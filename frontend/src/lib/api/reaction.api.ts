import { apiClient } from './api-client';
import type { ToggleReactionData, ToggleReactionResponse } from '@/types';

// Backend returns aggregated format wrapped
interface AggregatedReactionsResponse {
  reactions: Record<string, string[]>;
}

// Simplified reaction type for aggregated response
export interface ReactionItem {
  emoji: string;
  userId: string;
}

export const reactionApi = {
  // Toggle reaction on a message (add if not present, remove if present)
  toggle: (messageId: string, data: ToggleReactionData): Promise<ToggleReactionResponse> => {
    return apiClient.post<ToggleReactionResponse>(`/api/messages/${messageId}/reactions`, data);
  },

  // Transforms aggregated backend response into flat array
  getForMessage: async (messageId: string): Promise<ReactionItem[]> => {
      const res = await apiClient
          .get<AggregatedReactionsResponse>(`/api/messages/${messageId}/reactions`);
      const aggregated = res.reactions || {};
      const reactions: ReactionItem[] = [];
      for (const [emoji, userIds] of Object.entries(aggregated)) {
          for (const userId of userIds) {
              reactions.push({emoji, userId});
          }
      }
      return reactions;
  },
};
