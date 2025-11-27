import { NotificationType } from './enums';
import { UserBasic } from './user.types';

// UI Notification Item (for display)
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

// Notification (from backend)
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  conversationId: string | null;
  messageId: string | null;
  actorId: string | null;
  createdAt: Date;
  readAt: Date | null;
  actor?: UserBasic | null;
}

// Paginated Notifications Response
export interface PaginatedNotificationsResponse {
  notifications: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

// Notification Query Options
export interface NotificationQueryOptions {
  limit?: number;
  cursor?: string;
  unreadOnly?: boolean;
}

// Unread Count Response
export interface UnreadCountResponse {
  unreadCount: number;
}

// Mark As Read Response
export interface MarkAsReadResponse {
  notification: Notification;
}

// Mark All As Read Response
export interface MarkAllAsReadResponse {
  message: string;
  count: number;
}

// Mark Conversation As Read Response
export interface MarkConversationAsReadResponse {
  message: string;
  count: number;
}
