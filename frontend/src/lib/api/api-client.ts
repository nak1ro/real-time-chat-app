// Base API Client with interceptors for auth, error handling, and response parsing
import { env } from '@/config/env';
import { getToken } from '@/lib/auth/token-storage';

// Custom error class for API errors
export class ApiClientError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(message: string, statusCode: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// Request configuration
export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  requiresAuth?: boolean;
}

// Base API URL
const BASE_URL = env.apiUrl;

// Build URL with query parameters
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(endpoint, BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

// Build headers
function buildHeaders(config: RequestConfig = {}): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add existing headers from config
  if (config.headers) {
    const configHeaders = new Headers(config.headers);
    configHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  // Add auth token if required (default: true)
  const requiresAuth = config.requiresAuth !== false;
  if (requiresAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

// Handle API response
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  // Parse response body
  let data: any;
  if (isJson) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  // Handle error responses
  if (!response.ok) {
    const errorMessage = data?.message || `Request failed with status ${response.status}`;
    const errors = data?.errors;

    throw new ApiClientError(errorMessage, response.status, errors);
  }

  // Return data from the standard API response wrapper
  // Backend responses are in format: { status: 'success', data: {...} }
  if (isJson && data && typeof data === 'object' && 'data' in data) {
    return data.data as T;
  }

  return data as T;
}

// Core request function
async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { params, ...fetchConfig } = config;

  const url = buildUrl(endpoint, params);
  const headers = buildHeaders(config);

  const response = await fetch(url, {
    ...fetchConfig,
    headers,
  });

  return handleResponse<T>(response);
}

// API Client
export const apiClient = {
  // GET request
  get: <T>(endpoint: string, config?: RequestConfig) => {
    return request<T>(endpoint, { ...config, method: 'GET' });
  },

  // POST request
  post: <T>(endpoint: string, body?: any, config?: RequestConfig) => {
    return request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  // PATCH request
  patch: <T>(endpoint: string, body?: any, config?: RequestConfig) => {
    return request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  // PUT request
  put: <T>(endpoint: string, body?: any, config?: RequestConfig) => {
    return request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  // DELETE request
  delete: <T>(endpoint: string, config?: RequestConfig) => {
    return request<T>(endpoint, { ...config, method: 'DELETE' });
  },

  // Upload file (multipart/form-data)
  upload: async <T>(endpoint: string, formData: FormData, config?: Omit<RequestConfig, 'headers'>) => {
    const token = getToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData - browser will set it with boundary
    const url = buildUrl(endpoint, config?.params);

    const response = await fetch(url, {
      ...config,
      method: 'POST',
      headers,
      body: formData,
    });

    return handleResponse<T>(response);
  },
};

