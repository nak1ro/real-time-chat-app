import { MemberRole, InvitationStatus } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { NotFoundError, AuthorizationError, BadRequestError } from '../../middleware';
import { createNotification, buildNotificationContent } from '../messages/notification.service';
import {
    findConversationWithBasicMembers,
    verifyUserMembershipAndRole,
} from './conversation.service';

export interface CreateInvitationsResult {
    invitations: any[];
    notifications: any[];
}

export interface AcceptInvitationResult {
    conversationId: string;
    conversation: any;
}

// Check if user is the target recipient of invitation
const verifyInvitationOwnership = (invitation: { recipientId: string }, userId: string): void => {
    if (invitation.recipientId !== userId) {
        throw new AuthorizationError('You can only accept your own invitations');
    }
};

// Validate invitation is still pending
const verifyInvitationPending = (invitation: { status: InvitationStatus }): void => {
    if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestError(`Invitation is ${invitation.status.toLowerCase()}`);
    }
};

// Check if invitation has expired
const verifyInvitationNotExpired = (invitation: { expiresAt: Date | null }): void => {
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
        throw new BadRequestError('Invitation has expired');
    }
};

// Check if recipient already exists as member
const checkExistingMembership = async (
    recipientId: string,
    conversationId: string
): Promise<boolean> => {
    const existing = await prisma.conversationMember.findUnique({
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
const verifyRecipientExists = async (recipientId: string): Promise<any> => {
    const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
    });

    if (!recipient) {
        return null;
    }

    return recipient;
};

// Get or create notification for invitation
const getOrCreateInvitationNotification = async (
    invitation: any,
    actor: any,
    conversation: any,
    recipientId: string
): Promise<any> => {
    const existingNotification = await prisma.notification.findUnique({
        where: { invitationId: invitation.id },
    });

    const { title, body } = buildNotificationContent(
        'CONVERSATION_INVITE',
        actor.name,
        { conversationName: conversation.name }
    );

    if (existingNotification) {
        return prisma.notification.update({
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

    return createNotification({
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
export const createInvitations = async (
    conversationId: string,
    actorId: string,
    recipientIds: string[]
): Promise<CreateInvitationsResult> => {
    const conversation = await findConversationWithBasicMembers(conversationId);
    verifyUserMembershipAndRole(conversation, actorId, [MemberRole.ADMIN, MemberRole.OWNER]);

    const actor = await prisma.user.findUnique({
        where: { id: actorId },
        select: { id: true, name: true },
    });

    if (!actor) {
        throw new NotFoundError('Actor user not found');
    }

    const invitations: any[] = [];
    const notifications: any[] = [];

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

        const notification = await getOrCreateInvitationNotification(
            invitation,
            actor,
            conversation,
            recipientId
        );

        notifications.push(notification);
    }

    return { invitations, notifications };
};

// Accept an invitation to join a conversation
export const acceptInvitation = async (
    invitationId: string,
    userId: string
): Promise<AcceptInvitationResult> => {
    const invitation = await prisma.conversationInvitation.findUnique({
        where: { id: invitationId },
        include: {
            conversation: true,
        },
    });

    if (!invitation) {
        throw new NotFoundError('Invitation not found');
    }

    verifyInvitationOwnership(invitation, userId);
    verifyInvitationPending(invitation);
    verifyInvitationNotExpired(invitation);

    await prisma.$transaction(async (tx) => {
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

        await tx.conversationInvitation.update({
            where: { id: invitationId },
            data: { status: InvitationStatus.ACCEPTED },
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

// Decline an invitation to join a conversation
export const declineInvitation = async (
    invitationId: string,
    userId: string
): Promise<void> => {
    const invitation = await prisma.conversationInvitation.findUnique({
        where: { id: invitationId },
    });

    if (!invitation) {
        throw new NotFoundError('Invitation not found');
    }

    verifyInvitationOwnership(invitation, userId);
    verifyInvitationPending(invitation);

    await prisma.$transaction(async (tx) => {
        await tx.conversationInvitation.update({
            where: { id: invitationId },
            data: { status: InvitationStatus.DECLINED },
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
