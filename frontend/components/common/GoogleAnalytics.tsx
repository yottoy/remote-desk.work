import Script from 'next/script';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Add TypeScript declaration for gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string,
      config?: {
        page_path?: string;
        page_title?: string;
        page_location?: string;
        page_referrer?: string;
        user_agent?: string;
        screen_resolution?: string;
        language?: string;
        [key: string]: any;
      }
    ) => void;
  }
}

const GoogleAnalytics = () => {
  const router = useRouter();

  useEffect(() => {
    // Track page views with enhanced data
    const handleRouteChange = (url: string) => {
      window.gtag('config', 'G-X8FZ9VHCKY', {
        page_path: url,
        page_title: document.title,
        page_location: window.location.href,
        page_referrer: document.referrer,
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
      });
    };

    // Track initial page load
    handleRouteChange(router.pathname);

    // Track route changes
    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-X8FZ9VHCKY"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-X8FZ9VHCKY', {
            send_page_view: false, // We'll handle this manually
            cookie_flags: 'SameSite=None;Secure',
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            debug_mode: ${process.env.NODE_ENV !== 'production'}
          });
        `}
      </Script>
    </>
  );
};

export default GoogleAnalytics; 