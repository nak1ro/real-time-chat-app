import { MessageDeliveryStatus } from '@prisma/client';

// Receipt with user information
export interface ReceiptWithUser {
    id: string;
    messageId: string;
    userId: string;
    status: MessageDeliveryStatus;
    deliveredAt: Date | null;
    seenAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
}

// Receipt statistics for a message
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

// Receipt update payload for socket events
export interface ReceiptUpdatePayload {
    conversationId: string;
    messageId: string;
    userId: string;
    status: MessageDeliveryStatus;
    seenAt: Date | null;
    timestamp: Date;
}

// Bulk receipt update for marking multiple messages as read
export interface BulkReceiptUpdate {
    conversationId: string;
    userId: string;
    lastReadMessageId: string;
    messagesAffected: number;
    timestamp: Date;
}

