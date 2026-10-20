/**
 * AdSense configuration.
 *
 * The publisher ID is public (it is in public/ads.txt and the head script),
 * so it is safe to hard-code as a default. Manual ad unit slot IDs come from
 * the environment so that no unit is rendered with a placeholder slot.
 */
export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-3377844943647950';

/** Slot IDs for the manual units on /jobs. Unset means "do not render". */
export const ADSENSE_SLOTS = {
  jobsTop: process.env.NEXT_PUBLIC_ADSENSE_SLOT_JOBS_TOP || '',
  jobsBottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_JOBS_BOTTOM || '',
};
