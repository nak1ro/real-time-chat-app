"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConnection = void 0;
const socket_rooms_1 = require("./socket.rooms");
const socket_messages_1 = require("./socket.messages");
/**
 * Handle socket connection events
 */
const handleConnection = async (io, socket) => {
    const { userId, userName } = socket.data;
    console.log(`✅ User connected: ${userName} (${userId}) - Socket: ${socket.id}`);
    // Automatically join all conversation rooms user is a member of
    await (0, socket_rooms_1.joinUserConversations)(socket);
    // Handle explicit join conversation event
    socket.on('conversation:join', async (conversationId, callback) => {
        const success = await (0, socket_rooms_1.joinConversation)(socket, conversationId);
        if (callback && typeof callback === 'function') {
            callback({ success, conversationId });
        }
    });
    // Handle explicit leave conversation event
    socket.on('conversation:leave', async (conversationId, callback) => {
        await (0, socket_rooms_1.leaveConversation)(socket, conversationId);
        if (callback && typeof callback === 'function') {
            callback({ success: true, conversationId });
        }
    });
    // Handle request for current rooms
    socket.on('rooms:get', (callback) => {
        const rooms = (0, socket_rooms_1.getCurrentRooms)(socket);
        if (callback && typeof callback === 'function') {
            callback({ rooms });
        }
    });
    // Handle message events
    socket.on('message:send', (data, callback) => {
        (0, socket_messages_1.handleMessageSend)(io, socket, data, callback);
    });
    socket.on('message:edit', (data, callback) => {
        (0, socket_messages_1.handleMessageEdit)(io, socket, data, callback);
    });
    socket.on('message:delete', (data, callback) => {
        (0, socket_messages_1.handleMessageDelete)(io, socket, data, callback);
    });
    // Handle disconnection
    socket.on('disconnect', async (reason) => {
        await (0, socket_rooms_1.leaveAllConversations)(socket);
        console.log(`❌ User disconnected: ${userName} (${userId}) - Reason: ${reason}`);
    });
    // Handle errors
    socket.on('error', (error) => {
        console.error(`Socket error for user ${userId}:`, error);
    });
    // More handlers will be added here (messages, typing, etc.)
};
exports.handleConnection = handleConnection;
