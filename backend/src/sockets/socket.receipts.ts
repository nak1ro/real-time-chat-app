import { Server } from 'socket.io';
import { MessageDeliveryStatus } from '@prisma/client';
import { AuthenticatedSocket, SocketResponse } from './socket.types';
import {
    markMessagesAsRead,
    markMessageAsDelivered,
    getMessageReadStats,
} from '../services/receipt.service';
import {
    ReceiptUpdatePayload,
    BulkReceiptUpdate,
    MessageReadStats,
} from '../domain/receipt.types';
import {
    SOCKET_EVENTS,
    createSuccessResponse,
    createErrorResponse,
    invokeCallback,
    getErrorMessage,
} from './socket.utils';

// Helper Functions - Payload Creation

// Create single receipt update payload
const createReceiptUpdatePayload = (
    conversationId: string,
    messageId: string,
    userId: string,
    status: MessageDeliveryStatus,
    seenAt: Date | null
): ReceiptUpdatePayload => ({
    conversationId,
    messageId,
    userId,
    status,
    seenAt,
    timestamp: new Date(),
});

// Create bulk receipt update payload
const createBulkReceiptUpdatePayload = (
    conversationId: string,
    userId: string,
    lastReadMessageId: string,
    messagesAffected: number
): BulkReceiptUpdate => ({
    conversationId,
    userId,
    lastReadMessageId,
    messagesAffected,
    timestamp: new Date(),
});

// Helper Functions - Broadcasting

// Broadcast receipt update to conversation room
const broadcastToConversation = (
    io: Server,
    conversationId: string,
    payload: ReceiptUpdatePayload | BulkReceiptUpdate
): void => {
    io.to(conversationId).emit(SOCKET_EVENTS.RECEIPT_UPDATE, payload);
};

// Broadcast bulk read update
const broadcastBulkReadUpdate = (
    io: Server,
    conversationId: string,
    userId: string,
    lastMessageId: string,
    messagesAffected: number
): void => {
    const payload = createBulkReceiptUpdatePayload(
        conversationId,
        userId,
        lastMessageId,
        messagesAffected
    );

    broadcastToConversation(io, conversationId, payload);
};

// Broadcast single delivery update
const broadcastDeliveryUpdate = (
    io: Server,
    conversationId: string,
    messageId: string,
    userId: string
): void => {
    const payload = createReceiptUpdatePayload(
        conversationId,
        messageId,
        userId,
        MessageDeliveryStatus.DELIVERED,
        null
    );

    broadcastToConversation(io, conversationId, payload);
};

// Helper Functions - Result Processing

// Check if read result should be broadcast
const shouldBroadcastReadResult = (result: {
    messagesAffected: number;
    lastMessageId: string | null;
}): result is { messagesAffected: number; lastMessageId: string } => {
    return result.messagesAffected > 0 && result.lastMessageId !== null;
};

// Public API - Event Handlers

// Handle marking messages as read
export const handleMarkAsRead = async (
    io: Server,
    socket: AuthenticatedSocket,
    data: { conversationId: string; upToMessageId?: string },
    callback?: (
        response: SocketResponse<{
            messagesAffected: number;
            lastMessageId: string | null;
        }>
    ) => void
): Promise<void> => {
    const { userId } = socket.data;
    const { conversationId, upToMessageId } = data;

    try {
        const result = await markMessagesAsRead(conversationId, userId, upToMessageId);

        if (shouldBroadcastReadResult(result)) {
            broadcastBulkReadUpdate(
                io,
                conversationId,
                userId,
                result.lastMessageId,
                result.messagesAffected
            );
        }

        invokeCallback(callback, createSuccessResponse(result));
    } catch (error) {
        console.error(`Failed to mark messages as read for user ${userId}:`, error);
        invokeCallback(
            callback,
            createErrorResponse(getErrorMessage(error, 'Failed to mark messages as read'))
        );
    }
};

// Handle marking a single message as delivered
export const handleMarkAsDelivered = async (
    io: Server,
    socket: AuthenticatedSocket,
    data: { messageId: string; conversationId: string },
    callback?: (response: SocketResponse<{ success: boolean }>) => void
): Promise<void> => {
    const { userId } = socket.data;
    const { messageId, conversationId } = data;

    try {
        await markMessageAsDelivered(messageId, userId);

        broadcastDeliveryUpdate(io, conversationId, messageId, userId);

        invokeCallback(callback, createSuccessResponse({ success: true }));
    } catch (error) {
        console.error(`Failed to mark message ${messageId} as delivered:`, error);
        invokeCallback(
            callback,
            createErrorResponse(getErrorMessage(error, 'Failed to mark message as delivered'))
        );
    }
};

// Handle getting read statistics for a message
export const handleGetReadStats = async (
    socket: AuthenticatedSocket,
    messageId: string,
    callback?: (response: SocketResponse<MessageReadStats>) => void
): Promise<void> => {
    try {
        const stats = await getMessageReadStats(messageId);

        invokeCallback(callback, createSuccessResponse(stats));
    } catch (error) {
        console.error(`Failed to get read stats for message ${messageId}:`, error);
        invokeCallback(
            callback,
            createErrorResponse(getErrorMessage(error, 'Failed to get read statistics'))
        );
    }
};
