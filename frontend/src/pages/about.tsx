import React from 'react';
import Link from 'next/link';
import Layout from '../components/layout/Layout';

const AboutPage = () => {
  return (
    <Layout
      title="About ClickClickJob.com | Our Mission and Values"
      description="Learn about ClickClickJob.com, our mission to connect job seekers with verified remote data entry and administrative opportunities, and how we verify job listings."
    >
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            ABOUT CLICKCLICKJOB.COM
          </h1>
          
          <div className="prose max-w-none">
            <h2>Our Mission</h2>
            
            <p>
              ClickClickJob.com was founded with a simple yet powerful mission: to help people find verified remote work opportunities in data entry, administrative support, and related fields.
            </p>
            
            <p>
              We understand the challenges job seekers face when searching for remote work. The internet is filled with scams, misleading listings, and opportunities that seem too good to be true—because they often are. Our platform focuses exclusively on verifying and listing genuine remote opportunities from reputable employers.
            </p>
            
            <p>
              Whether you're a parent looking for flexible work, a student seeking part-time income, someone with mobility challenges, or simply prefer working from home, we're committed to connecting you with verified opportunities that match your skills and needs.
            </p>
            
            <h2>How We Verify Jobs</h2>
            
            <p>
              What sets ClickClickJob.com apart is our rigorous verification process. Before any job listing appears on our platform, our team evaluates it against a comprehensive set of criteria:
            </p>
            
            <ul>
              <li>
                <strong>Company Verification:</strong> We research each company, checking their online presence, reviews, and business registration where possible.
              </li>
              <li>
                <strong>Listing Authenticity:</strong> We review job descriptions to ensure they contain clear information about responsibilities, requirements, and application processes.
              </li>
              <li>
                <strong>Red Flag Detection:</strong> We automatically flag and manually review any listings that contain known scam indicators such as requests for payment, promises of unrealistic compensation, or vague details.
              </li>
              <li>
                <strong>Employer Contact:</strong> For new employers or those with limited online presence, we may directly contact the company to verify the legitimacy of their postings.
              </li>
              <li>
                <strong>User Feedback:</strong> We maintain a feedback system allowing job seekers to report suspicious listings, which triggers an immediate review.
              </li>
            </ul>
            
            <p>
              This multi-layered approach allows us to maintain high-quality standards and ensure that the opportunities on our platform are verified and worthwhile for job seekers.
            </p>
            
            <h2>Our Team</h2>
            
            <p>
              ClickClickJob.com is powered by a distributed team of professionals who are passionate about remote work. Many of us started our careers in data entry or administrative positions, giving us firsthand understanding of both the opportunities and challenges in these fields.
            </p>
            
            <p>
              Our team includes:
            </p>
            
            <ul>
              <li>
                <strong>Job Quality Analysts:</strong> Experts who review and verify job listings
              </li>
              <li>
                <strong>Technology Specialists:</strong> Developers and engineers who maintain and improve our platform
              </li>
              <li>
                <strong>Career Advisors:</strong> Professionals who create resources to help job seekers succeed
              </li>
              <li>
                <strong>Industry Researchers:</strong> Analysts who track trends and identify new opportunities in remote work
              </li>
            </ul>
            
            <p>
              We're proud to practice what we preach—our entire team works remotely, allowing us to deeply understand the remote work ecosystem and better serve our users.
            </p>
            
            <h2>Contact Us</h2>
            
            <p>
              Have questions? <Link href="/contact" className="text-blue-600 hover:text-blue-800">Contact us</Link> – we&apos;d love to help!
            </p>
            
            <p>
              Please use our <Link href="/contact" className="text-blue-600 hover:text-blue-800">contact form</Link> to get in touch with us.
            </p>
            
            <p>
              For business partnerships or employer inquiries, please use the contact form and select "Business Inquiry" as the subject.
            </p>
          </div>
          
          <div className="mt-12 bg-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Join Our Mission</h3>
            <p className="text-gray-700 mb-4">
              Are you an employer with remote opportunities? We'd love to feature your jobs on our platform.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Post a Job
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage; 