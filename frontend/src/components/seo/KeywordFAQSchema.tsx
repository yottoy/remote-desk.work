import React from 'react';
import { FAQItem } from '../../types/seo';

interface KeywordFAQSchemaProps {
  faqItems: FAQItem[];
  keyword: string;
}

const KeywordFAQSchema: React.FC<KeywordFAQSchemaProps> = ({ faqItems, keyword }) => {
  if (!faqItems || faqItems.length === 0) return null;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
};

export default KeywordFAQSchema;
