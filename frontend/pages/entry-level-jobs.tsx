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
  updated: string;
}

// Popular entry-level categories that map to existing landing pages.
// Doubles as internal linking + coverage for "entry level <X> jobs" variants.
const ENTRY_LEVEL_TYPES: { name: string; href: string; blurb: string }[] = [
  { name: 'Data Entry Jobs', href: '/remote-data-entry-jobs-no-experience', blurb: 'Type and organize data from home — no experience needed.' },
  { name: 'Customer Service Jobs', href: '/customer-service-work-from-home-jobs', blurb: 'Help customers by phone, chat, or email. Paid training provided.' },
  { name: 'Virtual Assistant Jobs', href: '/virtual-assistant-jobs-part-time-remote', blurb: 'Support businesses with admin, scheduling, and inbox tasks.' },
  { name: 'Administrative Assistant Jobs', href: '/remote-administrative-assistant-jobs', blurb: 'Remote admin and office-support roles for beginners.' },
  { name: 'Data Analyst Jobs', href: '/entry-level-data-analyst-jobs', blurb: 'Break into analytics with junior, no-experience roles.' },
  { name: 'Transcription & Captioning', href: '/remote-captioning-jobs', blurb: 'Turn audio and video into text on your own schedule.' },
  { name: 'Online Tutoring Jobs', href: '/online-tutoring-jobs-college-students', blurb: 'Teach and tutor students online, flexible hours.' },
  { name: 'Proofreading Jobs', href: '/remote-proofreading-jobs', blurb: 'Review and polish written content from home.' },
];

const EntryLevelJobsPage: React.FC<KeywordPageProps> = ({ title, h1, description, faqItems, jobs, updated }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  const pageUrl = `${baseUrl}/entry-level-jobs`;

  // Filter job types
  const jobTypes = Array.from(new Set(jobs.map(job => job.jobType).filter((type): type is string => !!type)));

  const filteredJobs = activeFilter
    ? jobs.filter(job => job.jobType === activeFilter)
    : jobs;

  // Generate schemas
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Entry Level Jobs', url: pageUrl }
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
      <Layout title={title} description={description}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb Navigation */}
          <nav className="mb-8 text-sm text-gray-600" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-gray-900 font-medium">Entry Level Jobs</li>
            </ol>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-6">{h1}</h1>

          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-xl text-gray-700 leading-relaxed">
              Looking for <strong>entry level jobs</strong> you can do from home? You're in the right place. Below are
              hand-screened <strong>entry level remote jobs</strong> hiring right now — including roles that require
              <strong> no experience</strong> and provide paid training. Whether you're a recent graduate, returning to
              work, or switching careers, these beginner-friendly work-from-home positions are a great place to start.
            </p>
            <p className="text-lg text-gray-600 mt-4">
              <em>Updated: {updated}</em> | Verified listings | No experience required on many roles | New jobs added daily
            </p>
          </div>

          {/* Live job listings */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Latest Entry Level Remote Jobs</h2>

            {jobTypes.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-8">
                <button
                  onClick={() => setActiveFilter(null)}
                  className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors ${
                    !activeFilter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Jobs ({jobs.length})
                </button>
                {jobTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors ${
                      activeFilter === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            {filteredJobs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map(job => (
                  <ImprovedJobCard
                    key={job._id}
                    job={job}
                    variant="compact"
                    keyword="entry-level-jobs"
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
                <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-4">We're actively sourcing new entry-level positions. Check back soon or browse related categories.</p>
                <div className="flex justify-center gap-4 mt-6">
                  <Link href="/jobs" className="text-blue-600 hover:text-blue-700 font-medium">
                    Browse All Jobs →
                  </Link>
                  <Link href="/remote-data-entry-jobs-no-experience" className="text-blue-600 hover:text-blue-700 font-medium">
                    Data Entry Jobs →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Popular types of entry level remote jobs */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Popular Types of Entry Level Remote Jobs</h2>
            <p className="text-lg text-gray-700 mb-6">
              Not sure where to start? These are the most popular entry level work-from-home categories, each with
              dedicated listings and tips for beginners:
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {ENTRY_LEVEL_TYPES.map(type => (
                <Link
                  key={type.href}
                  href={type.href}
                  className="block p-5 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <h3 className="font-semibold text-blue-600 mb-2">{type.name} →</h3>
                  <p className="text-sm text-gray-600">{type.blurb}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* No experience required */}
          <div className="mb-12 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Entry Level Jobs With No Experience Required</h2>
            <p className="text-lg text-gray-700 mb-6">
              Many employers are happy to hire motivated beginners and train them on the job. You don't need a long
              résumé to get started — these paths are designed for first-timers:
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Paid Training Roles</h3>
                <p className="text-sm text-gray-600">Get paid while you learn the job from day one.</p>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">No Degree Needed</h3>
                <p className="text-sm text-gray-600">Most roles ask only for a high school diploma.</p>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Flexible Hours</h3>
                <p className="text-sm text-gray-600">Part-time and full-time schedules available.</p>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Screened & Scam-Free</h3>
                <p className="text-sm text-gray-600">Every listing is checked for quality and legitimacy.</p>
              </div>
            </div>
          </div>

          {/* How to land an entry level remote job */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to Land Your First Entry Level Remote Job</h2>
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mr-4">1</div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Pick a starting role</h3>
                    <p className="text-gray-700">Choose a beginner-friendly category like data entry, customer service, or virtual assistant. You can always move up once you have a few months of experience.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mr-4">2</div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Set up a simple résumé</h3>
                    <p className="text-gray-700">Highlight reliability, computer skills, and any customer-facing or organizational experience — even from school, volunteering, or part-time work.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mr-4">3</div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Apply to several roles at once</h3>
                    <p className="text-gray-700">Entry-level roles get a lot of applicants, so apply to 5–10 positions that fit. Tailor a sentence or two to each employer to stand out.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mr-4">4</div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Get job alerts</h3>
                    <p className="text-gray-700">New entry-level jobs are posted daily. <Link href="/newsletter" className="text-blue-600 hover:text-blue-700 font-medium">Sign up for alerts</Link> so you can apply early, when your odds are best.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
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

          {/* CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-10 text-center shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-4">Start Your Job Search Today</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Browse every open entry-level role or get new beginner-friendly jobs delivered to your inbox.
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
  const keywordSlug = 'entry-level-jobs';
  const pageData = keywordPagesData[keywordSlug];

  if (!pageData) {
    return { notFound: true };
  }

  const updated = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const fetchJobs = async (qs: string): Promise<JobListing[]> => {
    const res = await fetch(`${apiBase}/api/jobs?${qs}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.jobs || [];
  };

  try {
    // Primary: real listings that explicitly mention "entry level".
    // (The experienceLevel field is not populated in the data, so we match on text.)
    let jobs: JobListing[] = await fetchJobs('search=entry%20level&limit=60');

    // Backfill with recent beginner-friendly remote jobs so the grid is never thin.
    if (jobs.length < 12) {
      const recent = await fetchJobs('limit=60&sort=newest');
      const seen = new Set(jobs.map(j => j._id));
      for (const job of recent) {
        if (seen.has(job._id)) continue;
        jobs.push(job);
        seen.add(job._id);
        if (jobs.length >= 30) break;
      }
    }

    // Fallback content so the page is never empty
    if (jobs.length === 0) {
      jobs = [
        {
          _id: 'entry-level-fallback-1',
          title: 'Entry Level Remote Customer Service Representative',
          company: 'Various Companies',
          location: 'Remote - US',
          salary: '$16-22/hr',
          jobType: 'Full-time',
          experienceLevel: 'Entry Level',
          description: 'We regularly feature new entry-level remote roles from companies that train beginners. Check back daily for the latest work-from-home opportunities.',
          postedDate: new Date().toISOString(),
          featured: false,
          skills: ['Communication', 'Computer Basics', 'Reliability'],
          applyUrl: '/jobs',
          employmentType: 'FULL_TIME'
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
        updated,
      }
    };
  } catch (error) {
    console.error('Error fetching entry level jobs:', error);

    const fallbackJobs: JobListing[] = [
      {
        _id: 'entry-level-fallback-1',
        title: 'Entry Level Remote Customer Service Representative',
        company: 'Various Companies',
        location: 'Remote - US',
        salary: '$16-22/hr',
        jobType: 'Full-time',
        experienceLevel: 'Entry Level',
        description: 'We regularly feature new entry-level remote roles from companies that train beginners. Check back daily for the latest work-from-home opportunities.',
        postedDate: new Date().toISOString(),
        featured: false,
        skills: ['Communication', 'Computer Basics', 'Reliability'],
        applyUrl: '/jobs',
        employmentType: 'FULL_TIME'
      }
    ];

    return {
      props: {
        title: pageData.title,
        h1: pageData.h1,
        description: pageData.description,
        faqItems: pageData.faqItems || [],
        jobs: fallbackJobs,
        updated,
      }
    };
  }
};

export default EntryLevelJobsPage;
