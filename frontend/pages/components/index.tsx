import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const ComponentsIndexPage = () => {
  return (
    <>
      <Head>
        <title>User Engagement Components | Remote-Desk.work</title>
        <meta name="description" content="Showcase of user engagement components for the Remote-Desk.work job board." />
      </Head>

      <div className="bg-white min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">User Engagement Components</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center">
              <svg className="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Home
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link href="/components/status-badges" className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow hover:border-blue-300">
              <h2 className="text-lg font-medium text-gray-900">Status Badges</h2>
              <p className="mt-2 text-gray-600">New, Popular, Expires Soon, and Verified badges for job listings.</p>
            </Link>

            <Link href="/components/reading-progress" className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow hover:border-blue-300">
              <h2 className="text-lg font-medium text-gray-900">Reading Progress</h2>
              <p className="mt-2 text-gray-600">Visual indicator for reading progress through long job descriptions.</p>
            </Link>

            <Link href="/components/trust-indicators" className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow hover:border-blue-300">
              <h2 className="text-lg font-medium text-gray-900">Trust Indicators</h2>
              <p className="mt-2 text-gray-600">Company verification, red flag warnings, and job safety tips.</p>
            </Link>

            <Link href="/components/discovery" className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow hover:border-blue-300">
              <h2 className="text-lg font-medium text-gray-900">Discovery Enhancement</h2>
              <p className="mt-2 text-gray-600">Similar jobs, "people also viewed", and related categories exploration.</p>
            </Link>

            <Link href="/components/user-helpers" className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow hover:border-blue-300">
              <h2 className="text-lg font-medium text-gray-900">User Helpers</h2>
              <p className="mt-2 text-gray-600">Application instructions and copy-to-clipboard functionality.</p>
            </Link>

            <Link href="/components/local-storage" className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow hover:border-blue-300">
              <h2 className="text-lg font-medium text-gray-900">Local Storage</h2>
              <p className="mt-2 text-gray-600">Recently viewed jobs, search history, and filter preferences.</p>
            </Link>
          </div>

          <div className="mt-12 bg-blue-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900">Complete Example</h2>
            <p className="mt-2 text-gray-600">See all components in action on a full job listing page.</p>
            <div className="mt-4">
              <Link href="/jobs" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                View Job Listings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ComponentsIndexPage; 