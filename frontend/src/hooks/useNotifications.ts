'use client';

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api';
import { queryKeys } from '@/lib/react-query/query-keys';
import type {
  Notification,
  NotificationQueryParams,
  PaginatedNotifications,
  MarkAllReadResponse,
  MarkConversationReadResponse,
} from '@/types';

// Hook to get notifications (paginated)
export function useNotifications(params?: NotificationQueryParams) {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => notificationApi.list(params),
    staleTime: 30 * 1000,
  });
}

// Hook to get notifications with infinite scroll
export function useInfiniteNotifications(params?: Omit<NotificationQueryParams, 'cursor'>) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.notifications.list(), 'infinite', params],
    queryFn: ({ pageParam }) => notificationApi.list({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 30 * 1000,
  });
}

// Hook to get unread notification count
export function useNotificationUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// Hook to mark a notification as read
export function useMarkNotificationAsRead(options?: {
  onSuccess?: (notification: Notification) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: (notification) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
      options?.onSuccess?.(notification);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Hook to mark all notifications as read
export function useMarkAllNotificationsAsRead(options?: {
  onSuccess?: (response: MarkAllReadResponse) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      queryClient.setQueryData(queryKeys.notifications.unreadCount(), 0);
      options?.onSuccess?.(response);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Hook to mark conversation notifications as read
export function useMarkConversationNotificationsAsRead(options?: {
  onSuccess?: (response: MarkConversationReadResponse) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => notificationApi.markConversationAsRead(conversationId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
      options?.onSuccess?.(response);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

// Utility hook combining all notification operations
export function useNotificationActions() {
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const markConversationAsRead = useMarkConversationNotificationsAsRead();

  return {
    markAsRead: markAsRead.mutate,
    markAsReadAsync: markAsRead.mutateAsync,
    isMarkingAsRead: markAsRead.isPending,
    markAllAsRead: markAllAsRead.mutate,
    markAllAsReadAsync: markAllAsRead.mutateAsync,
    isMarkingAllAsRead: markAllAsRead.isPending,
    markConversationAsRead: markConversationAsRead.mutate,
    markConversationAsReadAsync: markConversationAsRead.mutateAsync,
    isMarkingConversationAsRead: markConversationAsRead.isPending,
  };
}

