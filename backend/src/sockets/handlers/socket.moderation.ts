import { Server } from 'socket.io';
import { AuthenticatedSocket, SocketResponse } from '../core/socket.types';
import { applyModerationAction } from '../../services/conversations/moderation.service';
import { ModerationActionType } from '@prisma/client';
import {
    SOCKET_EVENTS,
    createSuccessResponse,
    createErrorResponse,
    invokeCallback,
    getErrorMessage,
} from '../core/socket.utils';

// Moderation action data structure
interface ModerationActionData {
    conversationId: string;
    action: ModerationActionType;
    targetUserId?: string;
    messageId?: string;
    reason?: string;
    expiresAt?: string;
}

// Moderation update payload for broadcasting
interface ModerationUpdatePayload {
    action: ModerationActionType;
    conversationId: string;
    targetUserId?: string;
    messageId?: string;
    actorId: string;
    actorName: string;
    reason?: string;
    expiresAt?: Date | null;
}

// Handle moderation:action event
export const handleModerationAction = async (
    io: Server,
    socket: AuthenticatedSocket,
    data: ModerationActionData,
    callback?: (response: SocketResponse<{ message: string }>) => void
): Promise<void> => {
    const { userId, userName } = socket.data;

    try {
        console.log(`[Socket Moderation] User ${userName} (${userId}) applying ${data.action} in conversation ${data.conversationId}`);

        // Apply moderation action through existing service
        await applyModerationAction({
            actorId: userId,
            action: data.action,
            conversationId: data.conversationId,
            targetUserId: data.targetUserId,
            messageId: data.messageId,
            reason: data.reason,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        });

        // Prepare broadcast payload
        const updatePayload: ModerationUpdatePayload = {
            action: data.action,
            conversationId: data.conversationId,
            targetUserId: data.targetUserId,
            messageId: data.messageId,
            actorId: userId,
            actorName: userName,
            reason: data.reason,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        };

        // Broadcast to conversation room
        io.to(data.conversationId).emit(SOCKET_EVENTS.MODERATION_UPDATED, updatePayload);

        console.log(`[Socket Moderation] Action ${data.action} applied successfully, broadcasted to conversation ${data.conversationId}`);

        // Send success response
        invokeCallback(
            callback,
            createSuccessResponse({ message: `Moderation action ${data.action} applied successfully` })
        );
    } catch (error) {
        console.error('[Socket Moderation] Failed to apply moderation action:', error);
        invokeCallback(
            callback,
            createErrorResponse(getErrorMessage(error, 'Failed to apply moderation action'))
        );
    }
};
