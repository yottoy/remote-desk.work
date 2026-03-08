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
  MODIFIER_SLUGS,
  CategoryInfo,
  StateInfo,
  ModifierInfo,
  getModifierInfo,
  isExperienceLevel,
  generateIntroParagraphs,
  generateFAQs,
  generateRelatedLinks,
  generatePageMetadata,
  generateSalaryTable
} from '../../../../data/programmaticSeo';

interface CategoryStateModifierPageProps {
  category: CategoryInfo;
  state: StateInfo;
  modifier: ModifierInfo;
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

export default function CategoryStateModifierPage({ 
  category, 
  state, 
  modifier,
  jobs, 
  jobCount, 
  content, 
  metadata 
}: CategoryStateModifierPageProps) {
  const [activeJobs] = useState<EnhancedJobListing[]>(jobs);

  // Generate JSON-LD schemas
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

  // JobPosting schema for each job listing
  const jobPostingSchemas = activeJobs.slice(0, 10).map(job => {
    const datePosted = job.postedDate ? new Date(job.postedDate).toISOString() : new Date().toISOString();
    const validThroughDate = new Date(datePosted);
    validThroughDate.setDate(validThroughDate.getDate() + 30);

    // Parse salary to extract numeric min/max values
    let baseSalary: any = undefined;
    if (job.salary) {
      const cleanStr = job.salary.toLowerCase().replace(/[,$]/g, '');
      const isHourly = /hour|hr|\/h\b/.test(cleanStr);
      const numbers = cleanStr.match(/(\d+(?:\.\d+)?)\s*k?\b/g);
      if (numbers && numbers.length > 0) {
        const parsed = numbers.map(n => {
          const num = parseFloat(n.replace('k', ''));
          if (n.includes('k')) return num * 1000;
          if (isHourly && num < 200) return num;
          if (!isHourly && num < 1000) return num * 1000;
          return num;
        });
        baseSalary = {
          "@type": "MonetaryAmount",
          "currency": "USD",
          "value": {
            "@type": "QuantitativeValue",
            "minValue": Math.min(...parsed),
            "maxValue": Math.max(...parsed),
            "unitText": isHourly ? "HOUR" : "YEAR"
          }
        };
      }
    }

    // Normalize employmentType to valid schema.org enum
    let employmentType = "FULL_TIME";
    if (job.jobType) {
      const jt = job.jobType.toLowerCase();
      if (jt.includes('part')) employmentType = "PART_TIME";
      else if (jt.includes('contract') || jt.includes('freelance')) employmentType = "CONTRACTOR";
      else if (jt.includes('temp')) employmentType = "TEMPORARY";
      else if (jt.includes('intern')) employmentType = "INTERN";
    }

    const desc = job.descriptionText || job.description || `${job.title} position at ${job.company}. This is a remote opportunity with flexible work arrangements.`;

    return {
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      "title": job.title,
      "description": desc.length < 200 ? desc + ` This remote ${job.title} role offers the flexibility to work from home with competitive compensation.` : desc,
      "datePosted": datePosted,
      "validThrough": validThroughDate.toISOString(),
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressRegion": state.abbreviation,
          "addressLocality": state.name,
          "addressCountry": "US"
        }
      },
      "jobLocationType": "TELECOMMUTE",
      "applicantLocationRequirements": {
        "@type": "Country",
        "name": "US"
      },
      "employmentType": employmentType,
      ...(baseSalary ? { "baseSalary": baseSalary } : {})
    };
  });

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
        <meta name="robots" content="index, follow" />
        
        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        {jobPostingSchemas.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm" aria-label="Breadcrumb">
            <ol className="flex items-center flex-wrap space-x-2 text-gray-600">
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
            
            {/* Modifier Badge */}
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200">
                {modifier.name} Positions
              </span>
            </div>
            
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="text-lg leading-relaxed mb-4">
                {content.paragraph1}
              </p>
              <p className="text-lg leading-relaxed">
                {content.paragraph2}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
                <div className="text-sm text-gray-600">Active Jobs</div>
                <div className="text-2xl font-bold text-blue-600">{jobCount}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
                <div className="text-sm text-gray-600">Hourly Pay</div>
                <div className="text-xl font-bold text-green-600">
                  ${category.salaryHourly[0]}-${category.salaryHourly[1]}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
                <div className="text-sm text-gray-600">Remote</div>
                <div className="text-xl font-bold text-purple-600">100%</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
                <div className="text-sm text-gray-600">State Tax</div>
                <div className="text-xs font-medium text-gray-900">
                  {state.taxInfo.includes('No') ? '✓ No Income Tax' : state.taxInfo.split(' ').slice(0, 3).join(' ')}
                </div>
              </div>
            </div>

            {/* Modifier Benefits */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-2">
                Why Choose {modifier.name} Positions?
              </h3>
              <p className="text-gray-700">
                {modifier.benefits.charAt(0).toUpperCase() + modifier.benefits.slice(1)}. 
                {' '}{modifier.targetAudience}
              </p>
            </div>
          </div>

          {/* Job Listings */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Latest {modifier.name} {category.name} Jobs in {state.name}
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
                    className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
                          {job.title}
                        </h3>
                        <div className="flex items-center flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          <span className="font-medium">{job.company}</span>
                          {job.location && <span>📍 {job.location}</span>}
                          {job.salary && <span className="font-semibold text-green-600">💰 {job.salary}</span>}
                          {job.postedDate && (
                            <span className="text-gray-500">
                              Posted {Math.floor((Date.now() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
                            </span>
                          )}
                        </div>
                        {job.descriptionText && (
                          <p className="text-gray-700 line-clamp-2 mb-3">
                            {job.descriptionText.substring(0, 250)}...
                          </p>
                        )}
                        {job.skills && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {job.skills.slice(0, 4).map((skill, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col items-end space-y-2">
                        {job.featured && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
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
                  No {modifier.name.toLowerCase()} jobs currently available
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  We're actively sourcing new {modifier.name.toLowerCase()} {category.name.toLowerCase()} positions in {state.name}. 
                  Most jobs are filled within 48 hours of posting—sign up for email alerts to never miss an opportunity!
                </p>
                <a
                  href="/newsletter"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Instant Job Alerts
                </a>
              </div>
            )}
          </div>

          {/* Salary Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Salary Expectations for {category.name} in {state.name}
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
                    <tr key={index} className={index === 0 ? 'bg-blue-50' : ''}>
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
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700">
                {state.taxInfo.includes('No state income tax') 
                  ? `💰 ${state.name} residents benefit from no state income tax, meaning you keep more of your earnings. A $40,000 salary in ${state.name} is equivalent to ~$42,000-45,000 in high-tax states like California or New York.`
                  : `💰 ${state.name} has ${state.taxInfo.toLowerCase()}, which affects your take-home pay.`}
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Common Questions About {modifier.name} {category.name} Jobs in {state.name}
            </h2>
            <div className="space-y-6">
              {content.faqs.map((faq, index) => (
                <details key={index} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0 group">
                  <summary className="cursor-pointer">
                    <h3 className="inline text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {faq.question}
                    </h3>
                  </summary>
                  <p className="mt-3 text-gray-700 leading-relaxed pl-4">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Skills Needed for {modifier.name} {category.name} Roles
            </h2>
            <p className="text-gray-600 mb-6">
              {modifier.requirements}
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {category.skills.map((skill, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2 text-lg">✓</span>
                  <span className="text-gray-700">{skill}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Related Links */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Explore Similar Opportunities
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
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get {modifier.name} {category.name} Job Alerts
            </h2>
            <p className="text-lg mb-2 text-blue-50">
              New positions added daily in {state.name}
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm mb-6 text-blue-100">
              <span className="flex items-center">
                <span className="mr-2">✓</span> Be first to apply
              </span>
              <span className="flex items-center">
                <span className="mr-2">✓</span> Jobs filled in 48 hours
              </span>
              <span className="flex items-center">
                <span className="mr-2">✓</span> Free career tips
              </span>
            </div>
            <a
              href="/newsletter"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Subscribe to Email Alerts
            </a>
            <p className="text-xs mt-4 text-blue-100">
              Join 10,000+ job seekers. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // For Phase 1, we'll generate paths for priority combinations only
  // You can expand this later to include all 450 combinations
  const paths: Array<{ params: { category: string; state: string; modifier: string } }> = [];
  
  // Priority: Top 5 states × All categories × Key modifiers
  const priorityStates = ['texas', 'california', 'florida', 'new-york', 'georgia'];
  const priorityModifiers = ['entry-level', 'no-experience', 'part-time'];
  
  CATEGORY_SLUGS.forEach(category => {
    priorityStates.forEach(state => {
      priorityModifiers.forEach(modifier => {
        paths.push({
          params: { category, state, modifier }
        });
      });
    });
  });

  // Add some Tier 2 states for data-entry (highest volume category)
  const tier2States = ['north-carolina', 'pennsylvania', 'ohio'];
  tier2States.forEach(state => {
    ['entry-level', 'no-experience'].forEach(modifier => {
      paths.push({
        params: { category: 'data-entry', state, modifier }
      });
    });
  });

  return {
    paths,
    fallback: 'blocking' // Generate other pages on-demand
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const categorySlug = params?.category as string;
  const stateSlug = params?.state as string;
  const modifierSlug = params?.modifier as string;
  
  const category = CATEGORIES[categorySlug];
  const state = STATES[stateSlug];
  const modifier = getModifierInfo(modifierSlug);

  if (!category || !state || !modifier) {
    return { notFound: true };
  }

  try {
    await connectDB();
    const mongoose = require('mongoose');
    
    const JobModel = mongoose.models.Job || mongoose.model('Job', new mongoose.Schema({}, { strict: false, collection: 'jobs' }));
    
    // Build query
    const query: any = {
      $and: [
        {
          $or: [
            { jobCategory: { $regex: category.name, $options: 'i' } },
            { title: { $regex: category.name, $options: 'i' } },
            { tags: { $in: [category.slug, category.name.toLowerCase()] } }
          ]
        },
        {
          $or: [
            { location_restriction: { $regex: state.name, $options: 'i' } },
            { location: { $regex: state.name, $options: 'i' } },
            { location: { $regex: state.abbreviation, $options: 'i' } }
          ]
        }
      ]
    };

    // Add modifier-specific filters
    if (isExperienceLevel(modifierSlug)) {
      query.$and.push({
        $or: [
          { experienceLevel: { $regex: modifier.name, $options: 'i' } },
          { title: { $regex: modifier.name, $options: 'i' } },
          { description: { $regex: modifier.name, $options: 'i' } }
        ]
      });
    } else if (modifierSlug === 'part-time') {
      query.$and.push({
        $or: [
          { jobType: { $regex: 'part.?time', $options: 'i' } },
          { title: { $regex: 'part.?time', $options: 'i' } }
        ]
      });
    }

    const jobCount = await JobModel.countDocuments(query);
    const jobs = await JobModel
      .find(query)
      .sort({ postedDate: -1 })
      .limit(25)
      .lean()
      .exec();

    // Generate content
    const { paragraph1, paragraph2 } = generateIntroParagraphs(category, state, modifier, jobCount);
    const faqs = generateFAQs(category, state, modifier);
    const relatedLinks = generateRelatedLinks(categorySlug, stateSlug, modifierSlug);
    const salaryTable = generateSalaryTable(category, state);
    const metadata = generatePageMetadata(category, state, modifier, jobCount);

    return {
      props: {
        category: JSON.parse(JSON.stringify(category)),
        state: JSON.parse(JSON.stringify(state)),
        modifier: JSON.parse(JSON.stringify(modifier)),
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
      revalidate: 3600
    };
  } catch (error) {
    console.error('Error fetching jobs:', error);
    
    const { paragraph1, paragraph2 } = generateIntroParagraphs(category, state, modifier, 0);
    const faqs = generateFAQs(category, state, modifier);
    const relatedLinks = generateRelatedLinks(categorySlug, stateSlug, modifierSlug);
    const salaryTable = generateSalaryTable(category, state);
    const metadata = generatePageMetadata(category, state, modifier, 0);

    return {
      props: {
        category: JSON.parse(JSON.stringify(category)),
        state: JSON.parse(JSON.stringify(state)),
        modifier: JSON.parse(JSON.stringify(modifier)),
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
