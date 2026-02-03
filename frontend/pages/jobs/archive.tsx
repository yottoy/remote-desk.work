import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import { formatJobDate } from '../../utils/jobUtils';
import type { Job } from '../../types/job';

interface JobArchiveProps {
  jobs: Job[];
  totalJobs: number;
  currentPage: number;
  totalPages: number;
  error?: string;
}

const JobArchivePage: React.FC<JobArchiveProps> = ({ 
  jobs, 
  totalJobs, 
  currentPage,
  totalPages,
  error 
}) => {
  
  if (error) {
    return (
      <Layout
        title="Job Archive - Error | ClickClickJob"
        description="Error loading job archive"
      >
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Error Loading Archive</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link href="/jobs" className="text-blue-600 hover:text-blue-800">
            Browse Current Jobs
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Job Archive - All Remote Jobs | ClickClickJob"
      description="Browse our complete archive of remote data entry and administrative jobs. Find opportunities from recent weeks and months."
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Job Archive</h1>
          <p className="text-gray-600">
            Browse our complete archive of remote data entry and administrative jobs. 
            Total jobs: {totalJobs.toLocaleString()}
          </p>
        </div>

        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-blue-600">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/jobs" className="hover:text-blue-600">Jobs</Link>
            </li>
            <li>/</li>
            <li className="text-gray-900">Archive</li>
          </ol>
        </nav>

        {/* Jobs Grid */}
        {jobs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <div key={job._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    <Link href={`/jobs/view/${job._id}`} className="hover:text-blue-600">
                      {job.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600">{job.company}</p>
                  <p className="text-xs text-gray-500">{job.location}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {formatJobDate(job.postedDate)}
                  </div>
                  {(job as any).salary && (
                    <div className="text-xs text-green-600 font-medium">
                      {(job as any).salary}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No jobs found in archive.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="inline-flex rounded-md shadow">
              {currentPage > 1 && (
                <Link
                  href={`/jobs/archive?page=${currentPage - 1}`}
                  className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              
              {/* Show page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <Link
                    key={page}
                    href={`/jobs/archive?page=${page}`}
                    className={`px-3 py-2 border border-gray-300 text-sm font-medium ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </Link>
                );
              })}
              
              {currentPage < totalPages && (
                <Link
                  href={`/jobs/archive?page=${currentPage + 1}`}
                  className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </nav>
          </div>
        )}

        {/* Back to Jobs Link */}
        <div className="mt-8 text-center">
          <Link
            href="/jobs"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Back to Current Jobs
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const page = parseInt(context.query.page as string) || 1;
  const limit = 60;
  const offset = (page - 1) * limit;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.clickclickjob.com';
    const response = await fetch(`${apiUrl}/api/jobs?limit=${limit}&offset=${offset}&sort=oldest`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    let jobs: Job[] = [];
    let totalJobs = 0;

    if (Array.isArray(data)) {
      jobs = data;
      totalJobs = data.length;
    } else if (data.jobs && Array.isArray(data.jobs)) {
      jobs = data.jobs;
      totalJobs = data.pagination?.totalJobs || jobs.length;
    }

    const totalPages = Math.ceil(totalJobs / limit);

    return {
      props: {
        jobs,
        totalJobs,
        currentPage: page,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error fetching job archive:', error);
    return {
      props: {
        jobs: [],
        totalJobs: 0,
        currentPage: 1,
        totalPages: 1,
        error: error instanceof Error ? error.message : 'Failed to load job archive',
      },
    };
  }
};

export default JobArchivePage; 