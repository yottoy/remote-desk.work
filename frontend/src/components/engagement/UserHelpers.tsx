import React, { useState, useEffect } from 'react';
import { JobListing, EnhancedJobListing } from '../../types/job';

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  successMessage?: string;
  className?: string;
}

export const CopyToClipboard: React.FC<CopyButtonProps> = ({
  textToCopy,
  label = 'Copy',
  successMessage = 'Copied!',
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset the "copied" state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    if (!isClient) return;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  if (!isClient) {
    return null; // Don't render anything during SSR
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}
      type="button"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4 mr-1.5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
};

interface ApplicationInstructionsProps {
  job: JobListing | EnhancedJobListing;
  className?: string;
}

export const ApplicationInstructions: React.FC<ApplicationInstructionsProps> = ({ job, className = '' }) => {
  // Extract application instructions from job description if available
  const hasSpecificInstructions = job.description?.toLowerCase().includes('apply') || 
                                 job.description?.toLowerCase().includes('application') || 
                                 job.description?.toLowerCase().includes('submit');

  return (
    <div className={`bg-blue-50 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-medium text-blue-800">How to Apply</h3>
      
      {hasSpecificInstructions ? (
        <div className="mt-2 text-sm text-blue-700">
          <p>This job has specific application instructions. Please read the full job description carefully.</p>
          <div className="mt-2 flex">
            {job.url ? (
              <a 
                href={job.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm leading-5 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply on Company Website
                <svg className="ml-1.5 w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-500 bg-gray-100 cursor-not-allowed">
                Application Link Unavailable
                <svg className="ml-1.5 w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
            {job.url && (
              <CopyToClipboard 
                textToCopy={job.url} 
                label="Copy URL" 
                className="ml-2" 
              />
            )}
          </div>
        </div>
      ) : (
        <div className="mt-2 text-sm text-blue-700">
          <p>To apply for this position, please follow these steps:</p>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Click the "Apply on Company Website" button below</li>
            <li>Review the job requirements carefully</li>
            <li>Follow the application instructions on the company's website</li>
            <li>Ensure your resume highlights relevant experience</li>
          </ol>
          <div className="mt-3 flex">
            {job.url ? (
              <a 
                href={job.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm leading-5 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply on Company Website
                <svg className="ml-1.5 w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-500 bg-gray-100 cursor-not-allowed">
                Application Link Unavailable
                <svg className="ml-1.5 w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
            {job.url && (
              <CopyToClipboard 
                textToCopy={job.url} 
                label="Copy URL" 
                className="ml-2" 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for managing search history in localStorage
export const useSearchHistory = (maxItems = 10) => {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history from localStorage on component mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('searchHistory');
      if (storedHistory) {
        setSearchHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Error loading search history from localStorage:', error);
    }
  }, []);

  // Add a new search term to history
  const addToSearchHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    setSearchHistory(prevHistory => {
      // Remove duplicate if exists and add to the beginning
      const updatedHistory = [searchTerm, ...prevHistory.filter(term => term !== searchTerm)].slice(0, maxItems);
      
      // Save to localStorage
      try {
        localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      } catch (error) {
        console.error('Error saving search history to localStorage:', error);
      }
      
      return updatedHistory;
    });
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('searchHistory');
    } catch (error) {
      console.error('Error removing search history from localStorage:', error);
    }
  };

  return { searchHistory, addToSearchHistory, clearSearchHistory };
};

// Hook for managing filter preferences in localStorage
export const useFilterPreferences = () => {
  const [filterPreferences, setFilterPreferences] = useState<Record<string, any>>({});

  // Load filter preferences from localStorage on component mount
  useEffect(() => {
    try {
      const storedPreferences = localStorage.getItem('filterPreferences');
      if (storedPreferences) {
        setFilterPreferences(JSON.parse(storedPreferences));
      }
    } catch (error) {
      console.error('Error loading filter preferences from localStorage:', error);
    }
  }, []);

  // Update filter preferences
  const updateFilterPreferences = (newPreferences: Record<string, any>) => {
    setFilterPreferences(prevPreferences => {
      const updatedPreferences = { ...prevPreferences, ...newPreferences };
      
      // Save to localStorage
      try {
        localStorage.setItem('filterPreferences', JSON.stringify(updatedPreferences));
      } catch (error) {
        console.error('Error saving filter preferences to localStorage:', error);
      }
      
      return updatedPreferences;
    });
  };

  // Clear filter preferences
  const clearFilterPreferences = () => {
    setFilterPreferences({});
    try {
      localStorage.removeItem('filterPreferences');
    } catch (error) {
      console.error('Error removing filter preferences from localStorage:', error);
    }
  };

  return { filterPreferences, updateFilterPreferences, clearFilterPreferences };
};

interface SearchHistoryDisplayProps {
  searchHistory: string[];
  onSelectTerm: (term: string) => void;
  onClearHistory: () => void;
  className?: string;
}

export const SearchHistoryDisplay: React.FC<SearchHistoryDisplayProps> = ({
  searchHistory,
  onSelectTerm,
  onClearHistory,
  className = ''
}) => {
  if (!searchHistory.length) return null;

  return (
    <div className={`rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Recent Searches</h3>
        <button
          onClick={onClearHistory}
          className="text-sm text-gray-500 hover:text-gray-700"
          type="button"
        >
          Clear
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {searchHistory.map((term, index) => (
          <button
            key={index}
            onClick={() => onSelectTerm(term)}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
            type="button"
          >
            <svg className="w-3.5 h-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}; 