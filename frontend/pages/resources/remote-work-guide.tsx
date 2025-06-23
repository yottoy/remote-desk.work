import React from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';

const RemoteWorkGuidePage = () => {
  return (
    <Layout
      title="Remote Work Guide | ClickClickJob.com"
      description="Learn everything you need to know about finding and succeeding in remote data entry and administrative jobs."
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Remote Work Guide</h1>
          
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Finding Legitimate Remote Opportunities</h2>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-700">Research company reputation before applying</p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-700">Be wary of jobs requiring upfront payments</p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-700">Look for detailed job descriptions with clear requirements</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-700">Verify company contact information and website</p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-700">Watch for unrealistic salary promises</p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-700">Check for secure application processes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Essential Skills for Remote Work</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Technical Skills</h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• Basic computer proficiency</li>
                    <li>• Typing speed (40+ WPM)</li>
                    <li>• Microsoft Office Suite</li>
                    <li>• Email management</li>
                    <li>• Data entry accuracy</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Soft Skills</h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• Time management</li>
                    <li>• Self-motivation</li>
                    <li>• Communication</li>
                    <li>• Problem-solving</li>
                    <li>• Attention to detail</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Work Environment</h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• Reliable internet</li>
                    <li>• Quiet workspace</li>
                    <li>• Backup power</li>
                    <li>• Ergonomic setup</li>
                    <li>• Security measures</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Common Remote Job Types</h2>
              <div className="space-y-6">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-xl font-medium text-gray-900 mb-3">Data Entry</h3>
                  <p className="text-gray-600 mb-4">
                    Data entry jobs involve inputting information into databases, spreadsheets, or other systems. These positions often require attention to detail and basic computer skills.
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Typical salary range: $15-25 per hour
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-xl font-medium text-gray-900 mb-3">Administrative Assistant</h3>
                  <p className="text-gray-600 mb-4">
                    Remote administrative assistants handle tasks like scheduling, email management, document preparation, and basic office support from home.
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Typical salary range: $18-30 per hour
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-xl font-medium text-gray-900 mb-3">Virtual Assistant</h3>
                  <p className="text-gray-600 mb-4">
                    Virtual assistants provide administrative support to clients remotely, often working with multiple clients and handling various tasks.
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Typical salary range: $20-35 per hour
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Application Tips</h2>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                        <span className="text-sm font-medium text-blue-600">1</span>
                      </span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Prepare Your Resume</h3>
                      <p className="mt-1 text-gray-600">
                        Tailor your resume to highlight relevant remote work skills and experience. Include any remote work experience, technical skills, and soft skills that are valuable for remote positions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                        <span className="text-sm font-medium text-blue-600">2</span>
                      </span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Write a Strong Cover Letter</h3>
                      <p className="mt-1 text-gray-600">
                        Emphasize your ability to work independently, manage time effectively, and communicate clearly in a remote environment. Include specific examples of your remote work capabilities.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                        <span className="text-sm font-medium text-blue-600">3</span>
                      </span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Prepare for Remote Interviews</h3>
                      <p className="mt-1 text-gray-600">
                        Test your equipment, find a quiet space, and prepare for video interviews. Be ready to discuss your remote work setup and how you handle common remote work challenges.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Getting Started</h2>
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                <p className="text-gray-600 mb-4">
                  Ready to start your remote work journey? Browse our curated list of remote data entry and administrative jobs:
                </p>
                <div className="mt-6">
                  <Link 
                    href="/jobs"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Browse Remote Jobs
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RemoteWorkGuidePage; 