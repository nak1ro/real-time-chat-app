// Receipt API - handles message receipt/read status-related API calls
import { apiClient } from './api-client';
import type {
  MarkMessagesAsReadDto,
  MarkMessagesAsReadResponse,
  GetMessageReceiptsResponse,
  ConversationUnreadCountResponse,
} from '@/types';

export const receiptApi = {
  // Mark messages as read in a conversation
  markMessagesAsRead: (conversationId: string, data: MarkMessagesAsReadDto) => {
    return apiClient.post<MarkMessagesAsReadResponse>(`/messages/conversations/${conversationId}/read`, data);
  },

  // Get message read statistics
  getMessageReadStats: (messageId: string) => {
    return apiClient.get<GetMessageReceiptsResponse>(`/messages/messages/${messageId}/receipts`);
  },

  // Get unread count for a conversation
  getUnreadCount: (conversationId: string) => {
    return apiClient.get<ConversationUnreadCountResponse>(`/messages/conversations/${conversationId}/unread`);
  },
};

