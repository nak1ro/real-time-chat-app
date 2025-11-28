'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { moderationApi } from '@/lib/api';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { ApplyModerationData, ModerationResponse, MuteStatus } from '@/types';

// Hook to get mute status for a user in a conversation
export function useMuteStatus(conversationId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['moderation', 'mutes', conversationId, userId],
    queryFn: () => moderationApi.getMuteStatus(conversationId!, userId!),
    enabled: !!conversationId && !!userId,
    staleTime: 30 * 1000,
  });
}

// Hook to apply a moderation action
export function useApplyModeration(options?: {
  onSuccess?: (response: ModerationResponse) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, data }: { conversationId: string; data: ApplyModerationData }) =>
      moderationApi.applyAction(conversationId, data),
    onSuccess: (response, { conversationId, data }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.detail(conversationId) });
      if (data.targetUserId) {
        queryClient.invalidateQueries({ queryKey: ['moderation', 'mutes', conversationId, data.targetUserId] });
      }
      if (data.messageId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.list(conversationId) });
      }
      options?.onSuccess?.(response);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Hook to mute a user
export function useMuteUser(options?: {
  onSuccess?: (response: ModerationResponse) => void;
  onError?: (error: Error) => void;
}) {
  const applyModeration = useApplyModeration(options);

  return {
    mute: (conversationId: string, userId: string, reason?: string, expiresAt?: string) =>
      applyModeration.mutate({
        conversationId,
        data: { action: 'MUTE_USER', targetUserId: userId, reason, expiresAt },
      }),
    muteAsync: (conversationId: string, userId: string, reason?: string, expiresAt?: string) =>
      applyModeration.mutateAsync({
        conversationId,
        data: { action: 'MUTE_USER', targetUserId: userId, reason, expiresAt },
      }),
    isPending: applyModeration.isPending,
    isError: applyModeration.isError,
    error: applyModeration.error,
  };
}

// Hook to kick a user
export function useKickUser(options?: {
  onSuccess?: (response: ModerationResponse) => void;
  onError?: (error: Error) => void;
}) {
  const applyModeration = useApplyModeration(options);

  return {
    kick: (conversationId: string, userId: string, reason?: string) =>
      applyModeration.mutate({
        conversationId,
        data: { action: 'KICK_USER', targetUserId: userId, reason },
      }),
    kickAsync: (conversationId: string, userId: string, reason?: string) =>
      applyModeration.mutateAsync({
        conversationId,
        data: { action: 'KICK_USER', targetUserId: userId, reason },
      }),
    isPending: applyModeration.isPending,
    isError: applyModeration.isError,
    error: applyModeration.error,
  };
}

// Hook to ban a user
export function useBanUser(options?: {
  onSuccess?: (response: ModerationResponse) => void;
  onError?: (error: Error) => void;
}) {
  const applyModeration = useApplyModeration(options);

  return {
    ban: (conversationId: string, userId: string, reason?: string) =>
      applyModeration.mutate({
        conversationId,
        data: { action: 'BAN_USER', targetUserId: userId, reason },
      }),
    banAsync: (conversationId: string, userId: string, reason?: string) =>
      applyModeration.mutateAsync({
        conversationId,
        data: { action: 'BAN_USER', targetUserId: userId, reason },
      }),
    isPending: applyModeration.isPending,
    isError: applyModeration.isError,
    error: applyModeration.error,
  };
}

// Hook to delete a message via moderation
export function useDeleteMessageModeration(options?: {
  onSuccess?: (response: ModerationResponse) => void;
  onError?: (error: Error) => void;
}) {
  const applyModeration = useApplyModeration(options);

  return {
    deleteMessage: (conversationId: string, messageId: string, reason?: string) =>
      applyModeration.mutate({
        conversationId,
        data: { action: 'DELETE_MESSAGE', messageId, reason },
      }),
    deleteMessageAsync: (conversationId: string, messageId: string, reason?: string) =>
      applyModeration.mutateAsync({
        conversationId,
        data: { action: 'DELETE_MESSAGE', messageId, reason },
      }),
    isPending: applyModeration.isPending,
    isError: applyModeration.isError,
    error: applyModeration.error,
  };
}

// Utility hook combining all moderation operations
export function useModerationActions() {
  const applyModeration = useApplyModeration();

  return {
    applyAction: applyModeration.mutate,
    applyActionAsync: applyModeration.mutateAsync,
    isPending: applyModeration.isPending,
    isError: applyModeration.isError,
    error: applyModeration.error,
  };
}

