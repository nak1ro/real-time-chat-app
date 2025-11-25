"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredModerations = exports.getActiveMute = exports.applyModerationAction = void 0;
const prisma_1 = require("../db/prisma");
const middleware_1 = require("../middleware");
const permissions_service_1 = require("./permissions.service");
const message_service_1 = require("./message.service");
const conversation_service_1 = require("./conversation.service");
const validation_helpers_1 = require("../utils/validation-helpers");
// Public API
// Apply a moderation action
const applyModerationAction = async (params) => {
    const { actorId, action, conversationId, targetUserId, messageId, reason, expiresAt } = params;
    // Verify actor has permission to perform moderation
    const canModerate = await (0, permissions_service_1.canManageMembers)(actorId, conversationId);
    if (!canModerate) {
        throw new middleware_1.AuthorizationError('Only OWNER or ADMIN can perform moderation actions');
    }
    // Verify conversation exists
    await (0, validation_helpers_1.verifyConversationExists)(conversationId);
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
            throw new middleware_1.BadRequestError('KICK action not yet implemented');
        case 'PIN_MESSAGE':
            throw new middleware_1.BadRequestError('PIN_MESSAGE action not yet implemented');
        default:
            throw new middleware_1.BadRequestError(`Unknown moderation action: ${action}`);
    }
};
exports.applyModerationAction = applyModerationAction;
// Action Handlers
// BAN - Create channel ban
const handleBan = async (params) => {
    const { actorId, conversationId, targetUserId, reason, expiresAt } = params;
    if (!targetUserId) {
        throw new middleware_1.BadRequestError('targetUserId is required for BAN action');
    }
    await (0, validation_helpers_1.verifyUserExists)(targetUserId);
    // Check if user is already banned
    const existingBan = await prisma_1.prisma.channelBan.findUnique({
        where: {
            userId_conversationId: {
                userId: targetUserId,
                conversationId,
            },
        },
    });
    if (existingBan) {
        throw new middleware_1.BadRequestError('User is already banned from this conversation');
    }
    // Create ban and moderation action in transaction
    return await prisma_1.prisma.$transaction(async (tx) => {
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
const handleUnban = async (params) => {
    const { actorId, conversationId, targetUserId, reason } = params;
    if (!targetUserId) {
        throw new middleware_1.BadRequestError('targetUserId is required for UNBAN action');
    }
    await (0, validation_helpers_1.verifyUserExists)(targetUserId);
    // Find active ban
    const ban = await prisma_1.prisma.channelBan.findUnique({
        where: {
            userId_conversationId: {
                userId: targetUserId,
                conversationId,
            },
        },
    });
    if (!ban) {
        throw new middleware_1.BadRequestError('User is not banned from this conversation');
    }
    // Delete ban and create moderation action
    return await prisma_1.prisma.$transaction(async (tx) => {
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
const handleMute = async (params) => {
    const { actorId, conversationId, targetUserId, reason, expiresAt } = params;
    if (!targetUserId) {
        throw new middleware_1.BadRequestError('targetUserId is required for MUTE action');
    }
    await (0, validation_helpers_1.verifyUserExists)(targetUserId);
    // Create moderation action
    return await prisma_1.prisma.moderationAction.create({
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
const handleUnmute = async (params) => {
    const { actorId, conversationId, targetUserId, reason } = params;
    if (!targetUserId) {
        throw new middleware_1.BadRequestError('targetUserId is required for UNMUTE action');
    }
    await (0, validation_helpers_1.verifyUserExists)(targetUserId);
    // Create moderation action (unmute is recorded as action)
    return await prisma_1.prisma.moderationAction.create({
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
const handleDeleteMessage = async (params) => {
    const { actorId, conversationId, messageId, reason } = params;
    if (!messageId) {
        throw new middleware_1.BadRequestError('messageId is required for DELETE_MESSAGE action');
    }
    await (0, validation_helpers_1.verifyMessageExists)(messageId);
    // Delete message and create moderation action
    await (0, message_service_1.softDeleteMessage)(messageId, actorId);
    // Create moderation action record
    return await prisma_1.prisma.moderationAction.create({
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
const handleMakeAdmin = async (params) => {
    const { actorId, conversationId, targetUserId, reason } = params;
    if (!targetUserId) {
        throw new middleware_1.BadRequestError('targetUserId is required for MAKE_ADMIN action');
    }
    await (0, validation_helpers_1.verifyUserExists)(targetUserId);
    // Update role through conversation service (handles hierarchy)
    await (0, conversation_service_1.updateMemberRole)(conversationId, actorId, targetUserId, 'ADMIN');
    // Create moderation action record
    return await prisma_1.prisma.moderationAction.create({
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
const handleRemoveAdmin = async (params) => {
    const { actorId, conversationId, targetUserId, reason } = params;
    if (!targetUserId) {
        throw new middleware_1.BadRequestError('targetUserId is required for REMOVE_ADMIN action');
    }
    await (0, validation_helpers_1.verifyUserExists)(targetUserId);
    // Update role through conversation service (handles hierarchy)
    await (0, conversation_service_1.updateMemberRole)(conversationId, actorId, targetUserId, 'MEMBER');
    // Create moderation action record
    return await prisma_1.prisma.moderationAction.create({
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
const getActiveMute = async (userId, conversationId) => {
    const now = new Date();
    // Find latest MUTE action
    const mute = await prisma_1.prisma.moderationAction.findFirst({
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
    const unmute = await prisma_1.prisma.moderationAction.findFirst({
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
exports.getActiveMute = getActiveMute;
// Clean up expired channel bans
const cleanupExpiredModerations = async () => {
    const now = new Date();
    // Delete expired channel bans
    const deletedBans = await prisma_1.prisma.channelBan.deleteMany({
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
exports.cleanupExpiredModerations = cleanupExpiredModerations;
