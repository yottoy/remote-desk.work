import React, { useState, useEffect } from 'react';

interface InternationalLegalDisclaimerProps {
  className?: string;
  compact?: boolean;
}

const InternationalLegalDisclaimer: React.FC<InternationalLegalDisclaimerProps> = ({
  className = '',
  compact = false
}) => {
  const [userRegion, setUserRegion] = useState<string>('');
  const [showRegionalInfo, setShowRegionalInfo] = useState<boolean>(false);
  
  useEffect(() => {
    // Try to detect user's region based on browser language
    try {
      const language = navigator.language;
      const region = language.split('-')[1] || '';
      setUserRegion(region);
      
      // Only show regional info for non-US users
      setShowRegionalInfo(region !== 'US' && region !== '');
    } catch (error) {
      console.error('Error detecting user region:', error);
      setUserRegion('');
      setShowRegionalInfo(false);
    }
  }, []);
  
  // Get region-specific legal disclaimer
  const getRegionalDisclaimer = (): string => {
    switch (userRegion) {
      case 'GB':
        return 'Employment opportunities may be subject to UK employment laws, including IR35 regulations for contractors.';
      case 'CA':
        return 'Remote positions may be subject to Canadian employment laws and provincial regulations.';
      case 'AU':
        return 'Remote positions may be subject to Australian employment laws and contractor regulations.';
      case 'DE':
      case 'FR':
      case 'IT':
      case 'ES':
        return 'EU-based workers may be subject to local employment laws, contractor regulations, and VAT requirements.';
      case 'IN':
        return 'Indian remote workers may need to register as independent contractors and comply with GST requirements.';
      default:
        return 'International remote workers should consult local tax and employment laws in their jurisdiction.';
    }
  };
  
  if (compact) {
    return (
      <div 
        className={`legal-disclaimer text-xs text-gray-500 ${className}`}
        data-testid="legal-disclaimer"
      >
        <p>*International employment may be subject to local laws and regulations. {showRegionalInfo && getRegionalDisclaimer()}</p>
      </div>
    );
  }
  
  return (
    <div 
      className={`legal-disclaimer bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}
      data-testid="legal-disclaimer"
    >
      <h3 className="text-sm font-medium text-gray-900 mb-2">International Employment Information</h3>
      
      <div className="text-xs text-gray-600 space-y-2">
        <p>Remote positions may have specific legal requirements depending on your location. Please consider the following:</p>
        
        <ul className="list-disc pl-5 space-y-1">
          <li>Employment status (contractor vs. employee) may vary by country</li>
          <li>Tax obligations differ based on your jurisdiction</li>
          <li>Payment methods and currencies may be limited for some regions</li>
          {showRegionalInfo && <li><strong>{getRegionalDisclaimer()}</strong></li>}
        </ul>
        
        <p>ClickClickJob.com provides job listings but is not responsible for employment arrangements. Always consult with a legal professional regarding your specific situation.</p>
      </div>
    </div>
  );
};

export default InternationalLegalDisclaimer;
