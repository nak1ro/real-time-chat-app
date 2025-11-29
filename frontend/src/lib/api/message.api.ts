import { apiClient } from './api-client';
import type {
  PaginatedMessages,
  MessagePaginationOptions,
} from '@/types';

export const messageApi = {
   // Get messages in a conversation (paginated)
  list: (conversationId: string, options?: MessagePaginationOptions): Promise<PaginatedMessages> => {
    return apiClient.get<PaginatedMessages>(`/api/conversations/${conversationId}/messages`, {
      params: options as any,
    });
  },
};
