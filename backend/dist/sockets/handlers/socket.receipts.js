"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetReadStats = exports.handleMarkAsRead = exports.broadcastBulkReadUpdate = void 0;
const receipt_service_1 = require("../../services/messages/receipt.service");
const socket_utils_1 = require("../core/socket.utils");
// Helper Functions - Payload Creation
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
exports.broadcastBulkReadUpdate = broadcastBulkReadUpdate;
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
            (0, exports.broadcastBulkReadUpdate)(io, conversationId, userId, result.lastMessageId, result.messagesAffected);
        }
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)(result));
    }
    catch (error) {
        console.error(`Failed to mark messages as read for user ${userId}:`, error);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createErrorResponse)((0, socket_utils_1.getErrorMessage)(error, 'Failed to mark messages as read')));
    }
};
exports.handleMarkAsRead = handleMarkAsRead;
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
