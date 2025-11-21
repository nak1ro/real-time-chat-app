import { Message, MessageReceipt, User, Conversation, Status } from '@prisma/client';

// Partial user info included with messages
export interface MessageUser {
    id: string;
    name: string;
    avatarUrl: string | null;
    status: Status | null;
}

// Reply-to message with minimal info
export interface MessageReplyTo {
    id: string;
    text: string;
    userId: string;
    createdAt: Date;
    user: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
}

// Message with full relations
export interface MessageWithRelations extends Message {
    user?: MessageUser;
    conversation?: Conversation;
    replyTo?: MessageReplyTo | null;
    receipts?: MessageReceipt[];
    _count?: {
        receipts?: number;
    };
}

// Input for creating a message
export interface CreateMessageData {
    userId: string;
    conversationId: string;
    text: string;
    replyToId?: string;
}

// Pagination options for message queries
export interface PaginationOptions {
    limit?: number;
    cursor?: string;
    sortOrder?: 'asc' | 'desc';
}

// Paginated message response
export interface PaginatedMessages {
    messages: MessageWithRelations[];
    nextCursor: string | null;
    hasMore: boolean;
    total?: number;
}
