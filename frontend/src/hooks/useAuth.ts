'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { AuthContext, type AuthContextValue } from '@/context/AuthContext';
import { useContext } from 'react';
import { authApi } from '@/lib/api';
import { setToken, clearToken, hasToken } from '@/lib/auth/token-storage';
import { queryKeys } from '@/lib/react-query/query-keys';
import { DEFAULT_LOGIN_REDIRECT, DEFAULT_LOGOUT_REDIRECT } from '@/config/routes';
import { useSocket } from '@/context/SocketContext';
import type { LoginDto, RegisterDto, User, AuthResponse, CurrentUserResponse } from '@/types';

// Hook to access the auth context state and methods
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Login mutation result type
export interface UseLoginResult {
  login: (credentials: LoginDto) => void;
  loginAsync: (credentials: LoginDto) => Promise<AuthResponse>;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: Error | null;
  reset: () => void;
}

// Hook for user login with React Query
export function useLogin(options?: {
  redirectTo?: string;
  onSuccess?: (data: AuthResponse) => void;
  onError?: (error: Error) => void;
}): UseLoginResult {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { redirectTo = DEFAULT_LOGIN_REDIRECT, onSuccess, onError } = options || {};

  const mutation = useMutation({
    mutationFn: async (credentials: LoginDto): Promise<AuthResponse> => {
      return authApi.login(credentials);
    },
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(queryKeys.auth.me(), data.user);
      onSuccess?.(data);
      router.push(redirectTo);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    login: mutation.mutate,
    loginAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset,
  };
}

// Register mutation result type
export interface UseRegisterResult {
  register: (data: RegisterDto) => void;
  registerAsync: (data: RegisterDto) => Promise<AuthResponse>;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: Error | null;
  reset: () => void;
}

// Hook for user registration with React Query
export function useRegister(options?: {
  redirectTo?: string;
  onSuccess?: (data: AuthResponse) => void;
  onError?: (error: Error) => void;
}): UseRegisterResult {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { redirectTo = DEFAULT_LOGIN_REDIRECT, onSuccess, onError } = options || {};

  const mutation = useMutation({
    mutationFn: async (data: RegisterDto): Promise<AuthResponse> => {
      return authApi.register(data);
    },
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(queryKeys.auth.me(), data.user);
      onSuccess?.(data);
      router.push(redirectTo);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    register: mutation.mutate,
    registerAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset,
  };
}

// Logout mutation result type
export interface UseLogoutResult {
  logout: () => void;
  logoutAsync: () => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

// Hook for user logout with React Query
export function useLogout(options?: {
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}): UseLogoutResult {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { disconnect } = useSocket();
  const { redirectTo = DEFAULT_LOGOUT_REDIRECT, onSuccess, onError } = options || {};

  const mutation = useMutation({
    mutationFn: async (): Promise<void> => {
      try {
        await authApi.logout();
      } catch {
        // Silently ignore logout API errors
      }
    },
    onSuccess: () => {
      clearToken();
      disconnect();
      queryClient.setQueryData(queryKeys.auth.me(), null);
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
      queryClient.clear();
      onSuccess?.();
      router.push(redirectTo);
    },
    onError: (error: Error) => {
      clearToken();
      disconnect();
      queryClient.clear();
      onError?.(error);
      router.push(redirectTo);
    },
  });

  return {
    logout: mutation.mutate,
    logoutAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
  };
}

// Current user query result type
export interface UseCurrentUserResult {
  user: User | null | undefined;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: Error | null;
  refetch: () => void;
}

// Hook to fetch the current authenticated user with React Query
export function useCurrentUser(options?: {
  enabled?: boolean;
}): UseCurrentUserResult {
  const isAuthenticated = hasToken();
  const enabled = options?.enabled ?? isAuthenticated;

  const query = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async (): Promise<User> => {
      const response = await authApi.getCurrentUser();
      return response.user;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    error: query.error,
    refetch: query.refetch,
  };
}

// Token refresh mutation result type
export interface UseRefreshTokenResult {
  refresh: () => void;
  refreshAsync: () => Promise<string>;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: Error | null;
}

// Hook to refresh the JWT token
export function useRefreshToken(options?: {
  onSuccess?: (token: string) => void;
  onError?: (error: Error) => void;
}): UseRefreshTokenResult {
  const { onSuccess, onError } = options || {};

  const mutation = useMutation({
    mutationFn: async (): Promise<string> => {
      const response = await authApi.refreshToken();
      return response.token;
    },
    onSuccess: (token) => {
      setToken(token);
      onSuccess?.(token);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    refresh: mutation.mutate,
    refreshAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
}

// Hook to check if the user is authenticated based on token existence
export function useIsAuthenticated(): boolean {
  return hasToken();
}

// Hook that provides all auth operations in one place
export function useAuthActions() {
  const auth = useAuth();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const currentUserQuery = useCurrentUser();
  const refreshTokenMutation = useRefreshToken();

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    login: loginMutation.login,
    loginAsync: loginMutation.loginAsync,
    isLoginLoading: loginMutation.isLoading,
    loginError: loginMutation.error,
    register: registerMutation.register,
    registerAsync: registerMutation.registerAsync,
    isRegisterLoading: registerMutation.isLoading,
    registerError: registerMutation.error,
    logout: logoutMutation.logout,
    logoutAsync: logoutMutation.logoutAsync,
    isLogoutLoading: logoutMutation.isLoading,
    currentUser: currentUserQuery.user,
    isCurrentUserLoading: currentUserQuery.isLoading,
    currentUserError: currentUserQuery.error,
    refetchCurrentUser: currentUserQuery.refetch,
    refreshToken: refreshTokenMutation.refresh,
    refreshTokenAsync: refreshTokenMutation.refreshAsync,
    isRefreshLoading: refreshTokenMutation.isLoading,
  };
}
