# SEO Action Items - February 2026

Based on Google Search Console data (Nov 6, 2025 - Feb 3, 2026).

---

## Status: Changes Made (Not Yet Deployed)

The following changes have been made locally and need to be committed and deployed:

| File | Change |
|------|--------|
| `frontend/pages/remote-captioning-jobs.tsx` | Title/H1/description updated to target "captioning jobs from home" and "closed captioning" |
| `frontend/pages/data-processing-jobs-remote.tsx` | Title/H1/description updated to lead with "from home" phrasing |
| `frontend/public/robots.txt` | Removed 3 ineffective bracket-pattern Disallow rules |
| 6 page files | Updated "January 2026" to "February 2026" |

### How to deploy

```bash
cd frontend
git add frontend/pages/remote-captioning-jobs.tsx \
       frontend/pages/data-processing-jobs-remote.tsx \
       frontend/public/robots.txt \
       frontend/pages/customer-service-work-from-home-jobs.tsx \
       frontend/pages/entry-level-data-analyst-jobs.tsx \
       frontend/pages/medical-data-entry-jobs.tsx \
       frontend/pages/online-tutoring-jobs-college-students.tsx \
       frontend/pages/remote-administrative-assistant-jobs.tsx \
       frontend/pages/remote-data-entry-jobs.tsx
git commit -m "SEO: align meta tags with GSC queries, fix robots.txt, update dates"
git push origin main
```

Vercel should auto-deploy on push. If not, run `vercel --prod` from the project root.

---

## Action Items You Need to Do

### 1. Create a branded OG image (HIGH priority)

**Problem:** The default Open Graph image in `frontend/components/layout/Layout.tsx` line 20 uses a placeholder URL (`via.placeholder.com`). This means every social share and some search result previews show a generic placeholder instead of your brand.

**What to do:**
1. Create a 1200x630px image with your ClickClickJob branding (logo, tagline, brand colors)
2. Save it as `frontend/public/og-image.png` (or `.jpg`)
3. Edit `frontend/components/layout/Layout.tsx` line 20, change:
   ```
   ogImage = 'https://via.placeholder.com/1200x630/3B82F6/FFFFFF?text=ClickClickJob.com%20-%20Remote%20Jobs'
   ```
   to:
   ```
   ogImage = '/og-image.png'
   ```
4. Deploy

**Tools:** Canva (free), Figma, or any image editor. Use your brand blue (#3B82F6) as background.

---

### 2. Handle brand name misspellings (MEDIUM priority)

**Problem:** 7+ spelling variants of your brand generate ~40 impressions with 0 clicks:
- clikjob (14 impressions)
- click job (17 impressions)
- clickjob (4 impressions)
- clickajob (2 impressions)
- clickajobs, click and jobs, job click, etc.

**What to do:**
- Option A (recommended): Ensure these queries all land on your homepage. Check in GSC which page Google shows for each variant. If they land on irrelevant pages, add a "Did you mean ClickClickJob?" section or ensure the homepage content includes these common misspellings naturally (e.g., in a "Also known as" or FAQ section).
- Option B: If different pages rank for different misspellings, consolidate by adding canonical tags pointing to the homepage.

**How to check:** In Google Search Console, click on each query to see which page it maps to. If they all go to the homepage, no action needed beyond improving the homepage CTR for those queries.

---

### 3. Investigate Sonimus company queries (MEDIUM priority)

**Problem:** "sonimus glassdoor" (24 impressions, position 6.9) and related queries (33 total impressions) rank well but get 0 clicks. Your site appears when people search for Sonimus company reviews.

**What to do:**
1. Search "sonimus glassdoor" on Google and find which page on your site appears
2. Decide if this traffic is valuable:
   - **If yes (Sonimus jobs are on your site):** Improve that job listing page's title to include "Sonimus" and "careers" or "jobs" to increase CTR
   - **If no (irrelevant traffic):** Consider whether the page is hurting your site's overall CTR metrics. You may want to noindex that specific page if it's dragging down site-wide signals

**How to check:** Go to GSC > Performance > filter by query "sonimus glassdoor" > click "Pages" tab to see which URL ranks.

---

### 4. Do the same for Sensarx queries (LOW priority)

"sensarx llc careers" (9 impressions, position 5.7) and "sensarx careers" (2 impressions, position 4.5) rank very well. Same decision as Sonimus above - decide if this traffic converts and optimize or noindex accordingly.

---

### 5. Improve ranking for high-impression pages stuck at position 30+ (ONGOING)

These pages get impressions but rank too low (page 3-5) to get clicks. On-page SEO alone won't fix this - you need content depth and backlinks.

| Page topic | Key query | Impressions | Avg Position |
|---|---|---|---|
| Captioning jobs | captioning jobs from home | 53 | 34.6 |
| Closed captioning | closed captioning jobs from home | 29 | 41.7 |
| Medical data entry | medical data entry | 26 | 31.4 |
| Data processing | data processing jobs from home | 23 | 40.7 |
| Healthcare data entry | healthcare data entry | 17 | 45.7 |
| Work from home admin | work from home administrative jobs | 15 | 41.5 |

**What to do for each page:**
1. **Add more unique content** - Expand the page with 500-1000 words of original content: salary ranges, day-in-the-life descriptions, required skills, equipment needed, top companies hiring. Pages ranking at position 30+ often lack content depth compared to competitors.
2. **Internal linking** - Add links TO these pages from your homepage, related category pages, and any blog/resource content. Each internal link signals importance to Google.
3. **Check competitor pages** - Search each query on Google, open the top 3 results, and note what content they have that your page lacks.
4. **Build backlinks** - The hardest but most impactful step. Consider guest posting on remote work blogs, getting listed in job board directories, or creating shareable content (salary reports, industry statistics) that others would link to.

---

### 6. Consider making hardcoded dates dynamic (LOW priority, developer task)

**Problem:** You have hardcoded "Updated: February 2026" strings in 6+ page files. These will go stale every month.

**What to do:** Replace the hardcoded date with a dynamic one. In each page, change:
```tsx
<em>Updated: February 2026</em>
```
to:
```tsx
<em>Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</em>
```

This will always show the current month/year. Since these pages use SSR (GetServerSideProps), the date will be accurate on each page load.

**Files to update:**
- `frontend/pages/medical-data-entry-jobs.tsx`
- `frontend/pages/customer-service-work-from-home-jobs.tsx`
- `frontend/pages/remote-administrative-assistant-jobs.tsx`
- `frontend/pages/online-tutoring-jobs-college-students.tsx`
- `frontend/pages/remote-data-entry-jobs.tsx`
- `frontend/pages/entry-level-data-analyst-jobs.tsx`

---

### 7. Monthly GSC review checklist

Repeat this process monthly:
1. Export GSC data for the last 3 months
2. Sort by impressions descending
3. For queries with impressions > 10 and position < 15: focus on CTR (improve title/description)
4. For queries with impressions > 10 and position > 20: focus on ranking (content depth, backlinks)
5. Look for new query clusters that suggest missing content pages
6. Update any hardcoded dates
