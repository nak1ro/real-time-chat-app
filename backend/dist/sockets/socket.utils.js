"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatConversationList = exports.filterSocketRooms = exports.invokeCallback = exports.getErrorMessage = exports.createErrorResponse = exports.createSuccessResponse = exports.SOCKET_EVENTS = void 0;
// Event names
exports.SOCKET_EVENTS = {
    // Connection
    CONNECT: 'connection',
    DISCONNECT: 'disconnect',
    ERROR: 'error',
    // Conversations
    CONVERSATION_JOIN: 'conversation:join',
    CONVERSATION_LEAVE: 'conversation:leave',
    // Rooms
    ROOMS_GET: 'rooms:get',
    // Messages
    MESSAGE_SEND: 'message:send',
    MESSAGE_EDIT: 'message:edit',
    MESSAGE_DELETE: 'message:delete',
    MESSAGE_NEW: 'message:new',
    MESSAGE_UPDATED: 'message:updated',
    MESSAGE_DELETED: 'message:deleted',
    // Presence
    PRESENCE_UPDATE: 'presence:update',
    PRESENCE_HEARTBEAT: 'presence:heartbeat',
    PRESENCE_GET: 'presence:get',
    // Receipts
    RECEIPT_READ: 'receipt:read',
    RECEIPT_DELIVERED: 'receipt:delivered',
    RECEIPT_UPDATE: 'receipt:update',
    RECEIPT_GET_STATS: 'receipt:getStats',
};
// Create success response
const createSuccessResponse = (data) => ({
    success: true,
    data,
});
exports.createSuccessResponse = createSuccessResponse;
// Create error response
const createErrorResponse = (error) => ({
    success: false,
    error: error instanceof Error ? error.message : error,
});
exports.createErrorResponse = createErrorResponse;
// Extract error message from unknown error
const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
    if (error instanceof Error) {
        return error.message;
    }
    return defaultMessage;
};
exports.getErrorMessage = getErrorMessage;
// Safe callback invocation
const invokeCallback = (callback, response) => {
    if (callback && typeof callback === 'function') {
        callback(response);
    }
};
exports.invokeCallback = invokeCallback;
// Filter out default socket.id room from rooms list
const filterSocketRooms = (rooms, socketId) => {
    return Array.from(rooms).filter((room) => room !== socketId);
};
exports.filterSocketRooms = filterSocketRooms;
// Format conversation list for logging
const formatConversationList = (conversationIds, maxDisplay = 3) => {
    if (conversationIds.length === 0)
        return 'none';
    const displayed = conversationIds.slice(0, maxDisplay);
    const remaining = conversationIds.length - maxDisplay;
    return displayed.join(', ') + (remaining > 0 ? ` +${remaining} more` : '');
};
exports.formatConversationList = formatConversationList;
