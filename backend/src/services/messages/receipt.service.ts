import { MessageDeliveryStatus } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { NotFoundError, AuthorizationError } from '../../middleware';
import { MessageReadStats, ReceiptWithUser } from '../../domain/receipt.types';
import { USER_SELECT, RECEIPT_INCLUDE_WITH_USER, buildReceiptTimestamps } from '../shared/service-constants';
import { verifyMembership } from '../../utils/validation-helpers';



// Helper Functions - Validation

// Verify user membership in conversation
const verifyUserIsMember = async (
    conversationId: string,
    userId: string
): Promise<void> => {
    await verifyMembership(userId, conversationId);
};

// Get and verify message exists
const getMessageOrThrow = async (messageId: string): Promise<{ conversationId: string }> => {
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { conversationId: true },
    });

    if (!message) {
        throw new NotFoundError('Message');
    }

    return message;
};

// Get target message and verify it belongs to conversation
const getTargetMessage = async (
    messageId: string,
    conversationId: string
): Promise<{ createdAt: Date }> => {
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { createdAt: true, conversationId: true },
    });

    if (!message) {
        throw new NotFoundError('Message');
    }

    if (message.conversationId !== conversationId) {
        throw new AuthorizationError('Message does not belong to this conversation');
    }

    return { createdAt: message.createdAt };
};

// Helper Functions - Data Retrieval

// Get conversation members excluding sender
const getConversationRecipients = async (
    conversationId: string,
    senderId: string
): Promise<string[]> => {
    const members = await prisma.conversationMember.findMany({
        where: {
            conversationId,
            userId: { not: senderId },
        },
        select: { userId: true },
    });

    return members.map((m) => m.userId);
};

// Get message IDs in conversation up to a specific point
const getMessageIdsUpTo = async (
    conversationId: string,
    targetCreatedAt: Date
): Promise<string[]> => {
    const messages = await prisma.message.findMany({
        where: {
            conversationId,
            createdAt: { lte: targetCreatedAt },
            deletedAt: null,
        },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
    });

    return messages.map((m) => m.id);
};

// Get all message IDs in conversation
const getAllMessageIds = async (conversationId: string): Promise<string[]> => {
    const messages = await prisma.message.findMany({
        where: {
            conversationId,
            deletedAt: null,
        },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
    });

    return messages.map((m) => m.id);
};

// Get message IDs based on optional target
const getMessageIdsInConversation = async (
    conversationId: string,
    upToMessageId?: string
): Promise<string[]> => {
    if (upToMessageId) {
        const targetMessage = await getTargetMessage(upToMessageId, conversationId);
        return await getMessageIdsUpTo(conversationId, targetMessage.createdAt);
    }

    return await getAllMessageIds(conversationId);
};

// Helper Functions - Receipt Operations



// Upsert a single receipt
const upsertReceipt = async (
    messageId: string,
    userId: string,
    status: MessageDeliveryStatus
): Promise<void> => {
    const timestamps = buildReceiptTimestamps(status);

    await prisma.messageReceipt.upsert({
        where: {
            messageId_userId: {
                messageId,
                userId,
            },
        },
        update: {
            status,
            ...timestamps,
            updatedAt: new Date(),
        },
        create: {
            messageId,
            userId,
            status,
            ...timestamps,
        },
    });
};

// Update last read message for conversation member
const updateLastReadMessage = async (
    conversationId: string,
    userId: string,
    messageId: string
): Promise<void> => {
    await prisma.conversationMember.update({
        where: {
            userId_conversationId: {
                userId,
                conversationId,
            },
        },
        data: {
            lastReadMessageId: messageId,
        },
    });
};

// Helper Functions - Statistics

// Calculate receipt statistics
const calculateReceiptStats = (
    receipts: Array<{
        status: MessageDeliveryStatus;
        userId: string;
        seenAt: Date | null;
        user: { name: string };
    }>
): {
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    readBy: Array<{ userId: string; userName: string; seenAt: Date | null }>;
} => {
    const stats = {
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        readBy: [] as Array<{ userId: string; userName: string; seenAt: Date | null }>,
    };

    for (const receipt of receipts) {
        switch (receipt.status) {
            case MessageDeliveryStatus.SENT:
                stats.sentCount++;
                break;
            case MessageDeliveryStatus.DELIVERED:
                stats.deliveredCount++;
                break;
            case MessageDeliveryStatus.READ:
                stats.readCount++;
                stats.readBy.push({
                    userId: receipt.userId,
                    userName: receipt.user.name,
                    seenAt: receipt.seenAt,
                });
                break;
        }
    }

    return stats;
};

// Count unread messages for never-read case
const countAllUnreadMessages = async (
    conversationId: string,
    userId: string
): Promise<number> => {
    return prisma.message.count({
        where: {
            conversationId,
            userId: {not: userId},
            deletedAt: null,
        },
    });
};

// Count unread messages after last read
const countUnreadMessagesAfter = async (
    conversationId: string,
    userId: string,
    lastReadAt: Date
): Promise<number> => {
    return prisma.message.count({
        where: {
            conversationId,
            userId: {not: userId},
            createdAt: {gt: lastReadAt},
            deletedAt: null,
        },
    });
};

// Public API

// Mark messages as read up to a specific message
export const markMessagesAsRead = async (
    conversationId: string,
    userId: string,
    upToMessageId?: string
): Promise<{ messagesAffected: number; lastMessageId: string | null }> => {
    await verifyUserIsMember(conversationId, userId);

    const messageIds = await getMessageIdsInConversation(conversationId, upToMessageId);

    if (messageIds.length === 0) {
        return { messagesAffected: 0, lastMessageId: null };
    }

    const lastMessageId = messageIds[messageIds.length - 1];

    // Upsert receipts for all messages
    await Promise.all(
        messageIds.map((id) => upsertReceipt(id, userId, MessageDeliveryStatus.READ))
    );

    // Update last read message pointer
    await updateLastReadMessage(conversationId, userId, lastMessageId);

    return {
        messagesAffected: messageIds.length,
        lastMessageId,
    };
};

// Create receipts for all recipients of a message
export const createReceiptForRecipients = async (
    messageId: string,
    conversationId: string,
    senderId: string,
    status: MessageDeliveryStatus = MessageDeliveryStatus.SENT
): Promise<void> => {
    const recipientIds = await getConversationRecipients(conversationId, senderId);

    if (recipientIds.length === 0) return;

    await Promise.all(
        recipientIds.map((recipientId) => upsertReceipt(messageId, recipientId, status))
    );
};

// Mark single message as delivered
export const markMessageAsDelivered = async (
    messageId: string,
    userId: string
): Promise<void> => {
    const message = await getMessageOrThrow(messageId);

    await verifyUserIsMember(message.conversationId, userId);
    await upsertReceipt(messageId, userId, MessageDeliveryStatus.DELIVERED);
};

// Get comprehensive read statistics for a message
export const getMessageReadStats = async (messageId: string): Promise<MessageReadStats> => {
    await getMessageOrThrow(messageId);

    const receipts = await prisma.messageReceipt.findMany({
        where: { messageId },
        include: RECEIPT_INCLUDE_WITH_USER,
    });

    const stats = calculateReceiptStats(receipts);

    return {
        messageId,
        totalRecipients: receipts.length,
        ...stats,
    };
};

// Get all receipts for a message with user info
export const getMessageReceipts = async (messageId: string): Promise<ReceiptWithUser[]> => {
    await getMessageOrThrow(messageId);

    return await prisma.messageReceipt.findMany({
        where: { messageId },
        include: RECEIPT_INCLUDE_WITH_USER,
        orderBy: { updatedAt: 'desc' },
    });
};

// Get count of unread messages for a user in a conversation
export const getUnreadMessageCount = async (
    conversationId: string,
    userId: string
): Promise<number> => {
    await verifyUserIsMember(conversationId, userId);

    const member = await prisma.conversationMember.findUnique({
        where: {
            userId_conversationId: {
                userId,
                conversationId,
            },
        },
        select: {
            lastReadMessageId: true,
            lastReadMessage: {
                select: { createdAt: true },
            },
        },
    });

    if (!member?.lastReadMessageId) {
        return await countAllUnreadMessages(conversationId, userId);
    }

    return await countUnreadMessagesAfter(
        conversationId,
        userId,
        member.lastReadMessage!.createdAt
    );
};

