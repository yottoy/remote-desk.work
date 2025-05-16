import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface SearchBarProps {
  placeholder?: string;
  defaultValue?: string;
  filterChips?: {
    label: string;
    value: string;
    active?: boolean;
  }[];
  onSearch?: (value: string) => void;
  onFilterChange?: (filters: string[]) => void;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search for jobs...',
  defaultValue = '',
  filterChips = [],
  onSearch,
  onFilterChange,
  className = '',
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(defaultValue);
  const [activeFilters, setActiveFilters] = useState<string[]>(
    filterChips.filter(chip => chip.active).map(chip => chip.value)
  );
  const [isMobile, setIsMobile] = useState(false);
  
  // Initialize search term from URL query if available
  useEffect(() => {
    if (router.query.q && typeof router.query.q === 'string') {
      setSearchTerm(router.query.q);
    }
    
    // Initialize active filters from URL query if available
    if (router.query.filters && typeof router.query.filters === 'string') {
      const urlFilters = router.query.filters.split(',');
      setActiveFilters(urlFilters);
    }
    
    // Check if viewport is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [router.query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      // Default behavior: navigate to jobs page with search query
      router.push({
        pathname: '/jobs/',
        query: { 
          q: searchTerm,
          ...(activeFilters.length > 0 && { filters: activeFilters.join(',') })
        },
      }, undefined, { shallow: false });
    }
  };

  const toggleFilter = (value: string) => {
    const newActiveFilters = activeFilters.includes(value)
      ? activeFilters.filter(f => f !== value)
      : [...activeFilters, value];
    
    setActiveFilters(newActiveFilters);
    
    if (onFilterChange) {
      onFilterChange(newActiveFilters);
    }
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    
    if (onFilterChange) {
      onFilterChange([]);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row w-full gap-2 sm:gap-0`}>
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search"
          />
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto sm:ml-3 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isMobile ? 'Search Jobs' : 'Search'}
        </button>
      </form>

      {filterChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 max-w-full overflow-x-auto pb-2">
          {filterChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => toggleFilter(chip.value)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeFilters.includes(chip.value)
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-transparent'
              }`}
              aria-pressed={activeFilters.includes(chip.value)}
            >
              {chip.label}
              {activeFilters.includes(chip.value) && (
                <svg className="ml-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
          
          {activeFilters.length > 0 && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-transparent transition-colors"
              aria-label="Clear all filters"
            >
              Clear All
              <svg className="ml-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 