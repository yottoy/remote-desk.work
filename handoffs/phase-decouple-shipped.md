# Phase Decouple — SHIPPED (encoding fix + upsert-by-URL importer)

**Date:** 2026-05-31
**Deploy commit:** `83b761c` on `main` (parent `d765b84` "Add TinyAdz ad script").
**Status:** ✅ Live. Two classifier-independent pieces shipped; classifier + read-path
work stay **parked** on `baseline-capture` and **disabled** (`READ_PROMOTED_STATUS` OFF /
absent on main). One real `--execute` import cycle ran and was verified against the live DB.

This is the completion record for `handoffs/phase-decouple-summary.md` (analysis `8405832`,
decouple edits `eb880d5`). Nothing about the classifier was promoted or enabled.

---

## 1. What deployed (selective merge — NOT a full-branch merge)

A full `git merge baseline-capture` would also have deployed the **parked read path**
(`frontend/pages/api/jobs/index.ts` rewrite + `frontend/lib/jobsFilter.js`, whose
`{ expired: { $ne: true } }` guard is *un-gated*) and ~40 classifier/gate/canary files.
That contradicts "read-path stays parked," so I shipped **only the 7 scraper-side files**
(handoff §5) onto `main` via `git checkout baseline-capture -- <files>`:

| file | change |
|---|---|
| `src/utils/cleanText.js` | **NEW** — standalone, classifier-free encoding/`cleanText` module |
| `import-scraper-to-mongodb.js` | upsert-by-URL importer; imports only `cleanText`; **no `classifyJob`**; `$setOnInsert` = `{ firstSeenAt }` only |
| `.github/workflows/direct-scraper.yml` | `--overwrite` → `--execute` (+ PIPESTATUS exit-code safety) |
| `.github/workflows/run-scrapers.yml` | `--overwrite` → `--execute` (workflow is disabled/manual-only) |
| `.github/workflows/database-cleanup.yml` | disabled + reconciled: soft-expire replaces the daily wipe; 45-day hard-delete still runs **inline** in direct-scraper.yml |
| `requirements.txt` | **NEW** — pip cache key + install for direct-scraper.yml |
| `test/importUpsert.test.js` | **NEW** — importer contract tests (8/8 pass) |

**Confirmed NOT live on `main` (`83b761c`):** `src/utils/jobClassifier.js`,
`frontend/lib/jobsFilter.js`, and all `scripts/{acceptance-gate,promote-canary,
rollback-proposed,measure-classifier,backfill-job-classification,build-*,validate-schema}.js`
are **absent**. The live read path (`frontend/pages/api/jobs/index.ts`) is unchanged and
reads no `status`/`category`/`proposed_*`/`expired`. No workflow references any
classifier/gate/promote/backfill script. The deploy touched **no** `frontend/` files, so
the Vercel-built website is byte-identical to pre-deploy.

### Step-1 reconfirmation (importer + flag)
- Importer `$setOnInsert` is exactly `{ firstSeenAt: new Date() }` (line ~148). It never
  writes `proposed_*`, `status`, `category`, `jobCategory`, `promoted_*`, or
  `pre_promotion_*`. The only `proposed_`/`classifier` strings in the file are comments.
- `READ_PROMOTED_STATUS` does not exist on `main` (the rewritten reader is parked), so it
  is OFF by definition and the live read path is unchanged.

---

## 2. The real `--execute` import cycle

**Blocker hit + resolution:** GitHub Actions first refused to start the job —
*"recent account payments have failed or your spending limit needs to be increased"*
(account-level billing on `yottoy`; today's scheduled runs had been dying in ~5s too,
which is why the DB was frozen at the 2026-05-24 snapshot). **Resolved by making the
repo public** (free Actions). The canonical production workflow then ran end-to-end.

**Run:** `direct-scraper.yml` run **`26727227822`** (workflow_dispatch on `main`),
completed **success** in 7m9s, import exit code **0**.

| metric | value |
|---|---|
| feed jobs | 3527 (unique 2722, 805 dup) |
| collection before | 622 |
| **UPSERT** (existing, `_id` preserved) | **94** |
| **INSERT** (new) | **2628** |
| **MARK-EXPIRED** | **0** (first run: no doc has `lastSeenAt`, and `$lt` can't match a missing field) |
| existing `_id`s reassigned | **0** |
| collection after import | 3250 (= 622 + 2628) |
| after inline 45-day cleanup | **1193** |

The post-import **inline** `periodic-database-cleanup.js --max-age=45` step (PRE-EXISTING
— already on `d765b84` line 154, unchanged by this deploy) hard-deleted **2057** of the
freshly-inserted jobs whose `postedDate`/`createdAt` was > 45 days old. It deleted **zero
originals** (see §3). Net: 622 → 1193 (+571 fresh jobs retained after age-pruning).

---

## 3. Verification against the live DB (`_id` stability + no wipe)

Compared to `handoffs/phase-decouple-predeploy-baseline.json` (30 URL→`_id` pairs +
counts captured read-only **before** the run).

**`_id` stability:** **30/30** baseline sample URLs map to the **same `_id`**;
0 mismatched, 0 missing. All 30 original `_id`s still present.

**No wipe — all 622 originals preserved (arithmetic proof):**
- `scrapedDate = 2026-05-24` → **528** docs: untouched originals, **original date AND `_id`
  intact** (a wipe would have deleted these).
- `lastSeenAt = 665` (set on every feed record) − `firstSeenAt = 571` (set on insert only)
  = **94** = the upserted originals (now dated 05-31, no `firstSeenAt`).
- 528 untouched + 94 upserted = **622 = every original doc**, none lost, none `_id`-reassigned.
- Surviving new inserts = 571 (`firstSeenAt`); cleanup pruned 2628 − 571 = 2057 of them.

**Importer wrote no classifier columns (before → after):**
`proposed_status` 322 → **322 unchanged**; `status` 0 → **0**; `category` 0 → **0**;
`jobCategory` 0 → **0**; `expired:true` 0 → **0**. Job URLs are stable (the natural key).

---

## 4. Rollback path

The live **website** was not changed (no `frontend/` files in `83b761c`) — no Vercel
rollback needed. Rollback concerns only the scraper/importer:

1. **Preferred (halt, don't regress):** if the upsert importer misbehaves, stop new writes
   without reverting code — `gh workflow disable direct-scraper.yml` (or re-comment the
   cron). The DB is left in its current good state.
2. **Code revert:** `git revert 83b761c && git push origin main` restores the old importer
   + workflows. ⚠️ **This re-enables the destructive `--overwrite` wipe** (`deleteMany({})`
   + `insertMany`) that reassigns **every** `_id` each cycle — the exact SEO problem this
   change fixed. Use only as a last resort; prefer (1).
3. **DB:** the run's writes are non-destructive (all 622 originals preserved, stable `_id`s),
   so no DB restore is required. The 571 new inserts are legitimate jobs and will age out via
   the existing 45-day cleanup if undesired; no manual deletion recommended.
4. **Read path / flag:** unchanged. `READ_PROMOTED_STATUS` is absent on `main` (OFF). To keep
   the classifier parked, do nothing.

---

## 5. Still open / follow-ups (not part of this ship)

- **GitHub Actions billing:** unblocked by making the repo **public** (2026-05-31). If the
  repo is made private again, Actions will stop until the account billing/spending limit is
  fixed, and the scraper (hence imports) will silently halt.
- **Inline cleanup is aggressive on fresh feeds:** it pruned ~78% (2057/2628) of new inserts
  as >45 days old by `postedDate`. This is pre-existing, but with upsert persistence the
  phase2.5 follow-up still stands — prune by `lastSeenAt` (delisted age) instead of
  `postedDate`/`createdAt`/`scrapedDate` so re-listed jobs are never hard-deleted and
  fresh-but-old-postedDate jobs are retained. Needs approval; not shipped.
- **Coupling C (expiry read-side) still parked:** the live `index.ts` does not filter
  `expired`, so once jobs start being soft-expired they linger visibly until the 45-day
  hard-delete. To make delisted jobs drop off, ship the single un-gated
  `{ expired: { $ne: true } }` line into the live read path (currently only in the parked
  `frontend/lib/jobsFilter.js`).
- **Classifier + read-path rewrite + gate/canary/promote/backfill** remain on
  `baseline-capture`, unmerged and disabled.

---

### Evidence committed alongside this doc
- `handoffs/phase-decouple-predeploy-baseline.json` — pre-deploy read-only snapshot
  (622 docs, all 2026-05-24, `proposed_status`=322, `lastSeenAt`=0; 30 URL→`_id` samples).
