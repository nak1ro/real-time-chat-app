import { apiClient } from './api-client';
import type { MarkAsReadData, BulkReceiptUpdate, MessageReadStats, UnreadCountResponse } from '@/types';

export const receiptApi = {
  // Mark messages as read in a conversation
  markAsRead: (conversationId: string, data: MarkAsReadData): Promise<BulkReceiptUpdate> => {
    return apiClient.post<BulkReceiptUpdate>(`/api/conversations/${conversationId}/read`, data);
  },

  // Get read statistics for a message
  getStats: (messageId: string): Promise<MessageReadStats> => {
    return apiClient.get<MessageReadStats>(`/api/messages/${messageId}/receipts`);
  },

  // Get unread count for a conversation
  getUnreadCount: (conversationId: string): Promise<number> => {
    return apiClient
      .get<UnreadCountResponse>(`/api/conversations/${conversationId}/unread`)
      .then((res) => res.unreadCount);
  },
};
