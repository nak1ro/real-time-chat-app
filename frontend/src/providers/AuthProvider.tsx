'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { AuthContext, type AuthState } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import { getToken, setToken, clearToken, hasToken } from '@/lib/auth/token-storage';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { User, LoginDto, RegisterDto } from '@/types';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize token from storage on mount
  useEffect(() => {
    const storedToken = getToken();
    setTokenState(storedToken);
    setIsInitialized(true);
  }, []);

  // Query for current user when we have a token
  const {
    data: user,
    isLoading: isUserLoading,
    refetch: refetchUser,
  } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async (): Promise<User> => {
      const response = await authApi.getCurrentUser();
      return response.user;
    },
    enabled: isInitialized && !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.statusCode === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Handle invalid token when query fails
  useEffect(() => {
    if (isInitialized && token && !isUserLoading && !user) {
      const timer = setTimeout(() => {
        const currentUser = queryClient.getQueryData(queryKeys.auth.me());
        if (!currentUser && hasToken()) {
          clearToken();
          setTokenState(null);
          queryClient.removeQueries({ queryKey: queryKeys.auth.me() });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, token, isUserLoading, user, queryClient]);

  const isLoading = !isInitialized || (!!token && isUserLoading);
  const isAuthenticated = !!token && !!user;

  const login = useCallback(async (credentials: LoginDto) => {
    const response = await authApi.login(credentials);
    setToken(response.token);
    setTokenState(response.token);
    queryClient.setQueryData(queryKeys.auth.me(), response.user);
  }, [queryClient]);

  const register = useCallback(async (data: RegisterDto) => {
    const response = await authApi.register(data);
    setToken(response.token);
    setTokenState(response.token);
    queryClient.setQueryData(queryKeys.auth.me(), response.user);
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors
    } finally {
      clearToken();
      setTokenState(null);
      queryClient.setQueryData(queryKeys.auth.me(), null);
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    }
  }, [queryClient]);

  const getUser = useCallback(async (): Promise<User | null> => {
    if (!token) {
      return null;
    }
    try {
      const response = await authApi.getCurrentUser();
      queryClient.setQueryData(queryKeys.auth.me(), response.user);
      return response.user;
    } catch {
      return null;
    }
  }, [token, queryClient]);

  const refreshUser = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      await refetchUser();
    } catch {
      await logout();
    }
  }, [token, refetchUser, logout]);

  // Sync with React Query cache updates from hooks
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryKey[0] === 'auth' && event.query.queryKey[1] === 'me') {
        const currentToken = getToken();
        if (currentToken !== token) {
          setTokenState(currentToken);
        }
      }
    });
    return () => unsubscribe();
  }, [queryClient, token]);

  const state: AuthState = {
    user: user ?? null,
    token,
    isAuthenticated,
    isLoading,
  };

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
