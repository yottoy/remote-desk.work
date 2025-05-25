import { useState, useCallback } from 'react';
import axios from 'axios';
import { getEmailError } from '../utils/validation';
import type { EmailCaptureState } from '../types/email-capture';

interface UseEmailCaptureProps {
  source?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useEmailCapture = ({ source, onSuccess, onError }: UseEmailCaptureProps = {}) => {
  const [state, setState] = useState<EmailCaptureState>({
    email: '',
    isLoading: false,
    error: null,
    success: false,
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = getEmailError(state.email);
    if (error) {
      setState(prev => ({ ...prev, error }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await axios.post('/api/subscribe', {
        email: state.email,
        source,
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        success: true,
        email: '',
      }));
      
      onSuccess?.();
    } catch (error) {
      let errorMessage = 'Failed to subscribe';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          errorMessage = 'Too many attempts. Please try again later.';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      onError?.(errorMessage);
    }
  }, [state.email, source, onSuccess, onError]);

  const handleEmailChange = useCallback((email: string) => {
    setState(prev => ({
      ...prev,
      email,
      error: getEmailError(email),
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      email: '',
      isLoading: false,
      error: null,
      success: false,
    });
  }, []);

  return {
    ...state,
    handleSubmit,
    handleEmailChange,
    reset,
  };
}; 