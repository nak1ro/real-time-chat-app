'use client';

import { useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reactionApi } from '@/lib/api';
import { queryKeys } from '@/lib/react-query/query-keys';
import { useSocket } from '@/context/SocketContext';
import {
    SOCKET_EVENTS,
    createReactionListener,
    getSocket,
    isSocketConnected,
} from '@/lib/socket';
import { emitWithAck } from '@/lib/socket/emitWithAck';
import type { ToggleReactionResponse } from '@/types';
import type { ReactionUpdatePayload } from '@/lib/socket/events';

// Socket response types
interface ToggleReactionSocketResponse {
    action: 'added' | 'removed';
}

// Helper to get current socket or throw
function getConnectedSocket() {
    const socket = getSocket();
    if (!socket || !isSocketConnected()) {
        throw new Error('Socket is not connected. Please check your connection and try again.');
    }
    return socket;
}

// Hook to get reactions for a message
export function useMessageReactions(messageId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.messages.reactions(messageId!),
        queryFn: () => reactionApi.getForMessage(messageId!),
        enabled: !!messageId,
        staleTime: 30 * 1000,
    });
}

// Hook to toggle a reaction on a message via WebSocket
export function useToggleReaction(options?: {
    onSuccess?: (response: ToggleReactionResponse) => void;
    onError?: (error: Error) => void;
}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ messageId, emoji }: {
            messageId: string;
            emoji: string
        }): Promise<ToggleReactionResponse> => {
            const socket = getConnectedSocket();

            console.log('[useToggleReaction] Toggling reaction via socket:', { messageId, emoji });

            const response = await emitWithAck<
                { messageId: string; emoji: string },
                ToggleReactionSocketResponse
            >(socket, SOCKET_EVENTS.REACTION_TOGGLE, {
                messageId,
                emoji,
            });

            console.log('[useToggleReaction] Reaction toggled:', response.action);

            return {
                action: response.action,
                reaction: null,
            };
        },
        onSuccess: (response, { messageId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.messages.reactions(messageId) });
            options?.onSuccess?.(response);
        },
        onError: (error: Error) => {
            console.error('[useToggleReaction] Error:', error.message);
            options?.onError?.(error);
        },
    });
}

// Hook to listen for real-time reaction updates via WebSocket
export function useReactionSocketListeners({
    conversationId,
    messageId,
    onReactionUpdated,
}: {
    conversationId?: string;
    messageId?: string;
    onReactionUpdated?: (data: ReactionUpdatePayload) => void;
}) {
    const queryClient = useQueryClient();
    const { socket, isConnected } = useSocket();

    // Handle reaction updated
    const handleReactionUpdated = useCallback((data: ReactionUpdatePayload) => {
        console.log('[useReactionSocketListeners] Reaction updated:', data);

        // If messageId is provided, only process updates for that message
        if (messageId && data.messageId !== messageId) {
            return;
        }

        queryClient.invalidateQueries({ queryKey: queryKeys.messages.reactions(data.messageId) });
        onReactionUpdated?.(data);
    }, [queryClient, messageId, onReactionUpdated]);

    // Register socket listeners
    useEffect(() => {
        if (!socket || !isConnected) {
            return;
        }

        // If conversationId is provided, we might want to log it, but reactions are usually global or per-message
        // The backend broadcasts reaction updates to the conversation room, so we need to be joined to it.
        // Assuming the component using this is already inside a conversation context or the user has joined the conversation.

        const cleanupReactionListener = createReactionListener(socket, handleReactionUpdated);

        return () => {
            cleanupReactionListener();
        };
    }, [socket, isConnected, handleReactionUpdated]);
}

// Utility hook combining all reaction operations
export function useReactionActions() {
    const toggleReaction = useToggleReaction();

    return {
        toggleReaction: toggleReaction.mutate,
        toggleReactionAsync: toggleReaction.mutateAsync,
        isTogglingReaction: toggleReaction.isPending,
    };
}
