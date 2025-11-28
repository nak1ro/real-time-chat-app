import { Reaction } from './message.types';

// Request DTO for toggling reaction
export interface ToggleReactionData {
  emoji: string;
}

// Response from toggling reaction
export interface ToggleReactionResponse {
  action: 'added' | 'removed';
  reaction: Reaction | null;
}

// Response from getting reactions
export interface ReactionsResponse {
  reactions: Reaction[];
}

// Legacy aliases
export type ToggleReactionDto = ToggleReactionData;
export type GetReactionsResponse = ReactionsResponse;
