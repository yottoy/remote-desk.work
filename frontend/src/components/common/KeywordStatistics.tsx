import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface KeywordStatisticsProps {
  keyword: string;
  totalJobs: number;
  lastUpdated?: Date;
  averageSalary?: number;
  noExperiencePercentage?: number;
  remotePercentage?: number;
  className?: string;
}

const KeywordStatistics: React.FC<KeywordStatisticsProps> = ({
  keyword,
  totalJobs,
  lastUpdated = new Date(),
  averageSalary,
  noExperiencePercentage,
  remotePercentage = 100, // Default to 100% since these are remote job listings
  className = ''
}) => {
  const [formattedDate, setFormattedDate] = useState<string>('');
  
  useEffect(() => {
    try {
      // Format the last updated date
      const date = lastUpdated instanceof Date ? 
        lastUpdated : 
        new Date(lastUpdated);
      
      if (!isNaN(date.getTime())) {
        setFormattedDate(formatDistanceToNow(date, { addSuffix: true }));
      } else {
        setFormattedDate('recently');
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      setFormattedDate('recently');
    }
  }, [lastUpdated]);
  
  // Format the keyword for display
  const formattedKeyword = keyword
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
  
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {formattedKeyword} Statistics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-700">{totalJobs}</div>
          <div className="text-sm text-gray-600">Available Jobs</div>
        </div>
        
        {averageSalary && (
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-700">
              ${averageSalary.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Average Annual Salary</div>
          </div>
        )}
        
        {noExperiencePercentage !== undefined && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-3xl font-bold text-yellow-700">
              {noExperiencePercentage}%
            </div>
            <div className="text-sm text-gray-600">No Experience Required</div>
          </div>
        )}
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-purple-700">
            {remotePercentage}%
          </div>
          <div className="text-sm text-gray-600">Fully Remote</div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        Last updated: {formattedDate}
      </div>
      
      <div className="mt-6">
        <h3 className="text-md font-medium text-gray-900 mb-2">Why {formattedKeyword}?</h3>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Access to {totalJobs}+ verified job opportunities</li>
          {averageSalary && (
            <li>Competitive salaries averaging ${averageSalary.toLocaleString()} annually</li>
          )}
          {noExperiencePercentage !== undefined && noExperiencePercentage > 0 && (
            <li>{noExperiencePercentage}% of positions open to candidates with no prior experience</li>
          )}
          <li>100% remote positions - work from anywhere</li>
          <li>Updated job listings {formattedDate}</li>
        </ul>
      </div>
    </div>
  );
};

export default KeywordStatistics;
