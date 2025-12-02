import { MessageDeliveryStatus, MessageReceipt } from '@prisma/client';

export interface ReceiptWithUser extends MessageReceipt {
    user: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
}

export interface MessageReadStats {
    messageId: string;
    totalRecipients: number;
    sentCount: number;
    readCount: number;
    readBy: Array<{
        userId: string;
        userName: string;
        seenAt: Date | null;
    }>;
}

export interface ReceiptUpdatePayload {
    conversationId: string;
    messageId: string;
    userId: string;
    status: MessageDeliveryStatus;
    seenAt: Date | null;
    timestamp: Date;
}

export interface BulkReceiptUpdate {
    conversationId: string;
    userId: string;
    lastReadMessageId: string;
    messagesAffected: number;
    timestamp: Date;
}
