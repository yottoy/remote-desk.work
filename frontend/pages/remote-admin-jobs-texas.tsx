import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
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

const RemoteAdminJobsTexasPage: React.FC<PageProps> = ({ jobs, recentJobsCount, error }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filterChips = [
    { label: 'Executive Assistant', value: 'executive' },
    { label: 'Data Entry', value: 'data-entry' },
    { label: 'Office Manager', value: 'office-manager' },
    { label: 'Part-Time', value: 'part-time' },
    { label: 'Full-Time', value: 'full-time' }
  ];

  // Filter jobs for Texas-based remote administrative positions with broad fallback
  let texasAdminJobs = jobs.filter(job => {
    const title = job.title?.toLowerCase() || '';
    const description = job.description?.toLowerCase() || '';
    const location = job.location?.toLowerCase() || '';
    const fullText = `${title} ${description} ${location}`;
    
    // Look for Texas in location or description
    const hasTexas = fullText.includes('texas') || 
                     fullText.includes('tx') ||
                     fullText.includes('dallas') ||
                     fullText.includes('houston') ||
                     fullText.includes('austin') ||
                     fullText.includes('san antonio');
    
    // Look for administrative terms
    const isAdmin = fullText.includes('admin') ||
                    fullText.includes('assistant') ||
                    fullText.includes('coordinator') ||
                    fullText.includes('clerk') ||
                    fullText.includes('secretary');
    
    return hasTexas && isAdmin;
  });
  
  // Fallback to any administrative jobs if no Texas-specific jobs found
  if (texasAdminJobs.length < 8) {
    const adminJobs = jobs.filter(job => {
      const title = job.title?.toLowerCase() || '';
      const description = job.description?.toLowerCase() || '';
      const fullText = `${title} ${description}`;
      
      return fullText.includes('admin') ||
             fullText.includes('assistant') ||
             fullText.includes('coordinator') ||
             fullText.includes('data entry') ||
             fullText.includes('clerk') ||
             fullText.includes('secretary') ||
             fullText.includes('office') ||
             fullText.includes('support');
    });
    texasAdminJobs = [...texasAdminJobs, ...adminJobs].slice(0, 24);
  }
  
  // Final fallback to show any jobs
  if (texasAdminJobs.length === 0) {
    texasAdminJobs = jobs.slice(0, 12);
  }

  const filteredJobs = activeFilter
    ? texasAdminJobs.filter(job => {
        const title = job.title?.toLowerCase() || '';
        const description = job.description?.toLowerCase() || '';
        const employmentType = (job as any).employmentType?.toLowerCase() || '';

        if (activeFilter === 'executive') {
          return title.includes('executive') || description.includes('executive');
        }
        if (activeFilter === 'data-entry') {
          return title.includes('data') || description.includes('data entry');
        }
        if (activeFilter === 'office-manager') {
          return title.includes('manager') || title.includes('office');
        }
        if (activeFilter === 'part-time') {
          return employmentType.includes('part');
        }
        if (activeFilter === 'full-time') {
          return employmentType.includes('full');
        }
        return true;
      })
    : texasAdminJobs;

  // FAQ items derived from page content
  const faqItems = [
    {
      question: 'Why is Texas a great state for remote administrative work?',
      answer: 'Texas offers unique advantages for remote workers including no state income tax, affordable cost of living outside major cities, a business-friendly environment, and a Central Time Zone that makes it easy to work with both coasts. Many companies are establishing remote teams in Texas to tap into the state\'s large, skilled workforce.'
    },
    {
      question: 'What types of remote administrative jobs are available in Texas?',
      answer: 'Common remote admin roles in Texas include virtual executive assistants, data entry specialists, remote office managers, customer service representatives, administrative coordinators, and medical office assistants. These positions span industries like energy, healthcare, technology, finance, and real estate.'
    },
    {
      question: 'How much do remote administrative jobs in Texas pay?',
      answer: 'Salaries vary by role: Entry-level data entry pays $28,000-$38,000/year, administrative assistants earn $35,000-$50,000/year, executive assistants make $45,000-$70,000/year, and remote office managers earn $50,000-$75,000/year. Salaries can be higher in specialized industries like oil & gas, healthcare, or tech.'
    },
    {
      question: 'Do I need to be a Texas resident to apply for these jobs?',
      answer: 'Many remote administrative positions require you to be a Texas resident for tax and legal purposes. Most roles operate on Central Time (CT), and some industries like healthcare and finance may require state-specific background checks or clearances.'
    },
    {
      question: 'Which Texas cities have the most remote admin job opportunities?',
      answer: 'Major metro areas like Houston (energy, healthcare, aerospace), Dallas-Fort Worth (tech, finance, logistics), Austin (tech startups, government), and San Antonio (healthcare, military support) have the most opportunities. Growing markets include El Paso, Corpus Christi, Lubbock, and The Woodlands.'
    },
    {
      question: 'What tips can help me land a remote admin job in Texas?',
      answer: 'Key tips include highlighting your familiarity with Texas business culture and time zones, joining Texas remote work groups and professional associations, emphasizing reliability and strong work ethic, mastering Microsoft Office and Google Workspace, having a dedicated home office setup, and demonstrating strong written and verbal communication skills.'
    }
  ];

  // JSON-LD Structured Data
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqItems.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer }
    }))
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.clickclickjob.com' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Remote Administrative Jobs in Texas', 'item': 'https://www.clickclickjob.com/remote-admin-jobs-texas' }
    ]
  };

  const jobSchemas = filteredJobs.slice(0, 10).map(job => {
    const datePosted = job.postedDate ? new Date(job.postedDate).toISOString() : new Date().toISOString();
    const validThroughDate = new Date(datePosted);
    validThroughDate.setDate(validThroughDate.getDate() + 30);
    const desc = (job as any).descriptionText || job.description || `${job.title} position at ${job.company}.`;
    return {
      '@context': 'https://schema.org/',
      '@type': 'JobPosting',
      'title': job.title,
      'description': desc.length < 200 ? desc + ` This remote ${job.title} role offers the flexibility to work from home.` : desc,
      'datePosted': datePosted,
      'validThrough': validThroughDate.toISOString(),
      'hiringOrganization': { '@type': 'Organization', 'name': job.company },
      'jobLocation': {
        '@type': 'Place',
        'address': {
          '@type': 'PostalAddress',
          'addressRegion': 'TX',
          'addressCountry': 'US'
        }
      },
      'jobLocationType': 'TELECOMMUTE',
      'applicantLocationRequirements': { '@type': 'Country', 'name': 'US' },
      'employmentType': 'FULL_TIME'
    };
  });

  return (
    <Layout
      title="Remote Administrative Jobs in Texas (Work from Home) | ClickClickJob"
      description="Find remote administrative jobs based in Texas. Virtual assistant, data entry, and office support positions for Texas residents. Work from home anywhere in TX."
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        {jobSchemas.map((schema, index) => (
          <script
            key={`job-schema-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center">
              Remote Administrative Jobs in Texas
            </h1>
            <span className="text-4xl">🤠</span>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 text-center">
            Work from home anywhere in Texas. Virtual assistant, data entry, and office support positions for TX residents.
          </p>
          
          <div className="max-w-3xl mx-auto">
            <SearchBar 
              placeholder="Search Texas remote admin jobs..."
              filterChips={filterChips}
              onSearch={(query) => console.log(query)}
              onFilterChange={(filters) => console.log(filters)}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['All Jobs', 'Executive Assistant', 'Data Entry', 'Office Manager', 'Part-Time', 'Full-Time'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter === 'All Jobs' ? null : filter.toLowerCase().replace(' ', '-'))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  (filter === 'All Jobs' && !activeFilter) || activeFilter === filter.toLowerCase().replace(' ', '-')
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-600'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="mt-8 flex justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{recentJobsCount}</div>
              <div className="text-sm text-gray-600">TX Positions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">100%</div>
              <div className="text-sm text-gray-600">Remote</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">Daily</div>
              <div className="text-sm text-gray-600">Updates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Available Remote Administrative Jobs in Texas
            </h2>
            <div className="text-sm text-gray-600">
              {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
            </div>
          </div>

          {error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">Error loading jobs: {error}</div>
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                Return to homepage
              </Link>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-600 mb-2">No jobs found matching your criteria</p>
              <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or check back later</p>
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                Browse all jobs
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <ImprovedJobCard key={job._id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Content Section - Texas Remote Work Information */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Remote Administrative Work in Texas: Everything You Need to Know
          </h2>

          <div className="prose prose-lg max-w-none">
            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Why Texas is Great for Remote Workers
            </h3>
            <p className="text-gray-700 mb-6">
              Texas has become a major hub for remote work opportunities, especially in administrative fields. 
              With no state income tax, affordable cost of living (outside major cities), and a business-friendly 
              environment, Texas offers unique advantages for remote administrative professionals. Many companies 
              are establishing remote teams in Texas to tap into the state's large, skilled workforce.
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Types of Remote Administrative Jobs in Texas
            </h3>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>Virtual Executive Assistants:</strong> Support C-level executives remotely with scheduling, travel, and communication</li>
              <li><strong>Data Entry Specialists:</strong> Process information for Texas-based companies across healthcare, energy, and tech</li>
              <li><strong>Remote Office Managers:</strong> Coordinate virtual teams and manage administrative operations</li>
              <li><strong>Customer Service Representatives:</strong> Handle inquiries for Texas businesses from your home office</li>
              <li><strong>Administrative Coordinators:</strong> Support project management and team coordination remotely</li>
              <li><strong>Medical Office Assistants:</strong> Work remotely for Texas healthcare providers handling records and scheduling</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Texas Cities with Remote Admin Opportunities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">🏙️ Major Metro Areas</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>Houston - Energy, healthcare, and aerospace</li>
                  <li>Dallas-Fort Worth - Tech, finance, and logistics</li>
                  <li>Austin - Tech startups and government</li>
                  <li>San Antonio - Healthcare and military support</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">🌆 Growing Markets</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>El Paso - Border trade and logistics</li>
                  <li>Corpus Christi - Port operations</li>
                  <li>Lubbock - Agriculture and education</li>
                  <li>The Woodlands - Corporate headquarters</li>
                </ul>
              </div>
            </div>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Salary Expectations for Texas Remote Admin Jobs
            </h3>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>Entry-Level Data Entry:</strong> $28,000 - $38,000/year</li>
              <li><strong>Administrative Assistant:</strong> $35,000 - $50,000/year</li>
              <li><strong>Executive Assistant:</strong> $45,000 - $70,000/year</li>
              <li><strong>Office Manager (Remote):</strong> $50,000 - $75,000/year</li>
              <li><strong>Administrative Coordinator:</strong> $40,000 - $60,000/year</li>
            </ul>
            <p className="text-sm text-gray-600 mb-6">
              <em>Note: Salaries can be higher for specialized industries like oil & gas, healthcare, or tech companies.</em>
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Texas-Specific Requirements
            </h3>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>Residency:</strong> Many positions require you to be a Texas resident for tax and legal purposes</li>
              <li><strong>Time Zone:</strong> Most roles operate on Central Time (CT)</li>
              <li><strong>Home Office:</strong> Reliable high-speed internet is essential (Texas has good coverage in metro areas)</li>
              <li><strong>Background Checks:</strong> Some industries (healthcare, finance) require state-specific clearances</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Top Industries Hiring Remote Admins in Texas
            </h3>
            <ol className="list-decimal pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>Energy & Oil/Gas:</strong> Houston-based energy companies need extensive administrative support</li>
              <li><strong>Healthcare:</strong> Texas Medical Center and healthcare networks across the state</li>
              <li><strong>Technology:</strong> Austin's tech scene and Dallas's corporate tech presence</li>
              <li><strong>Finance & Insurance:</strong> Major banks and insurance companies in Dallas and Houston</li>
              <li><strong>Real Estate:</strong> Booming property market needs admin coordination</li>
              <li><strong>Education:</strong> Universities and school districts transitioning to remote admin</li>
            </ol>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Benefits of Remote Work in Texas
            </h3>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>No State Income Tax:</strong> Keep more of your paycheck compared to other states</li>
              <li><strong>Affordable Living:</strong> Lower cost of living in many areas (especially outside major cities)</li>
              <li><strong>Central Time Zone:</strong> Easy to work with both coasts</li>
              <li><strong>Growing Economy:</strong> More companies relocating to Texas = more opportunities</li>
              <li><strong>Year-Round Comfort:</strong> Work from home during hot Texas summers</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Tips for Landing a Remote Admin Job in Texas
            </h3>
            <ol className="list-decimal pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>Highlight Local Knowledge:</strong> Mention familiarity with Texas business culture and time zones</li>
              <li><strong>Network Locally:</strong> Join Texas remote work groups and professional associations</li>
              <li><strong>Emphasize Reliability:</strong> Texas employers value dependability and strong work ethic</li>
              <li><strong>Technical Skills:</strong> Master Microsoft Office, Google Workspace, and industry-specific software</li>
              <li><strong>Professional Home Office:</strong> Be prepared to show you have a dedicated, quiet workspace</li>
              <li><strong>Communication Skills:</strong> Strong written and verbal communication is crucial for remote roles</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Get Texas Remote Jobs Delivered to Your Inbox
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Weekly updates with the latest administrative opportunities for Texas residents. Never miss a new posting.
            </p>
            <EmailCaptureForm 
              source="remote-admin-jobs-texas-page"
            />
          </div>
        </div>
      </section>

      {/* Internal Links Section */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            More Remote Administrative Jobs
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/work-from-home-administrative-jobs"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all"
            >
              Work from Home Admin Jobs
            </Link>
            <Link 
              href="/part-time-remote-admin-jobs"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all"
            >
              Part-Time Positions
            </Link>
            <Link 
              href="/remote-medical-administrative-jobs"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all"
            >
              Medical Admin Jobs
            </Link>
            <Link 
              href="/remote-jobs-near-me"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all"
            >
              Jobs Near Me
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

export default RemoteAdminJobsTexasPage;

