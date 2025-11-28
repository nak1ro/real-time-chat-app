import { NotificationType } from './enums';

// Full notification object from API
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  relatedMessageId: string | null;
  relatedConversationId: string | null;
  relatedUserId: string | null;
  createdAt: Date;
}

// Query parameters for listing notifications
export interface NotificationQueryParams {
  limit?: number;
  cursor?: string;
  unreadOnly?: boolean;
}

// Paginated notifications response
export interface PaginatedNotifications {
  notifications: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Response types
export interface NotificationResponse {
  notification: Notification;
}

export interface NotificationUnreadCountResponse {
  unreadCount: number;
}

export interface MarkAllReadResponse {
  message: string;
  count: number;
}

export interface MarkConversationReadResponse {
  message: string;
  count: number;
}

// UI notification item for display in components
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  preview?: string;
  timestamp: Date;
  conversationId?: string;
  messageId?: string;
  actor: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

// Message-related notification types for filtering
export const MESSAGE_NOTIFICATION_TYPES: NotificationType[] = [
  NotificationType.NEW_MESSAGE,
  NotificationType.MENTION,
  NotificationType.REACTION,
  NotificationType.REPLY,
];

// Legacy aliases for backward compatibility
export type NotificationQueryOptions = NotificationQueryParams;
export type PaginatedNotificationsResponse = PaginatedNotifications;
export type MarkAsReadResponse = NotificationResponse;
export type MarkAllAsReadResponse = MarkAllReadResponse;
export type MarkConversationAsReadResponse = MarkConversationReadResponse;

// Re-export the enum for convenience
export { NotificationType };
