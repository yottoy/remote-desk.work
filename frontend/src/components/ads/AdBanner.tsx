import React, { useEffect, useRef, useState } from 'react';

interface AdSize {
  width: number;
  height: number;
}

interface AdBannerProps {
  adSlotId: string;
  adFormat?: string; // e.g., 'auto', 'rectangle', 'vertical', 'horizontal'
  responsive?: boolean; // If true, ad will be responsive
  className?: string; // For additional styling
  style?: React.CSSProperties; // For inline styling
  layoutKey?: string; // Optional key for some ad layouts
  size?: AdSize; // For fixed size ads
  fallbackImage?: string; // Optional fallback image if ads fail to load
}

const AdSizes: Record<string, AdSize> = {
  leaderboard: { width: 728, height: 90 },
  banner: { width: 468, height: 60 },
  rectangle: { width: 336, height: 280 },
  largeRectangle: { width: 336, height: 280 },
  square: { width: 250, height: 250 },
  skyscraper: { width: 120, height: 600 },
  wideSkyscraper: { width: 160, height: 600 },
  mobileLeaderboard: { width: 320, height: 50 },
  mobileBanner: { width: 300, height: 50 },
  mediumRectangle: { width: 300, height: 250 },
};

const AdBanner: React.FC<AdBannerProps> = ({
  adSlotId,
  adFormat = 'auto',
  responsive = true,
  className = '',
  style = {},
  layoutKey,
  size,
  fallbackImage,
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [adReady, setAdReady] = useState(false);
  const [adFailed, setAdFailed] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID; // e.g., 'ca-pub-XXXXXXXXXXXXXXXX'

  // Determine proper ad dimensions for placeholder
  const getAdDimensions = (): AdSize => {
    if (size) return size;
    if (adFormat && AdSizes[adFormat]) return AdSizes[adFormat];
    
    // Default sizes based on common formats
    if (adFormat === 'horizontal') return AdSizes.leaderboard;
    if (adFormat === 'vertical') return AdSizes.skyscraper;
    if (adFormat === 'rectangle') return AdSizes.mediumRectangle;
    
    // Default responsive size
    return { width: 0, height: 0 };
  };

  const adDimensions = getAdDimensions();

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
        rootMargin: '200px', // Load when the ad is 200px away from viewport
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
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [adClient]);

  useEffect(() => {
    if (!isVisible || isAdLoaded || !adRef.current || !adClient) {
      return;
    }

    // Set timeout to detect if ad fails to load
    timeoutRef.current = setTimeout(() => {
      if (!adReady) {
        setAdFailed(true);
        console.warn(`Ad (${adSlotId}) failed to load within timeout period.`);
      }
    }, 3000);

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
          setAdReady(true);
        } catch (e) {
          console.error('AdSense push error:', e);
          setAdFailed(true);
        }
      };
      script.onerror = () => {
        console.error('Failed to load AdSense script.');
        setAdFailed(true);
      };
      document.head.appendChild(script);
    } else {
      // Script already loaded, just push the ad
      setIsAdLoaded(true);
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        setAdReady(true);
      } catch (e) {
        console.error('AdSense push error:', e);
        setAdFailed(true);
      }
    }

    // Add event listener for ad load success
    window.addEventListener('load', () => {
      if (adRef.current && adRef.current.querySelector('iframe')) {
        setAdReady(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, isAdLoaded, adClient, adSlotId, adFormat, responsive, layoutKey, adReady]);

  // Create container style with precise dimensions to prevent CLS
  const containerStyle: React.CSSProperties = {
    ...style,
    minHeight: adDimensions.height || style.height || '250px',
    minWidth: adDimensions.width || style.width || '100%',
    height: adDimensions.height || style.height || '250px', // Explicitly set height to prevent CLS
    width: responsive ? '100%' : (adDimensions.width || style.width || '100%'), // Handle responsive vs fixed width
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f9f9f9',
    overflow: 'hidden',
    position: 'relative',
    margin: '0 auto', // Center the ad
    boxSizing: 'border-box', // Make sure padding doesn't affect dimensions
    transition: 'height 0.3s ease-in-out', // Smooth transition for any height changes
  };

  if (!adClient) {
    // Optionally render a placeholder with exact dimensions
    return (
      <div 
        className={`adbanner-placeholder ${className}`} 
        style={containerStyle}
        aria-hidden="true"
      >
        <span className="text-gray-400 text-xs">Advertisement</span>
      </div>
    );
  }
  
  return (
    <div ref={adRef} className={`adbanner-container ${className}`} style={containerStyle}>
      {isVisible && !adFailed && (
        <ins
          className="adsbygoogle"
          style={{ 
            display: 'block', 
            width: adDimensions.width ? `${adDimensions.width}px` : '100%',
            height: adDimensions.height ? `${adDimensions.height}px` : '100%', // Use 100% instead of auto
            maxWidth: '100%', // Prevent overflow
            ...style 
          }}
          data-ad-client={adClient}
          data-ad-slot={adSlotId}
          data-ad-format={adFormat}
          data-full-width-responsive={responsive ? 'true' : 'false'}
          {...(layoutKey && { 'data-ad-layout-key': layoutKey })}
        >
        </ins>
      )}
      
      {!isVisible && (
        <div className="ad-loading-placeholder w-full h-full flex items-center justify-center">
          <span className="text-gray-400 text-xs">Advertisement</span>
        </div>
      )}
      
      {adFailed && fallbackImage && (
        <img 
          src={fallbackImage} 
          alt="Advertisement" 
          className="w-full h-full object-contain"
          style={{ maxWidth: adDimensions.width || '100%', maxHeight: adDimensions.height || 'auto' }}
        />
      )}
      
      {adFailed && !fallbackImage && (
        <div className="ad-failed-placeholder w-full h-full flex items-center justify-center">
          <span className="text-gray-400 text-xs">Advertisement</span>
        </div>
      )}
    </div>
  );
};

export default AdBanner; 