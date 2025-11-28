import { MessageDeliveryStatus } from './enums';
import { UserBasic } from './user.types';

// Receipt with user info
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

// User who read a message
export interface ReadByUser {
  userId: string;
  userName: string;
  seenAt: Date | null;
}

// Message read statistics
export interface MessageReadStats {
  messageId: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  readBy: ReadByUser[];
}

// Request DTO for marking messages as read
export interface MarkAsReadData {
  upToMessageId: string;
}

// Response from marking messages as read
export interface BulkReceiptUpdate {
  conversationId: string;
  userId: string;
  lastReadMessageId: string;
  messagesAffected: number;
  timestamp: Date;
}

// Unread count response
export interface UnreadCountResponse {
  unreadCount: number;
}

// Legacy aliases for backward compatibility
export type MarkMessagesAsReadDto = MarkAsReadData;
export type MarkMessagesAsReadResponse = BulkReceiptUpdate;
export type ConversationUnreadCountResponse = UnreadCountResponse & { conversationId: string };
export type GetMessageReceiptsResponse = { stats: MessageReadStats };
