// Core Web Vitals optimization utilities
export interface WebVitalsMetric {
  name: string;
  value: number;
  delta: number;
  entries: PerformanceEntry[];
  id: string;
}

export interface PerformanceConfig {
  enableLazyLoading: boolean;
  imageOptimization: boolean;
  preloadCriticalResources: boolean;
  enableServiceWorker: boolean;
}

/**
 * Reports Core Web Vitals metrics to analytics
 */
export function reportWebVitals(metric: WebVitalsMetric) {
  // Send to analytics service (Google Analytics, etc.)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      entries: metric.entries
    });
  }
  
  // Send to custom analytics endpoint
  if (typeof window !== 'undefined') {
    try {
      navigator.sendBeacon('/api/analytics/web-vitals', JSON.stringify({
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        url: window.location.href,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to send Web Vitals metric:', error);
    }
  }
}

/**
 * Optimizes images with lazy loading and proper sizing
 */
export class ImageOptimizer {
  private observer: IntersectionObserver | null = null;
  private images: Set<HTMLImageElement> = new Set();
  
  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: '50px 0px',
          threshold: 0.01
        }
      );
    }
  }
  
  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        this.loadImage(img);
        if (this.observer) {
          this.observer.unobserve(img);
        }
        this.images.delete(img);
      }
    });
  }
  
  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }
    
    if (srcset) {
      img.srcset = srcset;
      img.removeAttribute('data-srcset');
    }
    
    img.classList.remove('lazy-loading');
    img.classList.add('lazy-loaded');
  }
  
  /**
   * Add an image to be lazy loaded
   */
  observe(img: HTMLImageElement) {
    if (this.observer) {
      this.images.add(img);
      this.observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }
  
  /**
   * Clean up observer
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.images.clear();
    }
  }
}

/**
 * Preloads critical resources
 */
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;
  
  const criticalResources = [
    { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
    { href: '/images/logo.webp', as: 'image' },
    { href: '/api/jobs', as: 'fetch', crossorigin: 'anonymous' }
  ];
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    
    if (resource.type) {
      link.type = resource.type;
    }
    
    if (resource.crossorigin) {
      link.crossOrigin = resource.crossorigin;
    }
    
    // Only add if not already present
    if (!document.querySelector(`link[href="${resource.href}"]`)) {
      document.head.appendChild(link);
    }
  });
}

/**
 * Optimizes font loading with font-display: swap
 */
export function optimizeFontLoading() {
  if (typeof window === 'undefined') return;
  
  const fontFaces = [
    {
      family: 'Inter',
      src: 'url(/fonts/inter-var.woff2) format("woff2")',
      weight: '100 900',
      display: 'swap'
    }
  ];
  
  fontFaces.forEach(font => {
    const fontFace = new FontFace(font.family, font.src, {
      weight: font.weight,
      display: font.display as FontDisplay
    });
    
    fontFace.load().then(() => {
      document.fonts.add(fontFace);
    }).catch(error => {
      console.warn('Failed to load font:', error);
    });
  });
}

/**
 * Implements service worker for caching
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

/**
 * Measures and reports performance metrics
 */
export class PerformanceMonitor {
  private observer: PerformanceObserver | null = null;
  
  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.setupObserver();
    }
  }
  
  private setupObserver() {
    try {
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.processEntry(entry);
        });
      });
      
      // Observe different types of performance entries
      this.observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift'] });
    } catch (error) {
      console.warn('Failed to setup PerformanceObserver:', error);
    }
  }
  
  private processEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'navigation':
        this.reportNavigationTiming(entry as PerformanceNavigationTiming);
        break;
      case 'paint':
        this.reportPaintTiming(entry as PerformancePaintTiming);
        break;
      case 'largest-contentful-paint':
        this.reportLCP(entry);
        break;
      case 'layout-shift':
        this.reportCLS(entry);
        break;
    }
  }
  
  private reportNavigationTiming(entry: PerformanceNavigationTiming) {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      request: entry.responseStart - entry.requestStart,
      response: entry.responseEnd - entry.responseStart,
      dom: entry.domContentLoadedEventEnd - entry.responseEnd,
      load: entry.loadEventEnd - entry.loadEventStart
    };
    
    // Report to analytics
    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        this.reportMetric(`navigation_${name}`, value);
      }
    });
  }
  
  private reportPaintTiming(entry: PerformancePaintTiming) {
    this.reportMetric(entry.name.replace(/-/g, '_'), entry.startTime);
  }
  
  private reportLCP(entry: PerformanceEntry) {
    this.reportMetric('largest_contentful_paint', entry.startTime);
  }
  
  private reportCLS(entry: any) {
    if (entry.hadRecentInput) return; // Ignore shifts caused by user input
    this.reportMetric('cumulative_layout_shift', entry.value);
  }
  
  private reportMetric(name: string, value: number) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: Math.round(value),
        event_category: 'Performance'
      });
    }
  }
  
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Optimizes bundle loading with code splitting
 */
export function optimizeBundleLoading() {
  if (typeof window === 'undefined') return;
  
  // Preload route chunks for better navigation
  const importantRoutes = ['/jobs', '/categories', '/about'];
  
  importantRoutes.forEach(route => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/_next/static/chunks/pages${route}.js`;
    
    if (!document.querySelector(`link[href="${link.href}"]`)) {
      document.head.appendChild(link);
    }
  });
}

/**
 * Implements resource hints for better performance
 */
export function addResourceHints() {
  if (typeof window === 'undefined') return;
  
  const hints = [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
    { rel: 'dns-prefetch', href: '//www.google-analytics.com' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' }
  ];
  
  hints.forEach(hint => {
    const link = document.createElement('link');
    link.rel = hint.rel;
    link.href = hint.href;
    
    if (hint.crossorigin) {
      link.crossOrigin = hint.crossorigin;
    }
    
    if (!document.querySelector(`link[href="${hint.href}"][rel="${hint.rel}"]`)) {
      document.head.appendChild(link);
    }
  });
}

/**
 * Main performance optimization initializer
 */
export function initializePerformanceOptimizations(config: Partial<PerformanceConfig> = {}) {
  const defaultConfig: PerformanceConfig = {
    enableLazyLoading: true,
    imageOptimization: true,
    preloadCriticalResources: true,
    enableServiceWorker: true
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  
  if (typeof window === 'undefined') return;
  
  // Initialize performance monitoring
  const monitor = new PerformanceMonitor();
  
  // Initialize image optimization
  let imageOptimizer: ImageOptimizer | null = null;
  if (finalConfig.imageOptimization) {
    imageOptimizer = new ImageOptimizer();
    
    // Auto-observe images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageOptimizer!.observe(img as HTMLImageElement);
    });
  }
  
  // Preload critical resources
  if (finalConfig.preloadCriticalResources) {
    preloadCriticalResources();
  }
  
  // Optimize font loading
  optimizeFontLoading();
  
  // Add resource hints
  addResourceHints();
  
  // Optimize bundle loading
  optimizeBundleLoading();
  
  // Register service worker
  if (finalConfig.enableServiceWorker) {
    registerServiceWorker();
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    monitor.disconnect();
    if (imageOptimizer) {
      imageOptimizer.disconnect();
    }
  });
  
  return {
    monitor,
    imageOptimizer
  };
} 