import React, { useState, useEffect } from 'react';
import { detectUserRegion } from '../../utils/regionUtils';

interface RegionalJobMarketInsightsProps {
  keyword: string;
  className?: string;
}

interface RegionInsight {
  region: string;
  demandLevel: 'high' | 'medium' | 'low';
  averageSalary: string;
  growthTrend: 'increasing' | 'stable' | 'decreasing';
  topSkills: string[];
}

const RegionalJobMarketInsights: React.FC<RegionalJobMarketInsightsProps> = ({
  keyword,
  className = ''
}) => {
  const [userRegion, setUserRegion] = useState<string>('US');
  const [regionInsights, setRegionInsights] = useState<RegionInsight | null>(null);
  
  // Format the keyword for display
  const formattedKeyword = keyword
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
  
  useEffect(() => {
    // Detect user's region
    const region = detectUserRegion();
    setUserRegion(region);
    
    // Get insights for the detected region
    const insights = getRegionalInsights(region, keyword);
    setRegionInsights(insights);
  }, [keyword]);
  
  // Mock function to get regional insights based on keyword and region
  const getRegionalInsights = (region: string, keyword: string): RegionInsight => {
    // This would typically come from an API, but we're mocking it for now
    const insightsMap: Record<string, Record<string, RegionInsight>> = {
      'remote-data-entry-jobs-no-experience': {
        'US': {
          region: 'United States',
          demandLevel: 'high',
          averageSalary: '$35,000 - $45,000/year',
          growthTrend: 'increasing',
          topSkills: ['Microsoft Excel', 'Data Accuracy', 'Fast Typing', 'Google Sheets']
        },
        'UK': {
          region: 'United Kingdom',
          demandLevel: 'medium',
          averageSalary: '£22,000 - £30,000/year',
          growthTrend: 'stable',
          topSkills: ['Microsoft Excel', 'Data Accuracy', 'Fast Typing', 'Attention to Detail']
        },
        'EU': {
          region: 'European Union',
          demandLevel: 'medium',
          averageSalary: '€25,000 - €40,000/year',
          growthTrend: 'increasing',
          topSkills: ['Microsoft Excel', 'Data Accuracy', 'Fast Typing', 'Multiple Languages']
        },
        'OTHER': {
          region: 'Global',
          demandLevel: 'high',
          averageSalary: '$30,000 - $50,000/year',
          growthTrend: 'increasing',
          topSkills: ['Microsoft Excel', 'Data Accuracy', 'Fast Typing', 'Attention to Detail']
        }
      },
      'virtual-assistant-jobs-part-time-remote': {
        'US': {
          region: 'United States',
          demandLevel: 'high',
          averageSalary: '$20 - $35/hour',
          growthTrend: 'increasing',
          topSkills: ['Calendar Management', 'Email Management', 'Customer Service', 'Social Media']
        },
        'UK': {
          region: 'United Kingdom',
          demandLevel: 'high',
          averageSalary: '£15 - £25/hour',
          growthTrend: 'increasing',
          topSkills: ['Calendar Management', 'Email Management', 'Customer Service', 'Administrative Support']
        },
        'EU': {
          region: 'European Union',
          demandLevel: 'medium',
          averageSalary: '€18 - €30/hour',
          growthTrend: 'increasing',
          topSkills: ['Calendar Management', 'Email Management', 'Multiple Languages', 'Administrative Support']
        },
        'OTHER': {
          region: 'Global',
          demandLevel: 'high',
          averageSalary: '$15 - $30/hour',
          growthTrend: 'increasing',
          topSkills: ['Calendar Management', 'Email Management', 'Customer Service', 'Administrative Support']
        }
      }
    };
    
    // Default insights if specific keyword or region not found
    const defaultInsights: RegionInsight = {
      region: region === 'US' ? 'United States' : 
             region === 'UK' ? 'United Kingdom' : 
             region === 'EU' ? 'European Union' : 'Global',
      demandLevel: 'medium',
      averageSalary: '$30,000 - $50,000/year',
      growthTrend: 'stable',
      topSkills: ['Microsoft Office', 'Communication', 'Organization', 'Attention to Detail']
    };
    
    return insightsMap[keyword]?.[region] || 
           insightsMap[keyword]?.['OTHER'] || 
           defaultInsights;
  };
  
  if (!regionInsights) {
    return null;
  }
  
  return (
    <div 
      className={`regional-job-market bg-white rounded-lg shadow p-6 ${className}`}
      data-testid="regional-job-market"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {regionInsights.region} Job Market Insights
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <span className="text-sm text-gray-600">Demand Level:</span>
          <span className={`font-medium ${
            regionInsights.demandLevel === 'high' ? 'text-green-600' : 
            regionInsights.demandLevel === 'medium' ? 'text-yellow-600' : 
            'text-red-600'
          }`}>
            {regionInsights.demandLevel.charAt(0).toUpperCase() + regionInsights.demandLevel.slice(1)}
          </span>
        </div>
        
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <span className="text-sm text-gray-600">Average Salary:</span>
          <span className="font-medium text-gray-900">{regionInsights.averageSalary}</span>
        </div>
        
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <span className="text-sm text-gray-600">Growth Trend:</span>
          <span className={`font-medium ${
            regionInsights.growthTrend === 'increasing' ? 'text-green-600' : 
            regionInsights.growthTrend === 'stable' ? 'text-blue-600' : 
            'text-red-600'
          }`}>
            {regionInsights.growthTrend.charAt(0).toUpperCase() + regionInsights.growthTrend.slice(1)}
          </span>
        </div>
        
        <div>
          <span className="text-sm text-gray-600 block mb-2">Top Skills in Demand:</span>
          <div className="flex flex-wrap gap-2">
            {regionInsights.topSkills.map((skill, index) => (
              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-600">
        <p>
          <strong>Regional Insight:</strong> {formattedKeyword} in {regionInsights.region} {
            regionInsights.demandLevel === 'high' ? 'are in high demand with many companies hiring.' : 
            regionInsights.demandLevel === 'medium' ? 'have steady demand with consistent opportunities.' : 
            'may be more competitive, but opportunities still exist.'
          } Focus on the skills listed above to increase your chances of landing a position.
        </p>
      </div>
    </div>
  );
};

export default RegionalJobMarketInsights;
