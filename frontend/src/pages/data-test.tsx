import React from 'react';
import { keywordPagesData } from '../data/keywordPages';
import Layout from '../components/layout/Layout';

const DataTestPage: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Data Test Page</h1>
        <p className="mt-4 text-lg text-gray-500">
          This page tests if the keywordPagesData import is working correctly.
        </p>
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Keywords:</h2>
          <ul className="mt-4 space-y-2 list-disc pl-5">
            {Object.keys(keywordPagesData).map(key => (
              <li key={key}>
                <a 
                  href={`/${key}`} 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {key}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default DataTestPage;
