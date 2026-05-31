'use strict';

/**
 * Fix 2: the importer must upsert by URL, preserve `_id` for existing jobs, and
 * never clear promoted columns (status, category, pre_promotion_x, promoted_x)
 * or proposed_x columns on an existing job. These are properties of the per-job
 * write payload (buildUpsertPlan), so we assert them directly and also simulate
 * MongoDB's $set / $setOnInsert / upsert merge to prove the end-to-end behavior.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { buildUpsertPlan } = require('../import-scraper-to-mongodb');

// Fields a promotion/classification may own. The import must NEVER $set these.
const FORBIDDEN_IN_SET = [
  'status', 'category',
  'pre_promotion_category', 'pre_promotion_status', 'promoted_canary', 'promoted_at',
  'proposed_category', 'proposed_status', 'proposed_flag', 'processed_at',
];

// Mimic MongoDB updateOne({$set,$setOnInsert}, {upsert:true}).
function applyUpsert(existingDoc, record) {
  if (existingDoc) {
    // Update path: $set applied, $setOnInsert IGNORED, _id unchanged.
    return { ...existingDoc, ...record.set };
  }
  // Insert path: fresh _id, both $setOnInsert and $set applied.
  return { _id: 'MINTED_ID', ...record.setOnInsert, ...record.set };
}

test('dedupes by URL and by title+company', () => {
  const { records, skipped } = buildUpsertPlan([
    { title: 'Admin Assistant', company: 'A', url: 'https://x.io/1' },
    { title: 'Admin Assistant', company: 'A', url: 'https://x.io/1' }, // dup url
    { title: 'Data Entry', company: 'B' },
    { title: 'Data Entry', company: 'B' }, // dup title+company (no url)
  ]);
  assert.equal(records.length, 2);
  assert.equal(skipped, 2);
});

test('match filter uses url when present, else title+company', () => {
  const { records } = buildUpsertPlan([
    { title: 'Admin Assistant', company: 'A', url: 'https://x.io/1' },
    { title: 'Data Entry', company: 'B' },
  ]);
  assert.deepEqual(records[0].filter, { url: 'https://x.io/1' });
  assert.deepEqual(records[1].filter, { title: 'Data Entry', company: 'B' });
});

test('$set never carries promoted or proposed_* columns', () => {
  const { records } = buildUpsertPlan([{ title: 'Admin Assistant', company: 'A', url: 'https://x.io/1' }]);
  const setKeys = Object.keys(records[0].set);
  for (const k of FORBIDDEN_IN_SET) {
    assert.ok(!setKeys.includes(k), `$set must not contain ${k}`);
  }
});

test('$setOnInsert carries ONLY firstSeenAt — no classifier / proposed_* (decoupled)', () => {
  const { records } = buildUpsertPlan([{ title: 'Administrative Assistant', company: 'A', url: 'https://x.io/1' }]);
  const soi = records[0].setOnInsert;
  assert.deepEqual(Object.keys(soi), ['firstSeenAt']);
  assert.ok(soi.firstSeenAt instanceof Date);
  for (const k of ['proposed_category', 'proposed_status', 'proposed_flag', 'processed_at']) {
    assert.ok(!(k in soi), `$setOnInsert must not contain ${k}`);
  }
});

test('importer does NOT classify: no proposed_* even for a classifiable title', () => {
  // "Medical Data Entry Clerk" used to trip the classifier disagreement path; the
  // decoupled importer must not run the classifier or emit any proposed_* / flag.
  const { records } = buildUpsertPlan([{ title: 'Medical Data Entry Clerk', company: 'A', url: 'https://x.io/1' }]);
  const soi = records[0].setOnInsert;
  assert.ok(!('proposed_status' in soi));
  assert.ok(!('proposed_flag' in soi));
});

test('re-list recovery: every $set clears the expired flag and refreshes lastSeenAt', () => {
  const { records } = buildUpsertPlan([{ title: 'Admin Assistant', company: 'A', url: 'https://x.io/1' }]);
  assert.equal(records[0].set.expired, false);
  assert.ok(records[0].set.lastSeenAt instanceof Date);
  assert.ok(records[0].set.scrapedDate instanceof Date);
});

test('merge: an existing promoted job keeps status/category/proposed_* and its _id', () => {
  const { records } = buildUpsertPlan([{
    title: 'Administrative Assistant (updated title)',
    company: 'Acme',
    url: 'https://x.io/1',
    description: 'fresh description from this run',
  }]);

  // A job that was already promoted + classified in a prior run.
  const existing = {
    _id: 'STABLE_ID_123',
    title: 'Administrative Assistant',
    description: 'old description',
    url: 'https://x.io/1',
    status: 'show',
    category: 'admin',
    pre_promotion_status: null,
    pre_promotion_category: null,
    promoted_canary: true,
    promoted_at: new Date('2026-05-01'),
    proposed_status: 'quarantine',
    proposed_category: 'data_entry',
    processed_at: new Date('2026-04-01'),
    expired: true, // had been delisted; now back in the feed
  };

  const merged = applyUpsert(existing, records[0]);

  // _id and all promoted/proposed columns are untouched by the import.
  assert.equal(merged._id, 'STABLE_ID_123');
  assert.equal(merged.status, 'show');
  assert.equal(merged.category, 'admin');
  assert.equal(merged.promoted_canary, true);
  assert.deepEqual(merged.promoted_at, new Date('2026-05-01'));
  assert.equal(merged.proposed_status, 'quarantine');
  assert.equal(merged.proposed_category, 'data_entry');
  assert.deepEqual(merged.processed_at, new Date('2026-04-01'));

  // Content IS refreshed, and the job is un-expired (re-listed).
  assert.equal(merged.title, 'Administrative Assistant (updated title)');
  assert.equal(merged.description, 'fresh description from this run');
  assert.equal(merged.expired, false);
});

test('merge: a new job is inserted with a fresh _id and NO proposed_* (decoupled)', () => {
  const { records } = buildUpsertPlan([{ title: 'Bookkeeper', company: 'Acme', url: 'https://x.io/new' }]);
  const merged = applyUpsert(null, records[0]); // no existing doc

  assert.equal(merged._id, 'MINTED_ID');
  assert.ok(merged.firstSeenAt instanceof Date);
  assert.equal(merged.title, 'Bookkeeper');
  assert.equal(merged.expired, false);
  // The importer no longer classifies: a brand-new job has no proposed_* columns.
  assert.equal('proposed_status' in merged, false);
  assert.equal('proposed_category' in merged, false);
  // Promoted columns are absent on a brand-new job, too.
  assert.equal('status' in merged, false);
  assert.equal('category' in merged, false);
});
