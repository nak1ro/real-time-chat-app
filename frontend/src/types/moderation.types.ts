import { ModerationActionType } from './enums';

// Moderation Action
export interface ModerationAction {
  id: string;
  action: ModerationActionType;
  reason: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  actorId: string;
  targetUserId: string | null;
  conversationId: string | null;
  messageId: string | null;
}

// Apply Moderation Action DTO
export interface ApplyModerationActionDto {
  action: ModerationActionType;
  targetUserId?: string;
  messageId?: string;
  reason?: string;
  durationMinutes?: number;
}

// Apply Moderation Action Response
export interface ApplyModerationActionResponse {
  moderationAction: ModerationAction;
}

// Active Mute Response
export interface ActiveMuteResponse {
  mute: ModerationAction | null;
}
