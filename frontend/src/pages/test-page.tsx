import React from 'react';
import Layout from '../components/layout/Layout';

const TestPage: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Test Page</h1>
        <p className="mt-4 text-lg text-gray-500">
          This is a test page to verify that routing is working correctly.
        </p>
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">Keyword Pages:</h2>
          <ul className="mt-4 space-y-2">
            <li>
              <a 
                href="/remote-data-entry-jobs-no-experience" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Remote Data Entry Jobs No Experience
              </a>
            </li>
            <li>
              <a 
                href="/legitimate-work-from-home-admin-jobs" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Legitimate Work From Home Admin Jobs
              </a>
            </li>
            <li>
              <a 
                href="/virtual-assistant-jobs-part-time-remote" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Virtual Assistant Jobs Part Time Remote
              </a>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default TestPage;
