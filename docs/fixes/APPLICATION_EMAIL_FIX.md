# Application Email Address Fix

## Issue
Jobs without valid application URLs were showing an "Apply" button that directed candidates to send emails to `apply@clickclickjob.com` - an email address that doesn't exist. This was causing candidates to be unable to apply for jobs.

## Root Cause
In the job details page (`frontend/pages/jobs/[id].tsx` and `frontend/src/pages/jobs/[id].tsx`), there was a fallback condition for jobs without valid URLs:

```typescript
{job.url && job.url.startsWith('http') ? (
  // Show working Apply button
) : (
  // PROBLEM: Show mailto link to non-existent email
  <a href={`mailto:apply@clickclickjob.com?subject=...`}>
    Contact to Apply
  </a>
)}
```

## Solution
Replaced the mailto link with a disabled button that directs users to check the job description for application instructions:

```typescript
{job.url && job.url.startsWith('http') ? (
  // Show working Apply button linking to company's site
  <a href={job.url} target="_blank" rel="noopener noreferrer">
    Apply Now
  </a>
) : (
  // Show disabled button with helpful guidance
  <span className="...cursor-not-allowed" 
        title="Please see job description for application instructions">
    See Description for Apply Instructions
  </span>
)}
```

## Files Modified
1. `frontend/src/pages/jobs/[id].tsx` - Lines 360-370
2. `frontend/pages/jobs/[id].tsx` - Lines 360-370

## Visual Changes
- **Before**: Blue "Contact to Apply" button with email icon → Opens email client to non-existent address
- **After**: Gray disabled button with info icon → Shows tooltip "Please see job description for application instructions"

## Testing Recommendations
1. Visit a job posting without a valid URL
2. Verify the button shows "See Description for Apply Instructions"
3. Verify the button appears disabled (gray, not clickable)
4. Hover over the button to see the tooltip
5. Verify jobs WITH valid URLs still show the working "Apply Now" button

## Related Code
The `frontend/src/components/engagement/UserHelpers.tsx` component already had the correct pattern for handling missing URLs, which was used as reference for this fix.

## Date Fixed
January 2, 2026

