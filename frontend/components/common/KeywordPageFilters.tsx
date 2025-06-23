import React, { useState, useEffect } from 'react';
import { JobFilters } from '../../types/seo';
import { useRouter } from 'next/router';

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

interface KeywordPageFiltersProps {
  onFilterChange: (filters: Record<string, string[]>) => void;
  initialFilters: JobFilters;
  keyword: string;
  className?: string;
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
  const hasSelectedOptions = selectedOptions && selectedOptions.length > 0;
  
  return (
    <div className="py-3 border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={`filter-section-${id}`}
        tabIndex={0}
        aria-label={`Toggle ${title} filter section`}
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
            aria-hidden="true"
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
                aria-label={`Filter by ${option.label}`}
              />
              <label htmlFor={`${id}-${option.id}`} className="ml-3 text-sm text-gray-600 cursor-pointer flex items-center justify-between w-full">
                <span>{option.label}</span>
                {option.count !== undefined && (
                  <span className="text-xs text-gray-500">{option.count}</span>
                )}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const KeywordPageFilters: React.FC<KeywordPageFiltersProps> = ({
  onFilterChange,
  initialFilters,
  keyword,
  className = '',
}) => {
  const router = useRouter();
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({
    experienceLevel: initialFilters.experienceLevel ? [initialFilters.experienceLevel] : [],
    jobType: initialFilters.jobType ? [initialFilters.jobType] : [],
    category: initialFilters.category ? [initialFilters.category] : [],
    specialization: initialFilters.specialization ? [initialFilters.specialization] : [],
    timezoneCompatible: initialFilters.timezoneCompatible ? ['true'] : [],
  });
  
  // Handle filter changes from any section
  const handleFilterChange = (sectionId: string, optionId: string, checked: boolean) => {
    const currentValues = [...(appliedFilters[sectionId] || [])];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, optionId];
    } else {
      newValues = currentValues.filter(val => val !== optionId);
    }
    
    const newAppliedFilters = {
      ...appliedFilters,
      [sectionId]: newValues
    };
    
    setAppliedFilters(newAppliedFilters);
    onFilterChange(newAppliedFilters);
    
    // Track filter usage with analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // @ts-ignore
      window.gtag('event', 'filter_jobs', {
        filter_type: `${sectionId}:${optionId}:${checked ? 'add' : 'remove'}`,
        keyword_page: keyword
      });
    }
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    const emptyFilters = Object.keys(appliedFilters).reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {} as Record<string, string[]>);
    
    setAppliedFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };
  
  // Calculate if any filters are active
  const hasActiveFilters = Object.values(appliedFilters).some(
    filters => filters && filters.length > 0
  );
  
  // Filter sections definition - specifically for admin and data entry jobs
  const filterSections = [
    {
      id: 'experienceLevel',
      title: 'Experience Level',
      options: [
        { id: 'no-experience', label: 'No Experience' },
        { id: 'entry-level', label: 'Entry Level' },
        { id: 'mid-level', label: 'Intermediate' },
        { id: 'senior', label: 'Experienced' },
      ]
    },
    {
      id: 'jobType',
      title: 'Job Type',
      options: [
        { id: 'full-time', label: 'Full-time' },
        { id: 'part-time', label: 'Part-time' },
        { id: 'freelance', label: 'Freelance' },
        { id: 'contract', label: 'Contract' },
      ]
    },
    {
      id: 'category',
      title: 'Job Category',
      options: [
        { id: 'admin', label: 'Administrative' },
        { id: 'data-entry', label: 'Data Entry' },
        { id: 'virtual-assistant', label: 'Virtual Assistant' },
        { id: 'executive-assistant', label: 'Executive Assistant' },
      ]
    },
    {
      id: 'specialization',
      title: 'Specialization',
      options: [
        { id: 'medical', label: 'Medical' },
        { id: 'legal', label: 'Legal' },
        { id: 'bookkeeping', label: 'Bookkeeping' },
        { id: 'customer-service', label: 'Customer Service' },
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
      id: 'timezoneCompatible',
      title: 'Timezone',
      options: [
        { id: 'true', label: 'Timezone Compatible' },
        { id: 'any', label: 'Any Timezone' },
      ]
    },
  ];
  
  return (
    <div 
      className={`job-filters bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      data-testid="job-filters"
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Filters</h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
              aria-label="Clear all filters"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4 divide-y divide-gray-200">
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
  );
};

export default KeywordPageFilters;
