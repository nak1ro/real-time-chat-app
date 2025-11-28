import { AttachmentType, MessageDeliveryStatus, Status } from './enums';
import { UserBasic } from './user.types';

// Message User (includes status for presence display)
export interface MessageUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  status: Status | null;
}

// Attachment
export interface Attachment {
  id: string;
  messageId: string;
  url: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  type: AttachmentType;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  thumbnailUrl: string | null;
  createdAt: Date;
}

// Attachment Upload Data
export interface AttachmentUploadData {
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

// Reply-To Message (minimal info)
export interface MessageReplyTo {
  id: string;
  text: string;
  userId: string;
  createdAt: Date;
  user: UserBasic;
}

// Message Receipt
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

// Message Reaction
export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  messageId: string;
  createdAt: Date;
  user: UserBasic;
}

// Grouped Reactions (by emoji)
export interface GroupedReaction {
  emoji: string;
  count: number;
  users: UserBasic[];
  hasCurrentUser: boolean;
}

// Message Mention
export interface MessageMention {
  id: string;
  messageId: string;
  userId: string;
  createdAt: Date;
}

// Message (full, matching backend MessageWithRelations)
export interface Message {
  id: string;
  text: string;
  createdAt: Date;
  isEdited: boolean;
  editedAt: Date | null;
  deletedAt: Date | null;
  userId: string;
  conversationId: string;
  replyToId: string | null;
  user?: MessageUser;
  replyTo?: MessageReplyTo | null;
  attachments?: Attachment[];
  reactions?: MessageReaction[];
  receipts?: MessageReceipt[];
  // mentions array returned by backend when fetching messages
  mentions?: MessageMention[];
  // mentionedUserIds returned by backend when creating a message
  mentionedUserIds?: string[];
  _count?: {
    receipts?: number;
  };
}

// Create Message DTO
export interface CreateMessageDto {
  conversationId: string;
  text: string;
  replyToId?: string;
  attachments?: AttachmentUploadData[];
}

// Create Message Response
export interface CreateMessageResponse {
  message: Message;
  mentionedUserIds?: string[];
}

// Edit Message DTO
export interface EditMessageDto {
  text: string;
}

// Paginated Messages Response
export interface PaginatedMessagesResponse {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

// Upload Attachment Response
export interface UploadAttachmentResponse {
  attachment: Attachment;
}
