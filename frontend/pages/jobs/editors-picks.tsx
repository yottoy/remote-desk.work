import React from 'react';
import Layout from '../../components/layout/Layout';
import EditorPickJobCard from '../../components/EditorPickJobCard';

const EditorPicksPage: React.FC = () => {
  return (
    <Layout
      title="Editor's Pick Remote Jobs | Hand-Selected Opportunities | ClickClickJob"
      description="Discover remote administrative and data entry jobs personally selected by our editorial team for exceptional value, growth potential, and compensation."
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Editor's Pick Remote Jobs
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hand-selected remote administrative opportunities analyzed by our editorial team 
              for exceptional value, clear growth paths, and competitive compensation.
            </p>
          </div>
          
          <EditorPickJobCard />
        </div>
      </div>
    </Layout>
  );
};

export default EditorPicksPage; 