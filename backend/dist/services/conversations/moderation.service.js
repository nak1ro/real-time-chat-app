"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveMute = exports.applyModerationAction = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../db/prisma");
const middleware_1 = require("../../middleware");
const permissions_service_1 = require("../users/permissions.service");
const message_service_1 = require("../messages/message.service");
const conversation_service_1 = require("./conversation.service");
const validation_helpers_1 = require("../../utils/validation-helpers");
const ensureModerationPreconditions = async (actorId, conversationId) => {
    const canModerate = await (0, permissions_service_1.canManageMembers)(actorId, conversationId);
    if (!canModerate) {
        throw new middleware_1.AuthorizationError('Only OWNER or ADMIN can perform moderation actions');
    }
    await (0, validation_helpers_1.verifyConversationExists)(conversationId);
};
const ensureTargetUserExists = async (action, targetUserId) => {
    if (!targetUserId) {
        throw new middleware_1.BadRequestError(`targetUserId is required for ${action} action`);
    }
    await (0, validation_helpers_1.verifyUserExists)(targetUserId);
    return targetUserId;
};
const ensureMessageExists = async (action, messageId) => {
    if (!messageId) {
        throw new middleware_1.BadRequestError(`messageId is required for ${action} action`);
    }
    await (0, validation_helpers_1.verifyMessageExists)(messageId);
    return messageId;
};
const createModerationAction = async (client, data) => {
    return client.moderationAction.create({ data });
};
// Public API
// Apply a moderation action
const applyModerationAction = async (params) => {
    const { actorId, action, conversationId } = params;
    await ensureModerationPreconditions(actorId, conversationId);
    switch (action) {
        case client_1.ModerationActionType.BAN:
            return handleBan(params);
        case client_1.ModerationActionType.UNBAN:
            return handleUnban(params);
        case client_1.ModerationActionType.MUTE:
            return handleMute(params);
        case client_1.ModerationActionType.UNMUTE:
            return handleUnmute(params);
        case client_1.ModerationActionType.DELETE_MESSAGE:
            return handleDeleteMessage(params);
        case client_1.ModerationActionType.MAKE_ADMIN:
            return handleMakeAdmin(params);
        case client_1.ModerationActionType.REMOVE_ADMIN:
            return handleRemoveAdmin(params);
        case client_1.ModerationActionType.KICK:
            throw new middleware_1.BadRequestError('KICK action not yet implemented');
        case client_1.ModerationActionType.PIN_MESSAGE:
            throw new middleware_1.BadRequestError('PIN_MESSAGE action not yet implemented');
        default:
            throw new middleware_1.BadRequestError(`Unknown moderation action: ${action}`);
    }
};
exports.applyModerationAction = applyModerationAction;
// Action Handlers
// BAN
const handleBan = async (params) => {
    const { actorId, conversationId, targetUserId, reason, expiresAt } = params;
    const validTargetUserId = await ensureTargetUserExists(client_1.ModerationActionType.BAN, targetUserId);
    const existingBan = await prisma_1.prisma.channelBan.findUnique({
        where: {
            userId_conversationId: {
                userId: validTargetUserId,
                conversationId,
            },
        },
    });
    if (existingBan) {
        throw new middleware_1.BadRequestError('User is already banned from this conversation');
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        await tx.channelBan.create({
            data: {
                userId: validTargetUserId,
                conversationId,
                reason,
                expiresAt,
            },
        });
        return createModerationAction(tx, {
            action: client_1.ModerationActionType.BAN,
            actor: { connect: { id: actorId } },
            targetUser: { connect: { id: validTargetUserId } },
            conversation: { connect: { id: conversationId } },
            reason,
            expiresAt,
        });
    });
};
// UNBAN
const handleUnban = async (params) => {
    const { actorId, conversationId, targetUserId, reason } = params;
    const validTargetUserId = await ensureTargetUserExists(client_1.ModerationActionType.UNBAN, targetUserId);
    const ban = await prisma_1.prisma.channelBan.findUnique({
        where: {
            userId_conversationId: {
                userId: validTargetUserId,
                conversationId,
            },
        },
    });
    if (!ban) {
        throw new middleware_1.BadRequestError('User is not banned from this conversation');
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        await tx.channelBan.delete({
            where: {
                userId_conversationId: {
                    userId: validTargetUserId,
                    conversationId,
                },
            },
        });
        return createModerationAction(tx, {
            action: client_1.ModerationActionType.UNBAN,
            actor: { connect: { id: actorId } },
            targetUser: { connect: { id: validTargetUserId } },
            conversation: { connect: { id: conversationId } },
            reason,
        });
    });
};
// MUTE
const handleMute = async (params) => {
    const { actorId, conversationId, targetUserId, reason, expiresAt } = params;
    const validTargetUserId = await ensureTargetUserExists(client_1.ModerationActionType.MUTE, targetUserId);
    return createModerationAction(prisma_1.prisma, {
        action: client_1.ModerationActionType.MUTE,
        actor: { connect: { id: actorId } },
        targetUser: { connect: { id: validTargetUserId } },
        conversation: { connect: { id: conversationId } },
        reason,
        expiresAt,
    });
};
// UNMUTE
const handleUnmute = async (params) => {
    const { actorId, conversationId, targetUserId, reason } = params;
    const validTargetUserId = await ensureTargetUserExists(client_1.ModerationActionType.UNMUTE, targetUserId);
    return createModerationAction(prisma_1.prisma, {
        action: client_1.ModerationActionType.UNMUTE,
        actor: { connect: { id: actorId } },
        targetUser: { connect: { id: validTargetUserId } },
        conversation: { connect: { id: conversationId } },
        reason,
    });
};
// DELETE_MESSAGE
const handleDeleteMessage = async (params) => {
    const { actorId, conversationId, messageId, reason } = params;
    const validMessageId = await ensureMessageExists(client_1.ModerationActionType.DELETE_MESSAGE, messageId);
    await (0, message_service_1.softDeleteMessage)(validMessageId, actorId);
    return createModerationAction(prisma_1.prisma, {
        action: client_1.ModerationActionType.DELETE_MESSAGE,
        actor: { connect: { id: actorId } },
        message: { connect: { id: validMessageId } },
        conversation: { connect: { id: conversationId } },
        reason,
    });
};
// MAKE_ADMIN
const handleMakeAdmin = async (params) => {
    const { actorId, conversationId, targetUserId, reason } = params;
    const validTargetUserId = await ensureTargetUserExists(client_1.ModerationActionType.MAKE_ADMIN, targetUserId);
    await (0, conversation_service_1.updateMemberRole)(conversationId, actorId, validTargetUserId, 'ADMIN');
    return createModerationAction(prisma_1.prisma, {
        action: client_1.ModerationActionType.MAKE_ADMIN,
        actor: { connect: { id: actorId } },
        targetUser: { connect: { id: validTargetUserId } },
        conversation: { connect: { id: conversationId } },
        reason,
    });
};
// REMOVE_ADMIN
const handleRemoveAdmin = async (params) => {
    const { actorId, conversationId, targetUserId, reason } = params;
    const validTargetUserId = await ensureTargetUserExists(client_1.ModerationActionType.REMOVE_ADMIN, targetUserId);
    await (0, conversation_service_1.updateMemberRole)(conversationId, actorId, validTargetUserId, 'MEMBER');
    return createModerationAction(prisma_1.prisma, {
        action: client_1.ModerationActionType.REMOVE_ADMIN,
        actor: { connect: { id: actorId } },
        targetUser: { connect: { id: validTargetUserId } },
        conversation: { connect: { id: conversationId } },
        reason,
    });
};
// Get active mute for user in conversation
const getActiveMute = async (userId, conversationId) => {
    const now = new Date();
    const mute = await prisma_1.prisma.moderationAction.findFirst({
        where: {
            targetUserId: userId,
            conversationId,
            action: client_1.ModerationActionType.MUTE,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        orderBy: { createdAt: 'desc' },
    });
    if (!mute) {
        return null;
    }
    const unmute = await prisma_1.prisma.moderationAction.findFirst({
        where: {
            targetUserId: userId,
            conversationId,
            action: client_1.ModerationActionType.UNMUTE,
            createdAt: { gt: mute.createdAt },
        },
    });
    if (unmute) {
        return null;
    }
    return mute;
};
exports.getActiveMute = getActiveMute;
