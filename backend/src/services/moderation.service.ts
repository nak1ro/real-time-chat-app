import { ModerationActionType, Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { AuthorizationError, BadRequestError, NotFoundError } from '../middleware';
import { canManageMembers } from './permissions.service';
import { softDeleteMessage } from './message.service';
import { updateMemberRole } from './conversation.service';

// Types

export interface ApplyModerationActionParams {
    actorId: string;
    action: ModerationActionType;
    conversationId: string;
    targetUserId?: string;
    messageId?: string;
    reason?: string;
    expiresAt?: Date;
}

// Helper Functions

// Verify user exists
const verifyUserExists = async (userId: string): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new NotFoundError(`User with ID ${userId}`);
    }
};

// Verify conversation exists
const verifyConversationExists = async (conversationId: string): Promise<void> => {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
    });
    if (!conversation) {
        throw new NotFoundError('Conversation');
    }
};

// Verify message exists
const verifyMessageExists = async (messageId: string): Promise<void> => {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
        throw new NotFoundError('Message');
    }
};

// Public API

// Apply a moderation action
export const applyModerationAction = async (
    params: ApplyModerationActionParams
) => {
    const { actorId, action, conversationId, targetUserId, messageId, reason, expiresAt } = params;

    // Verify actor has permission to perform moderation
    const canModerate = await canManageMembers(actorId, conversationId);
    if (!canModerate) {
        throw new AuthorizationError('Only OWNER or ADMIN can perform moderation actions');
    }

    // Verify conversation exists
    await verifyConversationExists(conversationId);

    // Handle each action type
    switch (action) {
        case 'BAN':
            return await handleBan(params);

        case 'UNBAN':
            return await handleUnban(params);

        case 'MUTE':
            return await handleMute(params);

        case 'UNMUTE':
            return await handleUnmute(params);

        case 'DELETE_MESSAGE':
            return await handleDeleteMessage(params);

        case 'MAKE_ADMIN':
            return await handleMakeAdmin(params);

        case 'REMOVE_ADMIN':
            return await handleRemoveAdmin(params);

        case 'KICK':
            throw new BadRequestError('KICK action not yet implemented');

        case 'PIN_MESSAGE':
            throw new BadRequestError('PIN_MESSAGE action not yet implemented');

        default:
            throw new BadRequestError(`Unknown moderation action: ${action}`);
    }
};

// Action Handlers

// BAN - Create channel ban
const handleBan = async (params: ApplyModerationActionParams) => {
    const { actorId, conversationId, targetUserId, reason, expiresAt } = params;

    if (!targetUserId) {
        throw new BadRequestError('targetUserId is required for BAN action');
    }

    await verifyUserExists(targetUserId);

    // Check if user is already banned
    const existingBan = await prisma.channelBan.findUnique({
        where: {
            userId_conversationId: {
                userId: targetUserId,
                conversationId,
            },
        },
    });

    if (existingBan) {
        throw new BadRequestError('User is already banned from this conversation');
    }

    // Create ban and moderation action in transaction
    return await prisma.$transaction(async (tx) => {
        // Create channel ban
        await tx.channelBan.create({
            data: {
                userId: targetUserId,
                conversationId,
                reason,
                expiresAt,
            },
        });

        // Create moderation action record
        return await tx.moderationAction.create({
            data: {
                action: 'BAN',
                actorId,
                targetUserId,
                conversationId,
                reason,
                expiresAt,
            },
        });
    });
};

// UNBAN - Remove channel ban
const handleUnban = async (params: ApplyModerationActionParams) => {
    const { actorId, conversationId, targetUserId, reason } = params;

    if (!targetUserId) {
        throw new BadRequestError('targetUserId is required for UNBAN action');
    }

    await verifyUserExists(targetUserId);

    // Find active ban
    const ban = await prisma.channelBan.findUnique({
        where: {
            userId_conversationId: {
                userId: targetUserId,
                conversationId,
            },
        },
    });

    if (!ban) {
        throw new BadRequestError('User is not banned from this conversation');
    }

    // Delete ban and create moderation action
    return await prisma.$transaction(async (tx) => {
        // Delete channel ban
        await tx.channelBan.delete({
            where: {
                userId_conversationId: {
                    userId: targetUserId,
                    conversationId,
                },
            },
        });

        // Create moderation action record
        return await tx.moderationAction.create({
            data: {
                action: 'UNBAN',
                actorId,
                targetUserId,
                conversationId,
                reason,
            },
        });
    });
};

// MUTE - Prevent user from sending messages
const handleMute = async (params: ApplyModerationActionParams) => {
    const { actorId, conversationId, targetUserId, reason, expiresAt } = params;

    if (!targetUserId) {
        throw new BadRequestError('targetUserId is required for MUTE action');
    }

    await verifyUserExists(targetUserId);

    // Create moderation action
    return await prisma.moderationAction.create({
        data: {
            action: 'MUTE',
            actorId,
            targetUserId,
            conversationId,
            reason,
            expiresAt,
        },
    });
};

// UNMUTE - Remove mute
const handleUnmute = async (params: ApplyModerationActionParams) => {
    const { actorId, conversationId, targetUserId, reason } = params;

    if (!targetUserId) {
        throw new BadRequestError('targetUserId is required for UNMUTE action');
    }

    await verifyUserExists(targetUserId);

    // Create moderation action (unmute is recorded as action)
    return await prisma.moderationAction.create({
        data: {
            action: 'UNMUTE',
            actorId,
            targetUserId,
            conversationId,
            reason,
        },
    });
};

// DELETE_MESSAGE - Soft delete a message
const handleDeleteMessage = async (params: ApplyModerationActionParams) => {
    const { actorId, conversationId, messageId, reason } = params;

    if (!messageId) {
        throw new BadRequestError('messageId is required for DELETE_MESSAGE action');
    }

    await verifyMessageExists(messageId);

    // Delete message and create moderation action
    await softDeleteMessage(messageId, actorId);

    // Create moderation action record
    return await prisma.moderationAction.create({
        data: {
            action: 'DELETE_MESSAGE',
            actorId,
            messageId,
            conversationId,
            reason,
        },
    });
};

// MAKE_ADMIN - Promote member to ADMIN
const handleMakeAdmin = async (params: ApplyModerationActionParams) => {
    const { actorId, conversationId, targetUserId, reason } = params;

    if (!targetUserId) {
        throw new BadRequestError('targetUserId is required for MAKE_ADMIN action');
    }

    await verifyUserExists(targetUserId);

    // Update role through conversation service (handles hierarchy)
    await updateMemberRole(conversationId, actorId, targetUserId, 'ADMIN');

    // Create moderation action record
    return await prisma.moderationAction.create({
        data: {
            action: 'MAKE_ADMIN',
            actorId,
            targetUserId,
            conversationId,
            reason,
        },
    });
};

// REMOVE_ADMIN - Demote admin to MEMBER
const handleRemoveAdmin = async (params: ApplyModerationActionParams) => {
    const { actorId, conversationId, targetUserId, reason } = params;

    if (!targetUserId) {
        throw new BadRequestError('targetUserId is required for REMOVE_ADMIN action');
    }

    await verifyUserExists(targetUserId);

    // Update role through conversation service (handles hierarchy)
    await updateMemberRole(conversationId, actorId, targetUserId, 'MEMBER');

    // Create moderation action record
    return await prisma.moderationAction.create({
        data: {
            action: 'REMOVE_ADMIN',
            actorId,
            targetUserId,
            conversationId,
            reason,
        },
    });
};

// Get active mute for user in conversation
export const getActiveMute = async (userId: string, conversationId: string) => {
    const now = new Date();

    // Find latest MUTE action
    const mute = await prisma.moderationAction.findFirst({
        where: {
            targetUserId: userId,
            conversationId,
            action: 'MUTE',
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: now } },
            ],
        },
        orderBy: { createdAt: 'desc' },
    });

    if (!mute) {
        return null;
    }

    // Check if there's a more recent UNMUTE
    const unmute = await prisma.moderationAction.findFirst({
        where: {
            targetUserId: userId,
            conversationId,
            action: 'UNMUTE',
            createdAt: { gt: mute.createdAt },
        },
    });

    // If unmute exists and is more recent, user is not muted
    if (unmute) {
        return null;
    }

    return mute;
};

// Clean up expired channel bans
export const cleanupExpiredModerations = async (): Promise<void> => {
    const now = new Date();

    // Delete expired channel bans
    const deletedBans = await prisma.channelBan.deleteMany({
        where: {
            expiresAt: {
                lte: now,
            },
        },
    });

    console.log(`Cleaned up ${deletedBans.count} expired channel bans`);

    // Note: ModerationAction records are kept for historical purposes
    // Active mute checking already filters by expiresAt
};

