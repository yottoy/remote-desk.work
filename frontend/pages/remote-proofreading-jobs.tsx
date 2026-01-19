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

const RemoteProofreadingJobsPage: React.FC<PageProps> = ({ jobs, recentJobsCount, error }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filterChips = [
    { label: 'Entry-Level', value: 'entry-level' },
    { label: 'Experienced', value: 'experienced' },
    { label: 'Freelance', value: 'freelance' },
    { label: 'Full-Time', value: 'full-time' }
  ];

  // Filter jobs for proofreading/editing positions with broad fallback
  let proofreadingJobs = jobs.filter(job => {
    const title = job.title?.toLowerCase() || '';
    const description = job.description?.toLowerCase() || '';
    const fullText = `${title} ${description}`;
    
    return fullText.includes('proofread') || 
           fullText.includes('editor') ||
           fullText.includes('editing') ||
           fullText.includes('copy editor') ||
           fullText.includes('writer') ||
           fullText.includes('content') ||
           fullText.includes('copy') ||
           fullText.includes('grammar') ||
           fullText.includes('transcription') ||
           fullText.includes('documentation');
  });
  
  // Fallback to administrative/communication jobs if no editing-specific jobs found
  if (proofreadingJobs.length < 8) {
    const relatedJobs = jobs.filter(job => {
      const title = job.title?.toLowerCase() || '';
      const description = job.description?.toLowerCase() || '';
      const fullText = `${title} ${description}`;
      return fullText.includes('admin') || 
             fullText.includes('communication') ||
             fullText.includes('coordinator') || 
             fullText.includes('assistant') ||
             fullText.includes('correspondence') ||
             fullText.includes('data entry') ||
             fullText.includes('processing');
    });
    proofreadingJobs = [...proofreadingJobs, ...relatedJobs].slice(0, 24);
  }
  
  // Final fallback to show any jobs
  if (proofreadingJobs.length === 0) {
    proofreadingJobs = jobs.slice(0, 12);
  }

  const filteredJobs = activeFilter 
    ? proofreadingJobs.filter(job => {
        const title = job.title?.toLowerCase() || '';
        const description = job.description?.toLowerCase() || '';
        if (activeFilter === 'entry-level') {
          return title.includes('entry') || description.includes('entry-level') || description.includes('junior');
        }
        if (activeFilter === 'experienced') {
          return title.includes('senior') || description.includes('experienced') || description.includes('years');
        }
        return true;
      })
    : proofreadingJobs;

  return (
    <Layout
      title="Remote Proofreading Jobs - Work from Home | ClickClickJob"
      description="Find proofreading and editing opportunities. Freelance and employee positions available. Work from home with flexible hours."
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-center">
            Remote Proofreading Jobs - Work from Home
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 text-center">
            Find proofreading and editing opportunities. Freelance and employee positions available.
          </p>
          
          <div className="max-w-3xl mx-auto">
            <SearchBar 
              placeholder="Search proofreading jobs..."
              filterChips={filterChips}
              onSearch={(query) => console.log(query)}
              onFilterChange={(filters) => console.log(filters)}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['All Jobs', 'Entry-Level', 'Experienced', 'Freelance', 'Full-Time'].map((filter) => (
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Proofreading Positions</h2>
          
          {filteredJobs.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
                {filteredJobs.slice(0, 6).map(job => (
                  <ImprovedJobCard key={job._id} job={job} variant="compact" />
                ))}
              </div>
              {filteredJobs.length > 6 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">More Editing Opportunities</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredJobs.slice(6).map(job => (
                      <ImprovedJobCard key={job._id} job={job} variant="compact" />
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
              <h3 className="mt-4 text-lg font-medium text-gray-900">Loading proofreading positions</h3>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Types of Remote Proofreading Jobs</h2>
            
            <div className="space-y-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">General Proofreader</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    $15-35/hour
                  </span>
                </div>
                <p className="text-gray-700 mb-4">
                  Review content for spelling, grammar, punctuation, and formatting errors. Work with books, articles, website content, marketing materials, and business documents.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Content Types:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Books and manuscripts</li>
                      <li>• Blog articles and web content</li>
                      <li>• Marketing materials</li>
                      <li>• Business correspondence</li>
                      <li>• E-learning content</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Required Skills:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Excellent grammar knowledge</li>
                      <li>• Sharp attention to detail</li>
                      <li>• Consistent style application</li>
                      <li>• Fast, accurate reading</li>
                      <li>• Microsoft Word proficiency</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Copy Editor</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    $25-50/hour
                  </span>
                </div>
                <p className="text-gray-700 mb-4">
                  Provide substantive editing beyond basic proofreading. Improve clarity, flow, structure, and style while maintaining author's voice. Work in publishing, marketing, and corporate communications.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Editing Depth:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Grammar and mechanics</li>
                      <li>• Clarity and readability</li>
                      <li>• Structural improvements</li>
                      <li>• Consistency checking</li>
                      <li>• Fact verification</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Industries:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Publishing houses</li>
                      <li>• Marketing agencies</li>
                      <li>• Corporate communications</li>
                      <li>• Digital media companies</li>
                      <li>• Educational publishers</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Legal Proofreader</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    $30-60/hour
                  </span>
                </div>
                <p className="text-gray-700 mb-4">
                  Review legal documents for accuracy, consistency, and proper citation format. Requires understanding of legal terminology and formatting standards. Higher pay for specialized knowledge.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Document Types:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Court filings and briefs</li>
                      <li>• Contracts and agreements</li>
                      <li>• Legal memoranda</li>
                      <li>• Discovery documents</li>
                      <li>• Regulatory filings</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Specialized Knowledge:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Legal terminology</li>
                      <li>• Citation formats (Bluebook)</li>
                      <li>• Court filing requirements</li>
                      <li>• Confidentiality protocols</li>
                      <li>• Deadline management</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Academic Proofreader</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                    $20-45/hour
                  </span>
                </div>
                <p className="text-gray-700 mb-4">
                  Edit thesis papers, dissertations, research articles, and academic publications. Ensure adherence to specific style guides (APA, MLA, Chicago) and academic writing standards.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Academic Documents:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Thesis and dissertations</li>
                      <li>• Journal articles</li>
                      <li>• Research papers</li>
                      <li>• Grant proposals</li>
                      <li>• Conference papers</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Style Guides:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• APA (Psychology, Education)</li>
                      <li>• MLA (Humanities)</li>
                      <li>• Chicago (History, Arts)</li>
                      <li>• IEEE (Engineering)</li>
                      <li>• Harvard (Various fields)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Freelance vs. Employee Proofreading</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Freelance Proofreading</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-green-900 mb-2">Benefits:</p>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Set your own rates and hours</li>
                      <li>• Choose your projects and clients</li>
                      <li>• Work from anywhere</li>
                      <li>• Unlimited income potential</li>
                      <li>• Diverse content variety</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-green-900 mb-2">Challenges:</p>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Income variability</li>
                      <li>• Must find own clients</li>
                      <li>• No benefits package</li>
                      <li>• Self-employment taxes</li>
                      <li>• Administrative tasks</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-green-900 mb-2">Typical Pay:</p>
                    <p className="text-sm text-green-800">$0.01-0.05 per word or $20-60/hour depending on expertise and specialty</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Employee Positions</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-blue-900 mb-2">Benefits:</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Steady, predictable income</li>
                      <li>• Health insurance and benefits</li>
                      <li>• Paid time off</li>
                      <li>• No client hunting required</li>
                      <li>• Team support and training</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 mb-2">Challenges:</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Fixed schedule (usually)</li>
                      <li>• Salary cap</li>
                      <li>• Less content variety</li>
                      <li>• Must meet quotas</li>
                      <li>• Limited flexibility</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 mb-2">Typical Pay:</p>
                    <p className="text-sm text-blue-800">$35,000-$65,000 annually depending on experience and company size</p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Skills Needed for Proofreading Work</h2>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Essential Skills:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <span className="font-medium">Grammar Mastery:</span> Perfect understanding of English grammar, punctuation, and syntax</li>
                    <li>• <span className="font-medium">Attention to Detail:</span> Catch every typo, inconsistency, and error</li>
                    <li>• <span className="font-medium">Style Guide Knowledge:</span> AP, Chicago, APA, MLA familiarity</li>
                    <li>• <span className="font-medium">Reading Speed:</span> Fast but thorough reading ability</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Common Software:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <span className="font-medium">Microsoft Word:</span> Track changes, comments, formatting</li>
                    <li>• <span className="font-medium">Google Docs:</span> Suggesting mode, comments</li>
                    <li>• <span className="font-medium">Adobe Acrobat:</span> PDF markup and comments</li>
                    <li>• <span className="font-medium">Grammarly Premium:</span> Additional checking tool</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Getting Started as a Remote Proofreader</h2>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Building Your Portfolio:</h3>
              <ol className="space-y-3 text-gray-700">
                <li><span className="font-medium">1. Start with practice:</span> Proofread free samples or volunteer for nonprofits to build experience</li>
                <li><span className="font-medium">2. Take proofreading tests:</span> Complete assessments on platforms like Upwork, Fiverr, or editing companies</li>
                <li><span className="font-medium">3. Get certified (optional):</span> Consider proofreading courses from Editorial Freelancers Association or similar</li>
                <li><span className="font-medium">4. Create sample edits:</span> Show before/after examples (with permission or public domain text)</li>
                <li><span className="font-medium">5. Network:</span> Join editor associations, LinkedIn groups, and writing communities</li>
              </ol>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Finding First Clients or Jobs:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <span className="font-medium">Freelance Platforms:</span> Upwork, Fiverr, Freelancer.com</li>
                <li>• <span className="font-medium">Editing Companies:</span> Scribendi, Cactus Communications, Wordvice</li>
                <li>• <span className="font-medium">Publishing Houses:</span> Apply for remote positions at traditional publishers</li>
                <li>• <span className="font-medium">Direct Outreach:</span> Contact authors, bloggers, businesses needing editing</li>
                <li>• <span className="font-medium">Job Boards:</span> Mediabistro, EditFast, Indeed, LinkedIn</li>
              </ul>
            </div>
          </article>

          {/* Internal Links */}
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Job Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/work-from-home-administrative-jobs" className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors">
                <h4 className="font-semibold text-gray-900 mb-2">Administrative Jobs</h4>
                <p className="text-sm text-gray-600">General remote admin work</p>
              </Link>
              <Link href="/remote-captioning-jobs" className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors">
                <h4 className="font-semibold text-gray-900 mb-2">Captioning Jobs</h4>
                <p className="text-sm text-gray-600">Related transcription work</p>
              </Link>
              <Link href="/data-processing-jobs-remote" className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors">
                <h4 className="font-semibold text-gray-900 mb-2">Data Processing</h4>
                <p className="text-sm text-gray-600">Detail-oriented positions</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Get new proofreading jobs weekly
          </h2>
          <p className="text-gray-600 mb-6">
            Receive editing and proofreading opportunities in your inbox.
          </p>
          <EmailCaptureForm source="proofreading-jobs" variant="inline" className="max-w-md mx-auto" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Start Your Proofreading Career Today
          </h2>
          <p className="text-blue-100 mb-8 max-w-3xl mx-auto">
            Browse all opportunities or explore related remote positions.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/jobs" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50">
              Browse All Jobs
            </Link>
            <Link href="/work-from-home-administrative-jobs" className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-600">
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

export default RemoteProofreadingJobsPage;

