import React from 'react';
import Layout from '../../components/layout/Layout';
import CategoryCard from '../../components/common/CategoryCard';
import SearchBar from '../../components/common/SearchBar';
import { GetServerSideProps } from 'next';

// Define the job categories without counts (will be populated from API)
const jobCategoryDefinitions = [
  { name: 'Data Entry Jobs', slug: 'data-entry' },
  { name: 'Administrative Jobs', slug: 'administrative' },
  { name: 'Administrative Assistant Jobs', slug: 'administrative-assistant' },
  { name: 'Customer Service Jobs', slug: 'customer-service' },
  { name: 'Transcription Jobs', slug: 'transcription' },
  { name: 'Virtual Assistant Jobs', slug: 'virtual-assistant' },
  { name: 'Data Processing Jobs', slug: 'data-processing' },
  { name: 'Customer Support Jobs', slug: 'customer-support' },
  { name: 'Bookkeeping Jobs', slug: 'bookkeeping' },
  { name: 'Content Writing Jobs', slug: 'content-writing' },
  { name: 'Social Media Jobs', slug: 'social-media' },
  { name: 'Project Management Jobs', slug: 'project-management' },
  { name: 'Quality Assurance Jobs', slug: 'quality-assurance' }
];

// Group categories by first letter
const groupCategoriesByLetter = (categories: Array<{name: string, slug: string, count: number}>) => {
  const grouped: Record<string, Array<{name: string, slug: string, count: number}>> = {};
  
  categories.forEach(category => {
    const firstLetter = category.name.charAt(0).toUpperCase();
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push(category);
  });
  
  return grouped;
};

interface CategoriesPageProps {
  jobCategories: Array<{
    name: string;
    slug: string;
    count: number;
  }>;
}

export const getServerSideProps: GetServerSideProps<CategoriesPageProps> = async () => {
  try {
    // We'll fetch counts for each category
    const categoriesWithCounts = await Promise.all(
      jobCategoryDefinitions.map(async (category) => {
        try {
          // Fetch job count for this category
          const apiUrl = `https://clickclickjob.vercel.app/api/jobs/count?jobCategory=${category.slug}`;
          
          // Use AbortController for timeout functionality
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            },
            signal: controller.signal
          });
          
          // Clear the timeout
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            // If there's an error, return the category with count 0
            return { ...category, count: 0 };
          }
          
          const result = await response.json();
          const count = result.count || 0;
          
          return {
            ...category,
            count
          };
        } catch (error) {
          console.error(`Error fetching count for ${category.slug}:`, error);
          return { ...category, count: 0 };
        }
      })
    );
    
    return {
      props: {
        jobCategories: categoriesWithCounts
      }
    };
  } catch (error) {
    console.error('Failed to fetch category counts:', error);
    
    // If there's an error, return the categories with count 0
    return {
      props: {
        jobCategories: jobCategoryDefinitions.map(category => ({
          ...category,
          count: 0
        }))
      }
    };
  }
};

const CategoriesPage: React.FC<CategoriesPageProps> = ({ jobCategories }) => {
  const groupedCategories = groupCategoriesByLetter(jobCategories);
  const alphabetLetters = Object.keys(groupedCategories).sort();
  
  return (
    <Layout
      title="Remote Job Categories | Find Work From Home Positions | ClickClickJob.com"
      description="Browse all remote job categories. Find verified work-from-home positions in data entry, administrative support, customer service, and more."
    >
      {/* Hero Section */}
      <section className="bg-blue-50 py-12 border-b border-blue-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            REMOTE JOB CATEGORIES
          </h1>
          
          <p className="text-xl text-gray-700 max-w-4xl mx-auto mb-8">
            Browse all categories of verified remote work. Find the perfect work-from-home position that matches your skills and experience.
          </p>
          
          <div className="max-w-3xl mx-auto">
            <SearchBar 
              placeholder="Search categories..."
            />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {jobCategories.map(category => (
              <CategoryCard 
                key={category.slug}
                name={category.name}
                slug={category.slug}
                count={category.count}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Alphabetical Listing Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            BROWSE CATEGORIES ALPHABETICALLY
          </h2>
          
          {/* Alphabet navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {alphabetLetters.map(letter => (
              <a 
                key={letter}
                href={`#letter-${letter}`}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-700 font-medium"
              >
                {letter}
              </a>
            ))}
          </div>
          
          {/* Categories by letter */}
          <div className="space-y-8">
            {alphabetLetters.map(letter => (
              <div key={letter} id={`letter-${letter}`} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">{letter}</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedCategories[letter].map(category => (
                      <CategoryCard 
                        key={category.slug}
                        name={category.name}
                        slug={category.slug}
                        count={category.count}
                        variant="compact"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            POPULAR CATEGORIES
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {jobCategories
              .filter(category => category.count > 0)  // Only show categories with jobs
              .sort((a, b) => b.count - a.count)
              .slice(0, 4)
              .map(category => (
                <div key={category.slug} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-gray-600 mb-4">{category.count} opportunities available</p>
                  <a 
                    href={`/categories/${category.slug}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Browse Jobs →
                  </a>
                </div>
              ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CategoriesPage; 