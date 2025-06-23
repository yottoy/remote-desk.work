export interface Subscriber {
  email: string;
  source?: string;
  status: 'active' | 'unsubscribed';
  unsubscribeToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscribeRequest {
  email: string;
  source?: string;
}

export interface SubscribeResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    status: string;
  };
}

export interface UnsubscribeResponse {
  success: boolean;
  message: string;
}

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: ValidationError[];
} 