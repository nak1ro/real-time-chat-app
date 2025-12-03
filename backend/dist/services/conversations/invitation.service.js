"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.declineInvitation = exports.acceptInvitation = exports.createInvitations = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../db/prisma");
const middleware_1 = require("../../middleware");
const notification_service_1 = require("../messages/notification.service");
const conversation_service_1 = require("./conversation.service");
// Check if user is the target recipient of invitation
const verifyInvitationOwnership = (invitation, userId) => {
    if (invitation.recipientId !== userId) {
        throw new middleware_1.AuthorizationError('You can only accept your own invitations');
    }
};
// Validate invitation is still pending
const verifyInvitationPending = (invitation) => {
    if (invitation.status !== client_1.InvitationStatus.PENDING) {
        throw new middleware_1.BadRequestError(`Invitation is ${invitation.status.toLowerCase()}`);
    }
};
// Check if invitation has expired
const verifyInvitationNotExpired = (invitation) => {
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
        throw new middleware_1.BadRequestError('Invitation has expired');
    }
};
// Check if recipient already exists as member
const checkExistingMembership = async (recipientId, conversationId) => {
    const existing = await prisma_1.prisma.conversationMember.findUnique({
        where: {
            userId_conversationId: {
                userId: recipientId,
                conversationId,
            },
        },
    });
    return !!existing;
};
// Verify recipient user exists
const verifyRecipientExists = async (recipientId) => {
    const recipient = await prisma_1.prisma.user.findUnique({
        where: { id: recipientId },
    });
    if (!recipient) {
        return null;
    }
    return recipient;
};
// Get or create notification for invitation
const getOrCreateInvitationNotification = async (invitation, actor, conversation, recipientId) => {
    const existingNotification = await prisma_1.prisma.notification.findUnique({
        where: { invitationId: invitation.id },
    });
    const { title, body } = (0, notification_service_1.buildNotificationContent)('CONVERSATION_INVITE', actor.name, { conversationName: conversation.name });
    if (existingNotification) {
        return prisma_1.prisma.notification.update({
            where: { id: existingNotification.id },
            data: {
                isRead: false,
                title,
                body,
                actorId: actor.id,
                createdAt: new Date(),
            },
            include: {
                actor: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                conversation: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                message: {
                    select: {
                        id: true,
                        text: true,
                    },
                },
            },
        });
    }
    return (0, notification_service_1.createNotification)({
        userId: recipientId,
        type: 'CONVERSATION_INVITE',
        title,
        body,
        conversationId: conversation.id,
        actorId: actor.id,
        invitationId: invitation.id,
    });
};
// Create invitations for multiple recipients to join a conversation
const createInvitations = async (conversationId, actorId, recipientIds) => {
    const conversation = await (0, conversation_service_1.findConversationWithBasicMembers)(conversationId);
    (0, conversation_service_1.verifyUserMembershipAndRole)(conversation, actorId, [client_1.MemberRole.ADMIN, client_1.MemberRole.OWNER]);
    const actor = await prisma_1.prisma.user.findUnique({
        where: { id: actorId },
        select: { id: true, name: true },
    });
    if (!actor) {
        throw new middleware_1.NotFoundError('Actor user not found');
    }
    const invitations = [];
    const notifications = [];
    for (const recipientId of recipientIds) {
        if (recipientId === actorId) {
            continue;
        }
        const recipient = await verifyRecipientExists(recipientId);
        if (!recipient) {
            continue;
        }
        const isMember = await checkExistingMembership(recipientId, conversationId);
        if (isMember) {
            continue;
        }
        const invitation = await prisma_1.prisma.conversationInvitation.upsert({
            where: {
                conversationId_recipientId: {
                    conversationId,
                    recipientId,
                },
            },
            update: {
                status: client_1.InvitationStatus.PENDING,
                senderId: actorId,
                createdAt: new Date(),
            },
            create: {
                conversationId,
                senderId: actorId,
                recipientId,
                status: client_1.InvitationStatus.PENDING,
            },
        });
        invitations.push(invitation);
        const notification = await getOrCreateInvitationNotification(invitation, actor, conversation, recipientId);
        notifications.push(notification);
    }
    return { invitations, notifications };
};
exports.createInvitations = createInvitations;
// Accept an invitation to join a conversation
const acceptInvitation = async (invitationId, userId) => {
    const invitation = await prisma_1.prisma.conversationInvitation.findUnique({
        where: { id: invitationId },
        include: {
            conversation: true,
        },
    });
    if (!invitation) {
        throw new middleware_1.NotFoundError('Invitation not found');
    }
    verifyInvitationOwnership(invitation, userId);
    verifyInvitationPending(invitation);
    verifyInvitationNotExpired(invitation);
    await prisma_1.prisma.$transaction(async (tx) => {
        await tx.conversationMember.upsert({
            where: {
                userId_conversationId: {
                    userId,
                    conversationId: invitation.conversationId,
                },
            },
            update: {},
            create: {
                userId,
                conversationId: invitation.conversationId,
                role: client_1.MemberRole.MEMBER,
            },
        });
        await tx.conversationInvitation.update({
            where: { id: invitationId },
            data: { status: client_1.InvitationStatus.ACCEPTED },
        });
        await tx.notification.updateMany({
            where: {
                userId,
                invitationId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    });
    return {
        conversationId: invitation.conversationId,
        conversation: invitation.conversation,
    };
};
exports.acceptInvitation = acceptInvitation;
// Decline an invitation to join a conversation
const declineInvitation = async (invitationId, userId) => {
    const invitation = await prisma_1.prisma.conversationInvitation.findUnique({
        where: { id: invitationId },
    });
    if (!invitation) {
        throw new middleware_1.NotFoundError('Invitation not found');
    }
    verifyInvitationOwnership(invitation, userId);
    verifyInvitationPending(invitation);
    await prisma_1.prisma.$transaction(async (tx) => {
        await tx.conversationInvitation.update({
            where: { id: invitationId },
            data: { status: client_1.InvitationStatus.DECLINED },
        });
        await tx.notification.updateMany({
            where: {
                userId,
                invitationId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    });
};
exports.declineInvitation = declineInvitation;
