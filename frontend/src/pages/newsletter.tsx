import React from 'react';
import Layout from '../components/layout/Layout';
import EmailCapture from '../components/common/EmailCapture';

const NewsletterPage = () => {
  return (
    <Layout
      title="Remote Work Newsletter | Daily Data Entry & Administrative Job Alerts | ClickClickJob.com"
      description="Subscribe to our newsletter for daily remote job alerts. Get verified data entry, virtual assistant, and administrative work-from-home opportunities delivered straight to your inbox."
    >
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Never Miss a Remote Job Opportunity Again
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              Get verified <strong>data entry</strong>, <strong>virtual assistant</strong>, and <strong>administrative jobs</strong> delivered to your inbox daily. Join 10,000+ remote workers who find their perfect work-from-home opportunity through our newsletter.
            </p>
          </div>

          {/* Email Signup Form */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 md:p-12 shadow-lg mb-12">
            <EmailCapture 
              title="🔥 Get Daily Remote Job Alerts"
              description="Fresh opportunities every morning. Verified companies. No spam. No experience required for many positions."
              source="newsletter_page"
              variant="compact"
            />
          </div>

          {/* Benefits Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">100% Verified Jobs</h3>
              <p className="text-gray-600">Every job is hand-checked by our team. No scams, no fake listings, no pyramid schemes.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fresh Daily Updates</h3>
              <p className="text-gray-600">New opportunities added every day. Be among the first to apply for the best remote positions.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Experience Required</h3>
              <p className="text-gray-600">Many positions welcome beginners. Perfect for career changes, students, or parents returning to work.</p>
            </div>
          </div>

          {/* Job Types Section */}
          <div className="bg-gray-50 rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What You'll Get in Your Inbox</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">✅ Data Entry Jobs</h3>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>• Online data entry positions</li>
                  <li>• Spreadsheet and database work</li>
                  <li>• Document processing roles</li>
                  <li>• Copy-paste data entry jobs</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">✅ Virtual Assistant Opportunities</h3>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>• Administrative support roles</li>
                  <li>• Email management positions</li>
                  <li>• Schedule coordination jobs</li>
                  <li>• Customer service VA roles</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">✅ Administrative Positions</h3>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>• Executive assistant roles</li>
                  <li>• Office support positions</li>
                  <li>• Bookkeeping opportunities</li>
                  <li>• Project coordination jobs</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">✅ Customer Service Jobs</h3>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>• Live chat support roles</li>
                  <li>• Phone customer service</li>
                  <li>• Help desk positions</li>
                  <li>• Technical support jobs</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="bg-blue-600 text-white rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4">Join Thousands of Successful Remote Workers</h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-200">10,000+</div>
                <div className="text-blue-100">Newsletter Subscribers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-200">500+</div>
                <div className="text-blue-100">Jobs Added Weekly</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-200">95%</div>
                <div className="text-blue-100">Verified Job Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewsletterPage; 