import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import ImprovedJobCard from '../components/common/ImprovedJobCard';
import SearchBar from '../components/common/SearchBar';
import { EmailCaptureForm } from '../components/email-capture/EmailCaptureForm';
import type { Job } from '../types/job';

interface PageProps {
  jobs: Job[];
  recentJobsCount: number;
  error?: string;
}

const RemoteSchoolAdminJobsPage: React.FC<PageProps> = ({ jobs, recentJobsCount, error }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filterChips = [
    { label: 'K-12', value: 'k12' },
    { label: 'Higher Education', value: 'higher-ed' },
    { label: 'Registrar', value: 'registrar' },
    { label: 'Admissions', value: 'admissions' },
    { label: 'Part-Time', value: 'part-time' }
  ];

  // Filter jobs for education administrative positions with broad fallback
  let schoolAdminJobs = jobs.filter(job => {
    const title = job.title?.toLowerCase() || '';
    const description = job.description?.toLowerCase() || '';
    const fullText = `${title} ${description}`;
    
    return fullText.includes('registrar') || 
           fullText.includes('school') ||
           fullText.includes('education') ||
           fullText.includes('admissions') ||
           fullText.includes('academic') ||
           fullText.includes('university') ||
           fullText.includes('college') ||
           fullText.includes('student');
  });
  
  // Fallback to administrative jobs if no education-specific jobs found
  if (schoolAdminJobs.length < 8) {
    const adminJobs = jobs.filter(job => {
      const title = job.title?.toLowerCase() || '';
      const description = job.description?.toLowerCase() || '';
      const fullText = `${title} ${description}`;
      return fullText.includes('admin') || 
             fullText.includes('coordinator') || 
             fullText.includes('assistant') ||
             fullText.includes('clerk') ||
             fullText.includes('support');
    });
    schoolAdminJobs = [...schoolAdminJobs, ...adminJobs].slice(0, 24);
  }
  
  // Final fallback to show any jobs
  if (schoolAdminJobs.length === 0) {
    schoolAdminJobs = jobs.slice(0, 12);
  }

  const filteredJobs = activeFilter 
    ? schoolAdminJobs.filter(job => {
        const title = job.title?.toLowerCase() || '';
        const description = job.description?.toLowerCase() || '';
        if (activeFilter === 'registrar') {
          return title.includes('registrar');
        }
        if (activeFilter === 'admissions') {
          return title.includes('admission');
        }
        if (activeFilter === 'part-time') {
          return (job as any).jobType?.toLowerCase().includes('part');
        }
        return true;
      })
    : schoolAdminJobs;

  return (
    <Layout
      title="Remote School Administrative & Registrar Jobs | ClickClickJob"
      description="Work with educational institutions from home. K-12 and higher education opportunities. Remote registrar, admissions, and school admin positions."
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-center">
            Remote School Administrative & Registrar Jobs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 text-center">
            Work with educational institutions from home. K-12 and higher education opportunities.
          </p>
          
          <div className="max-w-3xl mx-auto">
            <SearchBar 
              placeholder="Search school admin jobs..."
              filterChips={filterChips}
              onSearch={(query) => console.log(query)}
              onFilterChange={(filters) => console.log(filters)}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['All Jobs', 'K-12', 'Higher Education', 'Registrar', 'Admissions', 'Part-Time'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter === 'All Jobs' ? null : filter.toLowerCase().replace(' ', '-'))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  (filter === 'All Jobs' && !activeFilter) || activeFilter === filter.toLowerCase().replace(' ', '-')
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Education Admin Roles</h2>
          
          {filteredJobs.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
                {filteredJobs.slice(0, 6).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                  />
                ))}
              </div>
              {filteredJobs.length > 6 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">More Education Opportunities</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredJobs.slice(6).map(job => (
                      <ImprovedJobCard 
                        key={job._id} 
                        job={job} 
                        variant="compact" 
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg mb-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Loading education positions</h3>
              <p className="mt-2 text-sm text-gray-500">Browse administrative jobs for more opportunities.</p>
              <Link href="/work-from-home-administrative-jobs" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">
                View Admin Jobs →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <article className="prose max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Remote School Administrative Roles</h2>
            
            <div className="space-y-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">School Registrar (Remote)</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    $40-65k
                  </span>
                </div>
                <p className="text-gray-700 mb-4">
                  Manage student records, enrollment processes, transcript requests, and ensure compliance with educational regulations. Work with K-12 schools, universities, or online education platforms.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Responsibilities:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Maintain accurate student records</li>
                      <li>• Process enrollment and registration</li>
                      <li>• Issue transcripts and diplomas</li>
                      <li>• Ensure FERPA compliance</li>
                      <li>• Coordinate with faculty and staff</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Required Experience:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 2-5 years in education administration</li>
                      <li>• Student Information System (SIS) experience</li>
                      <li>• Understanding of academic policies</li>
                      <li>• Strong organizational skills</li>
                      <li>• Bachelor's degree often required</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Admissions Coordinator</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    $35-55k
                  </span>
                </div>
                <p className="text-gray-700 mb-4">
                  Process applications, communicate with prospective students, review admission materials, and support the enrollment process for educational institutions.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Key Tasks:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Review and process applications</li>
                      <li>• Communicate with applicants</li>
                      <li>• Coordinate campus visits (virtual)</li>
                      <li>• Track application status</li>
                      <li>• Support recruitment efforts</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Skills Needed:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• CRM software experience</li>
                      <li>• Excellent customer service</li>
                      <li>• Attention to detail</li>
                      <li>• Communication skills</li>
                      <li>• Data management</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Online School Administrator</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    $50-80k
                  </span>
                </div>
                <p className="text-gray-700 mb-4">
                  Oversee virtual school operations, coordinate with online instructors, manage learning management systems, and ensure quality education delivery in remote settings.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Responsibilities:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Manage virtual school operations</li>
                      <li>• Support online instructors</li>
                      <li>• Oversee LMS (Canvas, Blackboard)</li>
                      <li>• Monitor student progress</li>
                      <li>• Ensure compliance with standards</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Requirements:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 3-7 years education experience</li>
                      <li>• Online learning platform expertise</li>
                      <li>• Leadership abilities</li>
                      <li>• Education background preferred</li>
                      <li>• Project management skills</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Student Services Coordinator</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                    $35-50k
                  </span>
                </div>
                <p className="text-gray-700 mb-4">
                  Provide student support services, coordinate advising, connect students with resources, and help navigate academic and administrative processes remotely.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Support Areas:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Academic advising coordination</li>
                      <li>• Student resource connections</li>
                      <li>• Problem resolution</li>
                      <li>• Event coordination (virtual)</li>
                      <li>• Student communication</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Skills:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Student-centered approach</li>
                      <li>• Empathy and patience</li>
                      <li>• Organization</li>
                      <li>• Communication excellence</li>
                      <li>• Problem-solving mindset</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Who Hires Remote School Administrators?</h2>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-semibold">Online K-12 Schools:</span> Fully virtual charter schools and online learning academies serving students nationwide
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-semibold">Universities with Online Programs:</span> Traditional universities expanding distance learning offerings
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-semibold">Community Colleges:</span> Two-year institutions with growing online and hybrid programs
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-semibold">Education Technology Companies:</span> EdTech platforms providing educational services and content
                  </div>
                </li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Required Skills & Qualifications</h2>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Common Requirements:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <span className="font-medium">Education Background:</span> Bachelor's degree, often in education or related field</li>
                    <li>• <span className="font-medium">SIS Experience:</span> PowerSchool, Infinite Campus, Banner, PeopleSoft</li>
                    <li>• <span className="font-medium">FERPA Knowledge:</span> Understanding of student privacy laws</li>
                    <li>• <span className="font-medium">Compliance:</span> Knowledge of accreditation standards</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Helpful Certifications:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• State-specific education administrator license (varies)</li>
                    <li>• Professional development in higher education administration</li>
                    <li>• Project management certifications</li>
                    <li>• Technology certifications (Google Educator, Microsoft)</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Career Path in Remote Educational Administration</h2>
            
            <p className="text-lg text-gray-700 mb-4">
              Starting as an admissions coordinator or student services specialist, you can advance to registrar positions, then to assistant dean or director of operations. With 5-10 years experience, advancement to dean or VP-level positions is possible.
            </p>
            
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Salary Progression:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <span className="font-medium">Entry (0-2 years):</span> $35-45k - Coordinator, assistant roles</li>
                <li>• <span className="font-medium">Mid-Level (3-5 years):</span> $45-65k - Registrar, senior coordinator</li>
                <li>• <span className="font-medium">Senior (5-10 years):</span> $65-90k - Director, assistant dean</li>
                <li>• <span className="font-medium">Executive (10+ years):</span> $90-130k+ - Dean, VP-level positions</li>
              </ul>
            </div>
          </article>

          {/* Internal Links */}
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Job Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link 
                href="/categories/administrative"
                className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors"
              >
                <h4 className="font-semibold text-gray-900 mb-2">Administrative Jobs</h4>
                <p className="text-sm text-gray-600">General admin positions</p>
              </Link>
              <Link 
                href="/work-from-home-administrative-jobs"
                className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors"
              >
                <h4 className="font-semibold text-gray-900 mb-2">Work from Home Admin</h4>
                <p className="text-sm text-gray-600">All remote admin roles</p>
              </Link>
              <Link 
                href="/part-time-remote-admin-jobs"
                className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors"
              >
                <h4 className="font-semibold text-gray-900 mb-2">Part-Time Positions</h4>
                <p className="text-sm text-gray-600">Flexible schedule jobs</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Get school administrative jobs in your inbox
          </h2>
          <p className="text-gray-600 mb-6">
            Receive education administration opportunities delivered weekly.
          </p>
          <EmailCaptureForm
            source="school-admin-jobs"
            variant="inline"
            className="max-w-md mx-auto"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Start Your Education Administration Career
          </h2>
          <p className="text-blue-100 mb-8 max-w-3xl mx-auto">
            Browse all opportunities or explore related administrative positions.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/jobs"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50"
            >
              Browse All Jobs
            </Link>
            <Link 
              href="/work-from-home-administrative-jobs"
              className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-600"
            >
              Administrative Jobs
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/jobs`
      : (process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000/api/jobs'
        : 'https://clickclickjob.vercel.app/api/jobs');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'ClickClickJob/1.0',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    let jobs = [];
    
    if (Array.isArray(result)) {
      jobs = result;
    } else if (result.jobs && Array.isArray(result.jobs)) {
      jobs = result.jobs;
    }
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const validJobs = jobs.filter((job: any) => {
      if (!job || !job._id || !job.title || !job.company) return false;
      const jobDate = new Date(job.postedDate || job.scrapedDate || job.createdAt);
      return jobDate >= thirtyDaysAgo;
    });
    
    return {
      props: {
        jobs: validJobs.slice(0, 50),
        recentJobsCount: validJobs.length
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        jobs: [],
        recentJobsCount: 0,
        error: error instanceof Error ? error.message : 'Failed to load jobs'
      }
    };
  }
};

export default RemoteSchoolAdminJobsPage;

