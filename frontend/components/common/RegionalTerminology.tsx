import React, { useState, useEffect } from 'react';

interface RegionalTerminologyProps {
  usVariant: string;
  ukVariant: string;
  className?: string;
}

const RegionalTerminology: React.FC<RegionalTerminologyProps> = ({
  usVariant,
  ukVariant,
  className = ''
}) => {
  const [userRegion, setUserRegion] = useState<'US' | 'UK' | 'other'>('US');
  const [displayedTerm, setDisplayedTerm] = useState<string>(usVariant);
  
  useEffect(() => {
    // Try to detect user's region based on browser language
    try {
      const language = navigator.language;
      if (language.includes('en-GB')) {
        setUserRegion('UK');
        setDisplayedTerm(ukVariant);
      } else if (language.includes('en-US')) {
        setUserRegion('US');
        setDisplayedTerm(usVariant);
      } else {
        // For other English variants, use both terms
        setUserRegion('other');
        setDisplayedTerm(`${usVariant}/${ukVariant}`);
      }
    } catch (error) {
      console.error('Error detecting user region:', error);
      setUserRegion('US');
      setDisplayedTerm(usVariant);
    }
  }, [usVariant, ukVariant]);
  
  return (
    <span className={className}>
      {displayedTerm}
    </span>
  );
};

export default RegionalTerminology;
