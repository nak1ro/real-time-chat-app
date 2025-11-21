"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessageDelete = exports.handleMessageEdit = exports.handleMessageSend = void 0;
const message_service_1 = require("../services/message.service");
const socket_rooms_1 = require("./socket.rooms");
/**
 * Handle message:send event
 * Creates a new message and broadcasts to conversation room
 */
const handleMessageSend = async (io, socket, data, callback) => {
    const { userId } = socket.data;
    try {
        // Create message using service (includes all validations)
        const messageData = {
            userId,
            conversationId: data.conversationId,
            text: data.text,
            replyToId: data.replyToId,
        };
        const message = await (0, message_service_1.createMessage)(messageData);
        // Ensure sender is in the conversation room
        await (0, socket_rooms_1.joinConversation)(socket, data.conversationId);
        // Broadcast to all members in the conversation room
        io.to(data.conversationId).emit('message:new', message);
        console.log(`📨 Message sent to conversation ${data.conversationId} by user ${userId}`);
        // Send acknowledgment to sender
        if (callback && typeof callback === 'function') {
            callback({ success: true, message });
        }
    }
    catch (error) {
        console.error(`Failed to send message:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
        if (callback && typeof callback === 'function') {
            callback({ success: false, error: errorMessage });
        }
    }
};
exports.handleMessageSend = handleMessageSend;
/**
 * Handle message:edit event
 * Edits a message and broadcasts update to conversation room
 */
const handleMessageEdit = async (io, socket, data, callback) => {
    const { userId } = socket.data;
    try {
        // Edit message using service (includes all validations)
        const message = await (0, message_service_1.editMessage)(data.messageId, userId, data.text);
        // Broadcast to all members in the conversation room
        io.to(message.conversationId).emit('message:updated', message);
        console.log(`✏️ Message ${data.messageId} edited by user ${userId}`);
        // Send acknowledgment to sender
        if (callback && typeof callback === 'function') {
            callback({ success: true, message });
        }
    }
    catch (error) {
        console.error(`Failed to edit message:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to edit message';
        if (callback && typeof callback === 'function') {
            callback({ success: false, error: errorMessage });
        }
    }
};
exports.handleMessageEdit = handleMessageEdit;
/**
 * Handle message:delete event
 * Soft deletes a message and broadcasts deletion to conversation room
 */
const handleMessageDelete = async (io, socket, data, callback) => {
    const { userId } = socket.data;
    try {
        // Soft delete message using service (includes all validations)
        const message = await (0, message_service_1.softDeleteMessage)(data.messageId, userId);
        // Broadcast to all members in the conversation room
        io.to(message.conversationId).emit('message:deleted', message);
        console.log(`🗑️ Message ${data.messageId} deleted by user ${userId}`);
        // Send acknowledgment to sender
        if (callback && typeof callback === 'function') {
            callback({ success: true, message });
        }
    }
    catch (error) {
        console.error(`Failed to delete message:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete message';
        if (callback && typeof callback === 'function') {
            callback({ success: false, error: errorMessage });
        }
    }
};
exports.handleMessageDelete = handleMessageDelete;
