import React from 'react';
import { EnhancedJobListing } from '../../types/job';
import Link from 'next/link';

interface JobCardMiniProps {
  job: EnhancedJobListing;
  className?: string;
}

// Simplified job card for recommendations and "also viewed" sections
const JobCardMini: React.FC<JobCardMiniProps> = ({ job, className = '' }) => {
  return (
    <Link href={`/jobs/view/${job._id}`} className={`block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors ${className}`}>
      <h3 className="font-medium truncate">{job.title}</h3>
      <p className="text-sm text-gray-600 truncate">{job.company}</p>
      <div className="mt-2 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Posted {new Date(job.postedDate).toLocaleDateString()}
        </span>
        {job.qualityScore >= 8 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            Verified
          </span>
        )}
      </div>
    </Link>
  );
};

interface SimilarJobsProps {
  currentJob: EnhancedJobListing;
  similarJobs: EnhancedJobListing[];
  className?: string;
}

export const SimilarJobs: React.FC<SimilarJobsProps> = ({ 
  currentJob, 
  similarJobs, 
  className = '' 
}) => {
  if (!similarJobs.length) return null;

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold mb-3">Similar Jobs</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {similarJobs.map(job => (
          <JobCardMini key={job._id} job={job} />
        ))}
      </div>
    </div>
  );
};

interface PeopleAlsoViewedProps {
  currentJob: EnhancedJobListing;
  viewedJobs: EnhancedJobListing[];
  className?: string;
}

export const PeopleAlsoViewed: React.FC<PeopleAlsoViewedProps> = ({ 
  currentJob, 
  viewedJobs, 
  className = '' 
}) => {
  if (!viewedJobs.length) return null;

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold mb-3">People Also Viewed</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {viewedJobs.map(job => (
          <JobCardMini key={job._id} job={job} />
        ))}
      </div>
    </div>
  );
};

interface RelatedCategoryProps {
  categoryName: string;
  jobCount: number;
  slug: string;
}

const RelatedCategory: React.FC<RelatedCategoryProps> = ({ categoryName, jobCount, slug }) => {
  return (
    <Link href={`/categories/${slug}`} className="block p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
      <h3 className="font-medium">{categoryName}</h3>
      <p className="text-sm text-gray-600">{jobCount} jobs available</p>
    </Link>
  );
};

interface RelatedCategoriesProps {
  categories: Array<{
    name: string;
    slug: string;
    jobCount: number;
  }>;
  className?: string;
}

export const RelatedCategories: React.FC<RelatedCategoriesProps> = ({ 
  categories, 
  className = '' 
}) => {
  if (!categories.length) return null;

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold mb-3">Related Categories</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {categories.map(category => (
          <RelatedCategory 
            key={category.slug} 
            categoryName={category.name} 
            jobCount={category.jobCount} 
            slug={category.slug}
          />
        ))}
      </div>
    </div>
  );
};

export const JobsYouMightLike: React.FC<{ jobs: EnhancedJobListing[], className?: string }> = ({ 
  jobs, 
  className = '' 
}) => {
  if (!jobs.length) return null;

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold mb-3">Jobs You Might Like</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {jobs.map(job => (
          <JobCardMini key={job._id} job={job} />
        ))}
      </div>
    </div>
  );
};

// Custom hook to handle local storage for recently viewed jobs
export const useRecentlyViewedJobs = () => {
  const [recentlyViewedJobs, setRecentlyViewedJobs] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Load recently viewed jobs from localStorage on component mount
    try {
      const storedJobs = localStorage.getItem('recentlyViewedJobs');
      if (storedJobs) {
        setRecentlyViewedJobs(JSON.parse(storedJobs));
      }
    } catch (error) {
      console.error('Error loading recently viewed jobs from localStorage:', error);
    }
  }, []);

  const addJobToRecentlyViewed = React.useCallback((jobId: string) => {
    setRecentlyViewedJobs(prevJobs => {
      // Remove the job if it already exists and add it to the beginning
      const updatedJobs = [jobId, ...prevJobs.filter(id => id !== jobId)].slice(0, 10);
      
      // Save to localStorage
      try {
        localStorage.setItem('recentlyViewedJobs', JSON.stringify(updatedJobs));
      } catch (error) {
        console.error('Error saving recently viewed jobs to localStorage:', error);
      }
      
      return updatedJobs;
    });
  }, []);

  return { recentlyViewedJobs, addJobToRecentlyViewed };
};

interface GuidedSearchSuggestionProps {
  suggestions: Array<{
    text: string;
    url: string;
  }>;
  className?: string;
}

export const GuidedSearchSuggestions: React.FC<GuidedSearchSuggestionProps> = ({ 
  suggestions, 
  className = '' 
}) => {
  if (!suggestions.length) return null;

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold mb-3">Popular Searches</h2>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Link 
            key={index} 
            href={suggestion.url}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
          >
            {suggestion.text}
          </Link>
        ))}
      </div>
    </div>
  );
}; 