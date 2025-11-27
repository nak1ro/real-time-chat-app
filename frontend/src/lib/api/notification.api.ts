// Notification API - handles notification-related API calls
import { apiClient } from './api-client';
import type {
  PaginatedNotificationsResponse,
  NotificationQueryOptions,
  UnreadCountResponse,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
  MarkConversationAsReadResponse,
} from '@/types';

export const notificationApi = {
  // Get user notifications (paginated)
  getUserNotifications: (options?: NotificationQueryOptions) => {
    return apiClient.get<PaginatedNotificationsResponse>('/api/messages/notifications', {
      params: options as any,
    });
  },

  // Get unread notification count
  getUnreadNotificationCount: () => {
    return apiClient.get<UnreadCountResponse>('/api/messages/notifications/unread/count');
  },

  // Mark notification as read
  markAsRead: (notificationId: string) => {
    return apiClient.patch<MarkAsReadResponse>(`/api/messages/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    return apiClient.post<MarkAllAsReadResponse>('/api/messages/notifications/read-all');
  },

  // Mark conversation notifications as read
  markConversationAsRead: (conversationId: string) => {
    return apiClient.post<MarkConversationAsReadResponse>(`/api/messages/conversations/${conversationId}/notifications/read`);
  },
};

