import React, { useState, useEffect } from 'react';

interface TimezoneCompatibilityProps {
  jobTimezone?: string;
  className?: string;
}

const TimezoneCompatibility: React.FC<TimezoneCompatibilityProps> = ({
  jobTimezone,
  className = ''
}) => {
  const [userTimezone, setUserTimezone] = useState<string>('');
  const [compatibility, setCompatibility] = useState<'high' | 'medium' | 'low'>('high');
  const [timeDifference, setTimeDifference] = useState<number>(0);
  const [userTime, setUserTime] = useState<string>('');
  const [jobTime, setJobTime] = useState<string>('');

  useEffect(() => {
    // Get user's timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimezone(tz || 'UTC');
      
      // Update user's current time
      const updateTime = () => {
        const now = new Date();
        setUserTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        
        // Calculate job timezone time if available
        if (jobTimezone && jobTimezone !== 'Any timezone' && jobTimezone !== 'Worldwide') {
          try {
            // For simplicity, we're using a mapping of common timezone strings to IANA timezone identifiers
            const timezoneMap: Record<string, string> = {
              'EST': 'America/New_York',
              'CST': 'America/Chicago',
              'MST': 'America/Denver',
              'PST': 'America/Los_Angeles',
              'GMT': 'Europe/London',
              'CET': 'Europe/Paris',
              'IST': 'Asia/Kolkata',
              'JST': 'Asia/Tokyo',
              'AEST': 'Australia/Sydney',
              'US East': 'America/New_York',
              'US West': 'America/Los_Angeles',
              'US': 'America/New_York',
              'Europe': 'Europe/London',
              'Asia': 'Asia/Singapore'
            };
            
            const tzIdentifier = timezoneMap[jobTimezone] || jobTimezone;
            
            // Get the current time in the job's timezone
            const jobTimeStr = now.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: tzIdentifier
            });
            
            setJobTime(jobTimeStr);
            
            // Calculate time difference
            const userHour = now.getHours();
            const jobHour = new Date(now.toLocaleString('en-US', { timeZone: tzIdentifier })).getHours();
            const hourDiff = Math.abs(userHour - jobHour);
            
            setTimeDifference(hourDiff);
            
            // Set compatibility based on time difference
            if (hourDiff <= 3) {
              setCompatibility('high');
            } else if (hourDiff <= 6) {
              setCompatibility('medium');
            } else {
              setCompatibility('low');
            }
          } catch (error) {
            console.error('Error calculating job timezone:', error);
            setJobTime('Unknown');
            setCompatibility('high'); // Default to high if we can't calculate
          }
        } else {
          // If job timezone is not specified, assume high compatibility
          setJobTime('Flexible');
          setCompatibility('high');
        }
      };
      
      // Update time immediately and then every minute
      updateTime();
      const interval = setInterval(updateTime, 60000);
      
      return () => clearInterval(interval);
    } catch (e) {
      setUserTimezone('Unknown');
      setCompatibility('high'); // Default to high if we can't determine
    }
  }, [jobTimezone]);

  // If we don't have timezone info yet, show a loading state
  if (!userTimezone) {
    return null;
  }

  return (
    <div 
      className={`timezone-compatibility bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}
      data-testid="timezone-compatibility"
    >
      <h3 className="text-sm font-medium text-gray-900 mb-2">Timezone Compatibility</h3>
      
      <div className="flex items-center mb-3">
        <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
          compatibility === 'high' ? 'bg-green-500' : 
          compatibility === 'medium' ? 'bg-yellow-500' : 
          'bg-red-500'
        }`}></div>
        <span className="text-sm text-gray-700">
          {compatibility === 'high' ? 'Highly Compatible' : 
           compatibility === 'medium' ? 'Moderately Compatible' : 
           'Low Compatibility'}
        </span>
      </div>
      
      <div className="text-xs text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>Your timezone:</span>
          <span className="font-medium">{userTimezone}</span>
        </div>
        <div className="flex justify-between">
          <span>Your local time:</span>
          <span className="font-medium">{userTime}</span>
        </div>
        {jobTimezone && jobTimezone !== 'Any timezone' && jobTimezone !== 'Worldwide' && (
          <>
            <div className="flex justify-between">
              <span>Job timezone:</span>
              <span className="font-medium">{jobTimezone}</span>
            </div>
            <div className="flex justify-between">
              <span>Job local time:</span>
              <span className="font-medium">{jobTime}</span>
            </div>
            {timeDifference > 0 && (
              <div className="flex justify-between">
                <span>Time difference:</span>
                <span className="font-medium">{timeDifference} hour{timeDifference !== 1 ? 's' : ''}</span>
              </div>
            )}
          </>
        )}
      </div>
      
      {compatibility !== 'high' && (
        <div className="mt-3 text-xs text-gray-600">
          <p>This job may require working hours that don't align perfectly with your timezone.</p>
        </div>
      )}
    </div>
  );
};

export default TimezoneCompatibility;
