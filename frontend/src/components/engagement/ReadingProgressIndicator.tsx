import React, { useEffect, useState } from 'react';

interface ReadingProgressIndicatorProps {
  target: React.RefObject<HTMLElement>;
  className?: string;
}

const ReadingProgressIndicator: React.FC<ReadingProgressIndicatorProps> = ({ 
  target,
  className = ''
}) => {
  const [readingProgress, setReadingProgress] = useState(0);

  const scrollListener = () => {
    if (!target.current) {
      return;
    }

    const element = target.current;
    const totalHeight = element.scrollHeight - element.clientHeight;
    const windowScrollTop = element.scrollTop;
    
    if (totalHeight === 0) {
      return setReadingProgress(100);
    }
    
    const newReadingProgress = Math.round((windowScrollTop / totalHeight) * 100);
    setReadingProgress(newReadingProgress);
  };

  useEffect(() => {
    const targetElement = target.current;
    if (!targetElement) return;

    targetElement.addEventListener('scroll', scrollListener);
    return () => targetElement.removeEventListener('scroll', scrollListener);
  }, [target]);

  return (
    <div className={`w-full bg-gray-200 rounded-full h-1.5 ${className}`}>
      <div 
        className="bg-blue-600 h-1.5 rounded-full transition-all duration-150 ease-out"
        style={{ width: `${readingProgress}%` }}
        role="progressbar"
        aria-valuenow={readingProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
};

export default ReadingProgressIndicator; 