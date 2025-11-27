// Moderation API - handles moderation-related API calls
import { apiClient } from './api-client';
import type {
  ApplyModerationActionDto,
  ApplyModerationActionResponse,
  ActiveMuteResponse,
} from '@/types';

export const moderationApi = {
  // Apply moderation action
  applyModerationAction: (conversationId: string, data: ApplyModerationActionDto) => {
    return apiClient.post<ApplyModerationActionResponse>(`/conversations/${conversationId}/moderation`, data);
  },

  // Get active mute for user
  getActiveMute: (conversationId: string, userId: string) => {
    return apiClient.get<ActiveMuteResponse>(`/conversations/${conversationId}/moderation/mutes/${userId}`);
  },
};

