import React, { useState, useEffect } from 'react';
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

const RemoteJobsNearMePage: React.FC<PageProps> = ({ jobs, recentJobsCount, error }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string>('your area');
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');

  const filterChips = [
    { label: 'Administrative', value: 'administrative' },
    { label: 'Data Entry', value: 'data-entry' },
    { label: 'Customer Service', value: 'customer-service' },
    { label: 'Part-Time', value: 'part-time' },
    { label: 'Full-Time', value: 'full-time' }
  ];

  // Get user's location on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Reverse geocoding to get city/state from coordinates
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            );
            const data = await response.json();
            
            const city = data.address?.city || data.address?.town || data.address?.village;
            const state = data.address?.state;
            
            if (city && state) {
              setUserLocation(`${city}, ${state}`);
            } else if (state) {
              setUserLocation(state);
            }
            setLocationPermission('granted');
          } catch (err) {
            console.error('Error getting location name:', err);
            setLocationPermission('denied');
          }
        },
        () => {
          setLocationPermission('denied');
        }
      );
    }
  }, []);

  // Filter jobs - all remote jobs are technically "near" the user
  let nearbyJobs = jobs;

  // If we have location permission, prioritize jobs that mention the user's state/city
  if (locationPermission === 'granted' && userLocation !== 'your area') {
    const locationKeywords = userLocation.toLowerCase().split(',').map(s => s.trim());
    
    const locationPreferredJobs = jobs.filter(job => {
      const location = job.location?.toLowerCase() || '';
      const description = job.description?.toLowerCase() || '';
      const fullText = `${location} ${description}`;
      
      return locationKeywords.some(keyword => fullText.includes(keyword));
    });

    if (locationPreferredJobs.length > 0) {
      // Show location-preferred jobs first, then others
      const otherJobs = jobs.filter(job => !locationPreferredJobs.includes(job));
      nearbyJobs = [...locationPreferredJobs, ...otherJobs];
    }
  }

  const filteredJobs = activeFilter 
    ? nearbyJobs.filter(job => {
        const title = job.title?.toLowerCase() || '';
        const description = job.description?.toLowerCase() || '';
        const employmentType = (job as any).employmentType?.toLowerCase() || '';
        
        if (activeFilter === 'administrative') {
          return title.includes('admin') || description.includes('administrative');
        }
        if (activeFilter === 'data-entry') {
          return title.includes('data') || description.includes('data entry');
        }
        if (activeFilter === 'customer-service') {
          return title.includes('customer') || description.includes('customer service');
        }
        if (activeFilter === 'part-time') {
          return employmentType.includes('part');
        }
        if (activeFilter === 'full-time') {
          return employmentType.includes('full');
        }
        return true;
      })
    : nearbyJobs.slice(0, 30);

  return (
    <Layout
      title="Remote Jobs Near Me - Work from Home in Your Area | ClickClickJob"
      description="Find remote jobs you can do from anywhere near you. 100% work from home positions in administrative, data entry, customer service, and more."
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-center">
            Remote Jobs Near {userLocation === 'your area' ? 'You' : userLocation}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4 text-center">
            Work from home positions you can do from anywhere. 100% remote jobs in administrative, customer service, and data entry.
          </p>
          
          {locationPermission === 'pending' && (
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500">
                📍 Allow location access to see jobs prioritized for your area
              </p>
            </div>
          )}
          
          {locationPermission === 'denied' && (
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500">
                💡 All jobs shown are 100% remote and can be done from anywhere
              </p>
            </div>
          )}

          <div className="max-w-3xl mx-auto">
            <SearchBar 
              placeholder="Search remote jobs near you..."
              filterChips={filterChips}
              onSearch={(query) => console.log(query)}
              onFilterChange={(filters) => console.log(filters)}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['All Jobs', 'Administrative', 'Data Entry', 'Customer Service', 'Part-Time', 'Full-Time'].map((filter) => (
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
              <div className="text-sm text-gray-600">Remote Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">100%</div>
              <div className="text-sm text-gray-600">Work from Home</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Commute</div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Available Remote Jobs
              {locationPermission === 'granted' && userLocation !== 'your area' && (
                <span className="text-blue-600"> in {userLocation}</span>
              )}
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

      {/* Content Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Finding Remote Jobs Near You: The Complete Guide
          </h2>

          <div className="prose prose-lg max-w-none">
            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              What "Remote Jobs Near Me" Really Means
            </h3>
            <p className="text-gray-700 mb-6">
              When you search for "remote jobs near me," you're looking for work-from-home positions that you can 
              do from your current location. The beauty of remote work is that geography becomes less important—you 
              can work for companies across the country without relocating. However, some employers do prefer or 
              require candidates in specific states or time zones for tax, legal, or operational reasons.
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Types of Remote Jobs Available Anywhere
            </h3>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>Administrative & Virtual Assistant:</strong> Support executives and teams with scheduling, email, and coordination</li>
              <li><strong>Data Entry & Processing:</strong> Input information, verify records, and maintain databases</li>
              <li><strong>Customer Service:</strong> Help customers via phone, email, or chat from your home office</li>
              <li><strong>Content Writing & Editing:</strong> Create blog posts, marketing copy, and website content</li>
              <li><strong>Transcription & Captioning:</strong> Convert audio/video to text</li>
              <li><strong>Bookkeeping & Accounting:</strong> Manage finances remotely for small businesses</li>
              <li><strong>Social Media Management:</strong> Handle social accounts for brands and businesses</li>
              <li><strong>Project Coordination:</strong> Support project managers and coordinate team activities</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Location-Based Considerations
            </h3>
            <p className="text-gray-700 mb-4">
              While remote jobs allow you to work from anywhere, some factors still matter:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>Time Zone Requirements:</strong> Some jobs need you to work specific hours (e.g., 9-5 Eastern Time)</li>
              <li><strong>State Restrictions:</strong> Employers may only hire from certain states due to tax and labor laws</li>
              <li><strong>Local Market Knowledge:</strong> Some roles benefit from understanding your local area</li>
              <li><strong>Internet Reliability:</strong> Rural areas may face connectivity challenges</li>
              <li><strong>Background Checks:</strong> Some positions require state-specific clearances</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Salary Expectations by Region
            </h3>
            <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
              <p className="text-gray-700 mb-4">
                Remote job salaries often vary by your location, even for the same role:
              </p>
              <ul className="text-gray-700 space-y-2 text-sm">
                <li>🏙️ <strong>Major Metro Areas (NYC, SF, LA):</strong> $45k-$70k for admin roles</li>
                <li>🌆 <strong>Mid-Size Cities (Austin, Denver, Seattle):</strong> $38k-$55k</li>
                <li>🏘️ <strong>Smaller Cities & Suburban:</strong> $32k-$48k</li>
                <li>🌾 <strong>Rural Areas:</strong> $28k-$42k</li>
              </ul>
              <p className="text-xs text-gray-600 mt-4">
                <em>Note: Many companies now use location-based pay scales. Some offer flat rates regardless of location.</em>
              </p>
            </div>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Home Office Requirements
            </h3>
            <p className="text-gray-700 mb-4">
              To successfully work remotely from your location, you'll need:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>High-Speed Internet:</strong> Minimum 25 Mbps download, 5 Mbps upload (for video calls)</li>
              <li><strong>Quiet Workspace:</strong> Dedicated area free from distractions and noise</li>
              <li><strong>Computer:</strong> Modern laptop or desktop (employer may provide)</li>
              <li><strong>Reliable Power:</strong> Consider backup power if you have frequent outages</li>
              <li><strong>Professional Background:</strong> Clean, neutral area visible on video calls</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Finding Remote Jobs in Your State
            </h3>
            <p className="text-gray-700 mb-4">
              When job hunting, focus on these strategies:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>Filter by Location:</strong> Use job boards that let you specify your state or "remote anywhere"</li>
              <li><strong>Check State Requirements:</strong> Read job descriptions carefully for location restrictions</li>
              <li><strong>Local Companies First:</strong> Start with companies headquartered in your state</li>
              <li><strong>Network Locally:</strong> Join local remote work groups and online communities</li>
              <li><strong>Highlight Time Zone:</strong> Make it clear you're available during required hours</li>
              <li><strong>Research State Laws:</strong> Understand your state's remote work and tax implications</li>
            </ol>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Benefits of Working Remotely from Your Current Location
            </h3>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>No Relocation:</strong> Keep your current home, community, and support network</li>
              <li><strong>Lower Cost of Living:</strong> Earn big-city wages while living in affordable areas</li>
              <li><strong>Zero Commute:</strong> Save time, money, and reduce stress</li>
              <li><strong>Flexibility:</strong> Better work-life balance and family time</li>
              <li><strong>Local Opportunities:</strong> Support your community while working remotely</li>
              <li><strong>Weather Independence:</strong> Work comfortably regardless of local weather</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Common Challenges and Solutions
            </h3>
            <div className="space-y-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Challenge: Limited Local Opportunities</h4>
                <p className="text-gray-700 text-sm">
                  <strong>Solution:</strong> Expand your search to national companies. Remote work opens doors to 
                  employers across the country who would never have been accessible before.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Challenge: Time Zone Differences</h4>
                <p className="text-gray-700 text-sm">
                  <strong>Solution:</strong> Look for async-friendly companies or roles with flexible hours. Many 
                  remote positions don't require strict 9-5 availability.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Challenge: Feeling Isolated</h4>
                <p className="text-gray-700 text-sm">
                  <strong>Solution:</strong> Join local coworking spaces, attend meetups, and connect with other 
                  remote workers in your area for coffee or collaboration.
                </p>
              </div>
            </div>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Tax and Legal Considerations
            </h3>
            <p className="text-gray-700 mb-4">
              <strong>Important:</strong> Working remotely from your location has tax implications:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>You typically pay income tax to the state where you live and work</li>
              <li>Your employer must be registered to do business in your state</li>
              <li>Some states have reciprocal agreements with neighbors</li>
              <li>Home office expenses may be tax-deductible (consult a tax professional)</li>
              <li>Workers' compensation laws vary by state</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Get Remote Jobs Delivered to Your Inbox
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Weekly updates with remote jobs you can do from anywhere. No commute required.
            </p>
            <EmailCaptureForm 
              source="remote-jobs-near-me-page"
            />
          </div>
        </div>
      </section>

      {/* Internal Links Section */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Browse Remote Jobs by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/work-from-home-administrative-jobs"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all"
            >
              Administrative Jobs
            </Link>
            <Link 
              href="/data-processing-jobs-remote"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all"
            >
              Data Processing
            </Link>
            <Link 
              href="/remote-admin-jobs-texas"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all"
            >
              Texas Remote Jobs
            </Link>
            <Link 
              href="/part-time-remote-admin-jobs"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all"
            >
              Part-Time Positions
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

export default RemoteJobsNearMePage;

