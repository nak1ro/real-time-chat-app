// Message API - handles message-related API calls
import { apiClient } from './api-client';
import type {
  Message,
  CreateMessageDto,
  CreateMessageResponse,
  EditMessageDto,
  PaginatedMessagesResponse,
  PaginationOptions,
} from '@/types';

export const messageApi = {
  // Create a new message
  createMessage: (data: CreateMessageDto) => {
    return apiClient.post<CreateMessageResponse>('/api/messages/messages', data);
  },

  // Get conversation messages (paginated)
  getConversationMessages: (conversationId: string, options?: PaginationOptions) => {
    return apiClient.get<PaginatedMessagesResponse>(`/api/messages/conversations/${conversationId}/messages`, {
      params: options as any,
    });
  },

  // Edit a message
  editMessage: (messageId: string, data: EditMessageDto) => {
    return apiClient.patch<{ message: Message }>(`/api/messages/messages/${messageId}`, data).then((res) => res.message);
  },

  // Delete a message (soft delete)
  deleteMessage: (messageId: string) => {
    return apiClient.delete<{ message: Message }>(`/api/messages/messages/${messageId}`).then((res) => res.message);
  },
};

