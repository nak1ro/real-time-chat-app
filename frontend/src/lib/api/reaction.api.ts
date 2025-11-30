import { apiClient } from './api-client';
import type { ToggleReactionData, ToggleReactionResponse } from '@/types';

// Backend returns aggregated format wrapped: { reactions: { "👍": ["userId1", "userId2"], "❤️": ["userId3"] } }
interface AggregatedReactionsResponse {
  reactions: Record<string, string[]>;
}

// Simplified reaction type for aggregated response (only has emoji and userId)
export interface ReactionItem {
  emoji: string;
  userId: string;
}

export const reactionApi = {
  // Toggle reaction on a message (add if not present, remove if present)
  toggle: (messageId: string, data: ToggleReactionData): Promise<ToggleReactionResponse> => {
    return apiClient.post<ToggleReactionResponse>(`/api/messages/${messageId}/reactions`, data);
  },

  // Get all reactions for a message
  // Transforms aggregated backend response into flat array
  getForMessage: (messageId: string): Promise<ReactionItem[]> => {
    return apiClient
      .get<AggregatedReactionsResponse>(`/api/messages/${messageId}/reactions`)
      .then((res) => {
        const aggregated = res.reactions || {};
        const reactions: ReactionItem[] = [];
        for (const [emoji, userIds] of Object.entries(aggregated)) {
          for (const userId of userIds) {
            reactions.push({ emoji, userId });
          }
        }
        return reactions;
      });
  },
};
