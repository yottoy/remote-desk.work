import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import ImprovedJobCard from '../components/common/ImprovedJobCard';
import SearchBar from '../components/common/SearchBar';
import SchemaHead from '../components/seo/SchemaHead';
import { generateFAQSchema, generateBreadcrumbSchema, generateJobPostingSchema } from '../utils/schemaGenerator';
import { EmailCaptureForm } from '../components/email-capture/EmailCaptureForm';
import type { Job } from '../types/job';

interface PageProps {
  jobs: Job[];
  recentJobsCount: number;
  error?: string;
}

const RemoteCaptioningJobsPage: React.FC<PageProps> = ({ jobs, recentJobsCount, error }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  const pageUrl = `${baseUrl}/remote-captioning-jobs`;

  // FAQ items based on page content
  const faqItems = [
    {
      question: 'What do remote captioners do?',
      answer: 'Remote captioners convert spoken audio into written text for videos, broadcasts, live events, and pre-recorded content. Captions are time-synchronized with audio and include speaker identification and sound effects. Captioners work across entertainment, education, legal, and medical industries.'
    },
    {
      question: 'How much do captioning jobs pay?',
      answer: 'Entry-level post-production captioning pays $15-20/hour. Experienced real-time captioning pays $25-40/hour. Specialized broadcast and CART captioning pays $40-80/hour. Rush jobs and specialized content like legal or medical captioning command premium rates.'
    },
    {
      question: 'What equipment do I need for remote captioning?',
      answer: 'For post-production captioning, you need a standard computer, reliable internet (10+ Mbps), quality headphones ($50-150), and optionally a foot pedal ($30-60). For real-time captioning, you need a stenography machine ($1,500-3,000), high-speed internet (50+ Mbps), a backup internet connection, and a professional headset.'
    },
    {
      question: 'What types of captioning jobs are available?',
      answer: 'The main types are: Real-Time Captioner ($25-45/hour) for live events using stenography, Post-Production Captioner ($15-30/hour) for pre-recorded videos, Broadcast Captioner ($30-50/hour) for TV networks ensuring FCC compliance, and CART Provider ($40-80/hour) for educational and legal accessibility services.'
    },
    {
      question: 'What skills are needed for captioning jobs?',
      answer: 'Required skills include typing speed of 60-80 WPM for post-production or 200+ WPM with stenography for real-time work, 98%+ accuracy rate, excellent grammar and punctuation, strong audio comprehension, attention to detail, and time management skills.'
    }
  ];

  const filterChips = [
    { label: 'Entry-Level', value: 'entry-level' },
    { label: 'Experienced', value: 'experienced' },
    { label: 'Real-Time', value: 'real-time' },
    { label: 'Post-Production', value: 'post-production' }
  ];

  // Filter jobs for captioning/transcription positions
  // First try to find specific captioning jobs
  let captioningJobs = jobs.filter(job => {
    const title = job.title?.toLowerCase() || '';
    const description = job.description?.toLowerCase() || '';
    return title.includes('caption') || 
           title.includes('transcription') ||
           title.includes('transcriber') ||
           description.includes('captioning') ||
           description.includes('subtitle');
  });
  
  // If no specific captioning jobs found, show transcription and data entry jobs as related
  if (captioningJobs.length === 0) {
    captioningJobs = jobs.filter(job => {
      const title = job.title?.toLowerCase() || '';
      const description = job.description?.toLowerCase() || '';
      return title.includes('transcription') || 
             title.includes('data entry') ||
             title.includes('administrative') ||
             description.includes('transcription') ||
             description.includes('typing');
    });
  }
  
  // If still no jobs, show all jobs as fallback
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

  // Generate structured data schemas
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Remote Captioning Jobs', url: pageUrl }
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

  const pageTitle = "Captioning Jobs from Home - Remote & Closed Captioning | ClickClickJob";
  const pageDescription = "Find captioning jobs from home including closed captioning, real-time captioning, and transcription. Remote captioning positions with flexible hours and competitive pay.";

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
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-center">
            Captioning Jobs from Home - Remote & Closed Captioning
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 text-center">
            Find captioning jobs from home including closed captioning and real-time captioning. Flexible hours, competitive pay.
          </p>
          
          <div className="max-w-3xl mx-auto">
            <SearchBar 
              placeholder="Search captioning jobs..."
              filterChips={filterChips}
              onSearch={(query) => console.log(query)}
              onFilterChange={(filters) => console.log(filters)}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['All Jobs', 'Entry-Level', 'Experienced', 'Real-Time', 'Post-Production'].map((filter) => (
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Captioning Positions</h2>
          
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">More Captioning Opportunities</h2>
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
              <h3 className="mt-4 text-lg font-medium text-gray-900">Loading captioning positions</h3>
              <p className="mt-2 text-sm text-gray-500">
                Browse transcription and administrative jobs for related opportunities.
              </p>
              <Link href="/categories/transcription" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">
                View Transcription Jobs →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <article className="prose max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What Do Remote Captioners Do?</h2>
            
            <p className="text-lg text-gray-700 mb-6">
              Remote captioners convert spoken audio into written text for videos, broadcasts, live events, and pre-recorded content. This differs from transcription in that captions are time-synchronized with audio and include speaker identification and sound effects. Captioners work across entertainment, education, legal, and medical industries.
            </p>
            
            <p className="text-lg text-gray-700 mb-6">
              Real-time captioning involves transcribing live events as they happen, requiring specialized equipment and high typing speeds (200+ WPM with stenography). Post-production captioning allows you to work on pre-recorded content at your own pace, typically requiring 60-80 WPM typing speed with high accuracy.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Types of Remote Captioning Jobs</h2>
            
            <div className="space-y-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Real-Time Captioner</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    $25-45/hour
                  </span>
                </div>
                <p className="text-gray-700 mb-3">
                  Caption live events, broadcasts, and meetings as they happen using stenography equipment or voice writing.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Required Skills:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Stenography certification (often required)</li>
                      <li>• 200+ WPM typing speed</li>
                      <li>• Real-time accuracy under pressure</li>
                      <li>• Specialized equipment proficiency</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Equipment Needed:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Stenography machine ($1,500-3,000)</li>
                      <li>• High-speed internet (50+ Mbps)</li>
                      <li>• Backup internet connection</li>
                      <li>• Quality headphones</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Post-Production Captioner</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    $15-30/hour
                  </span>
                </div>
                <p className="text-gray-700 mb-3">
                  Create captions for pre-recorded videos, ensuring accuracy, timing, and proper formatting.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Typical Turnaround:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 24-48 hours for standard projects</li>
                      <li>• Rush jobs pay premium rates</li>
                      <li>• 4:1 ratio (4 hours work per 1 hour video)</li>
                      <li>• Flexible scheduling</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Software Used:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• CaptionSync, Rev, 3Play Media</li>
                      <li>• Subtitle Edit (free)</li>
                      <li>• Aegisub (free)</li>
                      <li>• Company-specific platforms</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Broadcast Captioner</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    $30-50/hour
                  </span>
                </div>
                <p className="text-gray-700 mb-3">
                  Provide captions for TV networks and streaming services, ensuring FCC compliance and broadcast standards.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">FCC Requirements:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 99% accuracy standard</li>
                      <li>• Proper speaker identification</li>
                      <li>• Sound effect notation</li>
                      <li>• Synchronization requirements</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Career Path:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Start with smaller networks</li>
                      <li>• Build portfolio and reputation</li>
                      <li>• Advance to major broadcasters</li>
                      <li>• Potential for specialization</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">CART Provider</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    $40-80/hour
                  </span>
                </div>
                <p className="text-gray-700 mb-3">
                  Communication Access Realtime Translation for educational and legal settings, providing real-time text for deaf and hard-of-hearing individuals.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Certification:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• CART certification required</li>
                      <li>• State licensing (varies)</li>
                      <li>• Continuing education requirements</li>
                      <li>• Professional association membership</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Specialization Benefits:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Higher pay rates</li>
                      <li>• Consistent client base</li>
                      <li>• Professional development</li>
                      <li>• Industry recognition</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How Much Do Captioning Jobs Pay?</h2>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Pay Rates by Experience Level:</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex justify-between">
                  <span><span className="font-semibold">Entry-Level:</span> Post-production captioning</span>
                  <span className="text-blue-600 font-semibold">$15-20/hour</span>
                </li>
                <li className="flex justify-between">
                  <span><span className="font-semibold">Experienced:</span> Real-time captioning</span>
                  <span className="text-blue-600 font-semibold">$25-40/hour</span>
                </li>
                <li className="flex justify-between">
                  <span><span className="font-semibold">Specialized:</span> Broadcast and CART</span>
                  <span className="text-blue-600 font-semibold">$40-80/hour</span>
                </li>
              </ul>
              
              <p className="text-sm text-gray-600 mt-4">
                <strong>Pay Models:</strong> Per-minute rates ($1-3/minute of finished content) or hourly rates. Rush jobs and specialized content (legal, medical) command premium rates.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Getting Started in Remote Captioning</h2>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Required Skills:</h3>
              <ul className="grid md:grid-cols-2 gap-x-6 gap-y-3 text-gray-700">
                <li>• <span className="font-semibold">Typing Speed:</span> 60-80 WPM (post-production), 200+ WPM (real-time with stenography)</li>
                <li>• <span className="font-semibold">Accuracy:</span> 98%+ accuracy rate required</li>
                <li>• <span className="font-semibold">Grammar:</span> Excellent grammar and punctuation</li>
                <li>• <span className="font-semibold">Listening:</span> Strong audio comprehension</li>
                <li>• <span className="font-semibold">Attention to Detail:</span> Catch every word and sound</li>
                <li>• <span className="font-semibold">Time Management:</span> Meet tight deadlines</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Training Programs and Certifications:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <span className="font-semibold">Court Reporting Schools:</span> Offer stenography and CART training (12-36 months)</li>
                <li>• <span className="font-semibold">Online Courses:</span> Captioning fundamentals and software training (self-paced)</li>
                <li>• <span className="font-semibold">Certifications:</span> CART certification, broadcast captioner credentials</li>
                <li>• <span className="font-semibold">Company Training:</span> Some employers provide paid training for post-production work</li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Common Software Platforms:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-sm text-gray-900 mb-2">Professional Platforms:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• 3Play Media</li>
                    <li>• Rev.com</li>
                    <li>• CaptionSync</li>
                    <li>• Vitac</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 mb-2">Free Tools:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Subtitle Edit</li>
                    <li>• Aegisub</li>
                    <li>• YouTube Studio (practice)</li>
                    <li>• Amara (community)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Building Your Portfolio:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Start with free projects on Amara or YouTube to gain experience</li>
                <li>• Create sample captions for different content types (educational, entertainment, news)</li>
                <li>• Take typing tests to demonstrate speed and accuracy</li>
                <li>• Apply to entry-level positions with established captioning companies</li>
                <li>• Network with other captioners in professional associations</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Equipment Needed for Captioning Work</h2>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Post-Production Setup:</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• <span className="font-medium">Computer:</span> Standard laptop or desktop</li>
                    <li>• <span className="font-medium">Internet:</span> 10+ Mbps reliable connection</li>
                    <li>• <span className="font-medium">Headphones:</span> Quality over-ear headphones ($50-150)</li>
                    <li>• <span className="font-medium">Software:</span> Usually provided by employer</li>
                    <li>• <span className="font-medium">Foot Pedal:</span> Optional but helpful ($30-60)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Real-Time Setup:</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• <span className="font-medium">Stenography Machine:</span> $1,500-3,000 (or rent $100/month)</li>
                    <li>• <span className="font-medium">High-Speed Internet:</span> 50+ Mbps (hardwired)</li>
                    <li>• <span className="font-medium">Backup Internet:</span> Mobile hotspot or secondary ISP</li>
                    <li>• <span className="font-medium">Professional Headset:</span> Broadcast-quality ($100-300)</li>
                    <li>• <span className="font-medium">Quiet Workspace:</span> Soundproofed area essential</li>
                  </ul>
                </div>
              </div>
            </div>
          </article>

          {/* Internal Links */}
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Job Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/categories/transcription"
                className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors"
              >
                <h4 className="font-semibold text-gray-900 mb-2">Transcription Jobs</h4>
                <p className="text-sm text-gray-600">Related audio-to-text work</p>
              </Link>
              <Link
                href="/categories/data-entry"
                className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors"
              >
                <h4 className="font-semibold text-gray-900 mb-2">Data Entry Jobs</h4>
                <p className="text-sm text-gray-600">Entry-level remote positions</p>
              </Link>
              <Link
                href="/work-from-home-administrative-jobs"
                className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors"
              >
                <h4 className="font-semibold text-gray-900 mb-2">Administrative Jobs</h4>
                <p className="text-sm text-gray-600">General remote admin work</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How to Spot Legitimate Captioning Jobs */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How to Spot Legitimate Captioning Jobs</h2>
            <p className="text-lg text-gray-700 mb-6">
              Remote captioning is a growing field, but that growth has also attracted scammers. Knowing how to tell a real opportunity from a fraudulent one can save you time and money. Use the checklist below to evaluate any captioning job posting before you apply.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-green-700 mb-4">Green Flags (Legitimate)</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700"><strong>Real company website</strong> with an About page, contact information, and verifiable history</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700"><strong>Clear job description</strong> that specifies duties, required skills, hours, and content types</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700"><strong>No upfront fees</strong> -- the employer never asks you to pay for training, software, or equipment access</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700"><strong>Reasonable pay range</strong> of $15-25/hr for post-production work, consistent with industry standards</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700"><strong>Professional hiring process</strong> with a skills test, interview, or sample captioning assignment</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700"><strong>Established reputation</strong> -- you can find reviews from other captioners on forums or Glassdoor</span>
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
                    <span className="text-gray-700"><strong>Asks for money upfront</strong> for training materials, certification programs, or software licenses</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-700"><strong>Vague job descriptions</strong> that do not specify what content you will caption or what tools you will use</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-700"><strong>Unrealistic pay promises</strong> such as "earn $60/hour with no experience" or "make $5,000 your first week"</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-700"><strong>No company information</strong> -- no website, no physical address, and no way to verify the business exists</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-700"><strong>Pressure to act immediately</strong> with claims like "only 3 spots left" or "offer expires today"</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-700"><strong>Requests sensitive information early</strong> such as your Social Security number or bank details before any interview</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Remember:</strong> Legitimate captioning employers will never ask you to pay for the opportunity to work. They invest in your training because quality captioning protects their business reputation. All positions listed on ClickClickJob are screened, but always research a company independently before sharing personal information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Get Started in Remote Captioning */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How to Get Started in Remote Captioning</h2>
            <p className="text-lg text-gray-700 mb-8">
              Breaking into captioning work is achievable at any experience level. Post-production captioning has a lower barrier to entry than real-time work, making it an ideal starting point. Follow these steps to build a captioning career from scratch.
            </p>
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Assess and Improve Your Typing Speed</h3>
                <p className="text-gray-700 mb-3">
                  Post-production captioning requires a minimum of 60-80 words per minute with at least 98% accuracy. Use free tools such as TypingTest.com or Keybr.com to measure your current speed. If you are below the threshold, dedicate 20-30 minutes per day to typing practice. Most people can gain 10-15 WPM within a month of consistent practice. For real-time captioning, you will eventually need 200+ WPM using stenography, but that is an advanced skill to develop later.
                </p>
                <div className="bg-blue-50 rounded p-3">
                  <p className="text-sm text-gray-700"><strong>Tip:</strong> Many captioning companies include a timed typing and accuracy test as part of their application. Practicing beforehand gives you a significant advantage.</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Learn Captioning Standards and Get Certified</h3>
                <p className="text-gray-700 mb-3">
                  Captioning follows specific formatting rules that differ from general transcription. Study the Described and Captioned Media Program (DCMP) captioning guidelines, which cover timing, placement, speaker identification, and sound effect notation. For post-production work, a formal certification is not always required, but completing an online captioning course demonstrates commitment to employers. If you plan to pursue real-time or CART captioning, consider enrolling in a court reporting or stenography program, which typically takes 12-36 months.
                </p>
                <div className="bg-blue-50 rounded p-3">
                  <p className="text-sm text-gray-700"><strong>Tip:</strong> Free resources like the DCMP guidelines and YouTube tutorials on subtitle timing can help you learn the basics before investing in paid training.</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Choose Your Captioning Niche</h3>
                <p className="text-gray-700 mb-3">
                  Captioning spans many content types, and specializing can help you stand out and earn higher rates. Entertainment captioning covers movies, TV shows, and streaming content. Educational captioning focuses on lectures, courses, and training videos. Legal captioning involves court proceedings and depositions. Medical captioning covers healthcare conferences and patient education materials. Consider your existing knowledge and interests when choosing a niche. Captioners with subject-matter expertise produce more accurate work and are more competitive for specialized positions.
                </p>
                <div className="bg-blue-50 rounded p-3">
                  <p className="text-sm text-gray-700"><strong>Tip:</strong> Specializing in a technical field like legal or medical captioning can increase your hourly rate by 30-50% compared to general captioning work.</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">4. Apply to Reputable Captioning Companies</h3>
                <p className="text-gray-700 mb-3">
                  Start by applying to established captioning companies that hire remote workers. Companies such as Rev, 3Play Media, Vitac, and CaptionSync regularly hire post-production captioners and often provide their own training and software. When applying, highlight your typing speed, accuracy rate, and any relevant experience with audio-to-text work. Tailor each application to the specific company rather than sending identical submissions. Expect to complete a skills assessment that tests your ability to caption a short audio or video clip with proper timing and formatting.
                </p>
                <div className="bg-blue-50 rounded p-3">
                  <p className="text-sm text-gray-700"><strong>Tip:</strong> Apply to 3-5 companies at a time and follow up after one week if you have not received a response. Persistence matters in this field.</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">5. Build Your Portfolio and Advance Your Career</h3>
                <p className="text-gray-700 mb-3">
                  Once you land your first captioning role, focus on building a strong track record. Maintain a 98%+ accuracy rate and meet every deadline. Save examples of your best work (with permission) to build a portfolio you can show to future clients or employers. As you gain experience, you can take on more complex projects, move into real-time captioning, or transition to broadcast work for higher pay. Joining professional organizations like the National Court Reporters Association (NCRA) provides networking opportunities, continuing education, and access to higher-paying positions.
                </p>
                <div className="bg-blue-50 rounded p-3">
                  <p className="text-sm text-gray-700"><strong>Tip:</strong> Volunteer to caption content for nonprofits or community organizations on platforms like Amara. This builds your portfolio while contributing to accessibility.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Extended FAQ Section */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions About Remote Captioning</h2>
            <div className="space-y-6">
              {faqItems.map((faq, index) => (
                <div key={index} className="bg-white shadow-md rounded-lg p-6 border-l-4 border-blue-600">
                  <h3 className="font-semibold text-lg text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Get the latest captioning job opportunities
          </h2>
          <p className="text-gray-600 mb-6">
            Receive new captioning and transcription positions in your inbox weekly.
          </p>
          <EmailCaptureForm
            source="captioning-jobs"
            variant="inline"
            className="max-w-md mx-auto"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Start Your Captioning Career Today
          </h2>
          <p className="text-blue-100 mb-8 max-w-3xl mx-auto">
            Browse all opportunities or explore related transcription and administrative roles.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/jobs"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50"
            >
              Browse All Jobs
            </Link>
            <Link 
              href="/categories/transcription"
              className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-600"
            >
              Transcription Jobs
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

export default RemoteCaptioningJobsPage;

