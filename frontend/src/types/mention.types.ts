import { Message } from './message.types';

// Full mention object from API
export interface Mention {
  id: string;
  messageId: string;
  userId: string;
  mentionedUserId: string;
  createdAt: Date;
  message?: Message;
}

// Query parameters for listing mentions
export interface MentionQueryParams {
  limit?: number;
  cursor?: string;
}

// Paginated mentions response
export interface PaginatedMentions {
  mentions: Mention[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Legacy aliases for backward compatibility
export type MentionWithMessage = Mention;
export type MentionQueryOptions = MentionQueryParams;
export type PaginatedMentionsResponse = PaginatedMentions;
