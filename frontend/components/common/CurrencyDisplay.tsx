import React, { useState, useEffect } from 'react';

interface CurrencyDisplayProps {
  amount: string | number;
  currency?: 'USD' | 'EUR' | 'GBP';
  period?: 'hour' | 'day' | 'week' | 'month' | 'year';
  className?: string;
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency = 'USD',
  period = 'hour',
  className = ''
}) => {
  const [userRegion, setUserRegion] = useState<string>('US');
  const [formattedAmount, setFormattedAmount] = useState<string>('');
  
  useEffect(() => {
    // Try to detect user's region based on browser language
    try {
      const language = navigator.language;
      const region = language.split('-')[1] || 'US';
      setUserRegion(region);
    } catch (error) {
      console.error('Error detecting user region:', error);
      setUserRegion('US');
    }
    
    // Format the amount
    formatAmount();
  }, [amount, currency, userRegion]);
  
  const formatAmount = () => {
    if (!amount) {
      setFormattedAmount('');
      return;
    }
    
    // Convert string amount to number if needed
    let numericAmount: number;
    if (typeof amount === 'string') {
      // Extract numeric value from string (e.g., "$15/hr" -> 15)
      const match = amount.match(/(\d+(\.\d+)?)/);
      numericAmount = match ? parseFloat(match[0]) : 0;
    } else {
      numericAmount = amount;
    }
    
    if (isNaN(numericAmount)) {
      setFormattedAmount(amount.toString());
      return;
    }
    
    // Format based on currency and user region
    try {
      const formatter = new Intl.NumberFormat(userRegion === 'US' ? 'en-US' : `en-${userRegion}`, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
      
      const formatted = formatter.format(numericAmount);
      
      // Add period if specified
      const periodSuffix = period ? `/${periodAbbreviation(period)}` : '';
      setFormattedAmount(`${formatted}${periodSuffix}`);
    } catch (error) {
      console.error('Error formatting currency:', error);
      // Fallback to basic formatting
      setFormattedAmount(`${currency} ${numericAmount}${period ? `/${periodAbbreviation(period)}` : ''}`);
    }
  };
  
  const periodAbbreviation = (period: string): string => {
    switch (period) {
      case 'hour': return 'hr';
      case 'day': return 'day';
      case 'week': return 'wk';
      case 'month': return 'mo';
      case 'year': return 'yr';
      default: return period;
    }
  };
  
  return (
    <span className={`font-medium ${className}`}>
      {formattedAmount || `${currency} ${amount}`}
    </span>
  );
};

export default CurrencyDisplay;
