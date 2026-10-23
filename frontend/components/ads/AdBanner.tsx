import React, { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT_ID } from '../../config/ads';

interface AdBannerProps {
  /** AdSense ad unit slot ID. The unit is not rendered when this is empty. */
  adSlotId?: string;
  /** AdSense data-ad-format value: 'auto', 'horizontal', 'rectangle', 'vertical'. */
  adFormat?: 'auto' | 'horizontal' | 'rectangle' | 'vertical';
  /** Pass through to data-full-width-responsive. */
  responsive?: boolean;
  className?: string;
  /** Reserved height so the page does not shift when the ad fills. */
  minHeight?: number;
}

/**
 * A single AdSense display unit.
 *
 * The adsbygoogle.js library is loaded once in _document.tsx. This component
 * only renders the <ins> element and queues one push() for it. It never
 * injects a second copy of the script (doing so raises "Only one AdSense head
 * tag supported per page" and can stop Auto Ads on the page) and never
 * removes the <ins> after the push, which would destroy an ad mid-fill.
 */
const AdBanner: React.FC<AdBannerProps> = ({
  adSlotId,
  adFormat = 'auto',
  responsive = true,
  className = '',
  minHeight,
}) => {
  const pushed = useRef(false);

  useEffect(() => {
    if (!adSlotId || pushed.current) return;
    pushed.current = true;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense push error:', e);
    }
  }, [adSlotId]);

  if (!adSlotId) return null;

  return (
    <div
      className={`adbanner-container ${className}`}
      style={{ minHeight: minHeight ? `${minHeight}px` : undefined, width: '100%' }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={adSlotId}
        data-ad-format={adFormat}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};

export default AdBanner;
