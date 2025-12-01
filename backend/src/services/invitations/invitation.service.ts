import { prisma } from '../../db/prisma';
import { BadRequestError, NotFoundError, AuthorizationError } from '../../middleware';
import { createNotification } from '../messages/notification.service';
import { InvitationStatus, MemberRole } from '@prisma/client';
import { canManageMembers } from '../users/permissions.service';
import { notifyUser } from '../../sockets/handlers/socket.notifications';
import { io } from '../../app'; // Assuming io is exported from app.ts, otherwise we might need to pass it or use a singleton

export const createInvitations = async (
    conversationId: string,
    inviterId: string,
    userIds: string[]
) => {
    // Verify permissions
    const canManage = await canManageMembers(inviterId, conversationId);
    if (!canManage) {
        throw new AuthorizationError('Only OWNER or ADMIN can invite members');
    }

    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { members: true }
    });

    if (!conversation) throw new NotFoundError('Conversation');

    // Filter existing members
    const existingMemberIds = new Set(conversation.members.map(m => m.userId));
    const nonMemberIds = userIds.filter(id => !existingMemberIds.has(id));

    if (nonMemberIds.length === 0) {
        throw new BadRequestError('All users are already members');
    }

    // Filter users with existing pending invitations
    const existingInvitations = await prisma.conversationInvitation.findMany({
        where: {
            conversationId,
            recipientId: { in: nonMemberIds }, // Changed from inviteeId
            status: InvitationStatus.PENDING
        }
    });

    const alreadyInvitedIds = new Set(existingInvitations.map(i => i.recipientId)); // Changed from inviteeId
    const finalUserIds = nonMemberIds.filter(id => !alreadyInvitedIds.has(id));

    if (finalUserIds.length === 0) {
        return existingInvitations;
    }

    // Create invitations
    const invitations = await prisma.$transaction(
        finalUserIds.map(userId =>
            prisma.conversationInvitation.create({
                data: {
                    conversationId,
                    senderId: inviterId, // Changed from inviterId
                    recipientId: userId, // Changed from inviteeId
                    status: InvitationStatus.PENDING
                }
            })
        )
    );

    // Create notifications
    const inviter = await prisma.user.findUnique({ where: { id: inviterId } });

    // Create notifications in background
    Promise.all(invitations.map(async (invitation) => {
        try {
            const notification = await createNotification({
                userId: invitation.recipientId, // Changed from inviteeId
                type: 'CONVERSATION_INVITE',
                title: `You were invited to ${conversation.name}`,
                body: `${inviter?.name || 'Someone'} invited you to join ${conversation.name}`,
                conversationId,
                actorId: inviterId,
                messageId: undefined,
                invitationId: invitation.id // Link to invitation
            });

            // Emit real-time notification if io instance is available
            // Note: This requires access to the io instance. 
            // If not available here, we rely on the client polling or other mechanisms.
            // Ideally, we should inject io or use a global instance.
        } catch (error) {
            console.error('Failed to create invitation notification', error);
        }
    }));

    return invitations;
};

export const acceptInvitation = async (invitationId: string, userId: string) => {
    // Find pending invitation
    const invitation = await prisma.conversationInvitation.findUnique({
        where: { id: invitationId },
        include: { notification: true }
    });

    if (!invitation) {
        throw new NotFoundError('Invitation not found');
    }

    if (invitation.recipientId !== userId) {
        throw new AuthorizationError('This invitation is not for you');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestError(`Invitation is already ${invitation.status.toLowerCase()}`);
    }

    // Add member and update invitation status
    await prisma.$transaction([
        prisma.conversationMember.create({
            data: {
                conversationId: invitation.conversationId,
                userId,
                role: MemberRole.MEMBER
            }
        }),
        prisma.conversationInvitation.update({
            where: { id: invitation.id },
            data: { status: InvitationStatus.ACCEPTED }
        }),
        // Mark notification as read
        ...(invitation.notification ? [
            prisma.notification.update({
                where: { id: invitation.notification.id },
                data: { isRead: true, readAt: new Date() }
            })
        ] : [])
    ]);

    return { conversationId: invitation.conversationId };
};

export const declineInvitation = async (invitationId: string, userId: string) => {
    const invitation = await prisma.conversationInvitation.findUnique({
        where: { id: invitationId },
        include: { notification: true }
    });

    if (!invitation) {
        throw new NotFoundError('Invitation not found');
    }

    if (invitation.recipientId !== userId) {
        throw new AuthorizationError('This invitation is not for you');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestError(`Invitation is already ${invitation.status.toLowerCase()}`);
    }

    await prisma.$transaction([
        prisma.conversationInvitation.update({
            where: { id: invitation.id },
            data: { status: InvitationStatus.DECLINED } // Changed from REJECTED
        }),
        // Mark notification as read
        ...(invitation.notification ? [
            prisma.notification.update({
                where: { id: invitation.notification.id },
                data: { isRead: true, readAt: new Date() }
            })
        ] : [])
    ]);

    return { success: true };
};
