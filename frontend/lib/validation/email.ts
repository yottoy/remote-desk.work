import { ValidationError } from '@/types/subscriber';

export class EmailValidationError extends Error {
  errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('Email validation failed');
    this.errors = errors;
    this.name = 'EmailValidationError';
  }
}

export function validateEmail(email: string): void {
  const errors: ValidationError[] = [];

  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push({
      field: 'email',
      message: 'Invalid email format'
    });
    throw new EmailValidationError(errors);
  }

  // Length validation
  if (email.length > 254) {
    errors.push({
      field: 'email',
      message: 'Email address is too long'
    });
  }

  // Domain validation
  const [, domain] = email.split('@');
  if (domain.length > 255) {
    errors.push({
      field: 'email',
      message: 'Domain name is too long'
    });
  }

  // Disposable email domains (basic check)
  const disposableDomains = [
    'tempmail.com',
    'throwawaymail.com',
    'mailinator.com',
    'guerrillamail.com'
  ];
  if (disposableDomains.includes(domain.toLowerCase())) {
    errors.push({
      field: 'email',
      message: 'Disposable email addresses are not allowed'
    });
  }

  // XSS protection
  const xssPattern = /<script|javascript:|data:|vbscript:|onload=|onerror=/i;
  if (xssPattern.test(email)) {
    errors.push({
      field: 'email',
      message: 'Email contains potentially harmful content'
    });
  }

  if (errors.length > 0) {
    throw new EmailValidationError(errors);
  }
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
} 