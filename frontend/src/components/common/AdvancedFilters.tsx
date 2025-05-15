import React, { useState } from 'react';

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
  
  return (
    <div className="py-4 border-b border-gray-200">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
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
        <div className="mt-4 space-y-3">
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
                {option.count !== undefined && (
                  <span className="text-xs text-gray-500 ml-1">({option.count})</span>
                )}
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
}) => {
  // Helper to handle filter changes from any section
  const handleFilterChange = (sectionId: string, optionId: string, checked: boolean) => {
    const currentValues = selectedFilters[sectionId] || [];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, optionId];
    } else {
      newValues = currentValues.filter(val => val !== optionId);
    }
    
    onFilterChange(sectionId, newValues);
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    Object.keys(selectedFilters).forEach(key => {
      onFilterChange(key, []);
    });
  };
  
  // Filter sections definition - specifically for admin and data entry jobs
  const filterSections = [
    {
      id: 'jobCategory',
      title: 'Job Category',
      options: [
        { id: 'data-entry', label: 'Data Entry', count: showCounts ? 42 : undefined },
        { id: 'administrative-assistant', label: 'Administrative Assistant', count: showCounts ? 36 : undefined },
        { id: 'virtual-assistant', label: 'Virtual Assistant', count: showCounts ? 29 : undefined },
        { id: 'customer-service', label: 'Customer Service', count: showCounts ? 51 : undefined },
        { id: 'transcription', label: 'Transcription', count: showCounts ? 18 : undefined },
        { id: 'bookkeeping', label: 'Bookkeeping', count: showCounts ? 12 : undefined },
      ]
    },
    {
      id: 'jobType',
      title: 'Job Type',
      options: [
        { id: 'full-time', label: 'Full-time', count: showCounts ? 87 : undefined },
        { id: 'part-time', label: 'Part-time', count: showCounts ? 64 : undefined },
        { id: 'contract', label: 'Contract', count: showCounts ? 41 : undefined },
        { id: 'temporary', label: 'Temporary', count: showCounts ? 19 : undefined },
      ]
    },
    {
      id: 'experienceLevel',
      title: 'Experience Level',
      options: [
        { id: 'no-experience', label: 'No Experience', count: showCounts ? 32 : undefined },
        { id: 'entry-level', label: 'Entry Level', count: showCounts ? 78 : undefined },
        { id: 'intermediate', label: 'Intermediate', count: showCounts ? 54 : undefined },
        { id: 'experienced', label: 'Experienced', count: showCounts ? 24 : undefined },
      ]
    },
    {
      id: 'payRange',
      title: 'Pay Range',
      options: [
        { id: 'under-$15', label: 'Under $15/hr', count: showCounts ? 35 : undefined },
        { id: '$15-20', label: '$15-20/hr', count: showCounts ? 71 : undefined },
        { id: '$20-25', label: '$20-25/hr', count: showCounts ? 43 : undefined },
        { id: '$25+', label: '$25+/hr', count: showCounts ? 22 : undefined },
      ]
    },
    {
      id: 'softwareRequirements',
      title: 'Software',
      options: [
        { id: 'microsoft-office', label: 'Microsoft Office', count: showCounts ? 98 : undefined },
        { id: 'google-workspace', label: 'Google Workspace', count: showCounts ? 83 : undefined },
        { id: 'excel', label: 'Excel', count: showCounts ? 76 : undefined },
        { id: 'quickbooks', label: 'QuickBooks', count: showCounts ? 41 : undefined },
        { id: 'data-entry-software', label: 'Data Entry Software', count: showCounts ? 36 : undefined },
        { id: 'crm-systems', label: 'CRM Systems', count: showCounts ? 29 : undefined },
      ]
    },
    {
      id: 'location',
      title: 'Location',
      options: [
        { id: 'worldwide', label: 'Worldwide', count: showCounts ? 64 : undefined },
        { id: 'us-only', label: 'US Only', count: showCounts ? 89 : undefined },
        { id: 'us-canada', label: 'US & Canada', count: showCounts ? 95 : undefined },
        { id: 'europe', label: 'Europe', count: showCounts ? 38 : undefined },
      ]
    },
    {
      id: 'datePosted',
      title: 'Date Posted',
      options: [
        { id: 'today', label: 'Today', count: showCounts ? 27 : undefined },
        { id: 'this-week', label: 'This Week', count: showCounts ? 118 : undefined },
        { id: 'this-month', label: 'This Month', count: showCounts ? 167 : undefined },
      ]
    },
  ];
  
  // Calculate if any filters are active
  const hasActiveFilters = Object.values(selectedFilters).some(
    filters => filters && filters.length > 0
  );
  
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
        
        <div className="mt-4">
          {filterSections.map((section) => (
            <FilterSection
              key={section.id}
              id={section.id}
              title={section.title}
              options={section.options}
              selectedOptions={selectedFilters[section.id] || []}
              onChange={handleFilterChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters; 