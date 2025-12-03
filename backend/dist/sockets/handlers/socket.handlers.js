"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConnection = void 0;
const socket_rooms_1 = require("./socket.rooms");
const socket_messages_1 = require("./socket.messages");
const socket_presence_1 = require("./socket.presence");
const socket_receipts_1 = require("./socket.receipts");
const socket_reactions_1 = require("./socket.reactions");
const socket_notifications_1 = require("./socket.notifications");
const socket_moderation_1 = require("./socket.moderation");
const socket_utils_1 = require("../core/socket.utils");
// Register all event handlers for a socket connection
const handleConnection = async (io, socket) => {
    const { userId, userName } = socket.data;
    console.log(`User connected: ${userName} (${userId}) - Socket: ${socket.id}`);
    socket.join(userId);
    await (0, socket_rooms_1.joinUserConversations)(socket);
    await (0, socket_presence_1.handleUserOnline)(io, socket);
    registerConversationHandlers(socket);
    registerMessageHandlers(io, socket);
    registerPresenceHandlers(io, socket);
    registerReceiptHandlers(io, socket);
    registerReactionHandlers(io, socket);
    registerNotificationHandlers(io, socket);
    registerModerationHandlers(io, socket);
    registerDisconnectionHandlers(io, socket, userName, userId);
};
exports.handleConnection = handleConnection;
// Register conversation-related event handlers
const registerConversationHandlers = (socket) => {
    // Join specific conversation
    socket.on(socket_utils_1.SOCKET_EVENTS.CONVERSATION_JOIN, async (conversationId, callback) => {
        const success = await (0, socket_rooms_1.joinConversation)(socket, conversationId);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)({ conversationId }));
    });
    // Leave specific conversation
    socket.on(socket_utils_1.SOCKET_EVENTS.CONVERSATION_LEAVE, async (conversationId, callback) => {
        await (0, socket_rooms_1.leaveConversation)(socket, conversationId);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)({ conversationId }));
    });
    // Get current rooms
    socket.on(socket_utils_1.SOCKET_EVENTS.ROOMS_GET, (callback) => {
        const rooms = (0, socket_rooms_1.getCurrentRooms)(socket);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)({ rooms }));
    });
};
// Register message-related event handlers
const registerMessageHandlers = (io, socket) => {
    socket.on(socket_utils_1.SOCKET_EVENTS.MESSAGE_SEND, (data, callback) => {
        (0, socket_messages_1.handleMessageSend)(io, socket, data, callback);
    });
    socket.on(socket_utils_1.SOCKET_EVENTS.MESSAGE_EDIT, (data, callback) => {
        (0, socket_messages_1.handleMessageEdit)(io, socket, data, callback);
    });
    socket.on(socket_utils_1.SOCKET_EVENTS.MESSAGE_DELETE, (data, callback) => {
        (0, socket_messages_1.handleMessageDelete)(io, socket, data, callback);
    });
};
// Register presence-related event handlers
const registerPresenceHandlers = (io, socket) => {
    socket.on(socket_utils_1.SOCKET_EVENTS.PRESENCE_HEARTBEAT, (callback) => {
        (0, socket_presence_1.handleHeartbeat)(io, socket, callback);
    });
    socket.on(socket_utils_1.SOCKET_EVENTS.PRESENCE_GET, (userIds, callback) => {
        (0, socket_presence_1.handleGetPresence)(socket, userIds, callback);
    });
};
// Register receipt-related event handlers
const registerReceiptHandlers = (io, socket) => {
    socket.on(socket_utils_1.SOCKET_EVENTS.RECEIPT_READ, (data, callback) => {
        (0, socket_receipts_1.handleMarkAsRead)(io, socket, data, callback);
    });
    socket.on(socket_utils_1.SOCKET_EVENTS.RECEIPT_GET_STATS, (messageId, callback) => {
        (0, socket_receipts_1.handleGetReadStats)(socket, messageId, callback);
    });
};
// Register reaction-related event handlers
const registerReactionHandlers = (io, socket) => {
    socket.on(socket_utils_1.SOCKET_EVENTS.REACTION_TOGGLE, (data, callback) => (0, socket_reactions_1.handleToggleReaction)(io, socket, data, callback));
};
// Register notification-related event handlers
const registerNotificationHandlers = (io, socket) => {
    socket.on(socket_utils_1.SOCKET_EVENTS.NOTIFICATION_GET_ALL, (data, callback) => (0, socket_notifications_1.handleGetNotifications)(socket, data, callback));
    socket.on(socket_utils_1.SOCKET_EVENTS.NOTIFICATION_GET_UNREAD_COUNT, (callback) => (0, socket_notifications_1.handleGetUnreadCount)(socket, callback));
    socket.on(socket_utils_1.SOCKET_EVENTS.NOTIFICATION_MARK_READ, (data, callback) => (0, socket_notifications_1.handleMarkNotificationRead)(io, socket, data, callback));
    socket.on(socket_utils_1.SOCKET_EVENTS.NOTIFICATION_MARK_ALL_READ, (callback) => (0, socket_notifications_1.handleMarkAllNotificationsRead)(io, socket, callback));
};
// Register moderation-related event handlers
const registerModerationHandlers = (io, socket) => {
    socket.on(socket_utils_1.SOCKET_EVENTS.MODERATION_ACTION, (data, callback) => (0, socket_moderation_1.handleModerationAction)(io, socket, data, callback));
};
// Register disconnection and error handlers
const registerDisconnectionHandlers = (io, socket, userName, userId) => {
    socket.on(socket_utils_1.SOCKET_EVENTS.DISCONNECT, async (reason) => {
        await (0, socket_presence_1.handleUserOffline)(io, socket);
        await (0, socket_rooms_1.leaveAllConversations)(socket);
        console.log(`User disconnected: ${userName} (${userId}) - Reason: ${reason}`);
    });
    socket.on(socket_utils_1.SOCKET_EVENTS.ERROR, (error) => {
        console.error(`Socket error for user ${userId}:`, error);
    });
};
