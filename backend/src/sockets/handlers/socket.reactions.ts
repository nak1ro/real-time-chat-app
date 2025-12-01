import { Server } from 'socket.io';
import { AuthenticatedSocket, SocketResponse } from '../core/socket.types';
import { toggleReaction } from '../../services/messages/reaction.service';
import {
    SOCKET_EVENTS,
    createSuccessResponse,
    createErrorResponse,
    invokeCallback,
    getErrorMessage,
} from '../core/socket.utils';
import { prisma } from '../../db/prisma';
import { createNotification } from '../../services/messages/notification.service';
import { notifyUser } from './socket.notifications';

export const handleToggleReaction = async (
    io: Server,
    socket: AuthenticatedSocket,
    data: { messageId: string; emoji: string },
    callback?: (response: SocketResponse<{ action: 'added' | 'removed' }>) => void
): Promise<void> => {
    const { userId } = socket.data;
    const { messageId, emoji } = data;

    try {
        // Toggle reaction
        const result = await toggleReaction({ userId, messageId, emoji });

        // Get message details for broadcasting and notifications
        const message = await prisma.message.findUnique({
            where: { id: messageId },
            select: {
                conversationId: true,
                userId: true, // Message author ID
                text: true,
            },
        });

        if (message) {
            // Broadcast update to conversation
            io.to(message.conversationId).emit(SOCKET_EVENTS.REACTION_UPDATED, {
                messageId,
                emoji,
                userId,
                action: result.action,
            });

            // Create notification if:
            // 1. Reaction was added (not removed)
            // 2. Reactor is NOT the message author (don't notify yourself)
            if (result.action === 'added' && message.userId !== userId) {
                try {
                    // Get reactor's name
                    const reactor = await prisma.user.findUnique({
                        where: { id: userId },
                        select: { name: true },
                    });

                    const notification = await createNotification({
                        userId: message.userId, // Notify the message author
                        type: 'REACTION',
                        title: `${reactor?.name || 'Someone'} reacted to your message`,
                        body: `${emoji} · ${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}`,
                        conversationId: message.conversationId,
                        messageId: messageId,
                        actorId: userId,
                    });

                    // Emit notification to message author
                    notifyUser(io, message.userId, notification);
                } catch (notifError) {
                    console.error('Failed to create reaction notification:', notifError);
                    // Don't fail the reaction if notification fails
                }
            }
        }

        invokeCallback(callback, createSuccessResponse(result));
    } catch (error) {
        console.error(`Failed to toggle reaction for user ${userId}:`, error);
        invokeCallback(
            callback,
            createErrorResponse(getErrorMessage(error, 'Failed to toggle reaction'))
        );
    }
};
