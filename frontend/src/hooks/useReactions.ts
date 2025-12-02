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

import { MessagesQueryData } from './useMessages';

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
        onSuccess: (response, { messageId, emoji }) => {
            // We can't easily optimistically update here without the full reaction object or user info
            // But we can invalidate the message list to refetch
            // OR we can try to update if we have enough info.
            // For now, let's rely on the socket event which should follow shortly,
            // or just invalidate the message list.
            // Actually, the socket event is the source of truth for other users, but for the sender,
            // we might want immediate feedback.
            // However, since we are moving away from individual message reaction fetching,
            // we should invalidate the conversation messages list or update it.

            // Ideally we should wait for the socket event to update the UI to ensure consistency.
            // But to be responsive, we can assume success.

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

        // Update the message in the cache
        // We need to find the conversationId for this message if not provided.
        // But usually we are in a conversation context.
        // If conversationId is passed, use it.

        if (conversationId) {
            queryClient.setQueryData<MessagesQueryData>(
                queryKeys.messages.list(conversationId),
                (oldData) => {
                    if (!oldData) return oldData;

                    return {
                        ...oldData,
                        messages: oldData.messages.map((msg) => {
                            if (msg.id !== data.messageId) return msg;

                            // Update reactions
                            let reactions = msg.reactions || [];

                            // Check if this specific reaction (user + emoji) already exists
                            const existingIndex = reactions.findIndex(
                                r => r.userId === data.userId && r.emoji === data.emoji
                            );

                            if (data.action === 'added') {
                                if (existingIndex === -1) {
                                    // Add new reaction
                                    reactions = [...reactions, {
                                        id: `reaction-${data.messageId}-${data.userId}-${data.emoji}`,
                                        messageId: data.messageId,
                                        userId: data.userId,
                                        emoji: data.emoji,
                                        createdAt: new Date(),
                                        user: data.user, // Assuming data.user is sent with the event
                                    }];
                                }
                            } else if (data.action === 'removed') {
                                if (existingIndex !== -1) {
                                    // Remove reaction
                                    reactions = reactions.filter((_, index) => index !== existingIndex);
                                }
                            }

                            return { ...msg, reactions };
                        }),
                    };
                }
            );
        } else {
            // If we don't have conversationId, we might need to iterate over all cached conversations
            // or just invalidate. But since we usually have it in the context where this hook is used...
            // For MessageReactions component, we might NOT have conversationId passed explicitly if it's just inside MessageBubble.
            // MessageBubble is inside MessageList which has conversationId.
            // But MessageReactions is a child.
            // We should pass conversationId to MessageReactions if possible, or use a context.
            // Alternatively, we can use `queryClient.setQueriesData` to update all message lists.

            queryClient.setQueriesData<MessagesQueryData>(
                { queryKey: queryKeys.messages.all },
                (oldData) => {
                    if (!oldData) return oldData;

                    // Check if this list contains the message
                    const msgExists = oldData.messages?.some(m => m.id === data.messageId);
                    if (!msgExists) return oldData;

                    return {
                        ...oldData,
                        messages: oldData.messages.map((msg) => {
                            if (msg.id !== data.messageId) return msg;

                            let reactions = msg.reactions || [];
                            const existingIndex = reactions.findIndex(
                                r => r.userId === data.userId && r.emoji === data.emoji
                            );

                            if (data.action === 'added') {
                                if (existingIndex === -1) {
                                    reactions = [...reactions, {
                                        id: `reaction-${data.messageId}-${data.userId}-${data.emoji}`,
                                        messageId: data.messageId,
                                        userId: data.userId,
                                        emoji: data.emoji,
                                        createdAt: new Date(),
                                        user: data.user,
                                    }];
                                }
                            } else if (data.action === 'removed') {
                                if (existingIndex !== -1) {
                                    reactions = reactions.filter((_, index) => index !== existingIndex);
                                }
                            }

                            return { ...msg, reactions };
                        }),
                    };
                }
            );
        }

        onReactionUpdated?.(data);
    }, [queryClient, messageId, conversationId, onReactionUpdated]);

    // Register socket listeners
    useEffect(() => {
        if (!socket || !isConnected) {
            return;
        }

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
