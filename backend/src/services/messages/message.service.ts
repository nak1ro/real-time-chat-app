import { ConversationMember, MemberRole, Message, MessageDeliveryStatus, Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { CreateMessageData, MessageWithRelations, PaginatedMessages, PaginationOptions } from '../../domain';
import { AuthorizationError, BadRequestError, NotFoundError } from '../../middleware';
import { createReceiptForRecipients } from './receipt.service';
import { canSendMessage, canModerateMessage } from '../users/permissions.service';
import { attachFilesToMessage, AttachmentData } from './attachment.service';
import {
    DEFAULT_PAGE_LIMIT,
    MAX_PAGE_LIMIT,
    DELETED_MESSAGE_PLACEHOLDER,
    MESSAGE_INCLUDE_WITH_RELATIONS,
} from '../shared/service-constants';
import { verifyMessageExists, verifyConversationExists, verifyMembership } from '../../utils/validation-helpers';

// Helper Functions

// Verify reply-to message is valid
const verifyReplyToMessage = async (
    replyToId: string,
    conversationId: string
): Promise<void> => {
    const replyToMessage = await prisma.message.findUnique({
        where: { id: replyToId },
    });

    if (!replyToMessage) {
        throw new NotFoundError('Reply-to message not found');
    }

    if (replyToMessage.conversationId !== conversationId) {
        throw new BadRequestError('Reply-to message must be from the same conversation');
    }

    if (replyToMessage.deletedAt) {
        throw new BadRequestError('Cannot reply to a deleted message');
    }
};

// Check if user is the message author
const isMessageAuthor = (message: Message, userId: string): boolean => {
    return message.userId === userId;
};

// Verify user is the message author or throw
const verifyIsMessageAuthor = (message: Message, actorId: string): void => {
    if (!isMessageAuthor(message, actorId)) {
        throw new AuthorizationError('You can only edit your own messages');
    }
};

// Validate message text is not empty
const validateMessageText = (text: string): void => {
    if (!text || text.trim().length === 0) {
        throw new BadRequestError('Message text cannot be empty');
    }
};

// Build pagination where clause
const buildPaginationWhereClause = (
    conversationId: string,
    cursor?: string
): Prisma.MessageWhereInput => {
    const where: Prisma.MessageWhereInput = {
        conversationId,
        deletedAt: null,
    };

    if (cursor) {
        where.id = { lt: cursor };
    }

    return where;
};

// Public API


import { processMentions } from './mention.service';

// ... (existing imports)

// Create a new message in a conversation
export const createMessage = async (data: CreateMessageData): Promise<MessageWithRelations & { mentionedUserIds: string[] }> => {
    const { userId, conversationId, text, replyToId, attachments } = data;

    validateMessageText(text);

    // Verify user can send messages
    const canSend = await canSendMessage(userId, conversationId);
    if (!canSend) {
        throw new AuthorizationError('You cannot send messages in this conversation');
    }

    if (replyToId) {
        await verifyReplyToMessage(replyToId, conversationId);
    }

    let mentionedUserIds: string[] = [];

    const result = await prisma.$transaction(async (tx) => {
        const message = await tx.message.create({
            data: {
                text: text.trim(),
                userId,
                conversationId,
                replyToId,
            },
            include: MESSAGE_INCLUDE_WITH_RELATIONS,
        });

        // Attach files if provided
        if (attachments && attachments.length > 0) {
            await attachFilesToMessage(message.id, attachments as any);
        }

        // Process mentions
        mentionedUserIds = await processMentions(message.id, text);

        // Create READ receipt for the sender
        await tx.messageReceipt.create({
            data: {
                messageId: message.id,
                userId,
                status: MessageDeliveryStatus.READ,
                deliveredAt: new Date(),
                seenAt: new Date(),
            },
        });

        return message;
    });

    // Create SENT receipts for all other conversation members
    await createReceiptForRecipients(
        result.id,
        conversationId,
        userId,
        MessageDeliveryStatus.SENT
    );

    // Create NEW_MESSAGE notifications for conversation members
    // (Notifications will be sent via socket in the handler)
    // This is handled in the socket layer to include notification IDs

    return { ...result, mentionedUserIds };
};

// Get messages for a conversation with pagination
export const getConversationMessages = async (
    conversationId: string,
    userId: string,
    pagination?: PaginationOptions
): Promise<PaginatedMessages> => {
    await verifyConversationExists(conversationId);
    await verifyMembership(userId, conversationId);

    const limit = Math.min(pagination?.limit || DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT);
    const sortOrder = pagination?.sortOrder || 'desc';
    const cursor = pagination?.cursor;

    const where = buildPaginationWhereClause(conversationId, cursor);

    const messages = await prisma.message.findMany({
        where,
        take: limit + 1,
        orderBy: [{ createdAt: sortOrder }, { id: sortOrder }],
        include: MESSAGE_INCLUDE_WITH_RELATIONS,
    });

    const hasMore = messages.length > limit;
    const returnMessages = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor =
        hasMore && returnMessages.length > 0
            ? returnMessages[returnMessages.length - 1].id
            : null;

    return {
        messages: returnMessages,
        nextCursor,
        hasMore,
    };
};

// Edit a message (author only)
export const editMessage = async (
    messageId: string,
    actorId: string,
    text: string
): Promise<MessageWithRelations> => {
    validateMessageText(text);

    const message = await verifyMessageExists(messageId);

    if (message.deletedAt) {
        throw new BadRequestError('Cannot edit a deleted message');
    }

    verifyIsMessageAuthor(message, actorId);

    const trimmedText = text.trim();
    if (message.text === trimmedText) {
        throw new BadRequestError('New text is the same as current text');
    }

    return await prisma.message.update({
        where: { id: messageId },
        data: {
            text: trimmedText,
            isEdited: true,
            editedAt: new Date(),
        },
        include: MESSAGE_INCLUDE_WITH_RELATIONS,
    });
};

// Soft delete a message (author or elevated roles only for moderation)
export const softDeleteMessage = async (
    messageId: string,
    actorId: string
): Promise<MessageWithRelations> => {
    const message = await verifyMessageExists(messageId);

    if (message.deletedAt) {
        throw new BadRequestError('Message is already deleted');
    }

    // Verify user can moderate the message
    const canModerate = await canModerateMessage(actorId, messageId);
    if (!canModerate) {
        throw new AuthorizationError('You can only delete your own messages or must be OWNER/ADMIN');
    }

    return await prisma.message.update({
        where: { id: messageId },
        data: {
            deletedAt: new Date(),
            text: DELETED_MESSAGE_PLACEHOLDER,
        },
        include: MESSAGE_INCLUDE_WITH_RELATIONS,
    });
};

