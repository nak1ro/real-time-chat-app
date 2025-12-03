"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.softDeleteMessage = exports.editMessage = exports.getConversationMessages = exports.createMessage = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../db/prisma");
const middleware_1 = require("../../middleware");
const receipt_service_1 = require("./receipt.service");
const permissions_service_1 = require("../users/permissions.service");
const attachment_service_1 = require("./attachment.service");
const service_constants_1 = require("../shared/service-constants");
const validation_helpers_1 = require("../../utils/validation-helpers");
// Helper: Verify reply-to message is valid
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
// Helper: Check if user is the message author
const isMessageAuthor = (message, userId) => {
    return message.userId === userId;
};
// Helper: Verify user is the message author
const verifyIsMessageAuthor = (message, actorId) => {
    if (!isMessageAuthor(message, actorId)) {
        throw new middleware_1.AuthorizationError('You can only edit your own messages');
    }
};
// Helper: Validate message text is not empty
const validateMessageText = (text) => {
    if (!text || text.trim().length === 0) {
        throw new middleware_1.BadRequestError('Message text cannot be empty');
    }
};
// Helper: Build pagination where clause
const buildPaginationWhereClause = (conversationId) => {
    return { conversationId };
};
// Helper: Add isDeleted field to message
const addIsDeletedField = (message) => {
    const result = {
        ...message,
        isDeleted: message.deletedAt !== null,
    };
    if (message.replyTo) {
        return {
            ...result,
            replyTo: {
                ...message.replyTo,
                isDeleted: message.replyTo.deletedAt !== null,
            },
        };
    }
    return result;
};
// Helper: Create message in transaction
const createMessageInTransaction = async (tx, userId, conversationId, text, replyToId) => {
    return tx.message.create({
        data: {
            text: text.trim(),
            userId,
            conversationId,
            replyToId,
        },
    });
};
// Helper: Create read receipt for sender
const createSenderReadReceipt = async (tx, messageId, userId) => {
    await tx.messageReceipt.create({
        data: {
            messageId,
            userId,
            status: client_1.MessageDeliveryStatus.READ,
            deliveredAt: new Date(),
            seenAt: new Date(),
        },
    });
};
// Helper: Fetch message with all relations
const fetchMessageWithRelations = async (tx, messageId) => {
    return tx.message.findUniqueOrThrow({
        where: { id: messageId },
        include: service_constants_1.MESSAGE_INCLUDE_WITH_RELATIONS,
    });
};
// Helper: Verify user can send message
const verifyUserCanSendMessage = async (userId, conversationId) => {
    const canSend = await (0, permissions_service_1.canSendMessage)(userId, conversationId);
    if (!canSend) {
        throw new middleware_1.AuthorizationError('You can only send messages in this conversation');
    }
};
// Helper: Get pagination parameters
const getPaginationParams = (pagination) => {
    const limit = Math.min(pagination?.limit || service_constants_1.DEFAULT_PAGE_LIMIT, service_constants_1.MAX_PAGE_LIMIT);
    const sortOrder = pagination?.sortOrder || 'desc';
    const cursor = pagination?.cursor;
    return { limit, sortOrder, cursor };
};
// Helper: Extract next cursor from messages
const getNextCursor = (messages, limit) => {
    if (messages.length <= limit)
        return null;
    return messages[limit - 1].id;
};
// Helper: Add isDeleted to multiple messages
const addIsDeletedToMessages = (messages) => {
    return messages.map(addIsDeletedField);
};
// Helper: Verify message not deleted before editing
const verifyMessageNotDeleted = (message) => {
    if (message.deletedAt) {
        throw new middleware_1.BadRequestError('Cannot edit a deleted message');
    }
};
// Helper: Check if edited text is different
const verifyTextChanged = (oldText, newText) => {
    if (oldText === newText) {
        throw new middleware_1.BadRequestError('New text is the same as current text');
    }
};
// Create a new message in a conversation
const createMessage = async (data) => {
    const { userId, conversationId, text, replyToId, attachments } = data;
    validateMessageText(text);
    await verifyUserCanSendMessage(userId, conversationId);
    if (replyToId) {
        await verifyReplyToMessage(replyToId, conversationId);
    }
    const result = await prisma_1.prisma.$transaction(async (tx) => {
        const message = await createMessageInTransaction(tx, userId, conversationId, text, replyToId);
        if (attachments && attachments.length > 0) {
            await (0, attachment_service_1.attachFilesToMessage)(message.id, attachments, tx);
        }
        await createSenderReadReceipt(tx, message.id, userId);
        return await fetchMessageWithRelations(tx, message.id);
    });
    await (0, receipt_service_1.createReceiptForRecipients)(result.id, conversationId, userId, []);
    return addIsDeletedField(result);
};
exports.createMessage = createMessage;
// Get messages for a conversation with pagination
const getConversationMessages = async (conversationId, userId, pagination) => {
    await (0, validation_helpers_1.verifyConversationExists)(conversationId);
    await (0, validation_helpers_1.verifyMembership)(userId, conversationId);
    const { limit, sortOrder, cursor } = getPaginationParams(pagination);
    const where = buildPaginationWhereClause(conversationId);
    const messages = await prisma_1.prisma.message.findMany({
        where,
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [{ createdAt: sortOrder }, { id: sortOrder }],
        include: service_constants_1.MESSAGE_INCLUDE_WITH_RELATIONS,
    });
    const hasMore = messages.length > limit;
    const returnMessages = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = getNextCursor(messages, limit);
    const messagesWithIsDeleted = addIsDeletedToMessages(returnMessages);
    return {
        messages: messagesWithIsDeleted,
        nextCursor,
        hasMore,
    };
};
exports.getConversationMessages = getConversationMessages;
// Edit a message
const editMessage = async (messageId, actorId, text) => {
    validateMessageText(text);
    const message = await (0, validation_helpers_1.verifyMessageExists)(messageId);
    verifyMessageNotDeleted(message);
    verifyIsMessageAuthor(message, actorId);
    const trimmedText = text.trim();
    verifyTextChanged(message.text, trimmedText);
    const updatedMessage = await prisma_1.prisma.message.update({
        where: { id: messageId },
        data: {
            text: trimmedText,
            isEdited: true,
            editedAt: new Date(),
        },
        include: service_constants_1.MESSAGE_INCLUDE_WITH_RELATIONS,
    });
    return addIsDeletedField(updatedMessage);
};
exports.editMessage = editMessage;
// Soft delete a message
const softDeleteMessage = async (messageId, actorId) => {
    const message = await (0, validation_helpers_1.verifyMessageExists)(messageId);
    if (message.deletedAt) {
        throw new middleware_1.BadRequestError('Message is already deleted');
    }
    const canModerate = await (0, permissions_service_1.canModerateMessage)(actorId, messageId);
    if (!canModerate) {
        throw new middleware_1.AuthorizationError('You can only delete your own messages or must be OWNER/ADMIN');
    }
    const deletedMessage = await prisma_1.prisma.message.update({
        where: { id: messageId },
        data: {
            deletedAt: new Date(),
            text: service_constants_1.DELETED_MESSAGE_PLACEHOLDER,
        },
        include: service_constants_1.MESSAGE_INCLUDE_WITH_RELATIONS,
    });
    return addIsDeletedField(deletedMessage);
};
exports.softDeleteMessage = softDeleteMessage;
