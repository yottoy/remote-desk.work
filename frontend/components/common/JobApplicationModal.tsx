import React, { useState, useEffect } from 'react';
import { EnhancedJobListing } from '../../types/job';
import { keywordTracking } from './KeywordAnalytics';
import RegionalTerminology from './RegionalTerminology';
import Link from 'next/link';

interface JobApplicationModalProps {
  job: EnhancedJobListing;
  keyword: string;
  isOpen: boolean;
  onClose: () => void;
}

const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  job,
  keyword,
  isOpen,
  onClose
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [hasResume, setHasResume] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    // Basic validation
    if (!email || !name) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (hasResume && !resumeFile) {
      setFormError('Please upload your resume');
      return;
    }

    setIsSubmitting(true);

    try {
      // Track application start
      keywordTracking.trackJobApplication(keyword, job._id, job.title);

      // In a real implementation, you would send the application data to your backend
      // For this demo, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Track successful application
      if (typeof window !== 'undefined' && 'gtag' in window) {
        // @ts-ignore
        window.gtag('event', 'application_complete', {
          'job_id': job._id,
          'job_title': job.title,
          'source_keyword': keyword,
          'has_resume': hasResume,
          'value': 5
        });
      }

      setSuccessMessage('Your application has been submitted successfully! You will receive a confirmation email shortly.');
      
      // Clear form
      setEmail('');
      setName('');
      setHasResume(false);
      setResumeFile(null);
      
      // Close modal after success message
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      setFormError('There was an error submitting your application. Please try again.');
      console.error('Application submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Apply for {job.title} at {job.company}
                </h3>
                
                {successMessage ? (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                    {successMessage}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {formError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {formError}
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                        aria-required="true"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                        aria-required="true"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center">
                        <input
                          id="has-resume"
                          type="checkbox"
                          checked={hasResume}
                          onChange={(e) => setHasResume(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="has-resume" className="ml-2 block text-sm text-gray-700">
                          I have a <RegionalTerminology usVariant="resume" ukVariant="CV" /> to upload
                        </label>
                      </div>
                    </div>
                    
                    {hasResume && (
                      <div className="mb-4">
                        <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-1">
                          Upload <RegionalTerminology usVariant="Resume" ukVariant="CV" /> (PDF, DOC, or DOCX)
                        </label>
                        <input
                          type="file"
                          id="resume"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                        {resumeFile && (
                          <p className="mt-1 text-sm text-gray-500">
                            Selected file: {resumeFile.name}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-6 text-xs text-gray-500">
                      <p>By applying, you agree to our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link> and <Link href="/terms-of-service" className="text-blue-600 hover:underline">Terms of Service</Link>.</p>
                      <p className="mt-1">* Some links may be affiliate links that generate a commission for ClickClickJob.com</p>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {!successMessage && (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {successMessage ? 'Close' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationModal;
