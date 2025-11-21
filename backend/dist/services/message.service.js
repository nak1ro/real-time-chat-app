"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.softDeleteMessage = exports.editMessage = exports.getConversationMessages = exports.createMessage = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../db/prisma");
const middleware_1 = require("../middleware");
// Constants
const ELEVATED_ROLES = [client_1.MemberRole.OWNER, client_1.MemberRole.ADMIN];
const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 100;
const DELETED_MESSAGE_PLACEHOLDER = '[Message deleted]';
const MESSAGE_USER_SELECT = {
    id: true,
    name: true,
    avatarUrl: true,
    status: true,
};
const MESSAGE_REPLY_TO_INCLUDE = {
    select: {
        id: true,
        text: true,
        userId: true,
        createdAt: true,
        user: {
            select: {
                id: true,
                name: true,
                avatarUrl: true,
            },
        },
    },
};
const MESSAGE_INCLUDE_WITH_RELATIONS = {
    user: { select: MESSAGE_USER_SELECT },
    replyTo: MESSAGE_REPLY_TO_INCLUDE,
    _count: {
        select: { receipts: true },
    },
};
// Helper Functions
// Get user's membership in a conversation or throw
const getUserMembership = async (userId, conversationId) => {
    const membership = await prisma_1.prisma.conversationMember.findFirst({
        where: { userId, conversationId },
    });
    if (!membership) {
        throw new middleware_1.AuthorizationError('You are not a member of this conversation');
    }
    return membership;
};
// Verify user is banned from the conversation
const verifyUserIsNotBanned = async (userId, conversationId) => {
    const now = new Date();
    const activeBan = await prisma_1.prisma.channelBan.findFirst({
        where: {
            userId,
            conversationId,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: now } },
            ],
        },
    });
    if (activeBan) {
        const message = activeBan.expiresAt
            ? `You are banned from this conversation until ${activeBan.expiresAt.toISOString()}`
            : 'You are permanently banned from this conversation';
        throw new middleware_1.AuthorizationError(message);
    }
};
// Check if user has elevated role
const hasElevatedRole = (role) => {
    return ELEVATED_ROLES.includes(role);
};
// Get conversation by ID or throw
const getConversationOrThrow = async (conversationId) => {
    const conversation = await prisma_1.prisma.conversation.findUnique({
        where: { id: conversationId },
    });
    if (!conversation) {
        throw new middleware_1.NotFoundError('Conversation');
    }
    return conversation;
};
// Get message by ID or throw
const getMessageOrThrow = async (messageId) => {
    const message = await prisma_1.prisma.message.findUnique({
        where: { id: messageId },
    });
    if (!message) {
        throw new middleware_1.NotFoundError('Message');
    }
    return message;
};
// Verify reply-to message is valid
const verifyReplyToMessage = async (replyToId, conversationId) => {
    const replyToMessage = await prisma_1.prisma.message.findUnique({
        where: { id: replyToId },
    });
    if (!replyToMessage) {
        throw new middleware_1.NotFoundError('Reply-to message not found');
    }
    if (replyToMessage.conversationId !== conversationId) {
        throw new middleware_1.BadRequestError('Reply-to message must be from the same conversation');
    }
    if (replyToMessage.deletedAt) {
        throw new middleware_1.BadRequestError('Cannot reply to a deleted message');
    }
};
// Check if user is the message author
const isMessageAuthor = (message, userId) => {
    return message.userId === userId;
};
// Verify user is the message author or throw
const verifyIsMessageAuthor = (message, actorId) => {
    if (!isMessageAuthor(message, actorId)) {
        throw new middleware_1.AuthorizationError('You can only edit your own messages');
    }
};
// Check if user can delete a message (author or elevated role)
const canUserDeleteMessage = async (message, actorId) => {
    if (message.userId === actorId) {
        return true;
    }
    const membership = await prisma_1.prisma.conversationMember.findFirst({
        where: {
            userId: actorId,
            conversationId: message.conversationId,
        },
    });
    return membership ? hasElevatedRole(membership.role) : false;
};
// Verify user can delete message or throw
const verifyUserCanDeleteMessage = async (message, actorId) => {
    const canDelete = await canUserDeleteMessage(message, actorId);
    if (!canDelete) {
        throw new middleware_1.AuthorizationError('You can only delete your own messages or you must be an admin/owner');
    }
};
// Validate message text is not empty
const validateMessageText = (text) => {
    if (!text || text.trim().length === 0) {
        throw new middleware_1.BadRequestError('Message text cannot be empty');
    }
};
// Build pagination where clause
const buildPaginationWhereClause = (conversationId, cursor) => {
    const where = {
        conversationId,
        deletedAt: null,
    };
    if (cursor) {
        where.id = { lt: cursor };
    }
    return where;
};
// Public API
// Create a new message in a conversation
const createMessage = async (data) => {
    const { userId, conversationId, text, replyToId } = data;
    validateMessageText(text);
    const conversation = await getConversationOrThrow(conversationId);
    const membership = await getUserMembership(userId, conversationId);
    await verifyUserIsNotBanned(userId, conversationId);
    if (conversation.isReadOnly && !hasElevatedRole(membership.role)) {
        throw new middleware_1.AuthorizationError('This conversation is read-only. Only admins and owners can send messages');
    }
    if (replyToId) {
        await verifyReplyToMessage(replyToId, conversationId);
    }
    const result = await prisma_1.prisma.$transaction(async (tx) => {
        const message = await tx.message.create({
            data: {
                text: text.trim(),
                userId,
                conversationId,
                replyToId,
            },
            include: MESSAGE_INCLUDE_WITH_RELATIONS,
        });
        await tx.messageReceipt.create({
            data: {
                messageId: message.id,
                userId,
                status: client_1.MessageDeliveryStatus.READ,
                deliveredAt: new Date(),
                seenAt: new Date(),
            },
        });
        return message;
    });
    return result;
};
exports.createMessage = createMessage;
// Get messages for a conversation with pagination
const getConversationMessages = async (conversationId, userId, pagination) => {
    await getConversationOrThrow(conversationId);
    await getUserMembership(userId, conversationId);
    const limit = Math.min(pagination?.limit || DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT);
    const sortOrder = pagination?.sortOrder || 'desc';
    const cursor = pagination?.cursor;
    const where = buildPaginationWhereClause(conversationId, cursor);
    const messages = await prisma_1.prisma.message.findMany({
        where,
        take: limit + 1,
        orderBy: [{ createdAt: sortOrder }, { id: sortOrder }],
        include: MESSAGE_INCLUDE_WITH_RELATIONS,
    });
    const hasMore = messages.length > limit;
    const returnMessages = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore && returnMessages.length > 0
        ? returnMessages[returnMessages.length - 1].id
        : null;
    return {
        messages: returnMessages,
        nextCursor,
        hasMore,
    };
};
exports.getConversationMessages = getConversationMessages;
// Edit a message (author only)
const editMessage = async (messageId, actorId, text) => {
    validateMessageText(text);
    const message = await getMessageOrThrow(messageId);
    if (message.deletedAt) {
        throw new middleware_1.BadRequestError('Cannot edit a deleted message');
    }
    verifyIsMessageAuthor(message, actorId);
    const trimmedText = text.trim();
    if (message.text === trimmedText) {
        throw new middleware_1.BadRequestError('New text is the same as current text');
    }
    const updatedMessage = await prisma_1.prisma.message.update({
        where: { id: messageId },
        data: {
            text: trimmedText,
            isEdited: true,
            editedAt: new Date(),
        },
        include: MESSAGE_INCLUDE_WITH_RELATIONS,
    });
    return updatedMessage;
};
exports.editMessage = editMessage;
// Soft delete a message (author or elevated roles only for moderation)
const softDeleteMessage = async (messageId, actorId) => {
    const message = await getMessageOrThrow(messageId);
    if (message.deletedAt) {
        throw new middleware_1.BadRequestError('Message is already deleted');
    }
    await verifyUserCanDeleteMessage(message, actorId);
    const deletedMessage = await prisma_1.prisma.message.update({
        where: { id: messageId },
        data: {
            deletedAt: new Date(),
            text: DELETED_MESSAGE_PLACEHOLDER,
        },
        include: MESSAGE_INCLUDE_WITH_RELATIONS,
    });
    return deletedMessage;
};
exports.softDeleteMessage = softDeleteMessage;
