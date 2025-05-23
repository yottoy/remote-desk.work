import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

interface KeywordAnalyticsProps {
  keyword: string;
  pageTitle: string;
}

const KeywordAnalytics: React.FC<KeywordAnalyticsProps> = ({ keyword, pageTitle }) => {
  const router = useRouter();

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    // Track page view with keyword tracking
    if ('gtag' in window) {
      // @ts-ignore - gtag is added via script in _document.tsx
      window.gtag('event', 'page_view', {
        'page_title': pageTitle,
        'keyword_target': keyword,
        'page_location': window.location.href
      });
    }

    // Track when user navigates away from the page
    const handleRouteChange = () => {
      if ('gtag' in window) {
        // @ts-ignore
        window.gtag('event', 'exit_keyword_page', {
          'keyword_target': keyword,
          'time_on_page': Math.floor((new Date().getTime() - window.performance.timing.navigationStart) / 1000)
        });
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [keyword, pageTitle, router]);

  // Add event handlers for tracking job application clicks
  const trackJobApplication = (jobId: string, jobTitle: string) => {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // @ts-ignore
      window.gtag('event', 'apply_job', {
        'job_id': jobId,
        'job_title': jobTitle,
        'source_keyword': keyword,
        'value': 1
      });
    }
  };

  // Add event handlers for tracking filter usage
  const trackFilterUsage = (filterType: string) => {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // @ts-ignore
      window.gtag('event', 'filter_jobs', {
        'filter_type': filterType,
        'keyword_page': keyword
      });
    }
  };

  // Add event handlers for tracking search functionality
  const trackSearch = (searchTerm: string) => {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // @ts-ignore
      window.gtag('event', 'search', {
        'search_term': searchTerm,
        'keyword_match': keyword
      });
    }
  };

  // This component doesn't render anything visible
  return null;
};

// Export the component and the tracking functions
export { KeywordAnalytics };

// Export the tracking functions for use in other components
export const keywordTracking = {
  trackJobApplication: (keyword: string, jobId: string, jobTitle: string) => {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // @ts-ignore
      window.gtag('event', 'apply_job', {
        'job_id': jobId,
        'job_title': jobTitle,
        'source_keyword': keyword,
        'value': 1
      });
    }
  },
  
  trackFilterUsage: (keyword: string, filterType: string) => {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // @ts-ignore
      window.gtag('event', 'filter_jobs', {
        'filter_type': filterType,
        'keyword_page': keyword
      });
    }
  },
  
  trackSearch: (keyword: string, searchTerm: string) => {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // @ts-ignore
      window.gtag('event', 'search', {
        'search_term': searchTerm,
        'keyword_match': keyword
      });
    }
  }
};
