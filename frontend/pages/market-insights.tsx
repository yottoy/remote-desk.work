import React from 'react';
import Layout from '../components/layout/Layout';
import JobMarketInsightsDashboard from '../components/JobMarketInsightsDashboard';

const MarketInsightsPage: React.FC = () => {
  return (
    <Layout
      title="Job Market Insights | Remote Admin & Data Entry Trends | ClickClickJob"
      description="Latest salary trends, AI integration insights, and market analysis for remote administrative and data entry positions."
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Remote Job Market Insights
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Data-driven insights into remote administrative and data entry job markets, 
              salary trends, and emerging opportunities.
            </p>
          </div>
          
          <JobMarketInsightsDashboard />
        </div>
      </div>
    </Layout>
  );
};

export default MarketInsightsPage; 