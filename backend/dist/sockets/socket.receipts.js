"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetReadStats = exports.handleMarkAsDelivered = exports.handleMarkAsRead = void 0;
const client_1 = require("@prisma/client");
const receipt_service_1 = require("../services/receipt.service");
const socket_utils_1 = require("./socket.utils");
// Helper Functions - Payload Creation
// Create single receipt update payload
const createReceiptUpdatePayload = (conversationId, messageId, userId, status, seenAt) => ({
    conversationId,
    messageId,
    userId,
    status,
    seenAt,
    timestamp: new Date(),
});
// Create bulk receipt update payload
const createBulkReceiptUpdatePayload = (conversationId, userId, lastReadMessageId, messagesAffected) => ({
    conversationId,
    userId,
    lastReadMessageId,
    messagesAffected,
    timestamp: new Date(),
});
// Helper Functions - Broadcasting
// Broadcast receipt update to conversation room
const broadcastToConversation = (io, conversationId, payload) => {
    io.to(conversationId).emit(socket_utils_1.SOCKET_EVENTS.RECEIPT_UPDATE, payload);
};
// Broadcast bulk read update
const broadcastBulkReadUpdate = (io, conversationId, userId, lastMessageId, messagesAffected) => {
    const payload = createBulkReceiptUpdatePayload(conversationId, userId, lastMessageId, messagesAffected);
    broadcastToConversation(io, conversationId, payload);
};
// Broadcast single delivery update
const broadcastDeliveryUpdate = (io, conversationId, messageId, userId) => {
    const payload = createReceiptUpdatePayload(conversationId, messageId, userId, client_1.MessageDeliveryStatus.DELIVERED, null);
    broadcastToConversation(io, conversationId, payload);
};
// Helper Functions - Result Processing
// Check if read result should be broadcast
const shouldBroadcastReadResult = (result) => {
    return result.messagesAffected > 0 && result.lastMessageId !== null;
};
// Public API - Event Handlers
// Handle marking messages as read
const handleMarkAsRead = async (io, socket, data, callback) => {
    const { userId } = socket.data;
    const { conversationId, upToMessageId } = data;
    try {
        const result = await (0, receipt_service_1.markMessagesAsRead)(conversationId, userId, upToMessageId);
        if (shouldBroadcastReadResult(result)) {
            broadcastBulkReadUpdate(io, conversationId, userId, result.lastMessageId, result.messagesAffected);
        }
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)(result));
    }
    catch (error) {
        console.error(`Failed to mark messages as read for user ${userId}:`, error);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createErrorResponse)((0, socket_utils_1.getErrorMessage)(error, 'Failed to mark messages as read')));
    }
};
exports.handleMarkAsRead = handleMarkAsRead;
// Handle marking a single message as delivered
const handleMarkAsDelivered = async (io, socket, data, callback) => {
    const { userId } = socket.data;
    const { messageId, conversationId } = data;
    try {
        await (0, receipt_service_1.markMessageAsDelivered)(messageId, userId);
        broadcastDeliveryUpdate(io, conversationId, messageId, userId);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)({ success: true }));
    }
    catch (error) {
        console.error(`Failed to mark message ${messageId} as delivered:`, error);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createErrorResponse)((0, socket_utils_1.getErrorMessage)(error, 'Failed to mark message as delivered')));
    }
};
exports.handleMarkAsDelivered = handleMarkAsDelivered;
// Handle getting read statistics for a message
const handleGetReadStats = async (socket, messageId, callback) => {
    try {
        const stats = await (0, receipt_service_1.getMessageReadStats)(messageId);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)(stats));
    }
    catch (error) {
        console.error(`Failed to get read stats for message ${messageId}:`, error);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createErrorResponse)((0, socket_utils_1.getErrorMessage)(error, 'Failed to get read statistics')));
    }
};
exports.handleGetReadStats = handleGetReadStats;
