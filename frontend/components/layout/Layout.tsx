import React, { ReactNode, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import GoogleAnalytics from '../common/GoogleAnalytics';
import EmailCapture from '../common/EmailCapture';

type LayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  ogImage?: string;
  ogUrl?: string;
};

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'ClickClickJob.com | Remote Jobs',
  description = 'Find verified remote data entry & administrative jobs. 100+ work-from-home opportunities updated daily. No experience options available.',
  ogImage = 'https://via.placeholder.com/1200x630/3B82F6/FFFFFF?text=ClickClickJob.com%20-%20Remote%20Jobs',
  ogUrl
}) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Generate full URL for Open Graph
  const currentUrl = ogUrl || `https://www.clickclickjob.com${router.asPath}`;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `https://www.clickclickjob.com${ogImage}`;
  


  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const path = router.asPath;
    const segments = path.split('/').filter(Boolean);
    
    const breadcrumbs = [
      { label: 'Home', href: '/' }
    ];

    if (segments.length === 0) return breadcrumbs;

    // Special handling for different sections
    if (segments[0] === 'jobs') {
      breadcrumbs.push({ label: 'Jobs', href: '/jobs' });
      if (segments[1] === 'editors-picks') {
        breadcrumbs.push({ 
          label: 'Editor\'s Picks', 
          href: '/jobs/editors-picks'
        });
      }
    } else if (segments[0] === 'market-insights') {
      breadcrumbs.push({ 
        label: 'Market Insights', 
        href: '/market-insights'
      });
    } else if (segments[0] === 'resources') {
      breadcrumbs.push({ 
        label: 'Resources', 
        href: '/resources'
      });
    } else if (segments[0] === 'categories') {
      breadcrumbs.push({ label: 'Categories', href: '/categories' });
      if (segments[1]) {
        breadcrumbs.push({ 
          label: segments[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
          href: `/categories/${segments[1]}` 
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ClickClickJob.com" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={fullOgImage} />
        <meta property="og:url" content={currentUrl} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={fullOgImage} />
      </Head>
      
      <GoogleAnalytics />
      
      <div className="min-h-screen flex flex-col">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="flex-shrink-0 flex items-center">
                  <span className="text-2xl font-bold text-blue-700">
                    ClickClick<span className="text-orange-500">Job.com</span>
                  </span>
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-6 items-center">
                <Link 
                  href="/" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors ${router.pathname === '/' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
                >
                  Home
                </Link>
                
                <Link 
                  href="/jobs" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors ${router.pathname.startsWith('/jobs') ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
                >
                  Jobs
                </Link>
                
                <Link 
                  href="/categories" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors ${router.pathname.startsWith('/categories') ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
                >
                  Categories
                </Link>
                
                <Link 
                  href="/market-insights" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors ${router.pathname === '/market-insights' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
                >
                  Market Insights
                </Link>
                
                <Link 
                  href="/newsletter" 
                  className={`bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${router.pathname === '/newsletter' ? 'bg-blue-700' : ''}`}
                >
                  Get Job Alerts
                </Link>
                
                <Link 
                  href="/about" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors ${router.pathname === '/about' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
                >
                  About
                </Link>
              </nav>
              
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="text-gray-700 hover:text-blue-600 p-2"
                  aria-label="Toggle menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {menuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {menuOpen && (
              <div className="md:hidden border-t border-gray-200 py-4">
                <div className="space-y-2">
                  <Link 
                    href="/" 
                    className={`block px-4 py-2 text-sm font-medium ${router.pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    href="/jobs" 
                    className={`block px-4 py-2 text-sm font-medium ${router.pathname.startsWith('/jobs') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Jobs
                  </Link>
                  <Link 
                    href="/categories" 
                    className={`block px-4 py-2 text-sm font-medium ${router.pathname.startsWith('/categories') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Categories
                  </Link>
                  <Link 
                    href="/market-insights" 
                    className={`block px-4 py-2 text-sm font-medium ${router.pathname === '/market-insights' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Market Insights
                  </Link>
                  <Link 
                    href="/newsletter" 
                    className="block mx-4 my-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-center hover:bg-blue-700 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Get Job Alerts
                  </Link>
                  <Link 
                    href="/about" 
                    className={`block px-4 py-2 text-sm font-medium ${router.pathname === '/about' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    About
                  </Link>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Breadcrumb Navigation */}
        {breadcrumbs.length > 1 && (
          <nav className="bg-gray-50 border-b border-gray-200" aria-label="Breadcrumb">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-2 py-3 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                    <div className="flex items-center gap-2">
                      {index === breadcrumbs.length - 1 ? (
                        <span className="text-gray-500 font-medium">{crumb.label}</span>
                      ) : (
                        <Link 
                          href={crumb.href} 
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      )}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </nav>
        )}
        
        <main className="flex-grow">
          {children}
        </main>
        
        {/* Email Capture Section */}
        <EmailCapture 
          source={`page_${router.pathname.replace('/', '').replace('[', '').replace(']', '') || 'home'}`}
        />
        
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  ClickClickJob.com
                </h2>
                <p className="mt-2 text-gray-600 text-sm">
                  Find remote data entry and administrative jobs for professionals at all levels.
                </p>
              </div>
              
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Job Categories
                </h2>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link href="/categories/data-entry" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Data Entry Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/categories/administrative" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Administrative Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/categories/customer-service" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Customer Service Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/categories/virtual-assistant" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Virtual Assistant Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/jobs/editors-picks" className="text-purple-600 hover:text-purple-800 text-sm transition-colors font-medium">
                      Editor's Picks
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Resources
                </h2>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link href="/market-insights" className="text-purple-600 hover:text-purple-800 text-sm transition-colors font-medium">
                      Market Insights
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Remote Admin Guide
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Career Resources
                    </Link>
                  </li>
                  <li>
                    <Link href="/newsletter" className="text-blue-600 hover:text-blue-800 text-sm transition-colors font-medium">
                      Job Alerts
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Company Info
                </h2>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link href="/about" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy-policy" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms-of-service" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-200 pt-6">
              <p className="text-center text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} ClickClickJob.com. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Layout; 