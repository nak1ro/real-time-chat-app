'use client';

import {useEffect, useCallback} from 'react';
import {useMutation, useQuery, useQueryClient, useInfiniteQuery} from '@tanstack/react-query';
import {messageApi, attachmentApi, reactionApi, receiptApi} from '@/lib/api';
import {queryKeys} from '@/lib/react-query/query-keys';
import {useSocket} from '@/context/SocketContext';
import {
    SOCKET_EVENTS,
    createMessageListeners,
    createReactionListener,
    createReceiptListener,
    getSocket,
    isSocketConnected,
} from '@/lib/socket';
import {emitWithAck} from '@/lib/socket/emitWithAck';
import type {
    Message,
    CreateMessageData,
    EditMessageData,
    MessagePaginationOptions,
    BulkReceiptUpdate,
    UploadAttachmentResponse,
    ToggleReactionResponse,
} from '@/types';
import type {
    ReactionUpdatePayload,
    ReceiptUpdatePayload,
    BulkReceiptUpdate as SocketBulkReceiptUpdate,
} from '@/lib/socket/events';

// ============================================================================
// Query Hooks (HTTP - for initial data fetching and pagination)
// ============================================================================

// Hook to get messages for a conversation (paginated)
// Default sort order is 'asc' so oldest messages appear first, newest at bottom
export function useMessages(conversationId: string | undefined, options?: MessagePaginationOptions) {
    return useQuery({
        queryKey: queryKeys.messages.list(conversationId!),
        queryFn: () => messageApi.list(conversationId!, {sortOrder: 'asc', ...options}),
        enabled: !!conversationId,
        staleTime: 30 * 1000,
    });
}

// Hook to get messages with infinite scroll
// Default sort order is 'asc' so oldest messages appear first, newest at bottom
export function useInfiniteMessages(conversationId: string | undefined, options?: Omit<MessagePaginationOptions, 'cursor'>) {
    return useInfiniteQuery({
        queryKey: [...queryKeys.messages.list(conversationId!), 'infinite'],
        queryFn: ({pageParam}) => messageApi.list(conversationId!, {sortOrder: 'asc', ...options, cursor: pageParam}),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
        enabled: !!conversationId,
        staleTime: 30 * 1000,
    });
}

// Hook to get attachments for a message
export function useMessageAttachments(messageId: string | undefined) {
    return useQuery({
        queryKey: [...queryKeys.messages.detail(messageId!), 'attachments'],
        queryFn: () => attachmentApi.getForMessage(messageId!),
        enabled: !!messageId,
        staleTime: 5 * 60 * 1000,
    });
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

// Hook to get read statistics for a message
export function useMessageReadStats(messageId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.messages.receipts(messageId!),
        queryFn: () => receiptApi.getStats(messageId!),
        enabled: !!messageId,
        staleTime: 30 * 1000,
    });
}

// Hook to get unread count for a conversation
export function useUnreadCount(conversationId: string | undefined) {
    return useQuery({
        queryKey: [...queryKeys.conversations.detail(conversationId!), 'unread'],
        queryFn: () => receiptApi.getUnreadCount(conversationId!),
        enabled: !!conversationId,
        staleTime: 30 * 1000,
    });
}

// Hook to upload an attachment (remains HTTP - file uploads aren't suitable for WebSocket)
export function useUploadAttachment(options?: {
    onSuccess?: (response: UploadAttachmentResponse) => void;
    onError?: (error: Error) => void;
}) {
    return useMutation({
        mutationFn: (file: File) => attachmentApi.upload(file),
        onSuccess: (response: UploadAttachmentResponse) => {
            options?.onSuccess?.(response);
        },
        onError: (error: Error) => {
            options?.onError?.(error);
        },
    });
}

// ============================================================================
// Socket-based Mutation Hooks
// ============================================================================

// Socket response types (matching backend response structure)
interface SendMessageSocketResponse {
    message: Message & { mentionedUserIds?: string[] };
}

interface EditMessageSocketResponse {
    message: Message;
}

interface DeleteMessageSocketResponse {
    message: Message;
}

interface ToggleReactionSocketResponse {
    action: 'added' | 'removed';
}

interface MarkAsReadSocketResponse {
    messagesAffected: number;
    lastMessageId: string | null;
}

// Helper to get current socket or throw
function getConnectedSocket() {
    const socket = getSocket();
    if (!socket || !isSocketConnected()) {
        throw new Error('Socket is not connected. Please check your connection and try again.');
    }
    return socket;
}

// Hook to create a message via WebSocket
export function useCreateMessage(options?: {
    onSuccess?: (message: Message, mentionedUserIds?: string[]) => void;
    onError?: (error: Error) => void;
}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateMessageData): Promise<{ message: Message; mentionedUserIds?: string[] }> => {
            // Get current socket state (not stale closure)
            const socket = getConnectedSocket();

            console.log('[useCreateMessage] Sending message via socket:', {
                conversationId: data.conversationId,
                textLength: data.text.length,
            });

            const response = await emitWithAck<
                { conversationId: string; text: string; replyToId?: string },
                SendMessageSocketResponse
            >(socket, SOCKET_EVENTS.MESSAGE_SEND, {
                conversationId: data.conversationId,
                text: data.text,
                replyToId: data.replyToId,
            });

            console.log('[useCreateMessage] Message sent successfully:', response.message.id);

            // Extract mentionedUserIds from message object
            return {
                message: response.message,
                mentionedUserIds: response.message.mentionedUserIds,
            };
        },
        onSuccess: (response, variables) => {
            // Invalidate queries to refetch fresh data
            queryClient.invalidateQueries({queryKey: queryKeys.messages.list(variables.conversationId)});
            queryClient.invalidateQueries({queryKey: queryKeys.conversations.list()});
            options?.onSuccess?.(response.message, response.mentionedUserIds);
        },
        onError: (error: Error) => {
            console.error('[useCreateMessage] Error:', error.message);
            options?.onError?.(error);
        },
    });
}

// Hook to edit a message via WebSocket
export function useEditMessage(options?: {
    onSuccess?: (message: Message) => void;
    onError?: (error: Error) => void;
}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({id, data}: { id: string; data: EditMessageData }): Promise<Message> => {
            const socket = getConnectedSocket();

            console.log('[useEditMessage] Editing message via socket:', id);

            const response = await emitWithAck<
                { messageId: string; text: string },
                EditMessageSocketResponse
            >(socket, SOCKET_EVENTS.MESSAGE_EDIT, {
                messageId: id,
                text: data.text,
            });

            console.log('[useEditMessage] Message edited successfully:', response.message.id);

            return response.message;
        },
        onSuccess: (message) => {
            queryClient.invalidateQueries({queryKey: queryKeys.messages.list(message.conversationId)});
            options?.onSuccess?.(message);
        },
        onError: (error: Error) => {
            console.error('[useEditMessage] Error:', error.message);
            options?.onError?.(error);
        },
    });
}

// Hook to delete a message via WebSocket
export function useDeleteMessage(options?: {
    onSuccess?: (message: Message) => void;
    onError?: (error: Error) => void;
}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<Message> => {
            const socket = getConnectedSocket();

            console.log('[useDeleteMessage] Deleting message via socket:', id);

            const response = await emitWithAck<
                { messageId: string },
                DeleteMessageSocketResponse
            >(socket, SOCKET_EVENTS.MESSAGE_DELETE, {
                messageId: id,
            });

            console.log('[useDeleteMessage] Message deleted successfully:', response.message.id);

            return response.message;
        },
        onSuccess: (message) => {
            queryClient.invalidateQueries({queryKey: queryKeys.messages.list(message.conversationId)});
            options?.onSuccess?.(message);
        },
        onError: (error: Error) => {
            console.error('[useDeleteMessage] Error:', error.message);
            options?.onError?.(error);
        },
    });
}

// Hook to toggle a reaction on a message via WebSocket
export function useToggleReaction(options?: {
    onSuccess?: (response: ToggleReactionResponse) => void;
    onError?: (error: Error) => void;
}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({messageId, emoji}: {
            messageId: string;
            emoji: string
        }): Promise<ToggleReactionResponse> => {
            const socket = getConnectedSocket();

            console.log('[useToggleReaction] Toggling reaction via socket:', {messageId, emoji});

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
        onSuccess: (response, {messageId}) => {
            queryClient.invalidateQueries({queryKey: queryKeys.messages.reactions(messageId)});
            options?.onSuccess?.(response);
        },
        onError: (error: Error) => {
            console.error('[useToggleReaction] Error:', error.message);
            options?.onError?.(error);
        },
    });
}

// Hook to mark messages as read via WebSocket
export function useMarkAsRead(options?: {
    onSuccess?: (result: BulkReceiptUpdate) => void;
    onError?: (error: Error) => void;
}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({conversationId, upToMessageId}: {
            conversationId: string;
            upToMessageId: string
        }): Promise<BulkReceiptUpdate> => {
            const socket = getConnectedSocket();

            console.log('[useMarkAsRead] Marking messages as read via socket:', {conversationId, upToMessageId});

            const response = await emitWithAck<
                { conversationId: string; upToMessageId: string },
                MarkAsReadSocketResponse
            >(socket, SOCKET_EVENTS.RECEIPT_READ, {
                conversationId,
                upToMessageId,
            });

            console.log('[useMarkAsRead] Messages marked as read:', response.messagesAffected);

            return {
                conversationId,
                userId: '',
                lastReadMessageId: response.lastMessageId ?? upToMessageId,
                messagesAffected: response.messagesAffected,
                timestamp: new Date(),
            };
        },
        onSuccess: (result, {conversationId}) => {
            queryClient.invalidateQueries({queryKey: queryKeys.conversations.detail(conversationId)});
            queryClient.invalidateQueries({queryKey: queryKeys.notifications.unreadCount()});
            options?.onSuccess?.(result);
        },
        onError: (error: Error) => {
            console.error('[useMarkAsRead] Error:', error.message);
            options?.onError?.(error);
        },
    });
}

// ============================================================================
// Real-time Socket Listeners Hook
// ============================================================================

export interface UseMessageSocketListenersOptions {
    conversationId: string | undefined;
    onNewMessage?: (message: Message) => void;
    onMessageUpdated?: (message: Message) => void;
    onMessageDeleted?: (message: Message) => void;
    onReactionUpdated?: (data: ReactionUpdatePayload) => void;
    onReceiptUpdated?: (data: ReceiptUpdatePayload | SocketBulkReceiptUpdate) => void;
}

// Hook to listen for real-time message updates via WebSocket
export function useMessageSocketListeners({
                                              conversationId,
                                              onNewMessage,
                                              onMessageUpdated,
                                              onMessageDeleted,
                                              onReactionUpdated,
                                              onReceiptUpdated,
                                          }: UseMessageSocketListenersOptions) {
    const queryClient = useQueryClient();
    const {socket, isConnected} = useSocket();

    // Handle new message
    const handleNewMessage = useCallback((message: Message) => {
        console.log('[useMessageSocketListeners] New message received:', message.id, 'for conversation:', message.conversationId);

        // Only process messages for the current conversation
        if (conversationId && message.conversationId === conversationId) {
            queryClient.invalidateQueries({queryKey: queryKeys.messages.list(conversationId)});
            queryClient.invalidateQueries({queryKey: queryKeys.conversations.list()});
            onNewMessage?.(message);
        }
    }, [conversationId, queryClient, onNewMessage]);

    // Handle message updated
    const handleMessageUpdated = useCallback((message: Message) => {
        console.log('[useMessageSocketListeners] Message updated:', message.id);

        if (conversationId && message.conversationId === conversationId) {
            queryClient.invalidateQueries({queryKey: queryKeys.messages.list(conversationId)});
            onMessageUpdated?.(message);
        }
    }, [conversationId, queryClient, onMessageUpdated]);

    // Handle message deleted
    const handleMessageDeleted = useCallback((message: Message) => {
        console.log('[useMessageSocketListeners] Message deleted:', message.id);

        if (conversationId && message.conversationId === conversationId) {
            queryClient.invalidateQueries({queryKey: queryKeys.messages.list(conversationId)});
            onMessageDeleted?.(message);
        }
    }, [conversationId, queryClient, onMessageDeleted]);

    // Handle reaction updated
    const handleReactionUpdated = useCallback((data: ReactionUpdatePayload) => {
        console.log('[useMessageSocketListeners] Reaction updated:', data);

        queryClient.invalidateQueries({queryKey: queryKeys.messages.reactions(data.messageId)});
        onReactionUpdated?.(data);
    }, [queryClient, onReactionUpdated]);

    // Handle receipt updated
    const handleReceiptUpdated = useCallback((data: ReceiptUpdatePayload | SocketBulkReceiptUpdate) => {
        console.log('[useMessageSocketListeners] Receipt updated:', data);

        if ('messageId' in data) {
            queryClient.invalidateQueries({queryKey: queryKeys.messages.receipts(data.messageId)});
        }
        if (conversationId) {
            queryClient.invalidateQueries({queryKey: [...queryKeys.conversations.detail(conversationId), 'unread']});
        }
        onReceiptUpdated?.(data);
    }, [conversationId, queryClient, onReceiptUpdated]);

    // Register socket listeners
    useEffect(() => {
        if (!socket || !isConnected) {
            console.log('[useMessageSocketListeners] Socket not connected, skipping listener registration');
            return;
        }

        if (!conversationId) {
            console.log('[useMessageSocketListeners] No conversation selected, skipping listener registration');
            return;
        }

        console.log('[useMessageSocketListeners] Registering listeners for conversation:', conversationId);

        // Register message listeners
        const cleanupMessageListeners = createMessageListeners(socket, {
            onNew: handleNewMessage,
            onUpdated: handleMessageUpdated,
            onDeleted: handleMessageDeleted,
        });

        // Register reaction listener
        const cleanupReactionListener = createReactionListener(socket, handleReactionUpdated);

        // Register receipt listener
        const cleanupReceiptListener = createReceiptListener(socket, handleReceiptUpdated);

        // Cleanup on unmount or dependency change
        return () => {
            console.log('[useMessageSocketListeners] Cleaning up listeners for conversation:', conversationId);
            cleanupMessageListeners();
            cleanupReactionListener();
            cleanupReceiptListener();
        };
    }, [
        socket,
        isConnected,
        conversationId,
        handleNewMessage,
        handleMessageUpdated,
        handleMessageDeleted,
        handleReactionUpdated,
        handleReceiptUpdated,
    ]);
}

// ============================================================================
// Utility Hooks
// ============================================================================

// Utility hook combining all message operations
export function useMessageActions() {
    const createMessage = useCreateMessage();
    const editMessage = useEditMessage();
    const deleteMessage = useDeleteMessage();
    const uploadAttachment = useUploadAttachment();
    const toggleReaction = useToggleReaction();
    const markAsRead = useMarkAsRead();

    return {
        create: createMessage.mutate,
        createAsync: createMessage.mutateAsync,
        isCreating: createMessage.isPending,
        edit: editMessage.mutate,
        editAsync: editMessage.mutateAsync,
        isEditing: editMessage.isPending,
        delete: deleteMessage.mutate,
        deleteAsync: deleteMessage.mutateAsync,
        isDeleting: deleteMessage.isPending,
        uploadAttachment: uploadAttachment.mutate,
        uploadAttachmentAsync: uploadAttachment.mutateAsync,
        isUploading: uploadAttachment.isPending,
        toggleReaction: toggleReaction.mutate,
        toggleReactionAsync: toggleReaction.mutateAsync,
        isTogglingReaction: toggleReaction.isPending,
        markAsRead: markAsRead.mutate,
        markAsReadAsync: markAsRead.mutateAsync,
        isMarkingAsRead: markAsRead.isPending,
    };
}
