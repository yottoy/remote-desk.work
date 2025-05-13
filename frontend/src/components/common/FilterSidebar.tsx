import React, { useState } from 'react';

interface FilterOption {
  id: string;
  label: string;
  checked?: boolean;
}

interface FilterSection {
  id: string;
  title: string;
  options: FilterOption[];
  type: 'checkbox' | 'radio';
}

interface FilterSidebarProps {
  filters: FilterSection[];
  onFilterChange: (sectionId: string, optionId: string, checked: boolean) => void;
  className?: string;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  filters, 
  onFilterChange,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    filters.reduce((acc, section) => ({ ...acc, [section.id]: true }), {})
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-medium text-gray-900">Filters</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {filters.map((section) => (
          <div key={section.id} className="px-4 py-5 sm:px-6">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => toggleSection(section.id)}
            >
              <h3 className="text-base font-medium text-gray-900">{section.title}</h3>
              <span className="ml-6 h-7 flex items-center">
                <svg
                  className={`h-6 w-6 transform ${
                    expandedSections[section.id] ? 'rotate-180' : 'rotate-0'
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </button>
            
            {expandedSections[section.id] && (
              <div className="mt-4 space-y-3">
                {section.options.map((option) => (
                  <div key={option.id} className="flex items-start">
                    <div className="flex items-center h-5">
                      {section.type === 'checkbox' ? (
                        <input
                          id={`${section.id}-${option.id}`}
                          name={`${section.id}-${option.id}`}
                          type="checkbox"
                          checked={option.checked || false}
                          onChange={(e) => onFilterChange(section.id, option.id, e.target.checked)}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      ) : (
                        <input
                          id={`${section.id}-${option.id}`}
                          name={section.id}
                          type="radio"
                          checked={option.checked || false}
                          onChange={(e) => onFilterChange(section.id, option.id, e.target.checked)}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        />
                      )}
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor={`${section.id}-${option.id}`}
                        className="font-medium text-gray-700"
                      >
                        {option.label}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => {
            filters.forEach((section) => {
              section.options.forEach((option) => {
                if (option.checked) {
                  onFilterChange(section.id, option.id, false);
                }
              });
            });
          }}
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

// For mobile usage as a bottom drawer
export const MobileFilterDrawer: React.FC<FilterSidebarProps & { isOpen: boolean; onClose: () => void }> = ({
  filters,
  onFilterChange,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="fixed inset-x-0 bottom-0 max-h-80vh overflow-y-auto">
          <div className="bg-white rounded-t-lg shadow-xl">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="divide-y divide-gray-200 max-h-[60vh] overflow-y-auto">
              <FilterSidebar filters={filters} onFilterChange={onFilterChange} />
            </div>
            <div className="px-4 py-4 sm:px-6 border-t border-gray-200 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  filters.forEach((section) => {
                    section.options.forEach((option) => {
                      if (option.checked) {
                        onFilterChange(section.id, option.id, false);
                      }
                    });
                  });
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar; 