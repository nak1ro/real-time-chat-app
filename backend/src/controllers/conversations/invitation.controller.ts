import {Request, Response} from 'express';
import {Server} from 'socket.io';
import {asyncHandler} from '../../middleware';
import * as invitationService from '../../services/conversations/invitation.service';
import {getUnreadCount} from '../../services';
import {notifyUser} from '../../sockets/handlers/socket.notifications';
import {SOCKET_EVENTS} from '../../sockets';

// Socket server instance (will be injected)
let io: Server;

export const setSocketServer = (server: Server) => {
    io = server;
};

/**
 * POST /conversations/:id/invitations
 * Invite members to a conversation (requires ADMIN or OWNER role)
 */
export const inviteMembersToConversation = asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = (req as any).user?.id;
    const {id: conversationId} = req.params;
    const {recipientIds} = req.body;

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'recipientIds must be a non-empty array',
        });
    }

    const {invitations, notifications} = await invitationService.createInvitations(
        conversationId,
        currentUserId,
        recipientIds
    );

    // Emit socket events for each notification
    if (io && notifications.length > 0) {
        for (const notification of notifications) {
            // Emit new notification event
            notifyUser(io, notification.userId, notification);

            // Get and emit updated unread count
            const count = await getUnreadCount(notification.userId);
            io.to(notification.userId).emit(SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, {count});
        }
    }

    res.status(201).json({
        status: 'success',
        data: {
            invitations,
            count: invitations.length,
        },
    });
});

/**
 * POST /invitations/:invitationId/accept
 * Accept an invitation to join a conversation
 */
export const acceptInvitation = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const {invitationId} = req.params;

    const result = await invitationService.acceptInvitation(invitationId, userId);

    // Emit updated unread count via socket
    if (io) {
        const count = await getUnreadCount(userId);
        io.to(userId).emit(SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, {count});
    }

    res.status(200).json({
        status: 'success',
        data: {
            conversationId: result.conversationId,
            conversation: result.conversation,
        },
    });
});

/**
 * POST /invitations/:invitationId/decline
 * Decline an invitation to join a conversation
 */
export const declineInvitation = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const {invitationId} = req.params;

    await invitationService.declineInvitation(invitationId, userId);

    // Emit updated unread count via socket
    if (io) {
        const count = await getUnreadCount(userId);
        io.to(userId).emit(SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, {count});
    }

    res.status(200).json({
        status: 'success',
        data: {
            message: 'Invitation declined successfully',
        },
    });
});
