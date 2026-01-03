# UTF-8 Encoding Fix for Job Descriptions

## Issue
Job descriptions were displaying mojibake characters (encoding corruption) such as:
- `â` instead of `—` (em dash)
- `â¢` instead of `•` (bullet point)
- `â€™` instead of `'` (apostrophe)
- `â€œ` and `â€` instead of `"` and `"` (smart quotes)

Example from https://www.clickclickjob.com/jobs/69582fcdb51fd39530aec1a6:
- "New Yorkâbased" should be "New York—based"
- "â¢ Support daily operations" should be "• Support daily operations"

## Root Cause
The Python scraper (`direct_scraper.py`) was saving JSON files without proper UTF-8 encoding parameters:

```python
# BAD - Default behavior converts UTF-8 to escaped ASCII
with open(filename, "w") as f:
    json.dump(results, f, indent=2)
```

This caused UTF-8 characters to be double-encoded:
1. JobSpy scrapes job descriptions with proper UTF-8 characters
2. Python's `json.dump()` without `ensure_ascii=False` converts them to escaped sequences
3. When read back, the escaping creates mojibake characters

## Solution

### 1. Fixed Python Scraper (Prevention)
Updated all `json.dump()` calls in `direct_scraper.py` to properly handle UTF-8:

```python
# GOOD - Preserves UTF-8 characters correctly
with open(filename, "w", encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
```

**Changes Made:**
- Line 105-111: `create_empty_result_file()` function
- Line 270-279: `create_fallback_results()` function
- Line 496-498: `save_jobs_to_file()` function  
- Line 700-701: Multi-site scraping
- Line 839-845: Combined results saving
- Line 863: Test file creation
- Line 877-887: Fallback data saving
- Line 982-983: Error recovery
- Line 992-1004: Script status files
- Line 1014-1019: Error status files
- Line 1023-1024: Final error recovery

**Total: 11 locations updated**

### 2. Fixed Frontend Display (Remediation for Existing Data)
Added character replacement in `formatJobDescription()` function to fix already-corrupted data in the database:

**Files Updated:**
- `frontend/src/utils/jobUtils.ts` (lines 281-307)
- `frontend/utils/jobUtils.ts` (lines 281-307)

```typescript
// Fix common UTF-8 encoding issues (mojibake)
formatted = formatted.replace(/â€"/g, '—');   // em dash
formatted = formatted.replace(/â€"/g, '–');   // en dash
formatted = formatted.replace(/â€™/g, "'");   // right single quote
formatted = formatted.replace(/â€˜/g, "'");   // left single quote
formatted = formatted.replace(/â€œ/g, '"');   // left double quote
formatted = formatted.replace(/â€/g, '"');    // right double quote
formatted = formatted.replace(/â€¢/g, '•');   // bullet
formatted = formatted.replace(/â€¦/g, '…');   // ellipsis
formatted = formatted.replace(/Â /g, ' ');    // non-breaking space
formatted = formatted.replace(/Â°/g, '°');    // degree symbol
formatted = formatted.replace(/â‚¬/g, '€');   // euro sign
formatted = formatted.replace(/â„¢/g, '™');   // trademark
formatted = formatted.replace(/Â®/g, '®');    // registered trademark
formatted = formatted.replace(/Â©/g, '©');    // copyright
```

## Impact

### Prevention (Future Jobs)
All newly scraped jobs will have properly encoded UTF-8 characters saved to the database.

### Remediation (Existing Jobs)
The frontend now automatically fixes mojibake characters when displaying job descriptions, so:
- Existing jobs in the database will display correctly
- No database migration required
- Fix is transparent to users

## Testing

### For New Jobs (After Next Scrape)
1. Wait for the next automated scrape to run
2. Check newly added jobs for proper character display
3. Look for em dashes, bullet points, and smart quotes

### For Existing Jobs (Immediate)
1. Visit any job with encoding issues (e.g., https://www.clickclickjob.com/jobs/69582fcdb51fd39530aec1a6)
2. Verify that:
   - Em dashes (—) display correctly
   - Bullet points (•) display correctly  
   - Smart quotes (' ' " ") display correctly
3. No more `â` or `â¢` characters should appear

## Technical Details

### Why This Happened
Python's `json.dump()` has `ensure_ascii=True` by default, which:
- Converts all non-ASCII characters to `\uXXXX` escape sequences
- Is intended for ASCII-only environments
- Causes issues when UTF-8 is expected throughout the pipeline

### The Fix Explained
1. **`encoding='utf-8'`**: Tells Python to write files as UTF-8
2. **`ensure_ascii=False`**: Tells json.dump to keep Unicode characters as-is
3. Together, these preserve the original UTF-8 encoding from JobSpy

### Why Frontend Fix is Needed
The frontend fix handles existing data that was already corrupted. It's a temporary measure until all old data expires (jobs auto-expire after their TTL period).

## Files Modified

### Python (Backend/Scraper)
- `direct_scraper.py` - 11 `json.dump()` calls updated

### TypeScript (Frontend)
- `frontend/src/utils/jobUtils.ts` - Added mojibake character replacements
- `frontend/utils/jobUtils.ts` - Added mojibake character replacements

## Related Issues
This fix also resolves potential issues with:
- International company names with accents
- Currency symbols (€, £, ¥)
- Special punctuation in job titles
- Mathematical symbols in job descriptions

## Date Fixed
January 2, 2026

