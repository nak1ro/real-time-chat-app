import { apiClient } from './api-client';
import type { MentionQueryParams, PaginatedMentions } from '@/types';

export const mentionApi = {
  // Get all mentions for the current user (paginated)
  list: (params?: MentionQueryParams): Promise<PaginatedMentions> => {
    return apiClient.get<PaginatedMentions>('/api/mentions', {
      params: params as any,
    });
  },
};
