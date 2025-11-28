import { UserBasic } from './user.types';

// Notification types from API
export type NotificationType = 'MENTION' | 'REACTION' | 'MESSAGE' | 'SYSTEM';

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

// UI notification item for display
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  timestamp: Date;
  conversationId: string | null;
  messageId: string | null;
  isRead: boolean;
}

// Legacy aliases for backward compatibility
export type NotificationQueryOptions = NotificationQueryParams;
export type PaginatedNotificationsResponse = PaginatedNotifications;
export type UnreadCountResponse = NotificationUnreadCountResponse;
export type MarkAsReadResponse = NotificationResponse;
export type MarkAllAsReadResponse = MarkAllReadResponse;
export type MarkConversationAsReadResponse = MarkConversationReadResponse;
