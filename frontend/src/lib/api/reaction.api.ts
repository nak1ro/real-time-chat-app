// Reaction API - handles message reaction-related API calls
import { apiClient } from './api-client';
import type {
  ToggleReactionDto,
  ToggleReactionResponse,
  GetReactionsResponse,
} from '@/types';

export const reactionApi = {
  // Toggle reaction (add or remove)
  toggleReaction: (messageId: string, data: ToggleReactionDto) => {
    return apiClient.post<ToggleReactionResponse>(`/api/messages/messages/${messageId}/reactions`, data);
  },

  // Get message reactions
  getMessageReactions: (messageId: string) => {
    return apiClient.get<GetReactionsResponse>(`/api/messages/messages/${messageId}/reactions`);
  },
};

