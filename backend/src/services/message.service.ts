import { ConversationMember, MemberRole, Message, MessageDeliveryStatus, Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { CreateMessageData, MessageWithRelations, PaginatedMessages, PaginationOptions } from '../domain';
import { AuthorizationError, BadRequestError, NotFoundError } from '../middleware';
import { createReceiptForRecipients } from './receipt.service';
import { canSendMessage, canModerateMessage } from './permissions.service';
import { attachFilesToMessage, AttachmentData } from './attachment.service';

// Constants

const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 100;
const DELETED_MESSAGE_PLACEHOLDER = '[Message deleted]';

const MESSAGE_USER_SELECT = {
    id: true,
    name: true,
    avatarUrl: true,
    status: true,
} as const;

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
} as const;

const MESSAGE_INCLUDE_WITH_RELATIONS = {
    user: { select: MESSAGE_USER_SELECT },
    replyTo: MESSAGE_REPLY_TO_INCLUDE,
    attachments: true,
    _count: {
        select: { receipts: true },
    },
} as const;

// Helper Functions

// Get user's membership in a conversation or throw
const getUserMembership = async (
    userId: string,
    conversationId: string
): Promise<ConversationMember> => {
    const membership = await prisma.conversationMember.findFirst({
        where: { userId, conversationId },
    });

    if (!membership) {
        throw new AuthorizationError('You are not a member of this conversation');
    }

    return membership;
};

// Get conversation by ID or throw
const getConversationOrThrow = async (conversationId: string) => {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
    });

    if (!conversation) {
        throw new NotFoundError('Conversation');
    }

    return conversation;
};

// Get message by ID or throw
const getMessageOrThrow = async (messageId: string): Promise<Message> => {
    const message = await prisma.message.findUnique({
        where: { id: messageId },
    });

    if (!message) {
        throw new NotFoundError('Message');
    }

    return message;
};

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


// Create a new message in a conversation
export const createMessage = async (data: CreateMessageData): Promise<MessageWithRelations> => {
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

    return result;
};

// Get messages for a conversation with pagination
export const getConversationMessages = async (
    conversationId: string,
    userId: string,
    pagination?: PaginationOptions
): Promise<PaginatedMessages> => {
    await getConversationOrThrow(conversationId);
    await getUserMembership(userId, conversationId);

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

    const message = await getMessageOrThrow(messageId);

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
    const message = await getMessageOrThrow(messageId);

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
