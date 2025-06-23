import React, { useState, useEffect } from 'react';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterSectionProps {
  id: string;
  title: string;
  options: FilterOption[];
  selectedOptions: string[];
  onChange: (sectionId: string, optionId: string, checked: boolean) => void;
}

interface AdvancedFiltersProps {
  onFilterChange: (filterType: string, values: string[]) => void;
  selectedFilters: Record<string, string[]>;
  showCounts?: boolean;
  className?: string;
  isCollapsible?: boolean;
  mobileView?: boolean;
}

// Individual Filter Section Component
const FilterSection: React.FC<FilterSectionProps> = ({
  id, 
  title, 
  options, 
  selectedOptions, 
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  // Check if any options in this section are selected
  const hasSelectedOptions = selectedOptions && selectedOptions.length > 0;
  
  return (
    <div className="py-3 border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={`filter-section-${id}`}
      >
        <h3 className={`text-sm font-semibold ${hasSelectedOptions ? 'text-blue-600' : 'text-gray-900'} flex items-center`}>
          {title}
          {hasSelectedOptions && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full px-2 py-0.5">
              {selectedOptions.length}
            </span>
          )}
        </h3>
        <span>
          <svg
            className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      
      {isOpen && (
        <div className="mt-4 space-y-3" id={`filter-section-${id}`}>
          {options.map((option) => (
            <div key={option.id} className="flex items-center">
              <input
                id={`${id}-${option.id}`}
                name={`${id}-${option.id}`}
                type="checkbox"
                checked={selectedOptions.includes(option.id)}
                onChange={(e) => onChange(id, option.id, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={`${id}-${option.id}`} className="ml-3 text-sm text-gray-600 cursor-pointer flex items-center justify-between w-full">
                <span>{option.label}</span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Advanced Filters Component
const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  onFilterChange,
  selectedFilters,
  showCounts = false,
  className = '',
  isCollapsible = true,
  mobileView = false,
}) => {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>(selectedFilters);
  
  // Helper to handle filter changes from any section
  const handleFilterChange = (sectionId: string, optionId: string, checked: boolean) => {
    const currentValues = [...(appliedFilters[sectionId] || [])];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, optionId];
    } else {
      newValues = currentValues.filter(val => val !== optionId);
    }
    
    console.log(`Filter changed in UI: ${sectionId} -> ${optionId}, checked: ${checked}`);
    console.log(`New filter values for ${sectionId}:`, newValues);
    
    // Create a new reference to trigger proper re-render
    const newAppliedFilters = {
      ...appliedFilters,
      [sectionId]: newValues
    };
    
    setAppliedFilters(newAppliedFilters);
    
    if (!mobileView) {
      console.log(`Propagating filter change to parent: ${sectionId} ->`, newValues);
      onFilterChange(sectionId, newValues);
    }
  };
  
  // Apply all filters at once (for mobile view)
  const applyFilters = () => {
    Object.entries(appliedFilters).forEach(([key, values]) => {
      // Only update if there are values to apply or the filter was previously set
      if (values.length > 0 || selectedFilters[key]?.length > 0) {
        onFilterChange(key, values);
      }
    });
    setIsMobileFiltersOpen(false);
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    const emptyFilters = Object.keys(appliedFilters).reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {} as Record<string, string[]>);
    
    setAppliedFilters(emptyFilters);
    
    if (!mobileView) {
      Object.keys(selectedFilters).forEach(key => {
        onFilterChange(key, []);
      });
    }
  };
  
  // Update applied filters when selected filters change (for sync between URL params and UI)
  useEffect(() => {
    setAppliedFilters(selectedFilters);
  }, [selectedFilters]);
  
  // Filter sections definition - specifically for admin and data entry jobs
  const filterSections = [
    {
      id: 'jobCategory',
      title: 'Job Category',
      options: [
        { id: 'data-entry', label: 'Data Entry' },
        { id: 'administrative', label: 'Administrative' },
        { id: 'virtual-assistant', label: 'Virtual Assistant' },
        { id: 'customer-service', label: 'Customer Service' },
        { id: 'customer-support', label: 'Customer Support' },
        { id: 'transcription', label: 'Transcription' },
        { id: 'data-processing', label: 'Data Processing' },
        { id: 'bookkeeping', label: 'Bookkeeping' },
        { id: 'content-writing', label: 'Content Writing' },
        { id: 'social-media', label: 'Social Media' },
        { id: 'project-management', label: 'Project Management' },
        { id: 'quality-assurance', label: 'Quality Assurance' }
      ]
    },
    {
      id: 'jobType',
      title: 'Job Type',
      options: [
        { id: 'full-time', label: 'Full-time' },
        { id: 'part-time', label: 'Part-time' },
        { id: 'contract', label: 'Contract' },
        { id: 'temporary', label: 'Temporary' },
      ]
    },
    {
      id: 'experienceLevel',
      title: 'Experience Level',
      options: [
        { id: 'no-experience', label: 'No Experience' },
        { id: 'entry-level', label: 'Entry Level' },
        { id: 'intermediate', label: 'Intermediate' },
        { id: 'experienced', label: 'Experienced' },
      ]
    },
    {
      id: 'payRange',
      title: 'Pay Range',
      options: [
        { id: 'under-$15', label: 'Under $15/hr' },
        { id: '$15-20', label: '$15-20/hr' },
        { id: '$20-25', label: '$20-25/hr' },
        { id: '$25+', label: '$25+/hr' },
      ]
    },
    {
      id: 'softwareRequirements',
      title: 'Software',
      options: [
        { id: 'microsoft-office', label: 'Microsoft Office' },
        { id: 'google-workspace', label: 'Google Workspace' },
        { id: 'excel', label: 'Excel' },
        { id: 'quickbooks', label: 'QuickBooks' },
        { id: 'data-entry-software', label: 'Data Entry Software' },
        { id: 'crm-systems', label: 'CRM Systems' },
      ]
    },
    {
      id: 'location',
      title: 'Location',
      options: [
        { id: 'worldwide', label: 'Worldwide' },
        { id: 'us-only', label: 'US Only' },
        { id: 'us-canada', label: 'US & Canada' },
        { id: 'europe', label: 'Europe' },
        { id: 'asia', label: 'Asia' },
      ]
    },
    {
      id: 'datePosted',
      title: 'Date Posted',
      options: [
        { id: 'today', label: 'Today' },
        { id: 'this-week', label: 'This Week' },
        { id: 'this-month', label: 'This Month' },
      ]
    },
  ];
  
  // Calculate if any filters are active
  const hasActiveFilters = Object.values(appliedFilters).some(
    filters => filters && filters.length > 0
  );
  
  // Calculate total filter count for mobile button
  const totalFilterCount = Object.values(appliedFilters).reduce(
    (total, filters) => total + (filters ? filters.length : 0), 0
  );
  
  // Mobile filter drawer for small screens
  if (mobileView) {
    return (
      <>
        <button 
          onClick={() => setIsMobileFiltersOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          Filters
          {totalFilterCount > 0 && (
            <span className="ml-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full px-2 py-0.5">
              {totalFilterCount}
            </span>
          )}
        </button>
      
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-40 flex">
            {/* Overlay */}
            <div className="fixed inset-0">
              <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsMobileFiltersOpen(false)} />
            </div>
            
            {/* Drawer panel */}
            <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-4 pb-12 shadow-xl">
              <div className="flex px-4 pb-2 pt-5">
                <button 
                  type="button" 
                  className="-m-2 p-2 text-gray-400 hover:text-gray-500"
                  onClick={() => setIsMobileFiltersOpen(false)}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2 className="ml-2 text-lg font-medium text-gray-900">Filters</h2>
              </div>
              
              <div className="mt-4 px-4 divide-y divide-gray-200">
                {filterSections.map((section) => (
                  <FilterSection
                    key={section.id}
                    id={section.id}
                    title={section.title}
                    options={section.options}
                    selectedOptions={appliedFilters[section.id] || []}
                    onChange={handleFilterChange}
                  />
                ))}
              </div>
              
              <div className="sticky bottom-0 mt-auto border-t border-gray-200 bg-white p-4 flex space-x-3">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="flex-1 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:bg-gray-50"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:bg-blue-700"
                >
                  Apply filters
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
  
  // Desktop version
  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Filters</h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Clear all
            </button>
          )}
        </div>
        
        <div className="mt-4 divide-y divide-gray-200">
          {filterSections.map((section) => (
            <FilterSection
              key={section.id}
              id={section.id}
              title={section.title}
              options={section.options}
              selectedOptions={appliedFilters[section.id] || []}
              onChange={handleFilterChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters; 