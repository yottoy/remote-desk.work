import React from 'react';
import { NextPage, NextPageContext } from 'next';
import Head from 'next/head';
import Link from 'next/link';

interface ErrorProps {
  statusCode?: number;
  title?: string;
}

const Error: NextPage<ErrorProps> = ({ statusCode, title }) => {
  const errorTitle = title || statusCode 
    ? `Error ${statusCode}` 
    : 'An error occurred';
  
  const errorMessage = statusCode === 404
    ? "The page you're looking for can't be found."
    : 'Sorry, an error has occurred. Please try again later.';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>{errorTitle} | ClickClickJob.com</title>
      </Head>
      
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-700">ClickClick<span className="text-orange-500">Job.com</span></span>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-5xl font-extrabold text-blue-600">{statusCode || '!'}</p>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">{errorTitle}</h1>
          <p className="mt-2 text-base text-gray-600">{errorMessage}</p>
          
          <div className="mt-8">
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to homepage
            </Link>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} ClickClickJob.com. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

Error.getInitialProps = ({ res, err }: NextPageContext): { statusCode?: number } => {
  const statusCode = res ? res.statusCode : err ? (err as any).statusCode : 404;
  return { statusCode };
};

export default Error; 