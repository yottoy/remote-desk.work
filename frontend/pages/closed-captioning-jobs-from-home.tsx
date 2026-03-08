import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import ImprovedJobCard from '../components/common/ImprovedJobCard';
import SchemaHead from '../components/seo/SchemaHead';
import { generateFAQSchema, generateBreadcrumbSchema, generateJobPostingSchema } from '../utils/schemaGenerator';
import type { Job } from '../types/job';

interface PageProps {
  jobs: Job[];
  recentJobsCount: number;
  error?: string;
}

const ClosedCaptioningJobsPage: React.FC<PageProps> = ({ jobs, recentJobsCount, error }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  const pageUrl = `${baseUrl}/closed-captioning-jobs-from-home`;

  const faqItems = [
    {
      question: 'What are closed captioning jobs from home?',
      answer: 'Closed captioning jobs involve creating text overlays for video content that viewers can turn on or off. Unlike subtitles (which translate language), closed captions transcribe all audio including dialogue, sound effects, and music cues. Remote closed captioners work from home creating captions for TV shows, movies, streaming content, online courses, and live broadcasts.'
    },
    {
      question: 'How much do closed captioning jobs pay?',
      answer: 'Entry-level closed captioning pays $15-20 per hour for pre-recorded content. Experienced captioners working on broadcast or streaming content earn $20-35 per hour. Real-time closed captioners using stenography earn $30-50 per hour. Some captioners are paid per audio minute ($1-3/minute of finished content), which can translate to higher hourly rates for fast workers.'
    },
    {
      question: 'Do I need experience for closed captioning jobs?',
      answer: 'Many entry-level closed captioning positions require no prior experience. You need strong typing skills (60+ WPM), excellent grammar, and good listening comprehension. Most captioning companies provide training on their specific platforms and captioning standards. Experience with subtitle editing software is helpful but typically not required for starter positions.'
    },
    {
      question: 'What is the difference between open and closed captions?',
      answer: 'Open captions are permanently embedded in a video and cannot be turned off. Closed captions can be toggled on or off by the viewer using their device settings. Most captioning jobs involve creating closed captions, as they are required by the FCC for broadcast television and increasingly mandated for online video content under accessibility laws like the ADA.'
    },
    {
      question: 'What equipment do I need for closed captioning work?',
      answer: 'For pre-recorded captioning you need a computer, reliable internet (10+ Mbps), quality over-ear headphones ($50-150), and optionally a foot pedal for audio control ($30-60). Captioning software is typically provided by the employer. For real-time closed captioning, you also need a stenography machine ($1,500-3,000) and high-speed internet (50+ Mbps) with a backup connection.'
    }
  ];

  // Filter jobs for captioning positions
  let captioningJobs = jobs.filter(job => {
    const title = job.title?.toLowerCase() || '';
    const description = job.description?.toLowerCase() || '';
    return title.includes('caption') ||
           title.includes('subtitle') ||
           title.includes('transcription') ||
           title.includes('transcriber') ||
           description.includes('captioning') ||
           description.includes('closed caption') ||
           description.includes('subtitle');
  });

  if (captioningJobs.length === 0) {
    captioningJobs = jobs.filter(job => {
      const title = job.title?.toLowerCase() || '';
      const description = job.description?.toLowerCase() || '';
      return title.includes('transcription') ||
             title.includes('data entry') ||
             description.includes('transcription') ||
             description.includes('typing');
    });
  }

  if (captioningJobs.length === 0) {
    captioningJobs = jobs.slice(0, 12);
  }

  const filteredJobs = activeFilter
    ? captioningJobs.filter(job => {
        const title = job.title?.toLowerCase() || '';
        const description = job.description?.toLowerCase() || '';
        if (activeFilter === 'entry-level') {
          return title.includes('entry') || description.includes('entry-level');
        }
        if (activeFilter === 'experienced') {
          return title.includes('senior') || description.includes('experienced');
        }
        return true;
      })
    : captioningJobs;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Closed Captioning Jobs From Home', url: pageUrl }
  ]);

  const faqSchema = generateFAQSchema(faqItems);

  const jobSchemas = captioningJobs.slice(0, 10).map(job => generateJobPostingSchema({
    _id: job._id,
    title: job.title,
    company: job.company,
    location: (job as any).location || 'Remote',
    description: job.description || `${job.title} position at ${job.company}.`,
    salary: (job as any).salary,
    postedDate: job.postedDate ? new Date(job.postedDate).toISOString() : new Date().toISOString(),
    employmentType: (job as any).employmentType || (job as any).jobType,
    experienceLevel: (job as any).experienceLevel,
  }));

  const allSchemas = [breadcrumbSchema, faqSchema, ...jobSchemas];

  const pageTitle = "Closed Captioning Jobs From Home - Remote Captioning Work | ClickClickJob";
  const pageDescription = "Find closed captioning jobs from home. Remote captioning positions for TV, streaming, and online video. Entry-level to experienced. Flexible hours, competitive pay.";

  return (
    <>
      <SchemaHead
        schemas={allSchemas}
        title={pageTitle}
        description={pageDescription}
        canonical={pageUrl}
        openGraph={{
          title: pageTitle,
          description: pageDescription,
          url: pageUrl,
          type: 'website'
        }}
      />
      <Layout>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50 to-white py-16 border-b border-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="mb-6 text-sm text-gray-600" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
                <li><span className="mx-2">/</span></li>
                <li><Link href="/remote-captioning-jobs" className="hover:text-blue-600">Captioning Jobs</Link></li>
                <li><span className="mx-2">/</span></li>
                <li className="text-gray-900 font-medium">Closed Captioning</li>
              </ol>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-center">
              Closed Captioning Jobs From Home
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 text-center">
              Find remote closed captioning positions for TV, streaming platforms, and online video.
              Entry-level to experienced roles with flexible schedules.
            </p>

            {/* Filter Pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['All Jobs', 'Entry-Level', 'Experienced'].map((filter) => (
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

        {/* Job Listings */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Closed Captioning Positions</h2>

            {filteredJobs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
                {filteredJobs.slice(0, 12).map(job => (
                  <ImprovedJobCard
                    key={job._id}
                    job={job}
                    variant="compact"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg mb-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Loading captioning positions</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Browse related captioning and transcription jobs while we update listings.
                </p>
                <Link href="/remote-captioning-jobs" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">
                  View All Captioning Jobs →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* What Is Closed Captioning */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <article className="prose max-w-none">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">What Is Closed Captioning?</h2>

              <p className="text-lg text-gray-700 mb-6">
                Closed captioning is the process of displaying text on a screen to provide additional or
                interpretive information about video content. Unlike open captions (which are always visible),
                closed captions can be toggled on or off by the viewer. They include not just dialogue but also
                speaker identification, sound effects, and music descriptions.
              </p>

              <p className="text-lg text-gray-700 mb-6">
                The demand for closed captioning has grown significantly as streaming platforms, online education,
                and social media video content expand. The FCC requires closed captions on broadcast television,
                and the ADA increasingly applies to online content, creating steady demand for skilled captioners.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Types of Closed Captioning Work</h2>

              <div className="space-y-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Offline (Pre-Recorded) Captioning</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      $15-25/hour
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Caption pre-recorded video content including TV episodes, movies, YouTube videos, and online courses.
                    You work at your own pace with deadlines, making it ideal for beginners.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-sm text-gray-900 mb-2">Best For:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Beginners with strong typing skills</li>
                        <li>• Those wanting flexible schedules</li>
                        <li>• Part-time workers and students</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 mb-2">Requirements:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 60-80 WPM typing speed</li>
                        <li>• 98%+ accuracy</li>
                        <li>• Strong grammar skills</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Real-Time Closed Captioning</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      $30-50/hour
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Provide live closed captions for broadcasts, news programs, live events, and webinars as they happen.
                    Requires stenography skills or voice writing technology.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-sm text-gray-900 mb-2">Best For:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Trained stenographers</li>
                        <li>• Those seeking higher pay rates</li>
                        <li>• Experienced captioners ready to advance</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 mb-2">Requirements:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 200+ WPM with stenography</li>
                        <li>• Stenography machine ($1,500-3,000)</li>
                        <li>• High-speed internet with backup</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Streaming Platform Captioning</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      $18-30/hour
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Create closed captions for content on Netflix, Hulu, Amazon Prime, Disney+, and other streaming services.
                    These platforms have strict quality and formatting standards.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-sm text-gray-900 mb-2">Platform Standards:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Netflix Timed Text Style Guide</li>
                        <li>• Character limits per line (42 chars)</li>
                        <li>• Precise timing synchronization</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 mb-2">Growth Opportunity:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Rapidly growing market</li>
                        <li>• Regular work from major studios</li>
                        <li>• Can lead to subtitling work</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How to Start Closed Captioning From Home</h2>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Build Your Typing Speed and Accuracy</h3>
                    <p className="text-gray-700 text-sm">
                      Closed captioning requires at least 60-80 WPM with 98%+ accuracy. Practice daily using free tools
                      like TypingTest.com. Focus on accuracy first, then speed. Most captioning companies test both during
                      their application process.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Learn Captioning Standards</h3>
                    <p className="text-gray-700 text-sm">
                      Study the DCMP (Described and Captioned Media Program) guidelines for caption formatting, timing,
                      placement, and speaker identification. Understanding FCC captioning requirements for broadcast
                      content gives you an edge. Free resources are available online.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Practice With Free Tools</h3>
                    <p className="text-gray-700 text-sm">
                      Use free captioning software like Subtitle Edit or Aegisub to practice creating captions for YouTube
                      videos. Volunteer on platforms like Amara to build experience and a portfolio you can show employers.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Apply to Captioning Companies</h3>
                    <p className="text-gray-700 text-sm">
                      Start with companies that hire entry-level captioners: Rev, 3Play Media, Vitac, and CaptionSync.
                      Apply to multiple companies at once. Expect a skills assessment testing your typing speed, accuracy,
                      and ability to follow captioning guidelines.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Legitimacy Section */}
            <div className="mt-12 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Spot Legitimate Closed Captioning Jobs</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-green-700 mb-4">Green Flags (Legitimate)</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700"><strong>Real company</strong> with a website, contact info, and verifiable history</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700"><strong>Skills test</strong> as part of application (typing, accuracy, captioning sample)</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700"><strong>No upfront fees</strong> for training, software, or equipment</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700"><strong>Reasonable pay</strong> of $15-25/hr for entry-level pre-recorded work</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-red-700 mb-4">Red Flags (Potential Scams)</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-gray-700"><strong>Upfront payment</strong> required for training or certification</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-gray-700"><strong>Unrealistic pay</strong> like &quot;earn $60/hr with no experience&quot;</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-gray-700"><strong>No skills test</strong> or interview process before hiring</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-gray-700"><strong>Pressure tactics</strong> like &quot;limited spots available&quot;</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Related Links */}
            <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Job Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/remote-captioning-jobs"
                  className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">All Captioning Jobs</h4>
                  <p className="text-sm text-gray-600">Browse all remote captioning positions</p>
                </Link>
                <Link
                  href="/categories/transcription"
                  className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">Transcription Jobs</h4>
                  <p className="text-sm text-gray-600">Related audio-to-text work</p>
                </Link>
                <Link
                  href="/remote-data-entry-jobs"
                  className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">Data Entry Jobs</h4>
                  <p className="text-sm text-gray-600">Entry-level remote positions</p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions About Closed Captioning Jobs</h2>
            <div className="space-y-6">
              {faqItems.map((faq, index) => (
                <div key={index} className="bg-white shadow-md rounded-lg p-6 border-l-4 border-blue-600">
                  <h3 className="font-semibold text-lg text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-700 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Start Your Closed Captioning Career Today
            </h2>
            <p className="text-blue-100 mb-8 max-w-3xl mx-auto">
              Browse verified closed captioning opportunities or explore related transcription and data entry roles.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50"
              >
                Browse All Jobs
              </Link>
              <Link
                href="/remote-captioning-jobs"
                className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-600"
              >
                All Captioning Jobs
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    </>
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

export default ClosedCaptioningJobsPage;
