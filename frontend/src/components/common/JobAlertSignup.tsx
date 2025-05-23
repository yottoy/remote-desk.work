import React, { useState } from 'react';
import { keywordTracking } from './KeywordAnalytics';

interface JobAlertSignupProps {
  keyword: string;
  className?: string;
}

const JobAlertSignup: React.FC<JobAlertSignupProps> = ({ keyword, className = '' }) => {
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Track signup attempt
      keywordTracking.trackSearch(keyword, `email_signup:${email}:${frequency}`);
      
      // In a real implementation, you would send the data to your backend
      // For this demo, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Track successful signup
      if (typeof window !== 'undefined' && 'gtag' in window) {
        // @ts-ignore
        window.gtag('event', 'job_alert_signup', {
          'email': email,
          'frequency': frequency,
          'keyword_page': keyword,
          'value': 3
        });
      }
      
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError('There was an error signing up. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className={`email-signup bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}
      data-testid="email-signup"
    >
      <h3 className="text-lg font-medium text-gray-900 mb-3">
        Get Job Alerts for "{keyword.replace(/-/g, ' ')}"
      </h3>
      
      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Success! You're now signed up for job alerts.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="your@email.com"
              required
              aria-required="true"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
              Alert Frequency
            </label>
            <select
              id="frequency"
              name="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="instant">Instant (As soon as jobs are posted)</option>
            </select>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing Up...' : 'Get Job Alerts'}
            </button>
          </div>
          
          <p className="mt-2 text-xs text-gray-500">
            You can unsubscribe at any time. By signing up, you agree to our <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>.
          </p>
        </form>
      )}
    </div>
  );
};

export default JobAlertSignup;
