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
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  
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
                
                {/* Popular Searches Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setSearchDropdownOpen(!searchDropdownOpen)}
                    onBlur={() => setTimeout(() => setSearchDropdownOpen(false), 200)}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    Popular Searches
                    <svg className={`w-4 h-4 transition-transform ${searchDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {searchDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <Link href="/part-time-remote-admin-jobs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        Part-Time Admin Jobs
                      </Link>
                      <Link href="/work-from-home-administrative-jobs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        Work from Home Admin
                      </Link>
                      <Link href="/data-processing-jobs-remote" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        Data Processing Jobs
                      </Link>
                      <Link href="/remote-medical-administrative-jobs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        Medical Admin Jobs
                      </Link>
                      <Link href="/remote-jobs-near-me" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        Jobs Near Me
                      </Link>
                      <div className="border-t border-gray-200 my-2"></div>
                      <Link href="/remote-captioning-jobs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        Captioning Jobs
                      </Link>
                      <Link href="/remote-proofreading-jobs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        Proofreading Jobs
                      </Link>
                      <Link href="/usps-remote-jobs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        USPS Remote Jobs
                      </Link>
                    </div>
                  )}
                </div>
                
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
                  
                  {/* Popular Searches Section */}
                  <div className="px-4 py-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Popular Searches
                    </div>
                    <div className="space-y-1 pl-2">
                      <Link href="/part-time-remote-admin-jobs" className="block py-1.5 text-sm text-gray-600 hover:text-blue-600" onClick={() => setMenuOpen(false)}>
                        Part-Time Admin Jobs
                      </Link>
                      <Link href="/work-from-home-administrative-jobs" className="block py-1.5 text-sm text-gray-600 hover:text-blue-600" onClick={() => setMenuOpen(false)}>
                        Work from Home Admin
                      </Link>
                      <Link href="/data-processing-jobs-remote" className="block py-1.5 text-sm text-gray-600 hover:text-blue-600" onClick={() => setMenuOpen(false)}>
                        Data Processing Jobs
                      </Link>
                      <Link href="/remote-medical-administrative-jobs" className="block py-1.5 text-sm text-gray-600 hover:text-blue-600" onClick={() => setMenuOpen(false)}>
                        Medical Admin Jobs
                      </Link>
                      <Link href="/remote-jobs-near-me" className="block py-1.5 text-sm text-gray-600 hover:text-blue-600" onClick={() => setMenuOpen(false)}>
                        Jobs Near Me
                      </Link>
                    </div>
                  </div>
                  
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Job Categories
                </h2>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link href="/remote-data-entry-jobs" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Data Entry Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/work-from-home-administrative-jobs" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Administrative Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/data-processing-jobs-remote" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Data Processing Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/remote-captioning-jobs" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Captioning Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/customer-service-work-from-home-jobs" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Customer Service Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/remote-administrative-assistant-jobs" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Admin Assistant Jobs
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  More Jobs
                </h2>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link href="/part-time-remote-admin-jobs" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Part-Time Admin Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/medical-data-entry-jobs" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Medical Data Entry
                    </Link>
                  </li>
                  <li>
                    <Link href="/remote-medical-administrative-jobs" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Medical Admin Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/remote-proofreading-jobs" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Proofreading Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/entry-level-data-analyst-jobs" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Entry-Level Analyst
                    </Link>
                  </li>
                  <li>
                    <Link href="/remote-jobs-near-me" className="text-blue-600 hover:text-blue-800 text-sm transition-colors font-medium">
                      Jobs Near Me
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Jobs by State
                </h2>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link href="/jobs/data-entry/texas" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Data Entry in Texas
                    </Link>
                  </li>
                  <li>
                    <Link href="/jobs/data-entry/california" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Data Entry in California
                    </Link>
                  </li>
                  <li>
                    <Link href="/jobs/data-entry/florida" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Data Entry in Florida
                    </Link>
                  </li>
                  <li>
                    <Link href="/jobs/administrative/texas" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Admin Jobs in Texas
                    </Link>
                  </li>
                  <li>
                    <Link href="/jobs/customer-service/florida" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Customer Service in FL
                    </Link>
                  </li>
                  <li>
                    <Link href="/remote-admin-jobs-texas" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      Texas Remote Admin
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
                    <Link href="/jobs/editors-picks" className="text-purple-600 hover:text-purple-800 text-sm transition-colors font-medium">
                      Editor's Picks
                    </Link>
                  </li>
                  <li>
                    <Link href="/categories" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      All Categories
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
                  Company
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