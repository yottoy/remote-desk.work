import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { keywordPagesData } from '../data/keywordPages';
import Layout from '../components/layout/Layout';
import ImprovedJobCard from '../components/common/ImprovedJobCard';
import SchemaHead from '../components/seo/SchemaHead';
import { generateFAQSchema, generateBreadcrumbSchema, generateJobPostingSchema } from '../utils/schemaGenerator';

interface JobListing {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  jobType?: string;
  experienceLevel?: string;
  description: string;
  postedDate: string;
  featured?: boolean;
  skills?: string[];
  applyUrl?: string;
  employmentType?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface KeywordPageProps {
  title: string;
  h1: string;
  description: string;
  faqItems: FAQItem[];
  jobs: JobListing[];
  eslJobs: JobListing[];
  subjectJobs: JobListing[];
}

const OnlineTutoringJobsPage: React.FC<KeywordPageProps> = ({ 
  title, 
  h1, 
  description, 
  faqItems, 
  jobs,
  eslJobs,
  subjectJobs
}) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  const pageUrl = `${baseUrl}/online-tutoring-jobs-college-students`;

  // Available filters
  const filters = [
    { label: 'All Jobs', value: null, count: jobs.length },
    { label: 'ESL Teaching', value: 'esl', count: eslJobs.length },
    { label: 'Subject Tutoring', value: 'subject', count: subjectJobs.length },
  ];

  // Filtered jobs
  const getFilteredJobs = () => {
    if (!activeFilter) return jobs;
    if (activeFilter === 'esl') return eslJobs;
    if (activeFilter === 'subject') return subjectJobs;
    return jobs;
  };

  const filteredJobs = getFilteredJobs();

  // Generate schemas
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Online Tutoring Jobs for College Students', url: pageUrl }
  ]);

  const faqSchema = generateFAQSchema(faqItems);

  const jobSchemas = jobs.slice(0, 10).map(job => generateJobPostingSchema({
    _id: job._id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    salary: job.salary,
    postedDate: job.postedDate,
    employmentType: job.employmentType || job.jobType,
    experienceLevel: job.experienceLevel,
  }));

  const allSchemas = [breadcrumbSchema, faqSchema, ...jobSchemas];
  
  return (
    <>
      <SchemaHead
        schemas={allSchemas}
        title={title}
        description={description}
        canonical={pageUrl}
        openGraph={{
          title: title,
          description: description,
          url: pageUrl,
          type: 'website'
        }}
      />
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-gray-600" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-gray-900 font-medium">Online Tutoring Jobs for College Students</li>
            </ol>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{h1}</h1>
          
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-xl text-gray-700 leading-relaxed">
              Looking for <strong>online tutoring jobs for college students</strong>? Find flexible remote teaching positions 
              that work around your class schedule. Whether you want to <strong>teach English online work from home</strong> 
              or tutor in your subject area, these opportunities let you earn $15-30/hour while building valuable experience. 
              No teaching degree required for most positions!
            </p>
            <div className="flex items-center gap-6 mt-6 text-sm text-gray-600 flex-wrap">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Flexible Hours</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">$15-30/Hour</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">No Degree Required (Most)</span>
              </div>
            </div>
            <p className="text-base text-gray-600 mt-4">
              <em>Updated: February 2026</em> | Perfect for college students
            </p>
          </div>

          {/* Main Job Listings */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Latest Online Tutoring Jobs for Students</h2>
            
            <div className="flex flex-wrap gap-3 mb-8">
              {filters.map(filter => (
                <button 
                  key={filter.label}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors ${
                    activeFilter === filter.value
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
            
            {filteredJobs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.slice(0, 30).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                    keyword="online-tutoring-jobs-college-students"
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
                <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600">Check back soon for new tutoring opportunities.</p>
              </div>
            )}
          </div>

          {/* ESL Teaching Section */}
          {eslJobs.length > 0 && (
            <div className="mb-12 bg-blue-50 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">ESL & English Teaching Jobs Online</h2>
              <p className="text-gray-700 mb-6">
                <strong>Teach English online work from home</strong> to students around the world. Many platforms don't 
                require TEFL certification. Perfect for native English speakers with good communication skills.
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {eslJobs.slice(0, 6).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                    keyword="online-tutoring-jobs-college-students"
                  />
                ))}
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Popular ESL Platforms:</strong> Cambly (no TEFL needed), VIPKid, Palfish, Magic Ears, Qkids, 
                  SayABC. Most require being a native English speaker and having or pursuing a college degree.
                </p>
              </div>
            </div>
          )}

          {/* Subject Tutoring Section */}
          {subjectJobs.length > 0 && (
            <div className="mb-12 bg-green-50 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Subject Tutoring Opportunities</h2>
              <p className="text-gray-700 mb-6">
                Tutor in your area of expertise - math, science, writing, test prep, and more. Use your coursework 
                knowledge to help K-12 students or fellow college students succeed.
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {subjectJobs.slice(0, 6).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                    keyword="online-tutoring-jobs-college-students"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Why Perfect for Students */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Online Tutoring Is Perfect for College Students</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Flexible Scheduling</h3>
                    <p className="text-gray-600">Work around your classes, exams, and social life. Set your own hours or pick shifts that fit your schedule.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Decent Hourly Pay</h3>
                    <p className="text-gray-600">Earn $15-30/hour - much better than typical campus jobs. Perfect supplemental income for books, rent, or fun.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Resume</h3>
                    <p className="text-gray-600">Teaching experience looks great on resumes and grad school applications. Develop communication and leadership skills.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Remote/Location Independent</h3>
                    <p className="text-gray-600">Work from your dorm, apartment, library, or while traveling. All you need is a laptop and internet.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements Section */}
          <div className="mb-12 bg-gray-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Requirements for Online Tutoring Jobs</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">General Requirements</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700"><strong>Pursuing or completed degree:</strong> Most platforms require you be enrolled in college or have graduated</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700"><strong>Subject expertise:</strong> Strong knowledge in subjects you'll teach (proven through coursework or tests)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700"><strong>Reliable internet:</strong> Stable connection for video calls (minimum 10 Mbps)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700"><strong>Quiet space:</strong> Distraction-free environment for teaching sessions</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">For ESL Teaching</h3>
                <ul className="space-y-3 text-gray-700">
                  <li>• Native English speaker (usually required)</li>
                  <li>• Neutral accent preferred</li>
                  <li>• TEFL/TESOL certification (some platforms, can get online cheaply)</li>
                  <li>• Bachelor's degree (pursuing or completed)</li>
                  <li>• Patience and cultural sensitivity</li>
                  <li>• Available during peak hours (often early mornings for Asian students)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Getting Started Section */}
          <div className="mb-12 bg-blue-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Getting Started as an Online Tutor</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg mr-4 mt-1">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Your Platform</h3>
                  <p className="text-gray-700">
                    Research platforms that match your skills: Chegg, Tutor.com (subject tutoring), Cambly, VIPKid (ESL), 
                    Wyzant (set your own rates). Read reviews on Reddit r/onlinetutoring.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg mr-4 mt-1">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Set Up Your Profile</h3>
                  <p className="text-gray-700">
                    Complete application, pass subject assessments, upload transcripts or test scores. Create an engaging 
                    profile highlighting your strengths and teaching style.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg mr-4 mt-1">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Schedule Your First Sessions</h3>
                  <p className="text-gray-700">
                    Set availability around your class schedule. Start with a few hours per week. Build rapport with students 
                    to get positive reviews and repeat bookings.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg mr-4 mt-1">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Build Your Student Base</h3>
                  <p className="text-gray-700">
                    Provide excellent tutoring, earn 5-star ratings, and watch your bookings grow. Many tutors develop regular 
                    students who book recurring sessions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          {faqItems && faqItems.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
              <div className="max-w-4xl mx-auto space-y-6">
                {faqItems.map((faq, index) => (
                  <div key={index} className="bg-white shadow-md rounded-lg p-6 border-l-4 border-blue-600">
                    <h3 className="font-semibold text-lg text-gray-900 mb-3">{faq.question}</h3>
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Categories */}
          <div className="mb-12 bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Job Categories</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/customer-service-work-from-home-jobs" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Customer Service →</h3>
                <p className="text-sm text-gray-600">Help and support roles</p>
              </Link>
              <Link href="/remote-data-entry-jobs" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Data Entry Jobs →</h3>
                <p className="text-sm text-gray-600">Flexible data entry work</p>
              </Link>
              <Link href="/jobs" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">All Remote Jobs →</h3>
                <p className="text-sm text-gray-600">Browse all opportunities</p>
              </Link>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-10 text-center shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Tutoring Online?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Find flexible online tutoring opportunities perfect for college students. Earn while you learn!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/jobs" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-lg font-semibold rounded-lg text-white bg-transparent hover:bg-white hover:text-blue-700 transition-colors">
                Browse All Jobs
              </Link>
              <Link href="/newsletter" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-lg font-semibold rounded-lg text-blue-700 bg-white hover:bg-blue-50 transition-colors">
                Get Job Alerts
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const keywordSlug = 'online-tutoring-jobs-college-students';
  const pageData = keywordPagesData[keywordSlug];
  
  if (!pageData) {
    return { notFound: true };
  }
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/jobs?category=tutoring&limit=100`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    let jobs: JobListing[] = [];
    
    if (response.ok) {
      const data = await response.json();
      jobs = data.jobs || [];
      
      jobs = jobs.filter(job => {
        const searchText = `${job.title} ${job.description}`.toLowerCase();
        return searchText.includes('tutor') || 
               searchText.includes('teaching') ||
               searchText.includes('esl') ||
               searchText.includes('teach') ||
               searchText.includes('instructor') ||
               searchText.includes('education');
      });
    }

    const eslJobs = jobs.filter(j => {
      const text = `${j.title} ${j.description}`.toLowerCase();
      return text.includes('esl') || text.includes('english') || text.includes('tefl') || text.includes('tesol');
    });

    const subjectJobs = jobs.filter(j => {
      const text = `${j.title} ${j.description}`.toLowerCase();
      return (text.includes('math') || text.includes('science') || text.includes('writing') || 
              text.includes('sat') || text.includes('act') || text.includes('subject')) &&
              !text.includes('esl');
    });

    if (jobs.length === 0) {
      jobs = [
        {
          _id: 'tutor-fallback-1',
          title: 'Online Tutor - Multiple Subjects',
          company: 'Various Tutoring Platforms',
          location: 'Remote - Worldwide',
          salary: '$15-30/hr',
          jobType: 'Part-time',
          experienceLevel: 'Entry Level',
          description: 'We regularly feature new online tutoring positions perfect for college students. Check back daily for opportunities in ESL teaching, subject tutoring, and test prep.',
          postedDate: new Date().toISOString(),
          featured: false,
          skills: ['Teaching', 'Communication', 'Subject Expertise', 'Patience'],
          applyUrl: '/jobs',
          employmentType: 'PART_TIME'
        }
      ];
    }
    
    return {
      props: {
        title: pageData.title,
        h1: pageData.h1,
        description: pageData.description,
        faqItems: pageData.faqItems || [],
        jobs: jobs.slice(0, 30),
        eslJobs: eslJobs.slice(0, 15),
        subjectJobs: subjectJobs.slice(0, 15)
      }
    };
  } catch (error) {
    console.error('Error fetching tutoring jobs:', error);
    
    const fallbackJobs: JobListing[] = [
      {
        _id: 'tutor-fallback-1',
        title: 'Online Tutor - Multiple Subjects',
        company: 'Various Tutoring Platforms',
        location: 'Remote - Worldwide',
        salary: '$15-30/hr',
        jobType: 'Part-time',
        experienceLevel: 'Entry Level',
        description: 'We regularly feature new online tutoring positions perfect for college students. Check back daily for opportunities in ESL teaching, subject tutoring, and test prep.',
        postedDate: new Date().toISOString(),
        featured: false,
        skills: ['Teaching', 'Communication', 'Subject Expertise', 'Patience'],
        applyUrl: '/jobs',
        employmentType: 'PART_TIME'
      }
    ];
    
    return {
      props: {
        title: pageData.title,
        h1: pageData.h1,
        description: pageData.description,
        faqItems: pageData.faqItems || [],
        jobs: fallbackJobs,
        eslJobs: fallbackJobs,
        subjectJobs: []
      }
    };
  }
};

export default OnlineTutoringJobsPage;
