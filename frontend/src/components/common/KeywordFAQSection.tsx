import React, { useState } from 'react';
import { FAQItem } from '../../types/seo';

interface KeywordFAQSectionProps {
  faqItems: FAQItem[];
  keyword: string;
}

const KeywordFAQSection: React.FC<KeywordFAQSectionProps> = ({ faqItems, keyword }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!faqItems || faqItems.length === 0) return null;

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions About {keyword}
          </h2>
          
          <dl className="space-y-6 divide-y divide-gray-200">
            {faqItems.map((faq, index) => (
              <div key={index} className="pt-6">
                <dt className="text-lg">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="text-left w-full flex justify-between items-start text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                    aria-expanded={openIndex === index}
                    aria-controls={`faq-answer-${index}`}
                    tabIndex={0}
                    aria-label={`Question: ${faq.question}`}
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    <span className="ml-6 h-7 flex items-center">
                      <svg
                        className={`${openIndex === index ? '-rotate-180' : 'rotate-0'} h-6 w-6 transform transition-transform duration-200 ease-in-out text-blue-500`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                </dt>
                <dd 
                  className={`mt-2 pr-12 transition-all duration-200 ease-in-out ${openIndex === index ? 'block opacity-100 max-h-96' : 'hidden opacity-0 max-h-0'}`}
                  id={`faq-answer-${index}`}
                >
                  <p className="text-base text-gray-600">{faq.answer}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};

export default KeywordFAQSection;
