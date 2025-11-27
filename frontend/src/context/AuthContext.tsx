'use client';

import { createContext, useContext } from 'react';
import type { User, LoginDto, RegisterDto } from '@/types';

// Auth state interface
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Auth context interface
export interface AuthContextValue extends AuthState {
  login: (credentials: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  getUser: () => Promise<User | null>;
  refreshUser: () => Promise<void>;
}

// Default context value
const defaultContextValue: AuthContextValue = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  getUser: async () => null,
  refreshUser: async () => {},
};

// Create context
export const AuthContext = createContext<AuthContextValue>(defaultContextValue);

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

