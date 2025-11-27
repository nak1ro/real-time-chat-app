// Mention API - handles message mention-related API calls
import { apiClient } from './api-client';
import type {
  PaginatedMentionsResponse,
  MentionQueryOptions,
} from '@/types';

export const mentionApi = {
  // Get user mentions (paginated)
  getUserMentions: (options?: MentionQueryOptions) => {
    return apiClient.get<PaginatedMentionsResponse>('/api/messages/mentions', {
      params: options as any,
    });
  },
};

