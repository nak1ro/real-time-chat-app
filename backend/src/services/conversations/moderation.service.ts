import { ModerationActionType, Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AuthorizationError, BadRequestError } from '../../middleware';
import { canManageMembers } from '../users/permissions.service';
import { softDeleteMessage } from '../messages/message.service';
import { updateMemberRole } from './conversation.service';
import {
    verifyUserExists,
    verifyConversationExists,
    verifyMessageExists,
} from '../../utils/validation-helpers';

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

type ModerationClient = Pick<typeof prisma, 'moderationAction' | 'channelBan'> | Prisma.TransactionClient;

const ensureModerationPreconditions = async (actorId: string, conversationId: string) => {
    const canModerate = await canManageMembers(actorId, conversationId);
    if (!canModerate) {
        throw new AuthorizationError('Only OWNER or ADMIN can perform moderation actions');
    }
    await verifyConversationExists(conversationId);
};

const ensureTargetUserExists = async (action: ModerationActionType, targetUserId?: string) => {
    if (!targetUserId) {
        throw new BadRequestError(`targetUserId is required for ${action} action`);
    }
    await verifyUserExists(targetUserId);
    return targetUserId;
};

const ensureMessageExists = async (action: ModerationActionType, messageId?: string) => {
    if (!messageId) {
        throw new BadRequestError(`messageId is required for ${action} action`);
    }
    await verifyMessageExists(messageId);
    return messageId;
};

const createModerationAction = async (
    client: ModerationClient,
    data: Prisma.ModerationActionCreateInput
) => {
    return client.moderationAction.create({ data });
};

// Public API
// Apply a moderation action
export const applyModerationAction = async (params: ApplyModerationActionParams) => {
    const { actorId, action, conversationId } = params;

    await ensureModerationPreconditions(actorId, conversationId);

    switch (action) {
        case ModerationActionType.BAN:
            return handleBan(params);
        case ModerationActionType.UNBAN:
            return handleUnban(params);
        case ModerationActionType.MUTE:
            return handleMute(params);
        case ModerationActionType.UNMUTE:
            return handleUnmute(params);
        case ModerationActionType.DELETE_MESSAGE:
            return handleDeleteMessage(params);
        case ModerationActionType.MAKE_ADMIN:
            return handleMakeAdmin(params);
        case ModerationActionType.REMOVE_ADMIN:
            return handleRemoveAdmin(params);
        case ModerationActionType.KICK:
            throw new BadRequestError('KICK action not yet implemented');
        case ModerationActionType.PIN_MESSAGE:
            throw new BadRequestError('PIN_MESSAGE action not yet implemented');
        default:
            throw new BadRequestError(`Unknown moderation action: ${action}`);
    }
};

// Action Handlers

// BAN
const handleBan = async (params: ApplyModerationActionParams) => {
    const { actorId, conversationId, targetUserId, reason, expiresAt } = params;

    const validTargetUserId = await ensureTargetUserExists(ModerationActionType.BAN, targetUserId);

    const existingBan = await prisma.channelBan.findUnique({
        where: {
            userId_conversationId: {
                userId: validTargetUserId,
                conversationId,
            },
        },
    });

    if (existingBan) {
        throw new BadRequestError('User is already banned from this conversation');
    }

    return prisma.$transaction(async (tx) => {
        await tx.channelBan.create({
            data: {
                userId: validTargetUserId,
                conversationId,
                reason,
                expiresAt,
            },
        });

        return createModerationAction(tx, {
            action: ModerationActionType.BAN,
            actor: { connect: { id: actorId } },
            targetUser: { connect: { id: validTargetUserId } },
            conversation: { connect: { id: conversationId } },
            reason,
            expiresAt,
        });
    });
};

// UNBAN
const handleUnban = async (params: ApplyModerationActionParams) => {
    const { actorId, conversationId, targetUserId, reason } = params;

    const validTargetUserId = await ensureTargetUserExists(ModerationActionType.UNBAN, targetUserId);

    const ban = await prisma.channelBan.findUnique({
        where: {
            userId_conversationId: {
                userId: validTargetUserId,
                conversationId,
            },
        },
    });

    if (!ban) {
        throw new BadRequestError('User is not banned from this conversation');
    }

    return prisma.$transaction(async (tx) => {
        await tx.channelBan.delete({
            where: {
                userId_conversationId: {
                    userId: validTargetUserId,
                    conversationId,
                },
            },
        });

        return createModerationAction(tx, {
            action: ModerationActionType.UNBAN,
            actor: { connect: { id: actorId } },
            targetUser: { connect: { id: validTargetUserId } },
            conversation: { connect: { id: conversationId } },
            reason,
        });
    });
};

// MUTE
const handleMute = async (params: ApplyModerationActionParams) => {
    const { actorId, conversationId, targetUserId, reason, expiresAt } = params;

    const validTargetUserId = await ensureTargetUserExists(ModerationActionType.MUTE, targetUserId);

    return createModerationAction(prisma, {
        action: ModerationActionType.MUTE,
        actor: { connect: { id: actorId } },
        targetUser: { connect: { id: validTargetUserId } },
        conversation: { connect: { id: conversationId } },
        reason,
        expiresAt,
    });
};

// UNMUTE
const handleUnmute = async (params: ApplyModerationActionParams) => {
    const { actorId, conversationId, targetUserId, reason } = params;

    const validTargetUserId = await ensureTargetUserExists(ModerationActionType.UNMUTE, targetUserId);

    return createModerationAction(prisma, {
        action: ModerationActionType.UNMUTE,
        actor: { connect: { id: actorId } },
        targetUser: { connect: { id: validTargetUserId } },
        conversation: { connect: { id: conversationId } },
        reason,
    });
};

// DELETE_MESSAGE
const handleDeleteMessage = async (params: ApplyModerationActionParams) => {
    const { actorId, conversationId, messageId, reason } = params;

    const validMessageId = await ensureMessageExists(ModerationActionType.DELETE_MESSAGE, messageId);

    await softDeleteMessage(validMessageId, actorId);

    return createModerationAction(prisma, {
        action: ModerationActionType.DELETE_MESSAGE,
        actor: { connect: { id: actorId } },
        message: { connect: { id: validMessageId } },
        conversation: { connect: { id: conversationId } },
        reason,
    });
};

// MAKE_ADMIN
const handleMakeAdmin = async (params: ApplyModerationActionParams) => {
    const { actorId, conversationId, targetUserId, reason } = params;

    const validTargetUserId = await ensureTargetUserExists(ModerationActionType.MAKE_ADMIN, targetUserId);

    await updateMemberRole(conversationId, actorId, validTargetUserId, 'ADMIN');

    return createModerationAction(prisma, {
        action: ModerationActionType.MAKE_ADMIN,
        actor: { connect: { id: actorId } },
        targetUser: { connect: { id: validTargetUserId } },
        conversation: { connect: { id: conversationId } },
        reason,
    });
};

// REMOVE_ADMIN
const handleRemoveAdmin = async (params: ApplyModerationActionParams) => {
    const { actorId, conversationId, targetUserId, reason } = params;

    const validTargetUserId = await ensureTargetUserExists(ModerationActionType.REMOVE_ADMIN, targetUserId);

    await updateMemberRole(conversationId, actorId, validTargetUserId, 'MEMBER');

    return createModerationAction(prisma, {
        action: ModerationActionType.REMOVE_ADMIN,
        actor: { connect: { id: actorId } },
        targetUser: { connect: { id: validTargetUserId } },
        conversation: { connect: { id: conversationId } },
        reason,
    });
};

// Get active mute for user in conversation
export const getActiveMute = async (userId: string, conversationId: string) => {
    const now = new Date();

    const mute = await prisma.moderationAction.findFirst({
        where: {
            targetUserId: userId,
            conversationId,
            action: ModerationActionType.MUTE,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        orderBy: { createdAt: 'desc' },
    });

    if (!mute) {
        return null;
    }

    const unmute = await prisma.moderationAction.findFirst({
        where: {
            targetUserId: userId,
            conversationId,
            action: ModerationActionType.UNMUTE,
            createdAt: { gt: mute.createdAt },
        },
    });

    if (unmute) {
        return null;
    }

    return mute;
};

