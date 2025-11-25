"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessageDelete = exports.handleMessageEdit = exports.handleMessageSend = void 0;
const message_service_1 = require("../../services/messages/message.service");
const socket_rooms_1 = require("./socket.rooms");
const socket_utils_1 = require("../core/socket.utils");
const socket_mentions_1 = require("./socket.mentions");
const notification_service_1 = require("../../services/messages/notification.service");
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
        };
        const message = await (0, message_service_1.createMessage)(messageData);
        // Ensure sender is in conversation room
        await (0, socket_rooms_1.joinConversation)(socket, data.conversationId);
        // Broadcast to conversation room
        io.to(data.conversationId).emit(socket_utils_1.SOCKET_EVENTS.MESSAGE_NEW, message);
        // Notify mentioned users
        (0, socket_mentions_1.notifyMentionedUsers)(io, message, message.mentionedUserIds);
        // Create and broadcast NEW_MESSAGE notifications
        try {
            const notifications = await (0, notification_service_1.createNotificationsForMembers)(data.conversationId, userId, 'NEW_MESSAGE', {
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
        const message = await (0, message_service_1.editMessage)(data.messageId, userId, data.text);
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
        const message = await (0, message_service_1.softDeleteMessage)(data.messageId, userId);
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
