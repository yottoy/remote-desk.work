import React from 'react';
import type { EmailInputProps } from '../../types/email-capture';

export const EmailInput: React.FC<EmailInputProps> = ({
  value,
  onChange,
  error,
  disabled,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
}) => {
  return (
    <div className="relative">
      <input
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={!!error}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        className={`
          w-full px-4 py-2 text-gray-900 placeholder-gray-500
          border rounded-lg focus:outline-none focus:ring-2
          ${error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-blue-500'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          ${className}
        `}
        placeholder="Enter your email"
        required
        aria-required="true"
        autoComplete="email"
        spellCheck="false"
        autoCapitalize="none"
      />
      {error && (
        <p
          id="email-error"
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}; 