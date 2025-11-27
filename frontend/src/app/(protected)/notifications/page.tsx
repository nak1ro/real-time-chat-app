'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import {
  NotificationItem,
  NotificationSkeleton,
  NotificationEmpty,
  NotificationControls,
  mockNotifications,
  MESSAGE_NOTIFICATION_TYPES,
} from '@/components/notifications';
import type { NotificationItem as NotificationItemType } from '@/types/notification.types';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messagesOnly, setMessagesOnly] = useState(false);

  // Simulate loading notifications
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(mockNotifications);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Filter notifications based on toggle
  const filteredNotifications = useMemo(() => {
    if (!messagesOnly) {
      return notifications;
    }
    return notifications.filter((n) =>
      MESSAGE_NOTIFICATION_TYPES.includes(n.type)
    );
  }, [notifications, messagesOnly]);

  // Handle notification click - remove and navigate
  const handleNotificationClick = useCallback(
    (notification: NotificationItemType) => {
      // Remove notification from list
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));

      // Navigate to appropriate location
      if (notification.conversationId) {
        const url = notification.messageId
          ? `/chats?id=${notification.conversationId}&message=${notification.messageId}`
          : `/chats?id=${notification.conversationId}`;
        router.push(url);
      }
    },
    [router]
  );

  // Clear all notifications
  const handleClearAll = useCallback(() => {
    setNotifications([]);
  }, []);

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
          messagesOnly={messagesOnly}
          onMessagesOnlyChange={setMessagesOnly}
          onClearAll={handleClearAll}
          hasNotifications={notifications.length > 0}
        />
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <NotificationSkeleton count={5} />
        ) : filteredNotifications.length === 0 ? (
          <NotificationEmpty />
        ) : (
          <div className="divide-y divide-border">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
