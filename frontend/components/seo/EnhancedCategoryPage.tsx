import React from 'react';
import Head from 'next/head';
import { RemoteJobMetaTemplates, RemoteJobKeywordOptimizer } from '../../utils/seoOptimization';
import { Job, EnhancedJobListing } from '../../types/job';

interface EnhancedCategoryPageProps {
  categoryName: string;
  categorySlug: string;
  jobs: (Job | EnhancedJobListing)[];
  totalJobs: number;
  description?: string;
  targetKeywords?: string[];
  location?: string;
}

/**
 * Enhanced Category Page Component for Remote Jobs
 * Optimized for high-volume keywords and zero-click search results
 */
const EnhancedCategoryPage: React.FC<EnhancedCategoryPageProps> = ({
  categoryName,
  categorySlug,
  jobs,
  totalJobs,
  description,
  targetKeywords = [],
  location = 'United States'
}) => {
  // Generate optimized meta tags
  const title = RemoteJobMetaTemplates.generateCategoryTitle(categoryName, totalJobs);
  const metaDescription = RemoteJobMetaTemplates.generateCategoryDescription(categoryName, totalJobs);
  
  // Optimize content for target keywords
  const optimizedDescription = description 
    ? RemoteJobKeywordOptimizer.optimizeForKeywords(description, targetKeywords)
    : metaDescription;

  // Extract salary information for structured data
  const salaryStats = jobs.reduce((acc, job) => {
    const salary = (job as any).salary || (job as any).payRange;
    if (salary) {
      const match = salary.match(/\$(\d+)/);
      if (match) {
        acc.push(parseInt(match[1]));
      }
    }
    return acc;
  }, [] as number[]);

  const averageSalary = salaryStats.length > 0 
    ? Math.round(salaryStats.reduce((a, b) => a + b, 0) / salaryStats.length)
    : null;

  // Create structured data for category page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": title,
    "description": optimizedDescription,
    "url": `https://www.clickclickjob.com/categories/${categorySlug}`,
    "about": {
      "@type": "Thing",
      "name": `Remote ${categoryName}`,
      "description": `Collection of remote ${categoryName.toLowerCase()} opportunities`
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": totalJobs,
      "itemListElement": jobs.slice(0, 10).map((job, index) => {
        const postedDate = (job as any).postedDate ? new Date((job as any).postedDate).toISOString() : new Date().toISOString();
        const validThroughDate = new Date(postedDate);
        validThroughDate.setDate(validThroughDate.getDate() + 30);
        const desc = (job as any).descriptionText || (job as any).description || `${job.title} position at ${job.company}. This is a remote opportunity.`;

        const entry: any = {
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "JobPosting",
            "title": job.title,
            "description": desc.length < 200 ? desc + ` This remote ${job.title} role offers the flexibility to work from home with competitive compensation.` : desc,
            "datePosted": postedDate,
            "validThrough": validThroughDate.toISOString(),
            "hiringOrganization": {
              "@type": "Organization",
              "name": job.company
            },
            "jobLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "US"
              }
            },
            "jobLocationType": "TELECOMMUTE",
            "applicantLocationRequirements": {
              "@type": "Country",
              "name": "US"
            },
            "employmentType": "FULL_TIME",
            "url": `https://www.clickclickjob.com/jobs/view/${job._id}`
          }
        };

        const salary = (job as any).salary || (job as any).payRange;
        if (salary) {
          const cleanStr = salary.toLowerCase().replace(/[,$]/g, '');
          const isHourly = /hour|hr|\/h\b/.test(cleanStr);
          const numbers = cleanStr.match(/(\d+(?:\.\d+)?)\s*k?\b/g);
          if (numbers && numbers.length > 0) {
            const parsed = numbers.map((n: string) => {
              const num = parseFloat(n.replace('k', ''));
              if (n.includes('k')) return num * 1000;
              if (isHourly && num < 200) return num;
              if (!isHourly && num < 1000) return num * 1000;
              return num;
            });
            entry.item.baseSalary = {
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

        return entry;
      })
    }
  };

  // FAQ structured data for common questions
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `How many remote ${categoryName.toLowerCase()} are available?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `We currently have ${totalJobs} remote ${categoryName.toLowerCase()} available on ClickClickJob. New opportunities are added daily from verified employers across the United States.`
        }
      },
      {
        "@type": "Question",
        "name": `What is the average salary for remote ${categoryName.toLowerCase()}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": averageSalary 
            ? `The average salary for remote ${categoryName.toLowerCase()} is approximately $${averageSalary} per hour, with opportunities ranging from entry-level to experienced positions.`
            : `Remote ${categoryName.toLowerCase()} offer competitive compensation packages with many positions offering hourly rates between $15-30 depending on experience and specialization.`
        }
      },
      {
        "@type": "Question",
        "name": `Do I need experience for remote ${categoryName.toLowerCase()}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Many remote ${categoryName.toLowerCase()} welcome entry-level candidates with no prior experience. We have opportunities for both beginners and experienced professionals looking to work from home.`
        }
      },
      {
        "@type": "Question",
        "name": `Are these remote ${categoryName.toLowerCase()} legitimate?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes, all remote ${categoryName.toLowerCase()} on ClickClickJob are verified and sourced from legitimate employers. We screen all job postings to ensure they meet our quality standards for remote work opportunities.`
        }
      }
    ]
  };

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{title}</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={`remote ${categoryName.toLowerCase()}, work from home ${categoryName.toLowerCase()}, ${categorySlug.replace('-', ' ')}, remote work opportunities, telecommute jobs`} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://www.clickclickjob.com/categories/${categorySlug}`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://www.clickclickjob.com/categories/${categorySlug}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={`/images/categories/${categorySlug}-og.jpg`} />
        <meta property="og:site_name" content="ClickClickJob" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={`https://www.clickclickjob.com/categories/${categorySlug}`} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={metaDescription} />
        <meta property="twitter:image" content={`/images/categories/${categorySlug}-twitter.jpg`} />
        
        {/* Category-specific meta tags */}
        <meta name="category:name" content={categoryName} />
        <meta name="category:slug" content={categorySlug} />
        <meta name="category:count" content={totalJobs.toString()} />
        <meta name="category:type" content="remote-jobs" />
        
        {/* Search engine directives */}
        <meta name="robots" content="index, follow, max-snippet:155, max-image-preview:large" />
        <meta name="googlebot" content="index, follow, max-snippet:155, max-image-preview:large" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
        
        {/* FAQ Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqData)
          }}
        />
      </Head>

      <div className="enhanced-category-page">
        {/* Hero Section with Optimized Keywords */}
        <section className="hero-section bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {totalJobs}+ Remote {categoryName} Available Now
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Find verified remote {categoryName.toLowerCase()} opportunities. Work from home with flexible schedules. 
                Entry-level to experienced positions available. No commute required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Browse All Jobs
                </button>
                <button className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                  Set Job Alert
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Key Benefits Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Choose Remote {categoryName}?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Work From Anywhere</h3>
                <p className="text-gray-600">
                  Complete flexibility to work from your home office, coffee shop, or anywhere with internet connection.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Competitive Pay</h3>
                <p className="text-gray-600">
                  {averageSalary ? `Average $${averageSalary}/hour` : 'Competitive rates from $15-30/hour'} with opportunities for both entry-level and experienced professionals.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Verified Employers</h3>
                <p className="text-gray-600">
                  All remote {categoryName.toLowerCase()} are screened and verified to ensure legitimacy and quality.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section for Zero-Click Optimization */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-8">
              {faqData.mainEntity.map((faq, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-3">{faq.name}</h3>
                  <p className="text-gray-600">{faq.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Your Remote Career?
            </h2>
            <p className="text-xl mb-8">
              Join thousands of professionals who have found their perfect remote {categoryName.toLowerCase()} on ClickClickJob.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Browse Jobs Now
              </button>
              <button className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Create Job Alert
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default EnhancedCategoryPage; 