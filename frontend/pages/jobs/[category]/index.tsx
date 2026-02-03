import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import connectDB from '../../../lib/db';
import { EnhancedJobListing } from '../../../types/job';
import { 
  CATEGORIES, 
  CATEGORY_SLUGS, 
  CategoryInfo,
  generatePageMetadata
} from '../../../data/programmaticSeo';

interface CategoryPageProps {
  category: CategoryInfo;
  jobs: EnhancedJobListing[];
  jobCount: number;
  metadata: {
    title: string;
    description: string;
    h1: string;
    canonical: string;
  };
}

export default function CategoryPage({ category, jobs, jobCount, metadata }: CategoryPageProps) {
  const [activeJobs] = useState<EnhancedJobListing[]>(jobs);

  return (
    <>
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="canonical" href={metadata.canonical} />
        <meta property="og:title" content={metadata.title} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:url" content={metadata.canonical} />
        <meta property="og:type" content="website" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2 text-gray-600">
              <li><a href="/" className="hover:text-blue-600">Home</a></li>
              <li><span className="mx-2">/</span></li>
              <li><a href="/jobs" className="hover:text-blue-600">Jobs</a></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-gray-900 font-medium">{category.name}</li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {metadata.h1}
            </h1>
            
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="text-xl leading-relaxed mb-4">
                Explore {jobCount} remote {category.name.toLowerCase()} opportunities across the United States. 
                Our job board specializes in verified, legitimate work-from-home positions in the administrative and data fields.
              </p>
              <p className="leading-relaxed">
                {category.name} roles involve {category.description}. These positions typically require {category.software} 
                {category.typingRequirement && ` and typing speeds of ${category.typingRequirement}`}. 
                The field offers {category.growthOutlook}, with {category.remoteRatio}% of positions available as remote work.
              </p>
            </div>
          </div>

          {/* Salary Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Average Salary for {category.name}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="text-sm font-medium text-blue-700 mb-2">Hourly Rate</div>
                <div className="text-3xl font-bold text-gray-900">
                  ${category.salaryHourly[0]}-${category.salaryHourly[1]}/hr
                </div>
                <div className="text-sm text-gray-600 mt-2">Based on experience level</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-6">
                <div className="text-sm font-medium text-purple-700 mb-2">Annual Salary</div>
                <div className="text-3xl font-bold text-gray-900">
                  ${category.salaryAnnual[0].toLocaleString()}-${category.salaryAnnual[1].toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mt-2">Full-time positions</div>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Latest {category.name} Positions
            </h2>
            {activeJobs.length > 0 ? (
              <div className="space-y-4">
                {activeJobs.map((job) => (
                  <Link
                    key={job._id}
                    href={`/jobs/view/${job._id}`}
                    className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {job.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span className="font-medium">{job.company}</span>
                          {job.location && <span>📍 {job.location}</span>}
                          {job.salary && <span>💰 {job.salary}</span>}
                        </div>
                        {job.descriptionText && (
                          <p className="text-gray-700 line-clamp-2">
                            {job.descriptionText.substring(0, 200)}...
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col items-end space-y-2">
                        {job.featured && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⭐ Featured
                          </span>
                        )}
                        {job.jobType && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {job.jobType}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-600 mb-4">
                  No jobs currently available in this category. Check back soon or sign up for email alerts!
                </p>
                <a
                  href="/newsletter"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Job Alerts
                </a>
              </div>
            )}
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Skills Needed for {category.name} Positions
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {category.skills.map((skill, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span className="text-gray-700">{skill}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Browse by State */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Browse {category.name} Jobs by State
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {['texas', 'california', 'florida', 'new-york', 'georgia', 'north-carolina', 'pennsylvania', 'ohio', 'illinois', 'michigan', 'arizona', 'colorado', 'virginia', 'washington', 'tennessee'].map((state) => {
                const stateName = state.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                return (
                  <a
                    key={state}
                    href={`/jobs/${category.slug}/${state}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    {stateName}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Email Signup */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Never Miss a {category.name} Job
            </h2>
            <p className="text-lg mb-6 text-blue-50">
              Get daily email alerts for new positions. Be the first to apply!
            </p>
            <a
              href="/newsletter"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Subscribe to Job Alerts
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = CATEGORY_SLUGS.map(category => ({
    params: { category }
  }));

  return {
    paths,
    fallback: 'blocking' // Allow runtime generation if build fails
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const categorySlug = params?.category as string;
  const category = CATEGORIES[categorySlug];

  if (!category) {
    return { notFound: true };
  }

  try {
    await connectDB();
    const mongoose = require('mongoose');
    
    // Get job count and sample jobs
    const JobModel = mongoose.models.Job || mongoose.model('Job', new mongoose.Schema({}, { strict: false, collection: 'jobs' }));
    
    const query: any = {
      $or: [
        { jobCategory: { $regex: category.name, $options: 'i' } },
        { title: { $regex: category.name, $options: 'i' } },
        { tags: { $in: [category.slug, category.name.toLowerCase()] } }
      ]
    };

    const jobCount = await JobModel.countDocuments(query);
    const jobs = await JobModel
      .find(query)
      .sort({ postedDate: -1 })
      .limit(25)
      .lean()
      .exec();

    const metadata = generatePageMetadata(
      category,
      { name: 'Nationwide', slug: 'nationwide' } as any,
      null,
      jobCount
    );

    return {
      props: {
        category: JSON.parse(JSON.stringify(category)),
        jobs: JSON.parse(JSON.stringify(jobs)),
        jobCount,
        metadata
      },
      revalidate: 3600 // Revalidate every hour
    };
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return {
      props: {
        category: JSON.parse(JSON.stringify(category)),
        jobs: [],
        jobCount: 0,
        metadata: generatePageMetadata(
          category,
          { name: 'Nationwide', slug: 'nationwide' } as any,
          null,
          0
        )
      },
      revalidate: 3600
    };
  }
};
