import axios from 'axios';

const API_URL = process.env.API_URL || (process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000/api'
  : '/api');

/**
 * Utility to parse ISO date strings in API responses
 * @param data - The data to process
 * @returns - Data with parsed dates
 */
export const parseDates = (data: any): any => {
  if (!data) return data;
  
  // Date ISO format regex
  const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
  
  if (Array.isArray(data)) {
    return data.map(item => parseDates(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const result = { ...data };
    for (const key in result) {
      const value = result[key];
      
      // Check if value is a date string
      if (typeof value === 'string' && dateRegex.test(value)) {
        result[key] = new Date(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = parseDates(value);
      }
      
      // Special case for fields likely to be dates
      if (
        (key.toLowerCase().includes('date') || 
         key.toLowerCase().includes('time') || 
         key === 'createdAt' || 
         key === 'updatedAt') && 
        value && typeof value === 'string'
      ) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            result[key] = date;
          }
        } catch (e) {
          // Keep the original value if parsing fails
        }
      }
    }
    return result;
  }
  
  return data;
};

/**
 * Utility to serialize dates to ISO strings before sending to the API
 * @param data - The data to process
 * @returns - Data with dates converted to ISO strings
 */
export const serializeDates = (data: any): any => {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => serializeDates(item));
  }
  
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  if (typeof data === 'object' && data !== null) {
    const result: Record<string, any> = {};
    for (const key in data) {
      if (data[key] instanceof Date) {
        result[key] = data[key].toISOString();
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        result[key] = serializeDates(data[key]);
      } else {
        result[key] = data[key];
      }
    }
    return result;
  }
  
  return data;
};

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Serialize dates to ISO strings
    if (config.data) {
      config.data = serializeDates(config.data);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Parse ISO date strings to Date objects
    if (response.data) {
      response.data = parseDates(response.data);
    }
    return response;
  },
  (error) => {
    // Handle errors globally
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Job API endpoints
export const jobsAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/jobs', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch jobs from API:', error);
      throw error;
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch job details from API:', error);
      throw error;
    }
  },
  
  search: async (query: string, filters = {}) => {
    try {
      const response = await apiClient.get('/jobs/search', { 
        params: { q: query, ...filters } 
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search jobs from API:', error);
      throw error;
    }
  }
};

// Category API endpoints
export const categoriesAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch categories from API:', error);
      throw error;
    }
  },
  
  getBySlug: async (slug: string) => {
    try {
      const response = await apiClient.get(`/categories/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch category details from API:', error);
      throw error;
    }
  },
  
  getJobsByCategory: async (slug: string, params = {}) => {
    try {
      const response = await apiClient.get(`/categories/${slug}/jobs`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch category jobs from API:', error);
      throw error;
    }
  }
};

export default apiClient; 