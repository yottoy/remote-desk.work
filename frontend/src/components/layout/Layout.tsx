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
};

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'ClickClickJob.com | Remote Jobs',
  description = 'Find verified remote data entry & administrative jobs. 100+ work-from-home opportunities updated daily. No experience options available.'
}) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <GoogleAnalytics />
      
      <div className="min-h-screen flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex">
                <Link href="/" className="flex-shrink-0 flex items-center">
                  <span className="text-2xl font-bold text-blue-700">ClickClick<span className="text-orange-500">Job.com</span></span>
                </Link>
              </div>
              <nav className="hidden md:flex space-x-8">
                <Link href="/" className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium ${router.pathname === '/' ? 'text-blue-600' : ''}`}>
                  Home
                </Link>
                <Link href="/jobs" className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium ${router.pathname.startsWith('/jobs') ? 'text-blue-600' : ''}`}>
                  Jobs
                </Link>
                <Link href="/categories" className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium ${router.pathname.startsWith('/categories') ? 'text-blue-600' : ''}`}>
                  Categories
                </Link>
                <Link href="/about" className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium ${router.pathname === '/about' ? 'text-blue-600' : ''}`}>
                  About
                </Link>
              </nav>
              {/* Mobile menu - Show simplified menu instead of hamburger icon */}
              <div className="md:hidden flex space-x-2">
                <Link href="/jobs" className={`text-gray-700 hover:text-blue-600 px-2 py-1 text-sm font-medium ${router.pathname.startsWith('/jobs') ? 'text-blue-600' : ''}`}>
                  Jobs
                </Link>
                <Link href="/categories" className={`text-gray-700 hover:text-blue-600 px-2 py-1 text-sm font-medium ${router.pathname.startsWith('/categories') ? 'text-blue-600' : ''}`}>
                  Categories
                </Link>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-grow">
          {children}
        </main>
        
        {/* Email Capture Section */}
        <EmailCapture 
          source={`page_${router.pathname.replace('/', '').replace('[', '').replace(']', '') || 'home'}`}
        />
        
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  ClickClickJob.com
                </h2>
                <p className="mt-2 text-gray-600 text-sm">
                  Find remote data entry and administrative jobs.
                </p>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Categories
                </h2>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link href="/categories/data-entry" className="text-gray-600 hover:text-blue-600 text-sm">
                      Data Entry Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/categories/administrative" className="text-gray-600 hover:text-blue-600 text-sm">
                      Administrative Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/categories/customer-service" className="text-gray-600 hover:text-blue-600 text-sm">
                      Customer Service Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/categories/transcription" className="text-gray-600 hover:text-blue-600 text-sm">
                      Transcription Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/categories/virtual-assistant" className="text-gray-600 hover:text-blue-600 text-sm">
                      Virtual Assistant Jobs
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
                    <Link href="/about" className="text-gray-600 hover:text-blue-600 text-sm">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-gray-600 hover:text-blue-600 text-sm">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy-policy" className="text-gray-600 hover:text-blue-600 text-sm">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms-of-service" className="text-gray-600 hover:text-blue-600 text-sm">
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