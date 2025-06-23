import React from 'react';
import Link from 'next/link';
import { Job, EnhancedJobListing } from '../../types/job';

interface InternalLinkingProps {
  currentJob?: Job | EnhancedJobListing;
  relatedJobs?: (Job | EnhancedJobListing)[];
  category?: string;
  showJobSuggestions?: boolean;
  showCategoryLinks?: boolean;
  className?: string;
}

interface CategoryLink {
  name: string;
  slug: string;
  description: string;
}

const categoryLinks: CategoryLink[] = [
  {
    name: 'Data Entry Jobs',
    slug: 'data-entry',
    description: 'Remote data entry positions'
  },
  {
    name: 'Administrative Jobs',
    slug: 'administrative',
    description: 'Virtual administrative roles'
  },
  {
    name: 'Customer Service Jobs',
    slug: 'customer-service',
    description: 'Remote customer support positions'
  },
  {
    name: 'Virtual Assistant Jobs',
    slug: 'virtual-assistant',
    description: 'Virtual assistant opportunities'
  },
  {
    name: 'Transcription Jobs',
    slug: 'transcription',
    description: 'Audio and document transcription work'
  }
];

const InternalLinking: React.FC<InternalLinkingProps> = ({
  currentJob,
  relatedJobs = [],
  category,
  showJobSuggestions = true,
  showCategoryLinks = true,
  className = ''
}) => {
  // Filter out current job from related jobs
  const filteredRelatedJobs = relatedJobs.filter(job => 
    currentJob ? job._id !== currentJob._id : true
  ).slice(0, 5);

  // Get category links excluding current category
  const filteredCategoryLinks = categoryLinks.filter(cat => 
    category ? cat.slug !== category : true
  );

  if (!showJobSuggestions && !showCategoryLinks) {
    return null;
  }

  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Explore More Opportunities
      </h3>
      
      {/* Related Jobs Section */}
      {showJobSuggestions && filteredRelatedJobs.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Similar Positions
          </h4>
          <div className="space-y-2">
            {filteredRelatedJobs.map(job => (
              <Link
                key={job._id}
                href={`/jobs/${job._id}`}
                className="block p-3 bg-white rounded border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="text-sm font-medium text-gray-900 line-clamp-2">
                  {job.title}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {job.company} • {job.location}
                </div>
                {((job as any).salary || (job as any).payRange) && (
                  <div className="text-xs text-green-600 font-medium mt-1">
                    {(job as any).salary || (job as any).payRange}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Category Links Section */}
      {showCategoryLinks && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Browse by Category
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredCategoryLinks.map(categoryLink => (
              <Link
                key={categoryLink.slug}
                href={`/categories/${categoryLink.slug}`}
                className="block p-3 bg-white rounded border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="text-sm font-medium text-blue-600">
                  {categoryLink.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {categoryLink.description}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* General Navigation Links */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm">
          <Link 
            href="/jobs" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            All Jobs
          </Link>
          <Link 
            href="/categories" 
            className="text-blue-600 hover:text-blue-800"
          >
            Browse Categories
          </Link>
          <Link 
            href="/about" 
            className="text-blue-600 hover:text-blue-800"
          >
            About Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InternalLinking; 