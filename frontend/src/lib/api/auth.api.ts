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
    return apiClient.post<AuthResponse>('/auth/register', data, {
      requiresAuth: false,
    });
  },

  // Login user
  login: (data: LoginDto) => {
    return apiClient.post<AuthResponse>('/auth/login', data, {
      requiresAuth: false,
    });
  },

  // Get current authenticated user
  getCurrentUser: () => {
    return apiClient.get<CurrentUserResponse>('/auth/me');
  },

  // Refresh authentication token
  refreshToken: () => {
    return apiClient.post<TokenRefreshResponse>('/auth/refresh');
  },

  // Logout user
  logout: () => {
    return apiClient.post<LogoutResponse>('/auth/logout');
  },
};

