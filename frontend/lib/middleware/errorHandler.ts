import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@/types/subscriber';
import { EmailValidationError } from '../validation/email';

export function errorHandler(
  err: Error,
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  console.error('Error:', err);

  // Handle validation errors
  if (err instanceof EmailValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Email already subscribed'
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values((err as any).errors).map((e: any) => ({
      field: e.path,
      message: e.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  // Handle custom API errors
  const apiError = err as unknown as ApiError;
  if (apiError.statusCode) {
    return res.status(apiError.statusCode).json({
      success: false,
      message: apiError.message,
      errors: apiError.errors
    });
  }

  // Handle all other errors
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
} 