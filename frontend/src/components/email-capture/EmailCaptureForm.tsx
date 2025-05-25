import React, { useState, useCallback } from 'react';
import { EmailInput } from './EmailInput';
import { SubmitButton } from './SubmitButton';
import { useEmailCapture } from '../../hooks/useEmailCapture';
import type { EmailCaptureFormProps } from '../../types/email-capture';

export const EmailCaptureForm: React.FC<EmailCaptureFormProps> = ({
  source,
  variant = 'default',
  className = '',
  onSuccess,
  onError,
}) => {
  const {
    email,
    isLoading,
    error,
    success,
    handleSubmit,
    handleEmailChange,
  } = useEmailCapture({ source, onSuccess, onError });

  const getVariantClasses = () => {
    switch (variant) {
      case 'inline':
        return 'flex flex-col sm:flex-row gap-4';
      case 'sticky':
        return 'fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg z-50';
      case 'modal':
        return 'p-6 bg-white rounded-lg shadow-xl';
      default:
        return 'max-w-md mx-auto';
    }
  };

  if (success) {
    return (
      <div className={`text-center ${className}`}>
        <div className="text-green-600 mb-2">
          <svg
            className="w-8 h-8 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">
          Thanks for subscribing!
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          We'll keep you updated with the latest job opportunities.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${getVariantClasses()} ${className}`}
      noValidate
    >
      <div className="flex-grow">
        <EmailInput
          value={email}
          onChange={handleEmailChange}
          error={error}
          disabled={isLoading}
          aria-label="Email address"
          aria-describedby={error ? 'email-error' : undefined}
        />
      </div>
      <div className={variant === 'inline' ? 'sm:w-auto' : 'mt-4'}>
        <SubmitButton
          isLoading={isLoading}
          disabled={!email || !!error}
          aria-label={isLoading ? 'Subscribing...' : 'Subscribe'}
        />
      </div>
      {error && (
        <div
          id="email-error"
          className="mt-2 text-sm text-red-600"
          role="alert"
        >
          {error}
        </div>
      )}
    </form>
  );
}; 