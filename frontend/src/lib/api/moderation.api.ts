import { apiClient } from './api-client';
import type {
  ApplyModerationData,
  ModerationResponse,
  MuteStatus,
  MuteStatusResponse,
} from '@/types';

export const moderationApi = {
  // Apply moderation action to a user or message
  applyAction: (conversationId: string, data: ApplyModerationData): Promise<ModerationResponse> => {
    return apiClient.post<ModerationResponse>(`/api/conversations/${conversationId}/moderation`, data);
  },

  // Get active mute status for a user in a conversation
  getMuteStatus: async (conversationId: string, userId: string): Promise<MuteStatus | null> => {
    const res = await apiClient
        .get<MuteStatusResponse>(`/api/conversations/${conversationId}/moderation/mutes/${userId}`);
    return res.mute;
  },
};
