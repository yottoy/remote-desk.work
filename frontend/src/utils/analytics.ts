// Analytics service for tracking user interactions
// This is a lightweight implementation that could be integrated with services like 
// Google Analytics, Mixpanel, Segment, etc.

interface TrackingEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
}

interface FilterEvent {
  filterType: string;
  values: string[];
  resultCount: number;
  searchQuery?: string;
}

interface SearchEvent {
  query: string;
  resultCount: number;
  filters?: Record<string, any>;
  properties?: Record<string, any>;
}

interface PageViewEvent {
  page: string;
  referrer?: string;
  properties?: Record<string, any>;
}

interface ErrorEvent {
  error: string;
  message: string;
  componentStack?: string;
  url: string;
}

interface JobInteractionEvent {
  jobId: string;
  jobTitle: string;
  company: string;
  action: 'view' | 'click' | 'apply' | 'save';
  properties?: Record<string, any>;
}

class AnalyticsService {
  private initialized = false;
  private userId: string | null = null;
  private sessionId: string;
  private debugMode: boolean;
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.debugMode = process.env.NODE_ENV !== 'production';
    this.init();
  }
  
  /**
   * Initialize the analytics service and load required scripts
   */
  init(): void {
    if (this.initialized) return;
    
    if (typeof window !== 'undefined') {
      // Set anonymous user ID from localStorage if available, or generate new one
      this.userId = localStorage.getItem('ccj_anonymous_id');
      if (!this.userId) {
        this.userId = this.generateUserId();
        localStorage.setItem('ccj_anonymous_id', this.userId);
      }
      
      // In a real implementation, we would initialize 3rd party services here
      // Example: this.initGoogleAnalytics();
      // Example: this.initMixpanel();
      
      this.initialized = true;
      if (this.debugMode) {
        console.log('Analytics initialized', { userId: this.userId, sessionId: this.sessionId });
      }
    }
  }
  
  /**
   * Track page views
   */
  trackPageView(event: PageViewEvent): void {
    if (!this.initialized) this.init();
    
    const payload = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      page: event.page,
      referrer: event.referrer || document.referrer,
      url: window.location.href,
      ...event.properties
    };
    
    // Track in GA4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: event.page,
        page_referrer: event.referrer || document.referrer,
        user_id: this.userId,
        session_id: this.sessionId,
        ...event.properties
      });
    }
    
    // In production, send to analytics server
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalyticsServer('pageview', payload);
    } else if (this.debugMode) {
      console.log('PageView tracked:', payload);
    }
  }
  
  /**
   * Track general events
   */
  trackEvent(event: TrackingEvent): void {
    if (!this.initialized) this.init();
    
    const payload = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      category: event.category,
      action: event.action,
      label: event.label,
      value: event.value,
      url: window.location.href,
      ...event.properties
    };
    
    // In production, send to analytics server
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalyticsServer('event', payload);
    } else if (this.debugMode) {
      console.log('Event tracked:', payload);
    }
  }
  
  /**
   * Track filter usage specifically
   */
  trackFilterUsage(event: FilterEvent): void {
    if (!this.initialized) this.init();
    
    const payload = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      filterType: event.filterType,
      values: event.values,
      resultCount: event.resultCount,
      searchQuery: event.searchQuery,
      url: window.location.href
    };
    
    // Track in GA4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'filter_apply', {
        filter_type: event.filterType,
        filter_values: event.values.join(','),
        result_count: event.resultCount,
        search_query: event.searchQuery,
        user_id: this.userId,
        session_id: this.sessionId
      });
    }
    
    // In production, send to analytics server
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalyticsServer('filter', payload);
    } else if (this.debugMode) {
      console.log('Filter usage tracked:', payload);
    }
    
    // Also track as a general event
    this.trackEvent({
      category: 'Filters',
      action: 'Apply Filter',
      label: `${event.filterType}: ${event.values.join(', ')}`,
      value: event.resultCount,
      properties: { filterType: event.filterType, values: event.values }
    });
  }
  
  /**
   * Track search queries
   */
  trackSearch(event: SearchEvent): void {
    if (!this.initialized) this.init();
    
    const payload = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      query: event.query,
      resultCount: event.resultCount,
      filters: event.filters,
      url: window.location.href,
      ...event.properties
    };
    
    // Track in GA4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'search', {
        search_term: event.query,
        result_count: event.resultCount,
        filters: JSON.stringify(event.filters),
        user_id: this.userId,
        session_id: this.sessionId,
        ...event.properties
      });
    }
    
    // In production, send to analytics server
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalyticsServer('search', payload);
    } else if (this.debugMode) {
      console.log('Search tracked:', payload);
    }
    
    // Also track as a general event
    this.trackEvent({
      category: 'Search',
      action: 'Submit Search',
      label: event.query,
      value: event.resultCount
    });
  }
  
  /**
   * Track errors that occur
   */
  trackError(event: ErrorEvent): void {
    if (!this.initialized) this.init();
    
    const payload = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      error: event.error,
      message: event.message,
      componentStack: event.componentStack,
      url: event.url,
      userAgent: navigator.userAgent
    };
    
    // Track in GA4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'error', {
        error_name: event.error,
        error_message: event.message,
        error_stack: event.componentStack,
        user_id: this.userId,
        session_id: this.sessionId
      });
    }
    
    // In production, send to analytics server
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalyticsServer('error', payload);
    } else if (this.debugMode) {
      console.error('Error tracked:', payload);
    }
  }
  
  /**
   * Track job interactions
   */
  trackJobInteraction(event: JobInteractionEvent): void {
    if (!this.initialized) this.init();
    
    const payload = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      ...event,
      url: window.location.href
    };

    // Track in GA4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', `job_${event.action}`, {
        job_id: event.jobId,
        job_title: event.jobTitle,
        company: event.company,
        user_id: this.userId,
        session_id: this.sessionId,
        ...event.properties
      });
    }
    
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalyticsServer('job_interaction', payload);
    } else if (this.debugMode) {
      console.log('Job interaction tracked:', payload);
    }
  }
  
  /**
   * Send data to analytics server - implementation would depend on your backend
   */
  private sendToAnalyticsServer(eventType: string, payload: any): void {
    try {
      fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventType,
          payload
        }),
        // Use keepalive to ensure data is sent even if page is being unloaded
        keepalive: true
      }).catch(err => {
        console.error('Failed to send analytics data:', err);
      });
    } catch (error) {
      console.error('Error sending analytics data:', error);
    }
  }
  
  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  /**
   * Generate a unique anonymous user ID
   */
  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }
}

// Create singleton instance
const analytics = new AnalyticsService();

// Export instance
export default analytics; 