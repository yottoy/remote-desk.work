import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import { useRouter } from 'next/router';

export default function CustomRedirect404() {
  const router = useRouter();
  
  // Track 404s for analytics
  useEffect(() => {
    // Log the 404 event (in production this would be sent to analytics)
    console.error(`404 error: ${router.asPath}`);
  }, [router.asPath]);

  return (
    <Layout
      title="404 - Page Not Found | ClickClickJob.com"
      description="The page you are looking for could not be found. Browse our remote data entry and admin jobs."
    >
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-6xl font-extrabold text-blue-600 mb-4">404</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Page not found</h1>
          <p className="text-xl text-gray-600 mb-8">The page you're looking for doesn't exist or has been moved.</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-md font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go back home
            </Link>
            
            <Link
              href="/jobs/"
              className="w-full sm:w-auto px-6 py-3 bg-white text-blue-600 border border-blue-300 rounded-md font-medium shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse all jobs
            </Link>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Looking for something specific?</p>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <Link href="/categories/data-entry/" className="text-blue-600 hover:text-blue-800">
              Data Entry Jobs
            </Link>
            <Link href="/categories/administrative/" className="text-blue-600 hover:text-blue-800">
              Administrative Jobs
            </Link>
            <Link href="/categories/customer-service/" className="text-blue-600 hover:text-blue-800">
              Customer Service Jobs
            </Link>
            <Link href="/categories/virtual-assistant/" className="text-blue-600 hover:text-blue-800">
              Virtual Assistant Jobs
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
} 