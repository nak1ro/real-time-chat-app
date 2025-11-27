import { Message } from './message.types';

// Mention with Message
export interface MentionWithMessage {
  id: string;
  messageId: string;
  userId: string;
  createdAt: Date;
  message: Message;
}

// Paginated Mentions Response
export interface PaginatedMentionsResponse {
  mentions: MentionWithMessage[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

// Mention Query Options
export interface MentionQueryOptions {
  limit?: number;
  cursor?: string;
}
