export interface EmailCaptureFormProps {
  source?: string;
  variant?: 'default' | 'inline' | 'sticky' | 'modal';
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export interface SubmitButtonProps {
  isLoading: boolean;
  disabled: boolean;
  className?: string;
}

export interface SuccessMessageProps {
  message?: string;
  className?: string;
}

export interface ErrorMessageProps {
  message: string;
  className?: string;
}

export interface EmailCaptureModalProps extends EmailCaptureFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface EmailCaptureState {
  email: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
} 