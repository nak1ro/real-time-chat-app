'use client';

import {useEffect} from 'react';
import {useMutation, useQuery, useQueryClient, useInfiniteQuery, InfiniteData} from '@tanstack/react-query';
import {useRouter, usePathname} from 'next/navigation';
import {toast} from 'sonner';
import {notificationApi} from '@/lib/api';
import {queryKeys} from '@/lib/react-query/query-keys';
import {useSocket} from '@/hooks/useSocket';
import {createNotificationListeners} from '@/lib/socket/listeners';
import type {
    Notification,
    NotificationQueryParams,
    PaginatedNotifications,
    MarkAllReadResponse,
    MarkConversationReadResponse,
} from '@/types';
import {NotificationType} from '@/types/enums';

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
        queryFn: ({pageParam}) => notificationApi.list({...params, cursor: pageParam}),
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
            queryClient.invalidateQueries({queryKey: queryKeys.notifications.list()});
            queryClient.invalidateQueries({queryKey: queryKeys.notifications.unreadCount()});
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
            queryClient.invalidateQueries({queryKey: queryKeys.notifications.list()});
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
            queryClient.invalidateQueries({queryKey: queryKeys.notifications.list()});
            queryClient.invalidateQueries({queryKey: queryKeys.notifications.unreadCount()});
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

// Hook for real-time notification updates via Socket.IO
export function useNotificationSocket() {
    const queryClient = useQueryClient();
    const {socket, isConnected} = useSocket();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!socket || !isConnected) {
            console.log('[NOTIFICATION] Socket not ready:', {socket: !!socket, isConnected});
            return;
        }

        console.log('[NOTIFICATION] Socket connected and ready to receive notifications');

        // Handler for new notifications
        const handleNewNotification = (notification: Notification) => {
            console.log('[NOTIFICATION] Received new notification:', notification);

            // Update infinite query cache by prepending to first page
            queryClient.setQueriesData(
                {queryKey: [...queryKeys.notifications.list(), 'infinite']},
                (old: InfiniteData<PaginatedNotifications> | undefined) => {
                    if (!old) return old;

                    return {
                        ...old,
                        pages: old.pages.map((page, index) =>
                            index === 0
                                ? {
                                    ...page,
                                    notifications: [notification, ...page.notifications]
                                }
                                : page
                        ),
                    };
                }
            );

            // Invalidate regular list query
            queryClient.invalidateQueries({
                queryKey: queryKeys.notifications.list(),
                exact: false,
            });

            // Increment unread count
            queryClient.setQueryData(
                queryKeys.notifications.unreadCount(),
                (old: number | undefined) => (old ?? 0) + 1
            );

            // Show toast for NEW_MESSAGE notifications
            if (notification.type === NotificationType.NEW_MESSAGE && notification.conversationId) {
                console.log('[NOTIFICATION] Processing NEW_MESSAGE notification for conversation:', notification.conversationId);

                // Check if user is currently viewing this conversation
                const isViewingConversation = pathname?.includes(`/chats`) &&
                    pathname?.includes(notification.conversationId);

                console.log('[NOTIFICATION] Is viewing conversation?', isViewingConversation, 'pathname:', pathname);

                // Only show toast if NOT already viewing that conversation
                if (!isViewingConversation) {
                    console.log('[NOTIFICATION] Showing toast notification');
                    toast(notification.title, {
                        description: notification.body || 'Click to view message',
                        action: {
                            label: 'Open Chat',
                            onClick: () => {
                                router.push(`/chats?conversation=${notification.conversationId}`);
                            },
                        },
                        duration: 5000,
                    });
                } else {
                    console.log('[NOTIFICATION] Toast suppressed - user is viewing the conversation');
                }
            }
        };

        // Handler for count updates
        const handleCountUpdate = ({count}: { count: number }) => {
            queryClient.setQueryData(queryKeys.notifications.unreadCount(), count);
        };

        // Register listeners using the helper
        const cleanup = createNotificationListeners(socket, {
            onNew: handleNewNotification,
            onCountUpdated: handleCountUpdate,
        });

        return cleanup;
    }, [socket, isConnected, queryClient, router, pathname]);
}
