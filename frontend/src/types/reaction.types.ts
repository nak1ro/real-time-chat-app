import { MessageReaction, GroupedReaction } from './message.types';

// Toggle Reaction DTO
export interface ToggleReactionDto {
  emoji: string;
}

// Toggle Reaction Response
export interface ToggleReactionResponse {
  action: 'added' | 'removed';
  reaction?: MessageReaction;
}

// Get Reactions Response
export interface GetReactionsResponse {
  reactions: MessageReaction[];
}

// Grouped Reactions Response (optional, for UI grouping)
export interface GroupedReactionsResponse {
  grouped: GroupedReaction[];
}
