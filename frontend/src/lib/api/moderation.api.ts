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
  getMuteStatus: (conversationId: string, userId: string): Promise<MuteStatus | null> => {
    return apiClient
      .get<MuteStatusResponse>(`/api/conversations/${conversationId}/moderation/mutes/${userId}`)
      .then((res) => res.mute);
  },
};
