import { AttachmentType, MessageDeliveryStatus, Status } from './enums';
import { UserBasic } from './user.types';

// User info included in message responses
export interface MessageUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  status: Status | null;
}

// Attachment metadata for creating messages
export interface AttachmentData {
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  type: AttachmentType;
  width?: number;
  height?: number;
  durationMs?: number;
}

// Full attachment object from API
export interface Attachment {
  id: string;
  messageId: string;
  url: string;
  thumbnailUrl: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  type: AttachmentType;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  createdAt: Date;
}

// Minimal reply-to message info
export interface MessageReplyTo {
  id: string;
  text: string;
  userId: string;
  createdAt: Date;
  user: UserBasic;
}

// Message reaction object
export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
  user?: UserBasic;
}

// Grouped reactions by emoji for UI
export interface GroupedReaction {
  emoji: string;
  count: number;
  users: UserBasic[];
  hasCurrentUser: boolean;
}

// Message receipt object
export interface MessageReceipt {
  id: string;
  messageId: string;
  userId: string;
  status: MessageDeliveryStatus;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt: Date | null;
  seenAt: Date | null;
  user?: UserBasic;
}

// Message mention object
export interface MessageMention {
  id: string;
  messageId: string;
  userId: string;
  mentionedUserId: string;
  createdAt: Date;
  message?: Message;
}

// Full message object from API
export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  text: string;
  replyToId: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: MessageUser;
  replyTo?: MessageReplyTo | null;
  attachments?: Attachment[];
  reactions?: Reaction[];
  receipts?: MessageReceipt[];
  mentions?: MessageMention[];
  _count?: {
    receipts?: number;
  };
}

// Request DTO for creating messages
export interface CreateMessageData {
  conversationId: string;
  text: string;
  replyToId?: string;
  attachments?: AttachmentData[];
}

// Request DTO for editing messages
export interface EditMessageData {
  text: string;
}

// Pagination options for messages
export interface MessagePaginationOptions {
  limit?: number;
  cursor?: string;
  sortOrder?: 'asc' | 'desc';
}

// Paginated messages response
export interface PaginatedMessages {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

// Response types
export interface MessageResponse {
  message: Message;
  mentionedUserIds?: string[];
}

export interface AttachmentsResponse {
  attachments: Attachment[];
}

export interface UploadedAttachment {
  url: string;
  thumbnailUrl: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  type: string;
  width: number | null;
  height: number | null;
  durationMs: number | null;
}

export interface UploadAttachmentResponse {
  attachment: UploadedAttachment;
}

// Legacy aliases for backward compatibility
export type MessageReaction = Reaction;
export type CreateMessageDto = CreateMessageData;
export type EditMessageDto = EditMessageData;
export type PaginatedMessagesResponse = PaginatedMessages;
export type AttachmentUploadData = AttachmentData;
export type CreateMessageResponse = MessageResponse;
