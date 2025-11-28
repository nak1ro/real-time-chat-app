import { apiClient } from './api-client';
import type {
  Message,
  CreateMessageData,
  MessageResponse,
  EditMessageData,
  PaginatedMessages,
  MessagePaginationOptions,
} from '@/types';

export const messageApi = {
  // Create a new message in a conversation
  create: (data: CreateMessageData): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>('/api/messages', data);
  },

  // Get messages in a conversation (paginated)
  list: (conversationId: string, options?: MessagePaginationOptions): Promise<PaginatedMessages> => {
    return apiClient.get<PaginatedMessages>(`/api/conversations/${conversationId}/messages`, {
      params: options as any,
    });
  },

  // Edit a message
  edit: (id: string, data: EditMessageData): Promise<Message> => {
    return apiClient
      .patch<{ message: Message }>(`/api/messages/${id}`, data)
      .then((res) => res.message);
  },

  // Delete a message (soft delete)
  delete: (id: string): Promise<Message> => {
    return apiClient
      .delete<{ message: Message }>(`/api/messages/${id}`)
      .then((res) => res.message);
  },
};
