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

const WorkFromHomeAdministrativeJobsPage: React.FC<PageProps> = ({ jobs, recentJobsCount, error }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filterChips = [
    { label: 'Entry-Level', value: 'entry-level' },
    { label: 'Executive Level', value: 'executive' },
    { label: 'Part-Time', value: 'part-time' },
    { label: 'Full-Time', value: 'full-time' }
  ];

  // Filter jobs for administrative positions
  let adminJobs = jobs.filter(job => {
    const title = job.title?.toLowerCase() || '';
    const description = job.description?.toLowerCase() || '';
    return title.includes('admin') || 
           title.includes('assistant') ||
           title.includes('coordinator') ||
           title.includes('receptionist') ||
           description.includes('administrative');
  });
  
  // If no admin jobs found, show all jobs as fallback
  if (adminJobs.length === 0) {
    adminJobs = jobs.slice(0, 12);
  }

  const filteredJobs = activeFilter 
    ? adminJobs.filter(job => {
        const title = job.title?.toLowerCase() || '';
        const description = job.description?.toLowerCase() || '';
        if (activeFilter === 'entry-level') {
          return title.includes('entry') || description.includes('entry-level');
        }
        if (activeFilter === 'executive') {
          return title.includes('executive') || title.includes('ea ') || title.includes('executive assistant');
        }
        if (activeFilter === 'part-time') {
          return (job as any).jobType?.toLowerCase().includes('part');
        }
        if (activeFilter === 'full-time') {
          return (job as any).jobType?.toLowerCase().includes('full');
        }
        return true;
      })
    : adminJobs;

  return (
    <Layout
      title="Work from Home Administrative Jobs | Entry to Executive | ClickClickJob"
      description="Professional remote admin positions. Entry-level to executive opportunities. Browse work from home administrative jobs updated daily. Start your remote career today."
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-center">
            Work from Home Administrative Jobs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 text-center">
            Professional remote admin positions. Entry-level to executive opportunities.
          </p>
          
          <div className="max-w-3xl mx-auto">
            <SearchBar 
              placeholder="Search administrative jobs..."
              filterChips={filterChips}
              onSearch={(query) => console.log(query)}
              onFilterChange={(filters) => console.log(filters)}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <button
              onClick={() => setActiveFilter(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !activeFilter 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
              }`}
            >
              All Jobs
            </button>
            <button
              onClick={() => setActiveFilter('entry-level')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === 'entry-level'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
              }`}
            >
              Entry-Level
            </button>
            <button
              onClick={() => setActiveFilter('executive')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === 'executive'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
              }`}
            >
              Executive Level
            </button>
            <button
              onClick={() => setActiveFilter('part-time')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === 'part-time'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
              }`}
            >
              Part-Time
            </button>
            <button
              onClick={() => setActiveFilter('full-time')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === 'full-time'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
              }`}
            >
              Full-Time
            </button>
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Administrative Opportunities</h2>
          
          {filteredJobs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
              {filteredJobs.slice(0, 9).map(job => (
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
              <h3 className="mt-4 text-lg font-medium text-gray-900">Loading administrative positions</h3>
              <p className="mt-2 text-sm text-gray-500">
                Browse all jobs for more opportunities.
              </p>
              <Link href="/jobs" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">
                View All Jobs →
              </Link>
            </div>
          )}

          {filteredJobs.length > 9 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">More Administrative Positions</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.slice(9).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <article className="prose max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Remote Administrative Career Paths</h2>
            
            <p className="text-lg text-gray-700 mb-6">
              Administrative work offers clear career progression from entry-level to executive positions. Most professionals start as administrative assistants, advance to coordinator roles, and can reach executive assistant or office manager positions within 3-5 years.
            </p>
            
            <p className="text-lg text-gray-700 mb-6">
              Typical career timelines show entry-level assistants (0-2 years experience) earning $30-40k annually, mid-level coordinators (2-5 years) earning $40-55k, and senior roles (5+ years) reaching $55-80k. Remote positions often offer competitive salaries comparable to or exceeding in-office roles.
            </p>

            <p className="text-lg text-gray-700 mb-8">
              Salary progression accelerates with specialized skills. Learning project management tools, mastering advanced Excel/Sheets functions, gaining industry-specific knowledge, and developing technical skills can increase earning potential by 20-40%. Executive assistants with specialized skills can earn $70-90k annually while working remotely.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-6">Types of Work from Home Administrative Jobs</h2>
            
            {/* Entry-Level Administrative Assistant */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Entry-Level Administrative Assistant</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  $30-40k
                </span>
              </div>
              
              <p className="text-gray-700 mb-4">
                Support daily operations by handling emails, scheduling appointments, maintaining files, and providing general administrative assistance. Perfect for those starting their remote career.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Typical Responsibilities:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Manage email and calendar</li>
                    <li>• Schedule meetings and appointments</li>
                    <li>• Organize digital files and documents</li>
                    <li>• Handle basic data entry tasks</li>
                    <li>• Answer phone calls and messages</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Skills Needed:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Microsoft Office or Google Workspace</li>
                    <li>• Written and verbal communication</li>
                    <li>• Time management</li>
                    <li>• Attention to detail</li>
                    <li>• Basic tech proficiency</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Executive Assistant */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Executive Assistant</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  $50-80k
                </span>
              </div>
              
              <p className="text-gray-700 mb-4">
                Provide high-level support to executives, managing complex calendars, coordinating travel, preparing presentations, and acting as a liaison between leadership and teams.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Advanced Responsibilities:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Manage executive's full calendar</li>
                    <li>• Coordinate complex travel arrangements</li>
                    <li>• Prepare reports and presentations</li>
                    <li>• Handle confidential information</li>
                    <li>• Liaison with stakeholders</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Required Experience:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 3-5 years admin experience</li>
                    <li>• Advanced MS Office skills</li>
                    <li>• Project management ability</li>
                    <li>• Discretion and confidentiality</li>
                    <li>• Proactive problem-solving</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Office Manager (Remote) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Office Manager (Remote)</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  $45-70k
                </span>
              </div>
              
              <p className="text-gray-700 mb-4">
                Oversee administrative operations, manage team workflows, coordinate office systems and procedures, and ensure smooth day-to-day operations for remote or hybrid teams.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Management Responsibilities:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Oversee administrative team</li>
                    <li>• Manage office systems and tools</li>
                    <li>• Coordinate cross-functional projects</li>
                    <li>• Budget tracking and reporting</li>
                    <li>• Implement process improvements</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Skills Needed:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Leadership and team management</li>
                    <li>• Process optimization</li>
                    <li>• Budget management</li>
                    <li>• Project management tools</li>
                    <li>• Strategic thinking</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Administrative Coordinator */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Administrative Coordinator</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  $40-60k
                </span>
              </div>
              
              <p className="text-gray-700 mb-4">
                Coordinate projects and processes, support multiple team members, manage documentation and workflows, and ensure deadlines are met across various initiatives.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Project Coordination:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Track project timelines</li>
                    <li>• Coordinate team schedules</li>
                    <li>• Maintain project documentation</li>
                    <li>• Facilitate communication</li>
                    <li>• Monitor deliverables</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Required Skills:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Project management basics</li>
                    <li>• Multi-tasking ability</li>
                    <li>• Strong organization</li>
                    <li>• Communication skills</li>
                    <li>• Problem-solving mindset</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Virtual Receptionist */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Virtual Receptionist</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                  $28-40k
                </span>
              </div>
              
              <p className="text-gray-700 mb-4">
                Serve as the first point of contact for clients and customers, handle incoming calls, manage appointment scheduling, and provide excellent customer service remotely.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Customer-Facing Responsibilities:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Answer and route phone calls</li>
                    <li>• Schedule appointments</li>
                    <li>• Respond to email inquiries</li>
                    <li>• Provide information to clients</li>
                    <li>• Maintain customer database</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Communication Skills Focus:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Professional phone manner</li>
                    <li>• Active listening</li>
                    <li>• Clear written communication</li>
                    <li>• Customer service orientation</li>
                    <li>• Patience and empathy</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Essential Skills for Remote Administrative Work</h2>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Skills</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-semibold">Microsoft Office / Google Workspace: </span>
                    Word/Docs, Excel/Sheets, PowerPoint/Slides, Outlook/Gmail. Advanced Excel skills (pivot tables, VLOOKUP) highly valued.
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-semibold">Project Management Tools: </span>
                    Asana, Trello, Monday.com, ClickUp. Understanding of task management and workflow tracking.
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-semibold">Communication Platforms: </span>
                    Slack, Microsoft Teams, Zoom, Google Meet. Professional video conferencing etiquette.
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Soft Skills</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-semibold">Communication: </span>
                    Clear written and verbal communication. Ability to convey information concisely and professionally across time zones.
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-semibold">Organization: </span>
                    Excellent organizational skills to manage multiple tasks, prioritize effectively, and maintain detailed records.
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-semibold">Time Management: </span>
                    Self-motivation and discipline to meet deadlines without direct supervision. Ability to structure your workday effectively.
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry-Specific Skills</h3>
              <p className="text-gray-700 mb-3">
                Specializing in specific industries can increase your earning potential and job opportunities:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• <span className="font-semibold">Healthcare:</span> HIPAA compliance, medical terminology, EHR systems</li>
                <li>• <span className="font-semibold">Legal:</span> Legal document formatting, court procedures, client confidentiality</li>
                <li>• <span className="font-semibold">Real Estate:</span> MLS systems, transaction coordination, property management software</li>
                <li>• <span className="font-semibold">Finance:</span> Financial reporting, QuickBooks, compliance requirements</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Setting Up Your Home Office for Administrative Work</h2>
            
            <p className="text-lg text-gray-700 mb-6">
              A professional home office setup is essential for remote administrative work. Here's what you'll need:
            </p>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Essential Equipment</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• <span className="font-medium">Computer:</span> Laptop or desktop with webcam</li>
                    <li>• <span className="font-medium">Monitor:</span> Second monitor increases productivity 20-30%</li>
                    <li>• <span className="font-medium">Internet:</span> Minimum 25 Mbps, hardwired preferred</li>
                    <li>• <span className="font-medium">Headset:</span> Quality headset with noise cancellation</li>
                    <li>• <span className="font-medium">Desk & Chair:</span> Ergonomic setup to prevent strain</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Software Requirements</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Microsoft Office 365 or Google Workspace</li>
                    <li>• Video conferencing (Zoom, Teams)</li>
                    <li>• Project management tools (employer-provided)</li>
                    <li>• Cloud storage (Dropbox, Google Drive)</li>
                    <li>• Password manager for security</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-8">
              <h3 className="font-semibold text-yellow-900 mb-3">Workspace Organization Tips</h3>
              <ul className="space-y-2 text-yellow-800 text-sm">
                <li>• Dedicate a specific room or area for work only</li>
                <li>• Ensure good lighting to reduce eye strain</li>
                <li>• Minimize background noise and distractions</li>
                <li>• Keep supplies organized and within reach</li>
                <li>• Set boundaries with household members during work hours</li>
              </ul>
            </div>
          </article>

          {/* Internal Links */}
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Explore Related Opportunities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link 
                href="/categories/administrative"
                className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="font-medium text-gray-900">All Administrative Jobs</span>
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link 
                href="/categories/virtual-assistant"
                className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="font-medium text-gray-900">Virtual Assistant</span>
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link 
                href="/part-time-remote-admin-jobs"
                className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="font-medium text-gray-900">Part-Time Admin Jobs</span>
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Related Searches Section */}
          <div className="mt-8 bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="flex flex-wrap gap-3">
              <Link href="/part-time-remote-admin-jobs" className="inline-flex items-center px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300">
                Part-Time Admin Jobs
              </Link>
              <Link href="/categories/administrative" className="inline-flex items-center px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300">
                Executive Assistant Jobs
              </Link>
              <Link href="/categories/data-entry" className="inline-flex items-center px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300">
                Entry-Level Admin Jobs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Never miss a new administrative job posting
          </h2>
          <p className="text-gray-600 mb-6">
            Get curated remote admin opportunities delivered to your inbox every Monday.
          </p>
          <EmailCaptureForm
            source="work-from-home-admin-jobs"
            variant="inline"
            className="max-w-md mx-auto"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Start Your Remote Administrative Career
          </h2>
          <p className="text-blue-100 mb-8 max-w-3xl mx-auto">
            Browse all opportunities or explore specialized administrative roles.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/jobs"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50"
            >
              Browse All Jobs
            </Link>
            <Link 
              href="/part-time-remote-admin-jobs"
              className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-600"
            >
              Part-Time Opportunities
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
    
    // Filter for recent jobs (30 days)
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

export default WorkFromHomeAdministrativeJobsPage;

