'use client';

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { messageApi, attachmentApi, reactionApi, receiptApi } from '@/lib/api';
import { queryKeys } from '@/lib/react-query/query-keys';
import type {
  Message,
  CreateMessageData,
  EditMessageData,
  MessagePaginationOptions,
  PaginatedMessages,
  Attachment,
  Reaction,
  MessageReadStats,
  BulkReceiptUpdate,
  UploadAttachmentResponse,
  ToggleReactionResponse,
} from '@/types';

// Hook to get messages for a conversation (paginated)
export function useMessages(conversationId: string | undefined, options?: MessagePaginationOptions) {
  return useQuery({
    queryKey: queryKeys.messages.list(conversationId!),
    queryFn: () => messageApi.list(conversationId!, options),
    enabled: !!conversationId,
    staleTime: 30 * 1000,
  });
}

// Hook to get messages with infinite scroll
export function useInfiniteMessages(conversationId: string | undefined, options?: Omit<MessagePaginationOptions, 'cursor'>) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.messages.list(conversationId!), 'infinite'],
    queryFn: ({ pageParam }) => messageApi.list(conversationId!, { ...options, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!conversationId,
    staleTime: 30 * 1000,
  });
}

// Hook to create a message
export function useCreateMessage(options?: {
  onSuccess?: (message: Message, mentionedUserIds?: string[]) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMessageData) => messageApi.create(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.list(variables.conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.list() });
      options?.onSuccess?.(response.message, response.mentionedUserIds);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Hook to edit a message
export function useEditMessage(options?: {
  onSuccess?: (message: Message) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditMessageData }) => messageApi.edit(id, data),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.list(message.conversationId) });
      options?.onSuccess?.(message);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Hook to delete a message
export function useDeleteMessage(options?: {
  onSuccess?: (message: Message) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => messageApi.delete(id),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.list(message.conversationId) });
      options?.onSuccess?.(message);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Hook to upload an attachment
export function useUploadAttachment(options?: {
  onSuccess?: (response: UploadAttachmentResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (file: File) => attachmentApi.upload(file),
    onSuccess: (response) => {
      options?.onSuccess?.(response);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
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

// Hook to toggle a reaction on a message
export function useToggleReaction(options?: {
  onSuccess?: (response: ToggleReactionResponse) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      reactionApi.toggle(messageId, { emoji }),
    onSuccess: (response, { messageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.reactions(messageId) });
      options?.onSuccess?.(response);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
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

// Hook to mark messages as read
export function useMarkAsRead(options?: {
  onSuccess?: (result: BulkReceiptUpdate) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, upToMessageId }: { conversationId: string; upToMessageId: string }) =>
      receiptApi.markAsRead(conversationId, { upToMessageId }),
    onSuccess: (result, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
      options?.onSuccess?.(result);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
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

