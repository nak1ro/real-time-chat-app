import { Message, MessageDeliveryStatus, Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { CreateMessageData, MessageWithRelations, PaginatedMessages, PaginationOptions } from '../../domain';
import { AuthorizationError, BadRequestError, NotFoundError } from '../../middleware';
import { createReceiptForRecipients } from './receipt.service';
import { canModerateMessage, canSendMessage } from '../users/permissions.service';
import { attachFilesToMessage, AttachmentData } from './attachment.service';
import {
    DEFAULT_PAGE_LIMIT,
    DELETED_MESSAGE_PLACEHOLDER,
    MAX_PAGE_LIMIT,
    MESSAGE_INCLUDE_WITH_RELATIONS,
} from '../shared/service-constants';
import { verifyConversationExists, verifyMembership, verifyMessageExists } from '../../utils/validation-helpers';


// Helper: Verify reply-to message is valid
const verifyReplyToMessage = async (replyToId: string, conversationId: string): Promise<void> => {
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

// Helper: Check if user is the message author
const isMessageAuthor = (message: Message, userId: string): boolean => {
    return message.userId === userId;
};

// Helper: Verify user is the message author
const verifyIsMessageAuthor = (message: Message, actorId: string): void => {
    if (!isMessageAuthor(message, actorId)) {
        throw new AuthorizationError('You can only edit your own messages');
    }
};

// Helper: Validate message text is not empty
const validateMessageText = (text: string): void => {
    if (!text || text.trim().length === 0) {
        throw new BadRequestError('Message text cannot be empty');
    }
};

// Helper: Build pagination where clause
const buildPaginationWhereClause = (conversationId: string): Prisma.MessageWhereInput => {
    return { conversationId };
};

// Helper: Add isDeleted field to message
const addIsDeletedField = <T extends { deletedAt: Date | null; replyTo?: { deletedAt: Date | null } | null }>(
    message: T
): T & { isDeleted: boolean; replyTo?: (T['replyTo'] & { isDeleted: boolean }) | null } => {
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

    return result as T & { isDeleted: boolean; replyTo?: (T['replyTo'] & { isDeleted: boolean }) | null };
};

// Helper: Create message in transaction
const createMessageInTransaction = async (
    tx: Prisma.TransactionClient,
    userId: string,
    conversationId: string,
    text: string,
    replyToId?: string
) => {
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
const createSenderReadReceipt = async (
    tx: Prisma.TransactionClient,
    messageId: string,
    userId: string
) => {
    await tx.messageReceipt.create({
        data: {
            messageId,
            userId,
            status: MessageDeliveryStatus.READ,
            deliveredAt: new Date(),
            seenAt: new Date(),
        },
    });
};

// Helper: Fetch message with all relations
const fetchMessageWithRelations = async (tx: Prisma.TransactionClient, messageId: string) => {
    return tx.message.findUniqueOrThrow({
        where: { id: messageId },
        include: MESSAGE_INCLUDE_WITH_RELATIONS,
    });
};

// Helper: Verify user can send message
const verifyUserCanSendMessage = async (userId: string, conversationId: string): Promise<void> => {
    const canSend = await canSendMessage(userId, conversationId);
    if (!canSend) {
        throw new AuthorizationError('You can only send messages in this conversation');
    }
};

// Helper: Get pagination parameters
const getPaginationParams = (pagination?: PaginationOptions) => {
    const limit = Math.min(pagination?.limit || DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT);
    const sortOrder = pagination?.sortOrder || 'desc';
    const cursor = pagination?.cursor;

    return { limit, sortOrder, cursor };
};

// Helper: Extract next cursor from messages
const getNextCursor = (messages: any[], limit: number): string | null => {
    if (messages.length <= limit) return null;
    return messages[limit - 1].id;
};

// Helper: Add isDeleted to multiple messages
const addIsDeletedToMessages = (messages: any[]) => {
    return messages.map(addIsDeletedField);
};

// Helper: Verify message not deleted before editing
const verifyMessageNotDeleted = (message: Message): void => {
    if (message.deletedAt) {
        throw new BadRequestError('Cannot edit a deleted message');
    }
};

// Helper: Check if edited text is different
const verifyTextChanged = (oldText: string, newText: string): void => {
    if (oldText === newText) {
        throw new BadRequestError('New text is the same as current text');
    }
};

// Create a new message in a conversation
export const createMessage = async (
    data: CreateMessageData
): Promise<MessageWithRelations & { isDeleted: boolean }> => {
    const { userId, conversationId, text, replyToId, attachments } = data;

    validateMessageText(text);
    await verifyUserCanSendMessage(userId, conversationId);

    if (replyToId) {
        await verifyReplyToMessage(replyToId, conversationId);
    }

    const result = await prisma.$transaction(async (tx) => {
        const message = await createMessageInTransaction(tx, userId, conversationId, text, replyToId);

        if (attachments && attachments.length > 0) {
            await attachFilesToMessage(message.id, attachments as AttachmentData[], tx);
        }

        await createSenderReadReceipt(tx, message.id, userId);

        return await fetchMessageWithRelations(tx, message.id);
    });

    await createReceiptForRecipients(result.id, conversationId, userId, []);

    return addIsDeletedField(result);
};

// Get messages for a conversation with pagination
export const getConversationMessages = async (
    conversationId: string,
    userId: string,
    pagination?: PaginationOptions
): Promise<PaginatedMessages> => {
    await verifyConversationExists(conversationId);
    await verifyMembership(userId, conversationId);

    const { limit, sortOrder, cursor } = getPaginationParams(pagination);
    const where = buildPaginationWhereClause(conversationId);

    const messages = await prisma.message.findMany({
        where,
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [{ createdAt: sortOrder }, { id: sortOrder }],
        include: MESSAGE_INCLUDE_WITH_RELATIONS,
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

// Edit a message
export const editMessage = async (
    messageId: string,
    actorId: string,
    text: string
): Promise<MessageWithRelations & { isDeleted: boolean }> => {
    validateMessageText(text);

    const message = await verifyMessageExists(messageId);

    verifyMessageNotDeleted(message);
    verifyIsMessageAuthor(message, actorId);

    const trimmedText = text.trim();
    verifyTextChanged(message.text, trimmedText);

    const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
            text: trimmedText,
            isEdited: true,
            editedAt: new Date(),
        },
        include: MESSAGE_INCLUDE_WITH_RELATIONS,
    });

    return addIsDeletedField(updatedMessage);
};

// Soft delete a message
export const softDeleteMessage = async (
    messageId: string,
    actorId: string
): Promise<MessageWithRelations & { isDeleted: boolean }> => {
    const message = await verifyMessageExists(messageId);

    if (message.deletedAt) {
        throw new BadRequestError('Message is already deleted');
    }

    const canModerate = await canModerateMessage(actorId, messageId);
    if (!canModerate) {
        throw new AuthorizationError('You can only delete your own messages or must be OWNER/ADMIN');
    }

    const deletedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
            deletedAt: new Date(),
            text: DELETED_MESSAGE_PLACEHOLDER,
        },
        include: MESSAGE_INCLUDE_WITH_RELATIONS,
    });

    return addIsDeletedField(deletedMessage);
};
