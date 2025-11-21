import { Server } from 'socket.io';
import { AuthenticatedSocket } from './socket.types';
import {
    joinUserConversations,
    joinConversation,
    leaveConversation,
    leaveAllConversations,
    getCurrentRooms,
} from './socket.rooms';
import { handleMessageSend, handleMessageEdit, handleMessageDelete } from './socket.messages';
import { SOCKET_EVENTS, createSuccessResponse, invokeCallback } from './socket.utils';

// Register all event handlers for a socket connection
export const handleConnection = async (io: Server, socket: AuthenticatedSocket): Promise<void> => {
    const { userId, userName } = socket.data;

    console.log(`User connected: ${userName} (${userId}) - Socket: ${socket.id}`);

    await joinUserConversations(socket);

    registerConversationHandlers(socket);

    registerMessageHandlers(io, socket);

    registerDisconnectionHandlers(socket, userName, userId);
};

// Register conversation-related event handlers
const registerConversationHandlers = (socket: AuthenticatedSocket): void => {
    // Join specific conversation
    socket.on(SOCKET_EVENTS.CONVERSATION_JOIN, async (conversationId, callback) => {
        const success = await joinConversation(socket, conversationId);
        invokeCallback(callback, createSuccessResponse({ conversationId }));
    });

    // Leave specific conversation
    socket.on(SOCKET_EVENTS.CONVERSATION_LEAVE, async (conversationId, callback) => {
        await leaveConversation(socket, conversationId);
        invokeCallback(callback, createSuccessResponse({ conversationId }));
    });

    // Get current rooms
    socket.on(SOCKET_EVENTS.ROOMS_GET, (callback) => {
        const rooms = getCurrentRooms(socket);
        invokeCallback(callback, createSuccessResponse({ rooms }));
    });
};

// Register message-related event handlers
const registerMessageHandlers = (io: Server, socket: AuthenticatedSocket): void => {
    socket.on(SOCKET_EVENTS.MESSAGE_SEND, (data, callback) => {
        handleMessageSend(io, socket, data, callback);
    });

    socket.on(SOCKET_EVENTS.MESSAGE_EDIT, (data, callback) => {
        handleMessageEdit(io, socket, data, callback);
    });

    socket.on(SOCKET_EVENTS.MESSAGE_DELETE, (data, callback) => {
        handleMessageDelete(io, socket, data, callback);
    });
};

// Register disconnection and error handlers
const registerDisconnectionHandlers = (
    socket: AuthenticatedSocket,
    userName: string,
    userId: string
): void => {
    socket.on(SOCKET_EVENTS.DISCONNECT, async (reason) => {
        await leaveAllConversations(socket);
        console.log(`User disconnected: ${userName} (${userId}) - Reason: ${reason}`);
    });

    socket.on(SOCKET_EVENTS.ERROR, (error) => {
        console.error(`Socket error for user ${userId}:`, error);
    });
};
