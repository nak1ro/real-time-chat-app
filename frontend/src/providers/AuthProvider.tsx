'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext, type AuthState } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import { getToken, setToken, clearToken } from '@/lib/auth/token-storage';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { User, LoginDto, RegisterDto } from '@/types';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from stored token
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getToken();
      
      if (storedToken) {
        try {
          const { user } = await authApi.getCurrentUser();
          // Hydrate React Query cache
          queryClient.setQueryData(queryKeys.auth.me(), user);
          setState({
            user,
            token: storedToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token is invalid, clear it
          clearToken();
          queryClient.removeQueries({ queryKey: queryKeys.auth.me() });
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, [queryClient]);

  // Login function
  const login = useCallback(async (credentials: LoginDto) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      const { user, token } = await authApi.login(credentials);
      setToken(token);
      // Hydrate React Query cache with user data
      queryClient.setQueryData(queryKeys.auth.me(), user);
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [queryClient]);

  // Register function
  const register = useCallback(async (data: RegisterDto) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      const { user, token } = await authApi.register(data);
      setToken(token);
      // Hydrate React Query cache with user data
      queryClient.setQueryData(queryKeys.auth.me(), user);
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [queryClient]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      clearToken();
      // Clear React Query cache
      queryClient.setQueryData(queryKeys.auth.me(), null);
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, [queryClient]);

  // Get current user
  const getUser = useCallback(async (): Promise<User | null> => {
    if (!state.token) {
      return null;
    }

    try {
      const { user } = await authApi.getCurrentUser();
      queryClient.setQueryData(queryKeys.auth.me(), user);
      setState((prev) => ({ ...prev, user }));
      return user;
    } catch (error) {
      return null;
    }
  }, [state.token, queryClient]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!state.token) {
      return;
    }

    try {
      const { user } = await authApi.getCurrentUser();
      queryClient.setQueryData(queryKeys.auth.me(), user);
      setState((prev) => ({ ...prev, user }));
    } catch (error) {
      // Token might be expired, logout
      await logout();
    }
  }, [state.token, queryClient, logout]);

  // Memoize context value
  const contextValue = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      getUser,
      refreshUser,
    }),
    [state, login, register, logout, getUser, refreshUser]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

