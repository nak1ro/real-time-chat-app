"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessageDelete = exports.handleMessageEdit = exports.handleMessageSend = void 0;
const services_1 = require("../../services");
const socket_rooms_1 = require("./socket.rooms");
const socket_utils_1 = require("../core/socket.utils");
const services_2 = require("../../services");
const socket_notifications_1 = require("./socket.notifications");
// Handle message:send event
const handleMessageSend = async (io, socket, data, callback) => {
    const { userId } = socket.data;
    try {
        const messageData = {
            userId,
            conversationId: data.conversationId,
            text: data.text,
            replyToId: data.replyToId,
            attachments: data.attachments,
        };
        const message = await (0, services_1.createMessage)(messageData);
        // Ensure sender is in conversation room
        await (0, socket_rooms_1.joinConversation)(socket, data.conversationId);
        // Broadcast to conversation room
        io.to(data.conversationId).emit(socket_utils_1.SOCKET_EVENTS.MESSAGE_NEW, message);
        // Handle Receipts: Check who is in the room to mark as READ immediately
        const room = io.sockets.adapter.rooms.get(data.conversationId);
        const readUserIds = [];
        if (room) {
            // Get all sockets in the room
            const roomSocketIds = Array.from(room);
            // Find user IDs for these sockets
            // We need to iterate through connected sockets to find matching IDs
            // This is efficient enough for typical room sizes
            const connectedSockets = await io.in(data.conversationId).fetchSockets();
            connectedSockets.forEach((s) => {
                if (s.data && s.data.userId && s.data.userId !== userId) {
                    readUserIds.push(s.data.userId);
                }
            });
        }
        // Create receipts (READ for those in room, SENT for others)
        // We need to import this dynamically or ensure it's imported
        const { createReceiptForRecipients } = await Promise.resolve().then(() => __importStar(require('../../services/messages/receipt.service')));
        await createReceiptForRecipients(message.id, data.conversationId, userId, readUserIds);
        // Create and broadcast NEW_MESSAGE notifications
        try {
            const notifications = await (0, services_2.createNotificationsForMembers)(data.conversationId, userId, 'NEW_MESSAGE', {
                messageId: message.id,
                actorName: socket.data.userName,
                messageText: message.text.substring(0, 100),
            });
            // Notify each recipient
            notifications.forEach((notification) => {
                (0, socket_notifications_1.notifyUser)(io, notification.userId, notification);
            });
        }
        catch (notifError) {
            console.error('Failed to create message notifications:', notifError);
        }
        console.log(`Message sent to ${data.conversationId} by user ${userId}`);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)({ message }));
    }
    catch (error) {
        console.error('Failed to send message:', error);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createErrorResponse)((0, socket_utils_1.getErrorMessage)(error, 'Failed to send message')));
    }
};
exports.handleMessageSend = handleMessageSend;
// Handle message:edit event
const handleMessageEdit = async (io, socket, data, callback) => {
    const { userId } = socket.data;
    try {
        const message = await (0, services_1.editMessage)(data.messageId, userId, data.text);
        // Broadcast to conversation room
        io.to(message.conversationId).emit(socket_utils_1.SOCKET_EVENTS.MESSAGE_UPDATED, message);
        console.log(`Message ${data.messageId} edited by user ${userId}`);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)({ message }));
    }
    catch (error) {
        console.error('Failed to edit message:', error);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createErrorResponse)((0, socket_utils_1.getErrorMessage)(error, 'Failed to edit message')));
    }
};
exports.handleMessageEdit = handleMessageEdit;
// Handle message:delete event
const handleMessageDelete = async (io, socket, data, callback) => {
    const { userId } = socket.data;
    try {
        const message = await (0, services_1.softDeleteMessage)(data.messageId, userId);
        // Broadcast to conversation room
        io.to(message.conversationId).emit(socket_utils_1.SOCKET_EVENTS.MESSAGE_DELETED, message);
        console.log(`Message ${data.messageId} deleted by user ${userId}`);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)({ message }));
    }
    catch (error) {
        console.error('Failed to delete message:', error);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createErrorResponse)((0, socket_utils_1.getErrorMessage)(error, 'Failed to delete message')));
    }
};
exports.handleMessageDelete = handleMessageDelete;
