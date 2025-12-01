'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Loader2 } from 'lucide-react';
import {
  NotificationItem,
  NotificationSkeleton,
  NotificationEmpty,
  NotificationControls,
} from '@/components/notifications';
import {
  useInfiniteNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
} from '@/hooks/useNotifications';
import { MESSAGE_NOTIFICATION_TYPES } from '@/types/notification.types';
import type { Notification } from '@/types';
import { Button } from '@/components/ui';

export default function NotificationsPage() {
  const router = useRouter();

  // Fetch notifications with infinite scroll
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteNotifications();

  // Mark notification as read mutation
  const { mutate: markAsRead } = useMarkNotificationAsRead();

  // Mark all as read mutation
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();

  // Flatten paginated notifications
  const allNotifications = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.notifications);
  }, [data]);

  // Handle notification click - mark as read and navigate
  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      // Mark as read if not already read
      if (!notification.isRead) {
        markAsRead(notification.id);
      }

      // Navigate to appropriate location
      if (notification.conversationId) {
        const url = notification.messageId
          ? `/chats?conversation=${notification.conversationId}&message=${notification.messageId}`
          : `/chats?conversation=${notification.conversationId}`;
        router.push(url);
      }
    },
    [router, markAsRead]
  );

  // Clear all notifications
  const handleClearAll = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  // Convert backend Notification to NotificationItemType for display
  const notificationItems = useMemo(() => {
    return allNotifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      preview: notification.body,
      timestamp: new Date(notification.createdAt),
      conversationId: notification.conversationId ?? undefined,
      messageId: notification.messageId ?? undefined,
      actor: {
        id: notification.actor?.id ?? notification.actorId ?? 'unknown',
        name: notification.actor?.name ?? 'Unknown User',
        avatarUrl: notification.actor?.avatarUrl ?? null,
      },
    }));
  }, [allNotifications]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl md:text-2xl font-semibold">Notifications</h1>
        </div>

        {/* Controls */}
        <NotificationControls
          messagesOnly={false}
          onMessagesOnlyChange={() => {
          }} // TODO: Implement filtering
          onClearAll={handleClearAll}
          hasNotifications={allNotifications.length > 0}
        />
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <NotificationSkeleton count={5} />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <p className="text-destructive mb-2">Failed to load notifications</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        ) : notificationItems.length === 0 ? (
          <NotificationEmpty />
        ) : (
          <>
            <div className="divide-y divide-border">
              {notificationItems.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => {
                    // Find original notification to pass
                    const original = allNotifications.find(n => n.id === notification.id);
                    if (original) {
                      handleNotificationClick(original);
                    }
                  }}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="flex justify-center p-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
