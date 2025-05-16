import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import ErrorBoundary from '../components/common/ErrorBoundary';
import analytics from '../utils/analytics';
import '../styles/globals.css';

// Application wrapper
function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Track page views
  useEffect(() => {
    // Function to track page view
    const handleRouteChange = (url: string) => {
      analytics.trackPageView({ 
        page: url,
        properties: { 
          path: url,
          query: router.query 
        }
      });
    };

    // Track initial page load
    handleRouteChange(router.pathname);

    // Track route changes
    router.events.on('routeChangeComplete', handleRouteChange);
    
    // Clean up event listener
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Find verified remote data entry & administrative jobs. Work from home opportunities updated daily." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          // Track error in analytics
          analytics.trackError({
            error: error.name,
            message: error.message,
            componentStack: errorInfo.componentStack || '',
            url: typeof window !== 'undefined' ? window.location.href : ''
          });
        }}
      >
        <Component {...pageProps} />
        <Analytics />
      </ErrorBoundary>
    </>
  );
}

export default MyApp; 