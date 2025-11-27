// Auth API - handles authentication-related API calls
import  { apiClient } from './api-client';
import type {
  RegisterDto,
  LoginDto,
  AuthResponse,
  CurrentUserResponse,
  TokenRefreshResponse,
  LogoutResponse,
} from '@/types';

export const authApi = {
  // Register a new user
  register: (data: RegisterDto) => {
    return apiClient.post<AuthResponse>('/api/auth/register', data, {
      requiresAuth: false,
    });
  },

  // Login user
  login: (data: LoginDto) => {
    return apiClient.post<AuthResponse>('/api/auth/login', data, {
      requiresAuth: false,
    });
  },

  // Get current authenticated user
  getCurrentUser: () => {
    return apiClient.get<CurrentUserResponse>('/api/auth/me');
  },

  // Refresh authentication token
  refreshToken: () => {
    return apiClient.post<TokenRefreshResponse>('/api/auth/refresh');
  },

  // Logout user
  logout: () => {
    return apiClient.post<LogoutResponse>('/api/auth/logout');
  },
};

