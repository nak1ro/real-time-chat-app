"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canModerateMessage = exports.canManageMembers = exports.canSendMessage = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../db/prisma");
// Constants
const ELEVATED_ROLES = [client_1.MemberRole.OWNER, client_1.MemberRole.ADMIN];
// Helper Functions
// Get user's membership in a conversation or null if not a member
const getUserMembership = async (userId, conversationId) => {
    return await prisma_1.prisma.conversationMember.findFirst({
        where: { userId, conversationId },
    });
};
// Check if user has an active ban in the conversation
const getActiveBan = async (userId, conversationId) => {
    const now = new Date();
    return await prisma_1.prisma.channelBan.findFirst({
        where: {
            userId,
            conversationId,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: now } },
            ],
        },
    });
};
// Check if user has an active mute in the conversation
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
// Get conversation read-only status or null if not found
const getConversationReadOnlyStatus = async (conversationId) => {
    const conversation = await prisma_1.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { isReadOnly: true },
    });
    return conversation?.isReadOnly ?? null;
};
// Check if role is elevated (OWNER or ADMIN)
const hasElevatedRole = (role) => {
    return ELEVATED_ROLES.includes(role);
};
// Check if user is message author
const isMessageAuthor = (messageUserId, actorId) => {
    return messageUserId === actorId;
};
// Public Permission Helpers
// Check if a user can send messages in a conversation
const canSendMessage = async (userId, conversationId) => {
    const membership = await getUserMembership(userId, conversationId);
    if (!membership) {
        return false;
    }
    const ban = await getActiveBan(userId, conversationId);
    if (ban) {
        return false;
    }
    const mute = await getActiveMute(userId, conversationId);
    if (mute) {
        return false;
    }
    const isReadOnly = await getConversationReadOnlyStatus(conversationId);
    if (isReadOnly === null) {
        return false;
    }
    if (isReadOnly && !hasElevatedRole(membership.role)) {
        return false;
    }
    return true;
};
exports.canSendMessage = canSendMessage;
// Check if an actor can manage members in a conversation
const canManageMembers = async (actorId, conversationId) => {
    const membership = await getUserMembership(actorId, conversationId);
    if (!membership) {
        return false;
    }
    return hasElevatedRole(membership.role);
};
exports.canManageMembers = canManageMembers;
// Check if an actor can moderate a message
const canModerateMessage = async (actorId, messageId) => {
    const message = await prisma_1.prisma.message.findUnique({
        where: { id: messageId },
        select: {
            userId: true,
            conversationId: true,
        },
    });
    if (!message) {
        return false;
    }
    if (isMessageAuthor(message.userId, actorId)) {
        return true;
    }
    const membership = await getUserMembership(actorId, message.conversationId);
    if (!membership) {
        return false;
    }
    return hasElevatedRole(membership.role);
};
exports.canModerateMessage = canModerateMessage;
