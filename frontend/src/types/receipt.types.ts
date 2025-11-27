import { MessageDeliveryStatus } from './enums';
import { UserBasic } from './user.types';

// Receipt with User Info
export interface ReceiptWithUser {
  id: string;
  messageId: string;
  userId: string;
  status: MessageDeliveryStatus;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt: Date | null;
  seenAt: Date | null;
  user: UserBasic;
}

// Message Read Stats
export interface MessageReadStats {
  messageId: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  readBy: Array<{
    userId: string;
    userName: string;
    seenAt: Date | null;
  }>;
}

// Mark Messages As Read DTO
export interface MarkMessagesAsReadDto {
  lastReadMessageId: string;
}

// Mark Messages As Read Response
export interface MarkMessagesAsReadResponse {
  messagesAffected: number;
  timestamp: Date;
}

// Unread Count Response (for conversations)
export interface ConversationUnreadCountResponse {
  conversationId: string;
  unreadCount: number;
}

// Get Message Receipts Response
export interface GetMessageReceiptsResponse {
  stats: MessageReadStats;
}
