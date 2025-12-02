'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { messageApi, attachmentApi, receiptApi } from '@/lib/api';
import { queryKeys } from '@/lib/react-query/query-keys';
import { useSocket } from '@/context/SocketContext';
import {
    SOCKET_EVENTS,
    createMessageListeners,
    createReceiptListener,
    getSocket,
    isSocketConnected,
} from '@/lib/socket';
import { emitWithAck } from '@/lib/socket/emitWithAck';
import {
    type Message,
    type CreateMessageData,
    type EditMessageData,
    type MessagePaginationOptions,
    type BulkReceiptUpdate,
    type UploadAttachmentResponse,
    type AttachmentData,
    MessageDeliveryStatus,
} from '@/types';
import type {
    ReceiptUpdatePayload,
    BulkReceiptUpdate as SocketBulkReceiptUpdate,
} from '@/lib/socket/events';
import { updateMessageReceipt } from "@/lib/utils/receiptHelpers";

// Helper type for the messages query data structure
export interface MessagesQueryData {
    messages: Message[];
    nextCursor: string | null;
    hasMore: boolean;
    total?: number;
}

// Hook to get messages for a conversation (paginated)
export function useMessages(conversationId: string | undefined, options?: MessagePaginationOptions) {
    return useQuery({
        queryKey: queryKeys.messages.list(conversationId!),
        queryFn: () => messageApi.list(conversationId!, { sortOrder: 'asc', ...options }),
        enabled: !!conversationId,
    });
}

// Hook to get messages with infinite scroll
export function useInfiniteMessages(conversationId: string | undefined, options?: Omit<MessagePaginationOptions, 'cursor'>) {
    return useInfiniteQuery({
        queryKey: [...queryKeys.messages.list(conversationId!), 'infinite'],
        queryFn: ({ pageParam }) => messageApi.list(conversationId!, { sortOrder: 'asc', ...options, cursor: pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
        enabled: !!conversationId,
    });
}

// Hook to get attachments for a message
export function useMessageAttachments(messageId: string | undefined) {
    return useQuery({
        queryKey: [...queryKeys.messages.detail(messageId!), 'attachments'],
        queryFn: () => attachmentApi.getForMessage(messageId!),
        enabled: !!messageId,
    });
}

// Hook to get read statistics for a message
export function useMessageReadStats(messageId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.messages.receipts(messageId!),
        queryFn: () => receiptApi.getStats(messageId!),
        enabled: !!messageId,
    });
}

// Hook to get unread count for a conversation
export function useUnreadCount(conversationId: string | undefined) {
    return useQuery({
        queryKey: [...queryKeys.conversations.detail(conversationId!), 'unread'],
        queryFn: () => receiptApi.getUnreadCount(conversationId!),
        enabled: !!conversationId,
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

// Helper to optimistically add a message to the cache
function addMessageToCache(
    queryClient: ReturnType<typeof useQueryClient>,
    conversationId: string,
    message: Message
) {
    queryClient.setQueryData<MessagesQueryData>(
        queryKeys.messages.list(conversationId),
        (oldData) => {
            if (!oldData) {
                return {
                    messages: [message],
                    nextCursor: null,
                    hasMore: false,
                };
            }

            // Check if message already exists (deduplication)
            const exists = oldData.messages.some(msg => msg.id === message.id);
            if (exists) {
                console.log('[addMessageToCache] Message already exists, skipping:', message.id);
                return oldData;
            }

            return {
                ...oldData,
                messages: [...oldData.messages, message],
                total: oldData.total ? oldData.total + 1 : undefined,
            };
        }
    );
}

// Helper to optimistically update a message in the cache
function updateMessageInCache(
    queryClient: ReturnType<typeof useQueryClient>,
    conversationId: string,
    messageId: string,
    updates: Partial<Message>
) {
    queryClient.setQueryData<MessagesQueryData>(
        queryKeys.messages.list(conversationId),
        (oldData) => {
            if (!oldData) return oldData;

            return {
                ...oldData,
                messages: oldData.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                ),
            };
        }
    );
}

// Hook to create a message via WebSocket with optimistic updates
export function useCreateMessage(options?: {
    onSuccess?: (message: Message, mentionedUserIds?: string[]) => void;
    onError?: (error: Error) => void;
}) {
    const queryClient = useQueryClient();
    const lastSentMessageIdRef = useRef<string | null>(null);

    return useMutation({
        mutationFn: async (data: CreateMessageData): Promise<{ message: Message; mentionedUserIds?: string[] }> => {
            const socket = getConnectedSocket();

            console.log('[useCreateMessage] Sending message via socket:', {
                conversationId: data.conversationId,
                textLength: data.text.length,
                attachmentsCount: data.attachments?.length ?? 0,
            });

            const response = await emitWithAck<
                { conversationId: string; text: string; replyToId?: string; attachments?: AttachmentData[] },
                SendMessageSocketResponse
            >(socket, SOCKET_EVENTS.MESSAGE_SEND, {
                conversationId: data.conversationId,
                text: data.text,
                replyToId: data.replyToId,
                attachments: data.attachments,
            });

            console.log('[useCreateMessage] Message sent successfully:', response.message.id);

            // Store the message ID to prevent duplicate processing in socket listener
            lastSentMessageIdRef.current = response.message.id;

            return {
                message: response.message,
                mentionedUserIds: response.message.mentionedUserIds,
            };
        },
        onSuccess: (response, variables) => {
            // Optimistically add the message to cache
            addMessageToCache(queryClient, variables.conversationId, response.message);

            // Update conversation list to show latest message
            queryClient.invalidateQueries({ queryKey: queryKeys.conversations.list() });

            options?.onSuccess?.(response.message, response.mentionedUserIds);
        },
        onError: (error: Error) => {
            console.error('[useCreateMessage] Error:', error.message);
            options?.onError?.(error);
        },
    });
}

// Hook to edit a message via WebSocket with optimistic updates
export function useEditMessage(options?: {
    onSuccess?: (message: Message) => void;
    onError?: (error: Error) => void;
}) {
    const queryClient = useQueryClient();
    const lastEditedMessageIdRef = useRef<string | null>(null);

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: EditMessageData }): Promise<Message> => {
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

            // Store the message ID to prevent duplicate processing in socket listener
            lastEditedMessageIdRef.current = response.message.id;

            return response.message;
        },
        onSuccess: (message) => {
            // Update cache with server response (in case of any differences)
            updateMessageInCache(queryClient, message.conversationId, message.id, message);
            options?.onSuccess?.(message);
        },
        onError: (error: Error, variables) => {
            console.error('[useEditMessage] Error:', error.message);
            // Revert optimistic update on error
            queryClient.invalidateQueries({ queryKey: queryKeys.messages.list(variables.id) });
            options?.onError?.(error);
        },
    });
}

// Hook to delete a message via WebSocket with optimistic updates
export function useDeleteMessage(options?: {
    onSuccess?: (message: Message) => void;
    onError?: (error: Error) => void;
}) {
    const queryClient = useQueryClient();
    const lastDeletedMessageIdRef = useRef<string | null>(null);

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

            // Store the message ID to prevent duplicate processing in socket listener
            lastDeletedMessageIdRef.current = response.message.id;

            return response.message;
        },
        onSuccess: (message) => {
            // Optimistically update the cache to mark the message as deleted
            updateMessageInCache(queryClient, message.conversationId, message.id, {
                isDeleted: true,
                text: '',
            });

            // Update conversations list to reflect the change
            queryClient.invalidateQueries({ queryKey: queryKeys.conversations.list() });
            options?.onSuccess?.(message);
        },
        onError: (error: Error) => {
            console.error('[useDeleteMessage] Error:', error.message);
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
        mutationFn: async ({ conversationId, upToMessageId }: {
            conversationId: string;
            upToMessageId: string
        }): Promise<BulkReceiptUpdate> => {
            const socket = getConnectedSocket();

            console.log('[useMarkAsRead] Marking messages as read via socket:', { conversationId, upToMessageId });

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
        onSuccess: (result, { conversationId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.conversations.detail(conversationId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
            options?.onSuccess?.(result);
        },
        onError: (error: Error) => {
            console.error('[useMarkAsRead] Error:', error.message);
            options?.onError?.(error);
        },
    });
}

export interface UseMessageSocketListenersOptions {
    conversationId: string | undefined;
    onNewMessage?: (message: Message) => void;
    onMessageUpdated?: (message: Message) => void;
    onMessageDeleted?: (message: Message) => void;
    onReceiptUpdated?: (data: ReceiptUpdatePayload | SocketBulkReceiptUpdate) => void;
}

// Hook to listen for real-time message updates via WebSocket with deduplication
export function useMessageSocketListeners({
    conversationId,
    onNewMessage,
    onMessageUpdated,
    onMessageDeleted,
    onReceiptUpdated,
}: UseMessageSocketListenersOptions) {
    const queryClient = useQueryClient();
    const { socket, isConnected } = useSocket();

    // Handle new message with deduplication
    const handleNewMessage = useCallback((message: Message) => {
        console.log('[useMessageSocketListeners] New message received:', message.id, 'for conversation:', message.conversationId);

        // Only process messages for the current conversation
        if (conversationId && message.conversationId === conversationId) {
            // Check if message already exists in cache (deduplication)
            const existingData = queryClient.getQueryData<MessagesQueryData>(
                queryKeys.messages.list(conversationId)
            );

            const messageExists = existingData?.messages.some(msg => msg.id === message.id);

            if (messageExists) {
                console.log('[useMessageSocketListeners] Message already in cache, skipping:', message.id);
                return;
            }

            // Add new message to cache
            addMessageToCache(queryClient, conversationId, message);

            // Update conversation list
            queryClient.invalidateQueries({ queryKey: queryKeys.conversations.list() });

            onNewMessage?.(message);
        }
    }, [conversationId, queryClient, onNewMessage]);

    // Handle message updated with deduplication
    const handleMessageUpdated = useCallback((message: Message) => {
        console.log('[useMessageSocketListeners] Message updated:', message.id);

        if (conversationId && message.conversationId === conversationId) {
            // Update message in cache
            updateMessageInCache(queryClient, conversationId, message.id, message);
            onMessageUpdated?.(message);
        }
    }, [conversationId, queryClient, onMessageUpdated]);

    // Handle message deleted with deduplication
    const handleMessageDeleted = useCallback((message: Message) => {
        console.log('[useMessageSocketListeners] Message deleted:', message.id);

        if (conversationId && message.conversationId === conversationId) {
            // Update message in cache to show as deleted
            updateMessageInCache(queryClient, conversationId, message.id, {
                isDeleted: true,
                text: '',
            });
            onMessageDeleted?.(message);
        }
    }, [conversationId, queryClient, onMessageDeleted]);

    // Handle receipt updated
    const handleReceiptUpdated = useCallback((data: ReceiptUpdatePayload | SocketBulkReceiptUpdate) => {
        console.log('[useMessageSocketListeners] Receipt updated:', data);

        if (!conversationId) return;

        // Check if it's a single message update
        if ('messageId' in data && data.messageId) {
            // Update single message receipt in cache
            queryClient.setQueryData<MessagesQueryData>(
                queryKeys.messages.list(conversationId),
                (oldData) => {
                    if (!oldData) return oldData;

                    return {
                        ...oldData,
                        messages: oldData.messages.map((msg) => {
                            if (msg.id !== data.messageId) return msg;
                            return updateMessageReceipt(msg, data.userId, data.status, data.timestamp);
                        }),
                    };
                }
            );

            queryClient.invalidateQueries({ queryKey: queryKeys.messages.receipts(data.messageId) });
        }

        // Check if it's a bulk update (multiple messages)
        if ('lastReadMessageId' in data && data.lastReadMessageId) {
            // For bulk updates, manually update all affected messages in cache
            queryClient.setQueryData<MessagesQueryData>(
                queryKeys.messages.list(conversationId),
                (oldData) => {
                    if (!oldData) return oldData;
                    // Find the index of the last read message
                    const lastReadIndex = oldData.messages.findIndex(
                        (msg) => msg.id === data.lastReadMessageId
                    );
                    if (lastReadIndex === -1) {
                        console.warn('[handleReceiptUpdated] Last read message not found in cache');
                        return oldData;
                    }
                    // Update all messages up to and including the last read message
                    return {
                        ...oldData,
                        messages: oldData.messages.map((msg, index) => {
                            // Only update messages up to the last read message
                            if (index <= lastReadIndex) {
                                return updateMessageReceipt(
                                    msg,
                                    data.userId,
                                    MessageDeliveryStatus.READ,
                                    data.timestamp
                                );
                            }
                            return msg;
                        }),
                    };
                }
            );
        }

        if (conversationId) {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.conversations.detail(conversationId), 'unread'] });
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

        // Register receipt listener
        const cleanupReceiptListener = createReceiptListener(socket, handleReceiptUpdated);

        // Cleanup on unmount or dependency change
        return () => {
            console.log('[useMessageSocketListeners] Cleaning up listeners for conversation:', conversationId);
            cleanupMessageListeners();
            cleanupReceiptListener();
        };
    }, [
        socket,
        isConnected,
        conversationId,
        handleNewMessage,
        handleMessageUpdated,
        handleMessageDeleted,
        handleReceiptUpdated,
    ]);
}

// Utility hook combining all message operations
export function useMessageActions() {
    const createMessage = useCreateMessage();
    const editMessage = useEditMessage();
    const deleteMessage = useDeleteMessage();
    const uploadAttachment = useUploadAttachment();
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
        markAsRead: markAsRead.mutate,
        markAsReadAsync: markAsRead.mutateAsync,
        isMarkingAsRead: markAsRead.isPending,
    };
}