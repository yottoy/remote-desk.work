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

const RemoteMedicalAdminJobsPage: React.FC<PageProps> = ({ jobs, recentJobsCount, error }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filterChips = [
    { label: 'Entry-Level', value: 'entry-level' },
    { label: 'Medical Billing', value: 'billing' },
    { label: 'Medical Coding', value: 'coding' },
    { label: 'No Certification Required', value: 'no-cert' }
  ];

  // Filter jobs for medical administrative positions with broad fallback
  let medicalAdminJobs = jobs.filter(job => {
    const title = job.title?.toLowerCase() || '';
    const description = job.description?.toLowerCase() || '';
    const fullText = `${title} ${description}`;
    
    return fullText.includes('medical') || 
           fullText.includes('healthcare') ||
           fullText.includes('patient') ||
           fullText.includes('billing') ||
           fullText.includes('clinical') ||
           fullText.includes('hospital') ||
           fullText.includes('clinic') ||
           fullText.includes('health') ||
           fullText.includes('hipaa') ||
           fullText.includes('dental') ||
           fullText.includes('pharmacy');
  });
  
  // Fallback to administrative jobs if no medical-specific jobs found
  if (medicalAdminJobs.length < 8) {
    const adminJobs = jobs.filter(job => {
      const title = job.title?.toLowerCase() || '';
      const description = job.description?.toLowerCase() || '';
      const fullText = `${title} ${description}`;
      return fullText.includes('admin') || 
             fullText.includes('coordinator') || 
             fullText.includes('assistant') ||
             fullText.includes('receptionist') ||
             fullText.includes('clerk') ||
             fullText.includes('support') ||
             fullText.includes('records');
    });
    medicalAdminJobs = [...medicalAdminJobs, ...adminJobs].slice(0, 24);
  }
  
  // Final fallback to show any jobs
  if (medicalAdminJobs.length === 0) {
    medicalAdminJobs = jobs.slice(0, 12);
  }

  const filteredJobs = activeFilter 
    ? medicalAdminJobs.filter(job => {
        const title = job.title?.toLowerCase() || '';
        const description = job.description?.toLowerCase() || '';
        if (activeFilter === 'entry-level' || activeFilter === 'no-cert') {
          return title.includes('entry') || description.includes('entry-level') || description.includes('no experience');
        }
        if (activeFilter === 'billing') {
          return title.includes('billing');
        }
        if (activeFilter === 'coding') {
          return title.includes('coding') || title.includes('coder');
        }
        return true;
      })
    : medicalAdminJobs;

  return (
    <Layout
      title="Remote Medical Administrative Jobs | Healthcare Admin | ClickClickJob"
      description="Work from home in healthcare administration. Medical admin assistant, billing, coding, and patient coordinator positions. No patient contact required."
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-center">
            Remote Medical Administrative Jobs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 text-center">
            Work from home in healthcare administration. No patient contact required.
          </p>
          
          <div className="max-w-3xl mx-auto">
            <SearchBar 
              placeholder="Search medical admin jobs..."
              filterChips={filterChips}
              onSearch={(query) => console.log(query)}
              onFilterChange={(filters) => console.log(filters)}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['All Jobs', 'Entry-Level', 'Medical Billing', 'Medical Coding', 'No Certification Required'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter === 'All Jobs' ? null : filter.toLowerCase().replace(/ /g, '-'))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  (filter === 'All Jobs' && !activeFilter) || activeFilter === filter.toLowerCase().replace(/ /g, '-')
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Healthcare Admin Roles</h2>
          
          {filteredJobs.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
                {filteredJobs.slice(0, 6).map(job => (
                  <ImprovedJobCard key={job._id} job={job} variant="compact" />
                ))}
              </div>
              {filteredJobs.length > 6 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">More Medical Admin Opportunities</h2>
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
              <h3 className="mt-4 text-lg font-medium text-gray-900">Loading medical admin positions</h3>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Remote Medical Administrative Careers</h2>
            
            <div className="space-y-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Medical Administrative Assistant</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    $35-50k
                  </span>
                </div>
                <p className="text-gray-700 mb-4">
                  Handle scheduling, medical records, insurance verification, and patient communication. CMA certification helpful but often not required for remote positions.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Responsibilities:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Schedule patient appointments</li>
                      <li>• Maintain electronic medical records</li>
                      <li>• Verify insurance coverage</li>
                      <li>• Process patient intake forms</li>
                      <li>• Handle patient inquiries</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Required Skills:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Medical terminology knowledge</li>
                      <li>• HIPAA compliance understanding</li>
                      <li>• EHR system experience helpful</li>
                      <li>• Strong communication skills</li>
                      <li>• Attention to detail</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Medical Billing Specialist</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    $40-55k
                  </span>
                </div>
                <p className="text-gray-700 mb-4">
                  Process insurance claims, handle billing inquiries, follow up on unpaid claims, and ensure accurate coding for reimbursement. CPC or CCS certification helpful.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Key Tasks:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Submit insurance claims</li>
                      <li>• Follow up on denials</li>
                      <li>• Process patient billing</li>
                      <li>• Verify coding accuracy</li>
                      <li>• Handle collections</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Certifications (Optional):</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• CPC (Certified Professional Coder)</li>
                      <li>• CCS (Certified Coding Specialist)</li>
                      <li>• CMBS (Certified Medical Billing Specialist)</li>
                      <li>• On-the-job training often provided</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Medical Records Specialist</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    $35-48k
                  </span>
                </div>
                <p className="text-gray-700 mb-4">
                  Manage and organize electronic health records, ensure data accuracy, maintain confidentiality, and comply with HIPAA regulations. RHIT certification optional but valuable.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Daily Work:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Maintain EHR systems</li>
                      <li>• Ensure data accuracy</li>
                      <li>• Process records requests</li>
                      <li>• Audit medical charts</li>
                      <li>• Comply with regulations</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Skills Needed:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Detail-oriented mindset</li>
                      <li>• EHR software proficiency</li>
                      <li>• HIPAA knowledge (critical)</li>
                      <li>• Organization skills</li>
                      <li>• Confidentiality awareness</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Patient Coordinator (Remote)</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                    $32-45k
                  </span>
                </div>
                <p className="text-gray-700 mb-4">
                  Serve as liaison between patients and healthcare providers, schedule appointments, answer questions, and ensure smooth patient experience. No certification typically required.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Patient Interaction:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Schedule appointments</li>
                      <li>• Answer patient questions</li>
                      <li>• Coordinate referrals</li>
                      <li>• Follow up after visits</li>
                      <li>• Process new patient intake</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-2">Customer Service Focus:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Empathy and patience</li>
                      <li>• Clear communication</li>
                      <li>• Problem-solving skills</li>
                      <li>• Professional phone manner</li>
                      <li>• Multitasking ability</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Do You Need Certification?</h2>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Jobs That DON'T Require Certification:</h3>
              <ul className="space-y-2 text-gray-700 mb-6">
                <li>• Medical Administrative Assistant (entry-level)</li>
                <li>• Patient Coordinator</li>
                <li>• Medical Receptionist (remote)</li>
                <li>• Healthcare Customer Service Representative</li>
              </ul>
              
              <h3 className="font-semibold text-gray-900 mb-4">Jobs Where Certification Helps (But May Not Be Required):</h3>
              <ul className="space-y-2 text-gray-700 mb-6">
                <li>• Medical Billing Specialist - CPC, CMBS helpful</li>
                <li>• Medical Coding Specialist - CPC, CCS valuable</li>
                <li>• Medical Records Specialist - RHIT optional</li>
              </ul>
              
              <h3 className="font-semibold text-gray-900 mb-4">Popular Certifications:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <span className="font-medium">CMA</span> - Certified Medical Assistant</li>
                <li>• <span className="font-medium">CMAA</span> - Certified Medical Administrative Assistant</li>
                <li>• <span className="font-medium">CPC</span> - Certified Professional Coder</li>
                <li>• <span className="font-medium">CCS</span> - Certified Coding Specialist</li>
                <li>• <span className="font-medium">RHIT</span> - Registered Health Information Technician</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Healthcare Software Knowledge</h2>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Common EHR Systems:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <span className="font-medium">Epic</span> - Widely used in hospitals</li>
                    <li>• <span className="font-medium">Cerner</span> - Large healthcare networks</li>
                    <li>• <span className="font-medium">AllScripts</span> - Physician practices</li>
                    <li>• <span className="font-medium">Athenahealth</span> - Cloud-based system</li>
                    <li>• <span className="font-medium">eClinicalWorks</span> - Small to mid-size practices</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Medical Billing Software:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <span className="font-medium">Kareo</span> - Practice management</li>
                    <li>• <span className="font-medium">AdvancedMD</span> - Billing and coding</li>
                    <li>• <span className="font-medium">DrChrono</span> - Mobile EHR</li>
                    <li>• <span className="font-medium">Practice Fusion</span> - Free EHR option</li>
                    <li>• Training usually provided by employer</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">HIPAA Compliance for Remote Workers</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6">
              <h3 className="font-semibold text-yellow-900 mb-3">Critical Privacy Requirements:</h3>
              <ul className="space-y-2 text-yellow-800">
                <li>• <span className="font-medium">Secure Workspace:</span> Private area where conversations cannot be overheard</li>
                <li>• <span className="font-medium">Screen Privacy:</span> Position monitors away from windows/visitors</li>
                <li>• <span className="font-medium">Data Protection:</span> Use encrypted connections (VPN) for all medical data access</li>
                <li>• <span className="font-medium">Device Security:</span> Password-protected computers, automatic lock screens</li>
                <li>• <span className="font-medium">Document Disposal:</span> Shred any printed materials with patient information</li>
                <li>• <span className="font-medium">Training:</span> Complete HIPAA training (employer-provided)</li>
              </ul>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-6">
              <h3 className="font-semibold text-red-900 mb-3">HIPAA Violations Can Result In:</h3>
              <ul className="space-y-2 text-red-800">
                <li>• Immediate termination from position</li>
                <li>• Heavy fines ($100 to $50,000 per violation)</li>
                <li>• Criminal charges in severe cases</li>
                <li>• Difficulty finding future healthcare employment</li>
                <li className="font-medium mt-3">Take HIPAA compliance seriously - it protects patients and your career!</li>
              </ul>
            </div>
          </article>

          {/* Internal Links */}
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Job Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/categories/administrative" className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors">
                <h4 className="font-semibold text-gray-900 mb-2">Administrative Jobs</h4>
                <p className="text-sm text-gray-600">General admin positions</p>
              </Link>
              <Link href="/categories/customer-service" className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors">
                <h4 className="font-semibold text-gray-900 mb-2">Customer Service</h4>
                <p className="text-sm text-gray-600">Patient-facing roles</p>
              </Link>
              <Link href="/work-from-home-administrative-jobs" className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors">
                <h4 className="font-semibold text-gray-900 mb-2">Work from Home Admin</h4>
                <p className="text-sm text-gray-600">All remote admin work</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Get medical administrative jobs weekly
          </h2>
          <p className="text-gray-600 mb-6">
            Receive healthcare administration opportunities in your inbox.
          </p>
          <EmailCaptureForm source="medical-admin-jobs" variant="inline" className="max-w-md mx-auto" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Start Your Healthcare Administration Career
          </h2>
          <p className="text-blue-100 mb-8 max-w-3xl mx-auto">
            Browse all opportunities or explore related administrative positions.
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

export default RemoteMedicalAdminJobsPage;

