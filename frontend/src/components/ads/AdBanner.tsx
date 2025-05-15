import React, { useEffect, useRef, useState } from 'react';

interface AdBannerProps {
  adSlotId: string;
  adFormat?: string; // e.g., 'auto', 'rectangle', 'vertical', 'horizontal'
  responsive?: boolean; // If true, ad will be responsive
  className?: string; // For additional styling
  style?: React.CSSProperties; // For inline styling
  layoutKey?: string; // Optional key for some ad layouts
}

const AdBanner: React.FC<AdBannerProps> = ({
  adSlotId,
  adFormat = 'auto',
  responsive = true,
  className = '',
  style = {},
  layoutKey,
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID; // e.g., 'ca-pub-XXXXXXXXXXXXXXXX'

  useEffect(() => {
    if (!adClient) {
      console.error('AdSense client ID is not configured. Set NEXT_PUBLIC_ADSENSE_CLIENT_ID in your .env file.');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (observerRef.current) {
            observerRef.current.disconnect(); // Stop observing once visible
          }
        }
      },
      {
        rootMargin: '100px', // Load when the ad is 100px away from viewport
        threshold: 0.01,
      }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [adClient]);

  useEffect(() => {
    if (!isVisible || isAdLoaded || !adRef.current || !adClient) {
      return;
    }

    // Ensure AdSense script is loaded
    if (!(window as any).adsbygoogle) {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        setIsAdLoaded(true);
        try {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        } catch (e) {
          console.error('AdSense push error:', e);
        }
      };
      script.onerror = () => {
        console.error('Failed to load AdSense script.');
      };
      document.head.appendChild(script);
    } else {
      // Script already loaded, just push the ad
      setIsAdLoaded(true);
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense push error:', e);
      }
    }
  }, [isVisible, isAdLoaded, adClient, adSlotId, adFormat, responsive, layoutKey]);

  if (!adClient) {
    // Optionally render a placeholder or nothing if AdSense is not configured
    return <div className={`adbanner-placeholder ${className}`} style={style}>Ad disabled: Client ID missing</div>;
  }
  
  return (
    <div ref={adRef} className={`adbanner-container ${className}`} style={style}>
      {isVisible && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', ...style }}
          data-ad-client={adClient}
          data-ad-slot={adSlotId}
          data-ad-format={adFormat}
          data-full-width-responsive={responsive ? 'true' : 'false'}
          {...(layoutKey && { 'data-ad-layout-key': layoutKey })}
        >
        </ins>
      )}
      {!isVisible && <div style={{ minHeight: style?.height || '100px', minWidth: style?.width || '100%'}} className="ad-loading-placeholder"></div>}
    </div>
  );
};

export default AdBanner; 