/**
 * Import Scraper Results to MongoDB (upsert-by-URL)
 *
 * Phase 2.5 / Fix 2 — replaces the destructive `--overwrite` path
 * (deleteMany({}) + insertMany) with an idempotent upsert keyed on the job's
 * source URL. This:
 *   - PRESERVES `_id` for existing jobs, so /jobs/view/<id> URLs stay stable
 *     (the old wipe reassigned every _id every ~48h — an SEO problem and the
 *     reason promoted columns were destroyed each run).
 *   - PRESERVES promoted columns (status, category, pre_promotion_*, promoted_*)
 *     and proposed_* columns (proposed_category, proposed_status, proposed_flag,
 *     processed_at): they are NEVER in the $set payload, so any value already on
 *     a doc is left untouched. Decoupled 2026-05-30: the importer no longer runs
 *     the classifier and no longer WRITES proposed_* on insert either — it only
 *     cleans text and upserts by URL. $setOnInsert sets just firstSeenAt.
 *   - Handles delistings by SOFT-EXPIRING (expired:true) jobs not seen in the
 *     feed for EXPIRE_AFTER_DAYS, instead of hard-deleting them. Re-listed jobs
 *     are un-expired automatically.
 *
 * Natural key: `url` (job.url || job.job_url || job.job_url_direct). The source
 * URL is the most stable identifier the feeds provide and is what the prior
 * non-overwrite path already matched on. Jobs without a URL fall back to
 * title+company (less stable, but few jobs lack a URL).
 *
 * SAFETY: dry-run by DEFAULT (no writes). Pass --execute to write.
 *   node import-scraper-to-mongodb.js                 # DB dry-run (counts only)
 *   node import-scraper-to-mongodb.js --execute       # real upsert + expiry
 *   node import-scraper-to-mongodb.js --simulate=combined-results.json
 *                                                     # offline, no DB
 *
 * Env: MONGODB_URI, MONGODB_DB, EXPIRE_AFTER_DAYS (default 14),
 *      SMALL_FEED_MIN (absolute floor below which expiry is skipped, default 50).
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { cleanText } = require('./src/utils/cleanText');
require('dotenv').config();

const logger = {
  info: (...args) => console.log(`INFO: ${args.join(' ')}`),
  warn: (...args) => console.warn(`WARNING: ${args.join(' ')}`),
  error: (...args) => console.error(`ERROR: ${args.join(' ')}`)
};

// Try root directory first, then results subdirectory
const RESULTS_FILE = fs.existsSync(path.join(__dirname, 'combined-results.json'))
  ? path.join(__dirname, 'combined-results.json')
  : path.join(__dirname, 'results', 'combined-results.json');
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'clickclickjob';
const COLLECTION_NAME = 'jobs';
const EXPIRE_AFTER_DAYS = parseInt(process.env.EXPIRE_AFTER_DAYS || '14', 10);
const SMALL_FEED_MIN = parseInt(process.env.SMALL_FEED_MIN || '50', 10);

const MONGO_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000
};

/** Read the combined results file. */
async function readResultsFile() {
  try {
    if (!fs.existsSync(RESULTS_FILE)) {
      logger.error(`Results file not found: ${RESULTS_FILE}`);
      return null;
    }
    const data = fs.readFileSync(RESULTS_FILE, 'utf8');
    const parsedData = JSON.parse(data);
    const jobs = Array.isArray(parsedData) ? parsedData : (parsedData.jobs ? parsedData.jobs : []);
    logger.info(`Loaded ${jobs.length} jobs from ${RESULTS_FILE}`);
    return jobs;
  } catch (error) {
    logger.error(`Error reading results file: ${error.message}`);
    return null;
  }
}

const urlOf = (job) => job.url || job.job_url || job.job_url_direct || '';

/**
 * Clean + dedupe the feed and build the upsert plan for each unique job.
 * Returns { records, skipped } where each record has { key, filter, set,
 * setOnInsert } ready for a bulkWrite updateOne.
 */
function buildUpsertPlan(jobs) {
  const seenUrls = new Set();
  const seenTitleCompany = new Set();
  const records = [];
  let skipped = 0;

  for (const job of jobs) {
    const cleanedTitle = cleanText(job.title) || 'Untitled Position';
    const cleanedCompany = cleanText(job.company) || 'Unknown Company';
    const url = urlOf(job);
    const titleCompanyKey = `${cleanedTitle}::${cleanedCompany}`;

    if ((url && seenUrls.has(url)) || seenTitleCompany.has(titleCompanyKey)) {
      skipped++;
      continue;
    }
    if (url) seenUrls.add(url);
    seenTitleCompany.add(titleCompanyKey);

    // Match on URL when available, else on title+company.
    const filter = url ? { url } : { title: cleanedTitle, company: cleanedCompany };
    const key = url || titleCompanyKey;

    // Fields refreshed on EVERY import (content + freshness + re-list recovery).
    // NOTE: createdAt and scrapedDate are refreshed here to preserve the prior
    // overwrite-path semantics so periodic-database-cleanup's age logic is
    // unchanged by this commit. `firstSeenAt` (setOnInsert) is the stable
    // creation marker. See handoffs/phase2.5-summary.md for the proposed
    // follow-up to make cleanup prune by lastSeenAt.
    const set = {
      title: cleanedTitle,
      company: cleanedCompany,
      description: cleanText(job.description) || '',
      descriptionText: cleanText(job.descriptionText) || '',
      location: job.location || 'Remote',
      salary: job.salary || '',
      postedDate: job.postedDate ? new Date(job.postedDate)
        : job.date_posted ? new Date(job.date_posted)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      remote: true,
      url: url,
      source: job.source || job.site_source || 'direct_scraper',
      jobType: 'admin_data_entry',
      site: job.site || job.site_source || job.source || 'unknown',
      site_source: job.site_source || job.site || job.source || 'direct_scraper',
      scrapedDate: new Date(),
      updatedAt: new Date(),
      createdAt: job.createdAt ? new Date(job.createdAt) : new Date(),
      lastSeenAt: new Date(),
      // Re-list recovery: a job back in the feed is no longer expired.
      expired: false,
      expiredAt: null
    };

    // Written ONLY on insert. Decoupled 2026-05-30: the importer no longer runs
    // the classifier or writes any proposed_* columns — it cleans text and
    // upserts by URL only. firstSeenAt is the stable creation marker; existing
    // promoted/proposed_* columns are still never in $set, so any value already
    // on a doc is preserved untouched.
    const setOnInsert = {
      firstSeenAt: new Date()
    };

    records.push({ key, url, titleCompanyKey, filter, set, setOnInsert });
  }

  return { records, skipped };
}

/**
 * Look up which of the planned jobs already exist, returning a Map of
 * key -> existing _id. Used to report upsert-vs-insert and to confirm matched
 * jobs keep their _id.
 */
async function findExisting(collection, records) {
  const map = new Map();
  const urls = records.filter((r) => r.url).map((r) => r.url);

  if (urls.length > 0) {
    const cursor = collection.find({ url: { $in: urls } }, { projection: { _id: 1, url: 1 } });
    for await (const doc of cursor) {
      if (doc.url) map.set(doc.url, doc._id);
    }
  }

  // Jobs without a URL: match individually on title+company.
  for (const r of records.filter((rec) => !rec.url)) {
    const doc = await collection.findOne(r.filter, { projection: { _id: 1 } });
    if (doc) map.set(r.key, doc._id);
  }

  return map;
}

/**
 * Run the import. Dry-run unless opts.execute is true.
 */
async function runImport({ execute = false } = {}) {
  if (!MONGODB_URI) {
    logger.error('MONGODB_URI not set (use --simulate=<file> for an offline run)');
    return { error: 'MONGODB_URI not set' };
  }

  const jobs = await readResultsFile();
  if (!jobs) return { error: 'failed to read results file' };

  const { records, skipped } = buildUpsertPlan(jobs);
  const uniqueFeed = records.length;

  let client;
  try {
    client = new MongoClient(MONGODB_URI, MONGO_OPTIONS);
    await client.connect();
    logger.info(`Connected to MongoDB (${DB_NAME}.${COLLECTION_NAME})`);
    const collection = client.db(DB_NAME).collection(COLLECTION_NAME);

    const countBefore = await collection.countDocuments();
    const existing = await findExisting(collection, records);

    const toUpsert = records.filter((r) => existing.has(r.key));   // match -> update in place
    const toInsert = records.filter((r) => !existing.has(r.key));  // new -> insert

    // Expiry plan: jobs not seen for EXPIRE_AFTER_DAYS and not in this feed.
    const cutoff = new Date(Date.now() - EXPIRE_AFTER_DAYS * 24 * 60 * 60 * 1000);
    const feedUrls = new Set(records.map((r) => r.url).filter(Boolean));
    const feedTC = new Set(records.map((r) => r.titleCompanyKey));

    // Safety guard: never run the expiry sweep on a suspiciously small feed
    // (e.g. most scrapers failed), which could mass-expire live jobs over time.
    const feedFloor = Math.max(SMALL_FEED_MIN, Math.floor(0.2 * countBefore));
    const feedHealthy = uniqueFeed >= feedFloor;

    let expireCandidates = [];
    if (feedHealthy) {
      const cursor = collection.find(
        { lastSeenAt: { $lt: cutoff }, expired: { $ne: true } },
        { projection: { _id: 1, url: 1, title: 1, company: 1, lastSeenAt: 1 } }
      );
      for await (const doc of cursor) {
        const tc = `${doc.title}::${doc.company}`;
        const stillInFeed = (doc.url && feedUrls.has(doc.url)) || feedTC.has(tc);
        if (!stillInFeed) expireCandidates.push(doc);
      }
    }

    logger.info('');
    logger.info(`=== IMPORT (${execute ? 'EXECUTE' : 'DRY-RUN'}) ===`);
    logger.info(`feed file:        ${RESULTS_FILE}`);
    logger.info(`feed jobs:        ${jobs.length} (unique ${uniqueFeed}, duplicates skipped ${skipped})`);
    logger.info(`collection size:  ${countBefore} before`);
    logger.info(`would UPSERT (existing, _id preserved): ${toUpsert.length}`);
    logger.info(`would INSERT (new):                     ${toInsert.length}`);
    logger.info(`expiry window:    not seen in ${EXPIRE_AFTER_DAYS} days`);
    if (!feedHealthy) {
      logger.warn(`SMALL FEED (${uniqueFeed} < floor ${feedFloor}); expiry sweep SKIPPED this run`);
    }
    logger.info(`would MARK-EXPIRED (delisted):          ${expireCandidates.length}`);

    // _id-preservation confirmation: every upsert targets an existing _id and an
    // update never changes _id, so no _id is reassigned for existing jobs.
    logger.info(`_id check: ${toUpsert.length} matches reuse their existing _id; ` +
      `${toInsert.length} inserts mint new _ids; 0 existing _ids reassigned.`);

    const sample = (arr, fn, n = 5) => arr.slice(0, n).forEach((x) => logger.info('   ' + fn(x)));
    if (toUpsert.length) { logger.info('sample upserts (existing _id -> title):');
      sample(toUpsert, (r) => `${existing.get(r.key)}  ${r.set.title.slice(0, 50)}`); }
    if (toInsert.length) { logger.info('sample inserts (new):');
      sample(toInsert, (r) => `${r.set.title.slice(0, 50)}  [${r.url || r.titleCompanyKey.slice(0, 40)}]`); }
    if (expireCandidates.length) { logger.info('sample expiries (delisted):');
      sample(expireCandidates, (d) => `${d._id}  ${String(d.title).slice(0, 50)}  lastSeen=${d.lastSeenAt ? new Date(d.lastSeenAt).toISOString().slice(0, 10) : 'n/a'}`); }

    if (!execute) {
      logger.info('');
      logger.info('DRY-RUN: no writes performed. Re-run with --execute to apply.');
      return {
        mode: 'dry-run', countBefore, uniqueFeed, skipped,
        upserts: toUpsert.length, inserts: toInsert.length,
        expireCandidates: expireCandidates.length, feedHealthy
      };
    }

    // ---- EXECUTE -----------------------------------------------------------
    const ops = records.map((r) => ({
      updateOne: { filter: r.filter, update: { $set: r.set, $setOnInsert: r.setOnInsert }, upsert: true }
    }));

    let inserted = 0;
    let modified = 0;
    const batchSize = 200;
    for (let i = 0; i < ops.length; i += batchSize) {
      const res = await collection.bulkWrite(ops.slice(i, i + batchSize), { ordered: false });
      inserted += res.upsertedCount || 0;
      modified += res.modifiedCount || 0;
      logger.info(`batch ${Math.floor(i / batchSize) + 1}: ${res.upsertedCount} inserted, ${res.modifiedCount} updated`);
    }

    // Expire delistings. Feed jobs were just refreshed (lastSeenAt = now), so a
    // lastSeenAt<cutoff filter naturally excludes everything still in the feed.
    let expired = 0;
    if (feedHealthy) {
      const res = await collection.updateMany(
        { lastSeenAt: { $lt: cutoff }, expired: { $ne: true } },
        { $set: { expired: true, expiredAt: new Date(), expired_reason: 'not_seen_in_feed' } }
      );
      expired = res.modifiedCount || 0;
    }

    const countAfter = await collection.countDocuments();
    logger.info('');
    logger.info(`EXECUTED: ${inserted} inserted, ${modified} updated, ${expired} marked expired.`);
    logger.info(`collection size: ${countBefore} -> ${countAfter}`);
    return { mode: 'execute', inserted, modified, expired, countBefore, countAfter };
  } catch (error) {
    logger.error(`MongoDB error: ${error.message}`);
    return { error: error.message };
  } finally {
    if (client) {
      await client.close();
      logger.info('Disconnected from MongoDB');
    }
  }
}

/** Offline plan over a local results file — no DB. */
function simulate(file) {
  const abs = path.isAbsolute(file) ? file : path.join(__dirname, file);
  const data = JSON.parse(fs.readFileSync(abs, 'utf8'));
  const jobs = Array.isArray(data) ? data : (data.jobs || []);
  const { records, skipped } = buildUpsertPlan(jobs);
  const withUrl = records.filter((r) => r.url).length;

  logger.info('');
  logger.info('=== IMPORT (SIMULATE, no DB, no writes) ===');
  logger.info(`source:        ${file}`);
  logger.info(`feed jobs:     ${jobs.length} (unique ${records.length}, duplicates skipped ${skipped})`);
  logger.info(`with URL key:  ${withUrl}; title+company key: ${records.length - withUrl}`);
  logger.info('per-job write plan:');
  logger.info('   $set (every run): content + scrapedDate/updatedAt/lastSeenAt + expired:false');
  logger.info('   $setOnInsert (new only): firstSeenAt');
  logger.info('   NEVER written: status, category, pre_promotion_*, promoted_*, proposed_* (classifier decoupled)');
  logger.info('(no DB connection used; existing-vs-new requires --execute/dry-run against MONGODB_URI)');
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const simulateArg = args.find((a) => a.startsWith('--simulate='));

  if (args.includes('--overwrite') || args.includes('-o')) {
    logger.warn('--overwrite is DEPRECATED and ignored: the importer now upserts ' +
      'by URL and never wipes the collection. Use --execute to write.');
  }

  try {
    logger.info('Starting import of scraper results to MongoDB');

    if (simulateArg) {
      simulate(simulateArg.split('=')[1]);
      process.exit(0);
    }

    const result = await runImport({ execute });
    logger.info(`Result: ${JSON.stringify(result)}`);
    process.exit(result && result.error ? 1 : 0);
  } catch (error) {
    logger.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error(`Unhandled error in main: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { buildUpsertPlan, findExisting, runImport, readResultsFile, urlOf };
