import { Server } from 'socket.io';
import { AuthenticatedSocket, SocketResponse } from '../core/socket.types';
import { createMessage, editMessage, softDeleteMessage } from '../../services';
import { CreateMessageData, MessageWithRelations } from '../../domain';
import { joinConversation } from './socket.rooms';
import {
    SOCKET_EVENTS,
    createSuccessResponse,
    createErrorResponse,
    invokeCallback,
    getErrorMessage,
} from '../core/socket.utils';
import { notifyMentionedUsers } from './socket.mentions';
import { createNotificationsForMembers } from '../../services';
import { notifyUser } from './socket.notifications';

// Attachment data type for socket messages
interface AttachmentData {
    url: string;
    thumbnailUrl?: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    type: string;
    width?: number;
    height?: number;
    durationMs?: number;
}

// Handle message:send event
export const handleMessageSend = async (
    io: Server,
    socket: AuthenticatedSocket,
    data: { conversationId: string; text: string; replyToId?: string; attachments?: AttachmentData[] },
    callback?: (response: SocketResponse<{ message: MessageWithRelations }>) => void
): Promise<void> => {
    const { userId } = socket.data;

    try {
        const messageData: CreateMessageData = {
            userId,
            conversationId: data.conversationId,
            text: data.text,
            replyToId: data.replyToId,
            attachments: data.attachments,
        };

        const message = await createMessage(messageData);

        // Ensure sender is in conversation room
        await joinConversation(socket, data.conversationId);

        // Broadcast to conversation room
        io.to(data.conversationId).emit(SOCKET_EVENTS.MESSAGE_NEW, message);

        // Handle Receipts: Check who is in the room to mark as READ immediately
        const room = io.sockets.adapter.rooms.get(data.conversationId);
        const readUserIds: string[] = [];

        if (room) {
            // Get all sockets in the room
            const roomSocketIds = Array.from(room);

            // Find user IDs for these sockets
            // We need to iterate through connected sockets to find matching IDs
            // This is efficient enough for typical room sizes
            const connectedSockets = await io.in(data.conversationId).fetchSockets();

            connectedSockets.forEach((s: any) => {
                if (s.data && s.data.userId && s.data.userId !== userId) {
                    readUserIds.push(s.data.userId);
                }
            });
        }

        // Create receipts (READ for those in room, SENT for others)
        // We need to import this dynamically or ensure it's imported
        const { createReceiptForRecipients } = await import('../../services/messages/receipt.service');
        await createReceiptForRecipients(message.id, data.conversationId, userId, readUserIds);

        // Notify mentioned users
        notifyMentionedUsers(io, message, message.mentionedUserIds);

        // Create and broadcast NEW_MESSAGE notifications
        try {
            const notifications = await createNotificationsForMembers(
                data.conversationId,
                userId,
                'NEW_MESSAGE',
                {
                    messageId: message.id,
                    actorName: socket.data.userName,
                    messageText: message.text.substring(0, 100),
                }
            );

            // Notify each recipient
            notifications.forEach((notification) => {
                notifyUser(io, notification.userId, notification);
            });
        } catch (notifError) {
            console.error('Failed to create message notifications:', notifError);
        }

        console.log(`Message sent to ${data.conversationId} by user ${userId}`);

        invokeCallback(callback, createSuccessResponse({ message }));
    } catch (error) {
        console.error('Failed to send message:', error);
        invokeCallback(callback, createErrorResponse(getErrorMessage(error, 'Failed to send message')));
    }
};

// Handle message:edit event
export const handleMessageEdit = async (
    io: Server,
    socket: AuthenticatedSocket,
    data: { messageId: string; text: string },
    callback?: (response: SocketResponse<{ message: MessageWithRelations }>) => void
): Promise<void> => {
    const { userId } = socket.data;

    try {
        const message = await editMessage(data.messageId, userId, data.text);

        // Broadcast to conversation room
        io.to(message.conversationId).emit(SOCKET_EVENTS.MESSAGE_UPDATED, message);

        console.log(`Message ${data.messageId} edited by user ${userId}`);

        invokeCallback(callback, createSuccessResponse({ message }));
    } catch (error) {
        console.error('Failed to edit message:', error);
        invokeCallback(callback, createErrorResponse(getErrorMessage(error, 'Failed to edit message')));
    }
};

// Handle message:delete event
export const handleMessageDelete = async (
    io: Server,
    socket: AuthenticatedSocket,
    data: { messageId: string },
    callback?: (response: SocketResponse<{ message: MessageWithRelations }>) => void
): Promise<void> => {
    const { userId } = socket.data;

    try {
        const message = await softDeleteMessage(data.messageId, userId);

        // Broadcast to conversation room
        io.to(message.conversationId).emit(SOCKET_EVENTS.MESSAGE_DELETED, message);

        console.log(`Message ${data.messageId} deleted by user ${userId}`);

        invokeCallback(callback, createSuccessResponse({ message }));
    } catch (error) {
        console.error('Failed to delete message:', error);
        invokeCallback(callback, createErrorResponse(getErrorMessage(error, 'Failed to delete message')));
    }
};
