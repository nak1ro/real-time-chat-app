import { SocketResponse, SuccessResponse, ErrorResponse } from './socket.types';

// Event names
export const SOCKET_EVENTS = {
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

    // Mentions
    MENTION_NEW: 'mention:new',

    // Presence
    PRESENCE_UPDATE: 'presence:update',
    PRESENCE_HEARTBEAT: 'presence:heartbeat',
    PRESENCE_GET: 'presence:get',

    // Receipts
    RECEIPT_READ: 'receipt:read',
    RECEIPT_DELIVERED: 'receipt:delivered',
    RECEIPT_UPDATE: 'receipt:update',
    RECEIPT_GET_STATS: 'receipt:getStats',

    // Reactions
    REACTION_TOGGLE: 'reaction:toggle',
    REACTION_UPDATED: 'reaction:updated',

    // Notifications
    NOTIFICATION_NEW: 'notification:new',
    NOTIFICATION_GET_ALL: 'notification:getAll',
    NOTIFICATION_GET_UNREAD_COUNT: 'notification:getUnreadCount',
    NOTIFICATION_MARK_READ: 'notification:markRead',
    NOTIFICATION_MARK_ALL_READ: 'notification:markAllRead',
    NOTIFICATION_COUNT_UPDATED: 'notification:countUpdated',

    // Moderation
    MODERATION_ACTION: 'moderation:action',
    MODERATION_UPDATED: 'moderation:updated',
} as const;

// Create success response
export const createSuccessResponse = <T>(data?: T): SuccessResponse<T> => ({
    success: true,
    data,
});

// Create error response
export const createErrorResponse = (error: string | Error): ErrorResponse => ({
    success: false,
    error: error instanceof Error ? error.message : error,
});

// Extract error message from unknown error
export const getErrorMessage = (error: unknown, defaultMessage: string = 'An error occurred'): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return defaultMessage;
};

// Safe callback invocation
export const invokeCallback = <T>(
    callback: ((response: SocketResponse<T>) => void) | undefined,
    response: SocketResponse<T>
): void => {
    if (callback && typeof callback === 'function') {
        callback(response);
    }
};

// Filter out default socket.id room from rooms list
export const filterSocketRooms = (rooms: Set<string>, socketId: string): string[] => {
    return Array.from(rooms).filter((room) => room !== socketId);
};

// Format conversation list for logging
export const formatConversationList = (conversationIds: string[], maxDisplay: number = 3): string => {
    if (conversationIds.length === 0) return 'none';

    const displayed = conversationIds.slice(0, maxDisplay);
    const remaining = conversationIds.length - maxDisplay;

    return displayed.join(', ') + (remaining > 0 ? ` +${remaining} more` : '');
};

