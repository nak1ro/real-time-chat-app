'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { User, UpdateUserData, UserPresence } from '@/types';

// Hook to get a user by ID
export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.detail(id!),
    queryFn: () => userApi.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to search users
export function useUserSearch(query: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? query.length >= 2;

  return useQuery({
    queryKey: queryKeys.users.search(query),
    queryFn: () => userApi.search({ query }),
    enabled,
    staleTime: 30 * 1000,
  });
}

// Hook to update current user profile
export function useUpdateProfile(options?: {
  onSuccess?: (user: User) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserData) => userApi.updateMe(data),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.me(), user);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(user.id) });
      options?.onSuccess?.(user);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Hook to get user presence
export function useUserPresence(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.presence(userId!),
    queryFn: () => userApi.getPresence(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// Hook to get bulk user presences
export function useBulkPresence(userIds: string[], options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? userIds.length > 0;

  return useQuery({
    queryKey: ['users', 'presence', 'bulk', userIds],
    queryFn: () => userApi.getBulkPresence({ userIds }),
    enabled,
    staleTime: 30 * 1000,
  });
}

// Hook to send presence heartbeat
export function useHeartbeat(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: () => userApi.sendHeartbeat(),
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Hook to check permission
export function usePermissionCheck(
  conversationId: string | undefined,
  action: 'sendMessage' | 'manageMembers' | 'moderateMessage',
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? !!conversationId;

  return useQuery({
    queryKey: ['users', 'permissions', conversationId, action],
    queryFn: () => userApi.checkPermission({ conversationId: conversationId!, action }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// Utility hook combining user operations
export function useUserActions() {
  const updateProfile = useUpdateProfile();
  const heartbeat = useHeartbeat();

  return {
    updateProfile: updateProfile.mutate,
    updateProfileAsync: updateProfile.mutateAsync,
    isUpdatingProfile: updateProfile.isPending,
    sendHeartbeat: heartbeat.mutate,
    sendHeartbeatAsync: heartbeat.mutateAsync,
    isSendingHeartbeat: heartbeat.isPending,
  };
}

