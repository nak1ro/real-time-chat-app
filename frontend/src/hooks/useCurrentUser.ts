'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { queryKeys } from '@/lib/react-query/query-keys';
import { getToken } from '@/lib/auth/token-storage';
import type { User } from '@/types';

// Hook to get current user with React Query
export function useCurrentUser() {
  const token = getToken();

  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const { user } = await authApi.getCurrentUser();
      return user;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}

// Hook to invalidate and refetch current user
export function useRefreshCurrentUser() {
  const queryClient = useQueryClient();

  return () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
  };
}

// Hook to set current user data directly (for hydration after login)
export function useSetCurrentUser() {
  const queryClient = useQueryClient();

  return (user: User) => {
    queryClient.setQueryData(queryKeys.auth.me(), user);
  };
}

// Hook to clear current user data (for logout)
export function useClearCurrentUser() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.setQueryData(queryKeys.auth.me(), null);
    queryClient.removeQueries({ queryKey: queryKeys.auth.me() });
  };
}

