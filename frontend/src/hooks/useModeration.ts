'use client';

import { useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { moderationApi } from '@/lib/api';
import { queryKeys } from '@/lib/react-query/query-keys';
import { useSocket } from '@/context/SocketContext';
import {
  SOCKET_EVENTS,
  createModerationListener,
  getSocket,
  isSocketConnected,
} from '@/lib/socket';
import { emitWithAck } from '@/lib/socket/emitWithAck';
import type { ApplyModerationData, ModerationResponse, MuteStatus } from '@/types';
import type { ModerationUpdatePayload } from '@/lib/socket/events';

// Helper to get current socket or throw
function getConnectedSocket() {
  const socket = getSocket();
  if (!socket || !isSocketConnected()) {
    throw new Error('Socket is not connected. Please check your connection and try again.');
  }
  return socket;
}

// Socket response type
interface ModerationSocketResponse {
  message: string;
}

// Hook to get mute status for a user in a conversation (Read operation - remains HTTP)
export function useMuteStatus(conversationId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['moderation', 'mutes', conversationId, userId],
    queryFn: () => moderationApi.getMuteStatus(conversationId!, userId!),
    enabled: !!conversationId && !!userId,
    staleTime: 30 * 1000,
  });
}

// Hook to apply a moderation action via WebSocket
export function useApplyModeration(options?: {
  onSuccess?: (response: ModerationResponse) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, data }: { conversationId: string; data: ApplyModerationData }): Promise<ModerationResponse> => {
      const socket = getConnectedSocket();

      console.log(`[useApplyModeration] Applying ${data.action} via socket for conversation ${conversationId}`);

      const response = await emitWithAck<
        {
          conversationId: string;
          action: string;
          targetUserId?: string;
          messageId?: string;
          reason?: string;
          expiresAt?: string;
        },
        ModerationSocketResponse
      >(socket, SOCKET_EVENTS.MODERATION_ACTION, {
        conversationId,
        action: data.action,
        targetUserId: data.targetUserId,
        messageId: data.messageId,
        reason: data.reason,
        expiresAt: data.expiresAt,
      });

      console.log(`[useApplyModeration] Action ${data.action} applied successfully`);

      return response;
    },
    onSuccess: (response, { conversationId, data }) => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.detail(conversationId) });

      if (data.targetUserId) {
        queryClient.invalidateQueries({ queryKey: ['moderation', 'mutes', conversationId, data.targetUserId] });
      }

      if (data.messageId || data.action === 'DELETE_MESSAGE') {
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.list(conversationId) });
      }

      options?.onSuccess?.(response);
    },
    onError: (error: Error) => {
      console.error('[useApplyModeration] Error:', error.message);
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

// Hook to listen for real-time moderation updates
export function useModerationSocketListeners({
  conversationId,
  onModerationUpdated,
}: {
  conversationId: string | undefined;
  onModerationUpdated?: (data: ModerationUpdatePayload) => void;
}) {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const handleModerationUpdated = useCallback((data: ModerationUpdatePayload) => {
    console.log('[useModerationSocketListeners] Moderation updated:', data);

    if (conversationId && data.conversationId === conversationId) {
      // Invalidate relevant queries based on action
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.detail(conversationId) });

      if (data.targetUserId) {
        queryClient.invalidateQueries({ queryKey: ['moderation', 'mutes', conversationId, data.targetUserId] });
      }

      if (data.action === 'DELETE_MESSAGE' || data.messageId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.list(conversationId) });
      }

      onModerationUpdated?.(data);
    }
  }, [conversationId, queryClient, onModerationUpdated]);

  useEffect(() => {
    if (!socket || !isConnected || !conversationId) {
      return;
    }

    console.log('[useModerationSocketListeners] Registering listeners for conversation:', conversationId);

    const cleanup = createModerationListener(socket, handleModerationUpdated);

    return () => {
      cleanup();
    };
  }, [socket, isConnected, conversationId, handleModerationUpdated]);
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
