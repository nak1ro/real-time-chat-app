import { MemberRole, InvitationStatus } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { NotFoundError, AuthorizationError, BadRequestError } from '../../middleware';
import { createNotification, buildNotificationContent, getUnreadCount } from '../messages/notification.service';
import {
    findConversationWithBasicMembers,
    verifyUserMembershipAndRole,
} from './conversation.service';

// Type definitions
export interface CreateInvitationsResult {
    invitations: any[];
    notifications: any[];
}

export interface AcceptInvitationResult {
    conversationId: string;
    conversation: any;
}

/**
 * Create invitations for multiple recipients to join a conversation
 * Only ADMIN or OWNER can create invitations
 */
export const createInvitations = async (
    conversationId: string,
    actorId: string,
    recipientIds: string[]
): Promise<CreateInvitationsResult> => {
    // Validate that actorId is a member with ADMIN or OWNER role
    const conversation = await findConversationWithBasicMembers(conversationId);
    verifyUserMembershipAndRole(conversation, actorId, [MemberRole.ADMIN, MemberRole.OWNER]);

    // Get actor details for notification
    const actor = await prisma.user.findUnique({
        where: { id: actorId },
        select: { id: true, name: true },
    });

    if (!actor) {
        throw new NotFoundError('Actor user not found');
    }

    const invitations: any[] = [];
    const notifications: any[] = [];

    // Process each recipient
    for (const recipientId of recipientIds) {
        // Skip if recipient is the actor
        if (recipientId === actorId) {
            continue;
        }

        // Check if user exists
        const recipient = await prisma.user.findUnique({
            where: { id: recipientId },
        });

        if (!recipient) {
            continue; // Skip non-existent users
        }

        // Check if user is already a member
        const existingMembership = await prisma.conversationMember.findUnique({
            where: {
                userId_conversationId: {
                    userId: recipientId,
                    conversationId,
                },
            },
        });

        if (existingMembership) {
            continue; // Skip users who are already members
        }

        // Upsert invitation (handle unique constraint [conversationId, recipientId])
        const invitation = await prisma.conversationInvitation.upsert({
            where: {
                conversationId_recipientId: {
                    conversationId,
                    recipientId,
                },
            },
            update: {
                status: InvitationStatus.PENDING,
                senderId: actorId,
                createdAt: new Date(),
            },
            create: {
                conversationId,
                senderId: actorId,
                recipientId,
                status: InvitationStatus.PENDING,
            },
        });

        invitations.push(invitation);

        // Create notification for the invitation
        const { title, body } = buildNotificationContent(
            'CONVERSATION_INVITE',
            actor.name,
            { conversationName: conversation.name }
        );

        const notification = await createNotification({
            userId: recipientId,
            type: 'CONVERSATION_INVITE',
            title,
            body,
            conversationId,
            actorId,
            invitationId: invitation.id,
        });

        notifications.push(notification);
    }

    return { invitations, notifications };
};

/**
 * Accept an invitation to join a conversation
 */
export const acceptInvitation = async (
    invitationId: string,
    userId: string
): Promise<AcceptInvitationResult> => {
    // Load the invitation with conversation
    const invitation = await prisma.conversationInvitation.findUnique({
        where: { id: invitationId },
        include: {
            conversation: true,
        },
    });

    if (!invitation) {
        throw new NotFoundError('Invitation not found');
    }

    // Ensure invitation belongs to the user
    if (invitation.recipientId !== userId) {
        throw new AuthorizationError('You can only accept your own invitations');
    }

    // Ensure invitation is still pending
    if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestError(`Invitation is ${invitation.status.toLowerCase()}`);
    }

    // Check if invitation has expired
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
        throw new BadRequestError('Invitation has expired');
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
        // Upsert ConversationMember (in case somehow already exists)
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
                role: MemberRole.MEMBER,
            },
        });

        // Update invitation status
        await tx.conversationInvitation.update({
            where: { id: invitationId },
            data: { status: InvitationStatus.ACCEPTED },
        });

        // Mark related notifications as read
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

/**
 * Decline an invitation to join a conversation
 */
export const declineInvitation = async (
    invitationId: string,
    userId: string
): Promise<void> => {
    // Load the invitation
    const invitation = await prisma.conversationInvitation.findUnique({
        where: { id: invitationId },
    });

    if (!invitation) {
        throw new NotFoundError('Invitation not found');
    }

    // Ensure invitation belongs to the user
    if (invitation.recipientId !== userId) {
        throw new AuthorizationError('You can only decline your own invitations');
    }

    // Ensure invitation is still pending
    if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestError(`Invitation is ${invitation.status.toLowerCase()}`);
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
        // Update invitation status
        await tx.conversationInvitation.update({
            where: { id: invitationId },
            data: { status: InvitationStatus.DECLINED },
        });

        // Mark related notifications as read
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
