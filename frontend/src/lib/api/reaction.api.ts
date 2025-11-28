import { apiClient } from './api-client';
import type { ToggleReactionData, ToggleReactionResponse, ReactionsResponse, Reaction } from '@/types';

export const reactionApi = {
  // Toggle reaction on a message (add if not present, remove if present)
  toggle: (messageId: string, data: ToggleReactionData): Promise<ToggleReactionResponse> => {
    return apiClient.post<ToggleReactionResponse>(`/api/messages/${messageId}/reactions`, data);
  },

  // Get all reactions for a message
  getForMessage: (messageId: string): Promise<Reaction[]> => {
    return apiClient
      .get<ReactionsResponse>(`/api/messages/${messageId}/reactions`)
      .then((res) => res.reactions);
  },
};
