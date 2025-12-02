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

// Hook to manage token state and sync with storage
function useTokenState() {
  const [token, setTokenState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  // Initialize token from storage
  useEffect(() => {
    setTokenState(getToken());
    setIsInitialized(true);
  }, []);

  // Sync with React Query cache updates
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryKey[0] === 'auth' && event.query.queryKey[1] === 'me') {
        const currentToken = getToken();
        if (currentToken !== token) setTokenState(currentToken);
      }
    });
    return () => unsubscribe();
  }, [queryClient, token]);

  const updateToken = useCallback((newToken: string | null) => {
    if (newToken) setToken(newToken);
    else clearToken();
    setTokenState(newToken);
  }, []);

  return { token, isInitialized, updateToken };
}

// Hook to fetch and manage current user data
function useCurrentUser(token: string | null, isInitialized: boolean, updateToken: (t: string | null) => void) {
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading, refetch } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => (await authApi.getCurrentUser()).user,
    enabled: isInitialized && !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, error: any) => error?.statusCode !== 401 && failureCount < 2,
  });

  // Handle invalid token
  useEffect(() => {
    if (isInitialized && token && !isUserLoading && !user) {
      const timer = setTimeout(() => {
        const currentUser = queryClient.getQueryData(queryKeys.auth.me());
        if (!currentUser && hasToken()) {
          updateToken(null);
          queryClient.removeQueries({ queryKey: queryKeys.auth.me() });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, token, isUserLoading, user, queryClient, updateToken]);

  return { user, isUserLoading, refetch };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const { token, isInitialized, updateToken } = useTokenState();
  const { user, isUserLoading, refetch: refetchUser } = useCurrentUser(token, isInitialized, updateToken);

  const login = useCallback(async (credentials: LoginDto) => {
    const response = await authApi.login(credentials);
    updateToken(response.token);
    queryClient.setQueryData(queryKeys.auth.me(), response.user);
  }, [queryClient, updateToken]);

  const register = useCallback(async (data: RegisterDto) => {
    const response = await authApi.register(data);
    updateToken(response.token);
    queryClient.setQueryData(queryKeys.auth.me(), response.user);
  }, [queryClient, updateToken]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch { /* Ignore logout errors */ }
    finally {
      updateToken(null);
      queryClient.setQueryData(queryKeys.auth.me(), null);
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    }
  }, [queryClient, updateToken]);

  const getUser = useCallback(async (): Promise<User | null> => {
    if (!token) return null;
    try {
      const response = await authApi.getCurrentUser();
      queryClient.setQueryData(queryKeys.auth.me(), response.user);
      return response.user;
    } catch { return null; }
  }, [token, queryClient]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try { await refetchUser(); }
    catch { await logout(); }
  }, [token, refetchUser, logout]);

  const contextValue = useMemo(() => ({
    user: user ?? null,
    token,
    isAuthenticated: !!token && !!user,
    isLoading: !isInitialized || (!!token && isUserLoading),
    login,
    register,
    logout,
    getUser,
    refreshUser,
  }), [user, token, isInitialized, isUserLoading, login, register, logout, getUser, refreshUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
