"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnreadMessageCount = exports.getMessageReadStats = exports.createReceiptForRecipients = exports.markMessagesAsRead = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../db/prisma");
const middleware_1 = require("../../middleware");
const service_constants_1 = require("../shared/service-constants");
const validation_helpers_1 = require("../../utils/validation-helpers");
// Helper: Verify user membership in conversation
const verifyUserIsMember = async (conversationId, userId) => {
    await (0, validation_helpers_1.verifyMembership)(userId, conversationId);
};
// Helper: Get message or throw
const getMessageOrThrow = async (messageId) => {
    const message = await prisma_1.prisma.message.findUnique({
        where: { id: messageId },
        select: { conversationId: true },
    });
    if (!message) {
        throw new middleware_1.NotFoundError('Message');
    }
    return message;
};
// Helper: Get target message and verify conversation
const getTargetMessage = async (messageId, conversationId) => {
    const message = await prisma_1.prisma.message.findUnique({
        where: { id: messageId },
        select: { createdAt: true, conversationId: true },
    });
    if (!message) {
        throw new middleware_1.NotFoundError('Message');
    }
    if (message.conversationId !== conversationId) {
        throw new middleware_1.AuthorizationError('Message does not belong to this conversation');
    }
    return { createdAt: message.createdAt };
};
// Helper: Get conversation members excluding sender
const getConversationRecipients = async (conversationId, senderId) => {
    const members = await prisma_1.prisma.conversationMember.findMany({
        where: {
            conversationId,
            userId: { not: senderId },
        },
        select: { userId: true },
    });
    return members.map((m) => m.userId);
};
// Helper: Get message IDs up to a specific creation date
const getMessageIdsUpTo = async (conversationId, targetCreatedAt) => {
    const messages = await prisma_1.prisma.message.findMany({
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
// Helper: Get all message IDs in conversation
const getAllMessageIds = async (conversationId) => {
    const messages = await prisma_1.prisma.message.findMany({
        where: {
            conversationId,
            deletedAt: null,
        },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
    });
    return messages.map((m) => m.id);
};
// Helper: Get message IDs based on optional target
const getMessageIdsInConversation = async (conversationId, upToMessageId) => {
    if (upToMessageId) {
        const targetMessage = await getTargetMessage(upToMessageId, conversationId);
        return await getMessageIdsUpTo(conversationId, targetMessage.createdAt);
    }
    return await getAllMessageIds(conversationId);
};
// Helper: Upsert a single receipt
const upsertReceipt = async (messageId, userId, status) => {
    const timestamps = (0, service_constants_1.buildReceiptTimestamps)(status);
    await prisma_1.prisma.messageReceipt.upsert({
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
// Helper: Update last read message for conversation member
const updateLastReadMessage = async (conversationId, userId, messageId) => {
    await prisma_1.prisma.conversationMember.update({
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
// Helper: Count sent receipts
const countSentReceipts = (receipts) => {
    return receipts.filter((r) => r.status === client_1.MessageDeliveryStatus.SENT).length;
};
// Helper: Filter and map read receipts
const getReadReceiptsList = (receipts) => {
    return receipts
        .filter((r) => r.status === client_1.MessageDeliveryStatus.READ)
        .map((r) => ({
        userId: r.userId,
        userName: r.user.name,
        seenAt: r.seenAt,
    }));
};
// Helper: Calculate receipt statistics
const calculateReceiptStats = (receipts) => {
    const readBy = getReadReceiptsList(receipts);
    return {
        sentCount: countSentReceipts(receipts),
        readCount: readBy.length,
        readBy,
    };
};
// Helper: Count all unread messages for never-read case
const countAllUnreadMessages = async (conversationId, userId) => {
    return prisma_1.prisma.message.count({
        where: {
            conversationId,
            userId: { not: userId },
            deletedAt: null,
        },
    });
};
// Helper: Count unread messages after last read
const countUnreadMessagesAfter = async (conversationId, userId, lastReadAt) => {
    return prisma_1.prisma.message.count({
        where: {
            conversationId,
            userId: { not: userId },
            createdAt: { gt: lastReadAt },
            deletedAt: null,
        },
    });
};
// Public API
// Mark messages as read up to a specific message
const markMessagesAsRead = async (conversationId, userId, upToMessageId) => {
    await verifyUserIsMember(conversationId, userId);
    const messageIds = await getMessageIdsInConversation(conversationId, upToMessageId);
    if (messageIds.length === 0) {
        return { messagesAffected: 0, lastMessageId: null };
    }
    const lastMessageId = messageIds[messageIds.length - 1];
    // Upsert receipts for all messages
    await Promise.all(messageIds.map((id) => upsertReceipt(id, userId, client_1.MessageDeliveryStatus.READ)));
    // Update last read message pointer
    await updateLastReadMessage(conversationId, userId, lastMessageId);
    return {
        messagesAffected: messageIds.length,
        lastMessageId,
    };
};
exports.markMessagesAsRead = markMessagesAsRead;
// Create receipts for all recipients of a message
const createReceiptForRecipients = async (messageId, conversationId, senderId, readUserIds = []) => {
    const recipientIds = await getConversationRecipients(conversationId, senderId);
    if (recipientIds.length === 0)
        return;
    await Promise.all(recipientIds.map((recipientId) => {
        const status = readUserIds.includes(recipientId)
            ? client_1.MessageDeliveryStatus.READ
            : client_1.MessageDeliveryStatus.SENT;
        return upsertReceipt(messageId, recipientId, status);
    }));
};
exports.createReceiptForRecipients = createReceiptForRecipients;
// Get comprehensive read statistics for a message
const getMessageReadStats = async (messageId) => {
    await getMessageOrThrow(messageId);
    const receipts = await prisma_1.prisma.messageReceipt.findMany({
        where: { messageId },
        include: service_constants_1.RECEIPT_INCLUDE_WITH_USER,
    });
    const stats = calculateReceiptStats(receipts);
    return {
        messageId,
        totalRecipients: receipts.length,
        ...stats,
    };
};
exports.getMessageReadStats = getMessageReadStats;
// Get count of unread messages for a user in a conversation
const getUnreadMessageCount = async (conversationId, userId) => {
    await verifyUserIsMember(conversationId, userId);
    const member = await prisma_1.prisma.conversationMember.findUnique({
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
    return await countUnreadMessagesAfter(conversationId, userId, member.lastReadMessage.createdAt);
};
exports.getUnreadMessageCount = getUnreadMessageCount;
