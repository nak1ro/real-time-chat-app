// Moderation action types matching API docs
export type ModerationAction = 'MUTE_USER' | 'KICK_USER' | 'BAN_USER' | 'DELETE_MESSAGE';

// Mute status object from API
export interface MuteStatus {
  id: string;
  conversationId: string;
  userId: string;
  expiresAt: Date | null;
  createdAt: Date;
}

// Request DTO for applying moderation action
export interface ApplyModerationData {
  action: ModerationAction;
  targetUserId?: string;
  messageId?: string;
  reason?: string;
  expiresAt?: string;
}

// Response types
export interface ModerationResponse {
  message: string;
}

export interface MuteStatusResponse {
  mute: MuteStatus | null;
}

// Legacy aliases for backward compatibility
export type ApplyModerationActionDto = ApplyModerationData;
export type ApplyModerationActionResponse = ModerationResponse;
export type ActiveMuteResponse = MuteStatusResponse;
