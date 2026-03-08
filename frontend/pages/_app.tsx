import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import ErrorBoundary from '../components/common/ErrorBoundary';
import analytics from '../utils/analytics';
import { initializePerformanceOptimizations, reportWebVitals } from '../utils/performanceOptimization';
import { generateOrganizationSchema, generateWebSiteSchema, generateJSONLD } from '../utils/schemaGenerator';
import '../styles/globals.css';
import '../styles/jobDescription.css';
import '../components/JobMarketInsightsDashboard.css';
import '../components/EditorPickJobCard.css';

// Self-hosted Inter via next/font — no external Google Fonts request, no render-blocking, no FOUT
const inter = Inter({ subsets: ['latin'], display: 'swap' });

// Application wrapper
function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Initialize performance optimizations
  useEffect(() => {
    console.log('App initialized');
    
    // Initialize performance optimizations on client side
    const perfOptimizations = initializePerformanceOptimizations({
      enableLazyLoading: true,
      imageOptimization: true,
      preloadCriticalResources: true,
      enableServiceWorker: process.env.NODE_ENV === 'production'
    });
    
    return () => {
      // Cleanup performance optimizations
      if (perfOptimizations) {
        perfOptimizations.monitor.disconnect();
        if (perfOptimizations.imageOptimizer) {
          perfOptimizations.imageOptimizer.disconnect();
        }
      }
    };
  }, []);
  
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
    // Apply self-hosted Inter font class to root — eliminates Google Fonts CLS/FOUT
    <div className={inter.className}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Find verified remote data entry & administrative jobs. Work from home opportunities updated daily." />
        <link rel="icon" href="/favicon.ico" />

        {/* Global Schema.org markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: generateJSONLD(generateOrganizationSchema())
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: generateJSONLD(generateWebSiteSchema())
          }}
        />
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
    </div>
  );
}

// Export the Web Vitals reporting function for Next.js
export { reportWebVitals };

export default MyApp; 