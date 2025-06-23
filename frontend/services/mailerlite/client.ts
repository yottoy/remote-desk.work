import axios, { AxiosInstance, AxiosError } from 'axios';
import { MailerLiteConfig, MailerLiteError } from './types';

interface MailerLiteErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export class MailerLiteClient {
  private client: AxiosInstance;
  private config: MailerLiteConfig;

  constructor(config: MailerLiteConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-MailerLite-ApiVersion': '2023-01-01'
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<MailerLiteErrorResponse>) => {
        const mailerLiteError: MailerLiteError = {
          code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
          message: error.response?.data?.error?.message || error.message,
          status: error.response?.status || 500,
        };
        return Promise.reject(mailerLiteError);
      }
    );
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const response = await this.client.get<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await this.client.post<T>(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await this.client.put<T>(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await this.client.delete<T>(endpoint);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): MailerLiteError {
    if (error instanceof AxiosError) {
      return {
        code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
        message: error.response?.data?.error?.message || error.message,
        status: error.response?.status || 500,
      };
    }
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      status: 500,
    };
  }
} 