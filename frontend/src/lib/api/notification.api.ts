import { apiClient } from './api-client';
import type {
  Notification,
  NotificationQueryParams,
  PaginatedNotifications,
  NotificationResponse,
  NotificationUnreadCountResponse,
  MarkAllReadResponse,
  MarkConversationReadResponse,
} from '@/types';

export const notificationApi = {
  // Get notifications for current user (paginated)
  list: (params?: NotificationQueryParams): Promise<PaginatedNotifications> => {
    return apiClient.get<PaginatedNotifications>('/api/notifications', {
      params: params as any,
    });
  },

  // Get unread notification count
  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient
        .get<NotificationUnreadCountResponse>('/api/notifications/unread/count');
    return res.unreadCount;
  },

  // Mark a notification as read
  markAsRead: async (id: string): Promise<Notification> => {
    const res = await apiClient
        .patch<NotificationResponse>(`/api/notifications/${id}/read`);
    return res.notification;
  },

  // Mark all notifications as read
  markAllAsRead: (): Promise<MarkAllReadResponse> => {
    return apiClient.post<MarkAllReadResponse>('/api/notifications/read-all');
  },

  // Mark all notifications for a conversation as read
  markConversationAsRead: (conversationId: string): Promise<MarkConversationReadResponse> => {
    return apiClient.post<MarkConversationReadResponse>(
      `/api/conversations/${conversationId}/notifications/read`
    );
  },
};
