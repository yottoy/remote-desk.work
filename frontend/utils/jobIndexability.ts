/**
 * Decides whether a job detail page has enough unique content to be indexed.
 *
 * Thin pages drag down how Google rates the whole site: in Oct 2026 nearly every
 * page sat in "Crawled - currently not indexed" while ~1,400 jobs had only the
 * stub "…Please visit the job link for full details" and ~3,400 OnlineJobs.ph
 * jobs had card metadata ("Full Time Posted on 2026-… $900") in the title.
 * Such pages stay reachable for users but are noindexed and left out of the
 * jobs sitemap. Keep JOB_INDEXABLE_MONGO_FILTER in sync with isIndexableJob.
 */

export const MIN_INDEXABLE_DESCRIPTION_LENGTH = 300;

const STUB_DESCRIPTION = /please visit the job link for full details/i;
const LEAKED_CARD_METADATA = /\bPosted on \d{4}-\d{2}-\d{2}/i;

export function isIndexableJob(job: { title?: string; description?: string } | null | undefined): boolean {
  if (!job || !job.title) return false;
  if (LEAKED_CARD_METADATA.test(job.title)) return false;

  const text = String(job.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length < MIN_INDEXABLE_DESCRIPTION_LENGTH) return false;
  if (STUB_DESCRIPTION.test(text)) return false;

  return true;
}

/** MongoDB equivalent of isIndexableJob (raw length, so slightly more lenient). */
export const JOB_INDEXABLE_MONGO_FILTER = {
  title: { $not: LEAKED_CARD_METADATA },
  description: { $not: STUB_DESCRIPTION },
  $expr: {
    $gte: [
      { $strLenCP: { $trim: { input: { $ifNull: ['$description', ''] } } } },
      MIN_INDEXABLE_DESCRIPTION_LENGTH,
    ],
  },
};
