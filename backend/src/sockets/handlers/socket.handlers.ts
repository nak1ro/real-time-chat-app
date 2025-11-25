import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../core/socket.types';
import {
    joinUserConversations,
    joinConversation,
    leaveConversation,
    leaveAllConversations,
    getCurrentRooms,
} from './socket.rooms';
import { handleMessageSend, handleMessageEdit, handleMessageDelete } from './socket.messages';
import {
    handleUserOnline,
    handleUserOffline,
    handleHeartbeat,
    handleGetPresence,
} from './socket.presence';
import {
    handleMarkAsRead,
    handleMarkAsDelivered,
    handleGetReadStats,
} from './socket.receipts';
import { handleToggleReaction } from './socket.reactions';
import {
    handleGetNotifications,
    handleGetUnreadCount,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
} from './socket.notifications';
import { SOCKET_EVENTS, createSuccessResponse, invokeCallback } from '../core/socket.utils';

// Register all event handlers for a socket connection
export const handleConnection = async (io: Server, socket: AuthenticatedSocket): Promise<void> => {
    const { userId, userName } = socket.data;

    console.log(`User connected: ${userName} (${userId}) - Socket: ${socket.id}`);

    await joinUserConversations(socket);

    await handleUserOnline(io, socket);

    registerConversationHandlers(socket);

    registerMessageHandlers(io, socket);

    registerPresenceHandlers(io, socket);

    registerReceiptHandlers(io, socket);

    registerReactionHandlers(io, socket);

    registerNotificationHandlers(io, socket);

    registerDisconnectionHandlers(io, socket, userName, userId);
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

// Register presence-related event handlers
const registerPresenceHandlers = (io: Server, socket: AuthenticatedSocket): void => {
    socket.on(SOCKET_EVENTS.PRESENCE_HEARTBEAT, (callback) => {
        handleHeartbeat(io, socket, callback);
    });

    socket.on(SOCKET_EVENTS.PRESENCE_GET, (userIds, callback) => {
        handleGetPresence(socket, userIds, callback);
    });
};

// Register receipt-related event handlers
const registerReceiptHandlers = (io: Server, socket: AuthenticatedSocket): void => {
    socket.on(SOCKET_EVENTS.RECEIPT_READ, (data, callback) => {
        handleMarkAsRead(io, socket, data, callback);
    });

    socket.on(SOCKET_EVENTS.RECEIPT_DELIVERED, (data, callback) => {
        handleMarkAsDelivered(io, socket, data, callback);
    });

    socket.on(SOCKET_EVENTS.RECEIPT_GET_STATS, (messageId, callback) => {
        handleGetReadStats(socket, messageId, callback);
    });
};

// Register reaction-related event handlers
const registerReactionHandlers = (io: Server, socket: AuthenticatedSocket): void => {
    socket.on(SOCKET_EVENTS.REACTION_TOGGLE, (data, callback) =>
        handleToggleReaction(io, socket, data, callback)
    );
};

// Register notification-related event handlers
const registerNotificationHandlers = (io: Server, socket: AuthenticatedSocket): void => {
    socket.on(SOCKET_EVENTS.NOTIFICATION_GET_ALL, (data, callback) =>
        handleGetNotifications(socket, data, callback)
    );

    socket.on(SOCKET_EVENTS.NOTIFICATION_GET_UNREAD_COUNT, (callback) =>
        handleGetUnreadCount(socket, callback)
    );

    socket.on(SOCKET_EVENTS.NOTIFICATION_MARK_READ, (data, callback) =>
        handleMarkNotificationRead(io, socket, data, callback)
    );

    socket.on(SOCKET_EVENTS.NOTIFICATION_MARK_ALL_READ, (callback) =>
        handleMarkAllNotificationsRead(io, socket, callback)
    );
};

// Register disconnection and error handlers
const registerDisconnectionHandlers = (
    io: Server,
    socket: AuthenticatedSocket,
    userName: string,
    userId: string
): void => {
    socket.on(SOCKET_EVENTS.DISCONNECT, async (reason) => {
        await handleUserOffline(io, socket);
        await leaveAllConversations(socket);
        console.log(`User disconnected: ${userName} (${userId}) - Reason: ${reason}`);
    });

    socket.on(SOCKET_EVENTS.ERROR, (error) => {
        console.error(`Socket error for user ${userId}:`, error);
    });
};
