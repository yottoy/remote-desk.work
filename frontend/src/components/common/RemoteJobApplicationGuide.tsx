import React, { useState } from 'react';
import { getRegionalTerm, detectUserRegion } from '../../utils/regionUtils';

interface RemoteJobApplicationGuideProps {
  keyword: string;
  className?: string;
}

const RemoteJobApplicationGuide: React.FC<RemoteJobApplicationGuideProps> = ({
  keyword,
  className = ''
}) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  
  // Format the keyword for display
  const formattedKeyword = keyword
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
  
  // Get region-specific terms
  const resumeTerm = getRegionalTerm('resume');
  const coverLetterTerm = getRegionalTerm('cover letter');
  
  const toggleStep = (stepIndex: number) => {
    if (expandedStep === stepIndex) {
      setExpandedStep(null);
    } else {
      setExpandedStep(stepIndex);
    }
  };
  
  const applicationSteps = [
    {
      title: `Prepare Your ${resumeTerm.charAt(0).toUpperCase() + resumeTerm.slice(1)}`,
      content: `Tailor your ${resumeTerm} to highlight remote work skills such as self-discipline, communication, and time management. Include any previous remote work experience, even if informal. Emphasize digital tools and software proficiency relevant to ${formattedKeyword}.`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: `Craft a Compelling ${coverLetterTerm.charAt(0).toUpperCase() + coverLetterTerm.slice(1)}`,
      content: `Explain why you're interested in remote work and how your skills align with the specific requirements of ${formattedKeyword}. Address potential concerns about remote collaboration and communication. Personalize each ${coverLetterTerm} to the company and position.`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: 'Set Up Your Home Office',
      content: `Employers hiring for ${formattedKeyword} want to ensure you have a suitable remote work environment. Prepare a quiet workspace with reliable internet connection. During interviews, be ready to discuss your home office setup and how you manage distractions.`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: 'Prepare for Virtual Interviews',
      content: `Remote positions typically involve video interviews. Test your camera and microphone beforehand. Dress professionally and choose a clean, well-lit background. Be prepared to discuss your experience with remote collaboration tools and your strategies for staying productive while working independently.`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: 'Demonstrate Remote Work Skills',
      content: `For ${formattedKeyword}, employers value candidates who can work independently while staying connected with the team. Prepare examples that showcase your self-motivation, communication skills, and ability to collaborate across time zones. Highlight your experience with project management and communication tools.`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    }
  ];
  
  return (
    <div 
      className={`application-guide bg-white rounded-lg shadow p-6 ${className}`}
      data-testid="application-guide"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        How to Apply for {formattedKeyword}
      </h2>
      
      <div className="space-y-4">
        {applicationSteps.map((step, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
              onClick={() => toggleStep(index)}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  {step.icon}
                </div>
                <span className="text-md font-medium text-gray-900">
                  {index + 1}. {step.title}
                </span>
              </div>
              <svg
                className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${expandedStep === index ? 'rotate-180' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {expandedStep === index && (
              <div className="px-4 pb-4 text-sm text-gray-700">
                <p>{step.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-sm text-gray-600">
        <p>
          <strong>Pro Tip:</strong> When applying for {formattedKeyword}, highlight any experience with remote work tools like Slack, Zoom, Asana, or Trello. These skills are highly valued for remote positions.
        </p>
      </div>
    </div>
  );
};

export default RemoteJobApplicationGuide;
