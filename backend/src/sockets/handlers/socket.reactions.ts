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

        // Get conversationId for broadcasting
        const message = await prisma.message.findUnique({
            where: { id: messageId },
            select: { conversationId: true },
        });

        if (message) {
            // Broadcast update
            io.to(message.conversationId).emit(SOCKET_EVENTS.REACTION_UPDATED, {
                messageId,
                emoji,
                userId,
                action: result.action,
            });
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
