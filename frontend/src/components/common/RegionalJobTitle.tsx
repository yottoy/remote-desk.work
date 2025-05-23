import React, { useState, useEffect } from 'react';
import { getRegionalJobTitle, detectUserRegion } from '../../utils/regionUtils';

interface RegionalJobTitleProps {
  baseTitle: string;
  className?: string;
  showVariation?: boolean;
}

const RegionalJobTitle: React.FC<RegionalJobTitleProps> = ({
  baseTitle,
  className = '',
  showVariation = false
}) => {
  const [regionalTitle, setRegionalTitle] = useState<string>(baseTitle);
  const [userRegion, setUserRegion] = useState<string>('');
  
  useEffect(() => {
    // Get the user's region and the regional job title
    const region = detectUserRegion();
    const title = getRegionalJobTitle(baseTitle);
    
    setUserRegion(region);
    setRegionalTitle(title);
  }, [baseTitle]);
  
  if (baseTitle === regionalTitle || !showVariation) {
    return <span className={className}>{regionalTitle}</span>;
  }
  
  return (
    <span className={className}>
      {regionalTitle}
      <span className="text-xs text-gray-500 ml-1">
        ({baseTitle})
      </span>
    </span>
  );
};

export default RegionalJobTitle;
