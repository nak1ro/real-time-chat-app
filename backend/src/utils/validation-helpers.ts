import { User, Conversation, Message, ConversationMember } from '@prisma/client';
import { prisma } from '../db/prisma';
import { NotFoundError, AuthorizationError } from '../middleware';

// Generic entity verification

// Find an entity by ID or throw NotFoundError
export const verifyEntityExists = async <T>(
    findOperation: () => Promise<T | null>,
    entityName: string
): Promise<T> => {
    const entity = await findOperation();

    if (!entity) {
        throw new NotFoundError(entityName);
    }

    return entity;
};

// User verification

// Verify that a user exists by ID
export const verifyUserExists = async (userId: string): Promise<User> => {
    return verifyEntityExists(
        () => prisma.user.findUnique({ where: { id: userId } }),
        `User with ID ${userId}`
    );
};

// Verify that multiple users exist
export const verifyUsersExist = async (userIds: string[]): Promise<User[]> => {
    const users = await Promise.all(userIds.map(verifyUserExists));
    return users;
};

// Conversation verification

// Verify that a conversation exists by ID
export const verifyConversationExists = async (conversationId: string): Promise<Conversation> => {
    return verifyEntityExists(
        () => prisma.conversation.findUnique({ where: { id: conversationId } }),
        'Conversation'
    );
};

// Message verification

// Verify that a message exists by ID
export const verifyMessageExists = async (messageId: string): Promise<Message> => {
    return verifyEntityExists(
        () => prisma.message.findUnique({ where: { id: messageId } }),
        'Message'
    );
};

// Membership verification

// Verify user is a member of a conversation
export const verifyMembership = async (
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

// Check if user is a member (returns boolean)
export const isMemberOfConversation = async (
    userId: string,
    conversationId: string
): Promise<boolean> => {
    const membership = await prisma.conversationMember.findFirst({
        where: { userId, conversationId },
    });

    return membership !== null;
};
