import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import connectDB from '../../../../lib/db';
import { EnhancedJobListing } from '../../../../types/job';
import { 
  CATEGORIES, 
  STATES,
  CATEGORY_SLUGS, 
  STATE_SLUGS,
  CategoryInfo,
  StateInfo,
  generateIntroParagraphs,
  generateFAQs,
  generateRelatedLinks,
  generatePageMetadata,
  generateSalaryTable
} from '../../../../data/programmaticSeo';

interface CategoryStatePageProps {
  category: CategoryInfo;
  state: StateInfo;
  jobs: EnhancedJobListing[];
  jobCount: number;
  content: {
    paragraph1: string;
    paragraph2: string;
    faqs: Array<{ question: string; answer: string }>;
    relatedLinks: Array<{ text: string; url: string; description: string }>;
    salaryTable: Array<{ experienceLevel: string; hourlyRate: string; annualSalary: string }>;
  };
  metadata: {
    title: string;
    description: string;
    h1: string;
    canonical: string;
    breadcrumbs: Array<{ name: string; url: string }>;
  };
}

export default function CategoryStatePage({ 
  category, 
  state, 
  jobs, 
  jobCount, 
  content, 
  metadata 
}: CategoryStatePageProps) {
  const [activeJobs] = useState<EnhancedJobListing[]>(jobs);
  const currentYear = new Date().getFullYear();

  // Generate JSON-LD schema for FAQPage
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": content.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  // Generate JSON-LD schema for BreadcrumbList
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": metadata.breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };

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
        
        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-gray-600">
              {metadata.breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                  {index === metadata.breadcrumbs.length - 1 ? (
                    <span className="text-gray-900 font-medium">{crumb.name}</span>
                  ) : (
                    <a href={crumb.url} className="hover:text-blue-600">
                      {crumb.name}
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {metadata.h1}
            </h1>
            
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="text-lg leading-relaxed mb-4">
                {content.paragraph1}
              </p>
              <p className="text-lg leading-relaxed">
                {content.paragraph2}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
                <div className="text-sm text-gray-600">Active Jobs</div>
                <div className="text-2xl font-bold text-blue-600">{jobCount}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
                <div className="text-sm text-gray-600">Avg Hourly Rate</div>
                <div className="text-2xl font-bold text-green-600">
                  ${category.salaryHourly[0]}-${category.salaryHourly[1]}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
                <div className="text-sm text-gray-600">State Info</div>
                <div className="text-sm font-medium text-gray-900">{state.taxInfo}</div>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Latest {category.name} Jobs in {state.name}
              </h2>
              <div className="text-sm text-gray-600">
                Updated {new Date().toLocaleDateString()}
              </div>
            </div>
            
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
                        <div className="flex items-center flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          <span className="font-medium">{job.company}</span>
                          {job.location && <span>📍 {job.location}</span>}
                          {job.salary && <span className="font-medium text-green-600">💰 {job.salary}</span>}
                          {job.postedDate && (
                            <span className="text-gray-500">
                              Posted {new Date(job.postedDate).toLocaleDateString()}
                            </span>
                          )}
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
                        {job.experienceLevel && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {job.experienceLevel}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">📧</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No jobs currently available
                </h3>
                <p className="text-gray-600 mb-6">
                  We're actively sourcing new {category.name.toLowerCase()} positions in {state.name}. 
                  Sign up for email alerts to be notified when new jobs are posted!
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

          {/* Salary Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Average Salary for {category.name} in {state.name}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hourly Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Annual Salary
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {content.salaryTable.map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.experienceLevel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {row.hourlyRate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {row.annualSalary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              {state.taxInfo.includes('No state income tax') 
                ? `💡 ${state.name} has no state income tax, meaning you keep more of your earnings compared to high-tax states.`
                : `💡 ${state.name} has ${state.taxInfo.toLowerCase()}.`}
            </p>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Frequently Asked Questions About {category.name} Jobs in {state.name}
            </h2>
            <div className="space-y-6">
              {content.faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Skills Needed for {category.name} Positions
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {category.skills.map((skill, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2 text-lg">✓</span>
                  <span className="text-gray-700">{skill}</span>
                </div>
              ))}
            </div>
            {category.certifications.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Helpful Certifications:</h3>
                <ul className="space-y-2">
                  {category.certifications.map((cert, index) => (
                    <li key={index} className="text-gray-700 flex items-start">
                      <span className="text-purple-600 mr-2">🎓</span>
                      {cert}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Related Job Searches */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Related Job Searches
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.relatedLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200"
                >
                  <div className="font-medium text-blue-600 hover:text-blue-700 mb-1">
                    {link.text}
                  </div>
                  <div className="text-sm text-gray-600">
                    {link.description}
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Email Signup CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Never Miss a {category.name} Job in {state.name}
            </h2>
            <p className="text-lg mb-2 text-blue-50">
              Get daily email alerts for new positions
            </p>
            <p className="text-sm mb-6 text-blue-100">
              ✓ Be the first to apply  ✓ Most jobs filled within 48 hours  ✓ Free resume tips
            </p>
            <a
              href="/newsletter"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Subscribe to Job Alerts
            </a>
            <p className="text-xs mt-3 text-blue-100">
              We never share your email. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Generate paths for all category + state combinations
  const paths: Array<{ params: { category: string; state: string } }> = [];
  
  CATEGORY_SLUGS.forEach(category => {
    STATE_SLUGS.forEach(state => {
      paths.push({
        params: { category, state }
      });
    });
  });

  return {
    paths,
    fallback: false
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const categorySlug = params?.category as string;
  const stateSlug = params?.state as string;
  
  const category = CATEGORIES[categorySlug];
  const state = STATES[stateSlug];

  if (!category || !state) {
    return { notFound: true };
  }

  try {
    await connectDB();
    const mongoose = require('mongoose');
    
    const JobModel = mongoose.models.Job || mongoose.model('Job', new mongoose.Schema({}, { strict: false, collection: 'jobs' }));
    
    // Build query to match jobs for this category and state
    const query: any = {
      $or: [
        { jobCategory: { $regex: category.name, $options: 'i' } },
        { title: { $regex: category.name, $options: 'i' } },
        { tags: { $in: [category.slug, category.name.toLowerCase()] } }
      ],
      $and: [
        {
          $or: [
            { location_restriction: { $regex: state.name, $options: 'i' } },
            { location: { $regex: state.name, $options: 'i' } },
            { location: { $regex: state.abbreviation, $options: 'i' } }
          ]
        }
      ]
    };

    const jobCount = await JobModel.countDocuments(query);
    const jobs = await JobModel
      .find(query)
      .sort({ postedDate: -1 })
      .limit(25)
      .lean()
      .exec();

    // Generate unique content for this page
    const { paragraph1, paragraph2 } = generateIntroParagraphs(category, state, undefined, jobCount);
    const faqs = generateFAQs(category, state);
    const relatedLinks = generateRelatedLinks(categorySlug, stateSlug);
    const salaryTable = generateSalaryTable(category, state);
    const metadata = generatePageMetadata(category, state, null, jobCount);

    return {
      props: {
        category: JSON.parse(JSON.stringify(category)),
        state: JSON.parse(JSON.stringify(state)),
        jobs: JSON.parse(JSON.stringify(jobs)),
        jobCount,
        content: {
          paragraph1,
          paragraph2,
          faqs,
          relatedLinks,
          salaryTable
        },
        metadata
      },
      revalidate: 3600 // Revalidate every hour
    };
  } catch (error) {
    console.error('Error fetching jobs:', error);
    
    // Return props with zero jobs instead of failing
    const { paragraph1, paragraph2 } = generateIntroParagraphs(category, state, undefined, 0);
    const faqs = generateFAQs(category, state);
    const relatedLinks = generateRelatedLinks(categorySlug, stateSlug);
    const salaryTable = generateSalaryTable(category, state);
    const metadata = generatePageMetadata(category, state, null, 0);

    return {
      props: {
        category: JSON.parse(JSON.stringify(category)),
        state: JSON.parse(JSON.stringify(state)),
        jobs: [],
        jobCount: 0,
        content: {
          paragraph1,
          paragraph2,
          faqs,
          relatedLinks,
          salaryTable
        },
        metadata
      },
      revalidate: 3600
    };
  }
};
