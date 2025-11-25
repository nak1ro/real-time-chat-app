"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetPresence = exports.handleHeartbeat = exports.handleUserOffline = exports.handleUserOnline = void 0;
const client_1 = require("@prisma/client");
const presence_service_1 = require("../../services/users/presence.service");
const socket_rooms_1 = require("./socket.rooms");
const socket_utils_1 = require("../core/socket.utils");
// State management for heartbeat timers
const heartbeatTimers = new Map();
// Helper Functions
// Create presence data payload
const createPresenceData = (userId, status, lastSeenAt) => ({
    userId,
    status,
    lastSeenAt,
    timestamp: new Date(),
});
// Broadcast presence to all user's conversation rooms
const broadcastPresenceToConversations = async (io, userId, presenceData) => {
    const conversationIds = await (0, socket_rooms_1.getUserConversationIds)(userId);
    if (conversationIds.length === 0)
        return;
    for (const conversationId of conversationIds) {
        io.to(conversationId).emit(socket_utils_1.SOCKET_EVENTS.PRESENCE_UPDATE, presenceData);
    }
    console.log(`Broadcasted presence for user ${userId}: ${presenceData.status}`);
};
// Broadcast presence update
const broadcastPresenceUpdate = async (io, userId, status, lastSeenAt) => {
    try {
        const presenceData = createPresenceData(userId, status, lastSeenAt);
        await broadcastPresenceToConversations(io, userId, presenceData);
    }
    catch (error) {
        console.error(`Failed to broadcast presence for user ${userId}:`, error);
    }
};
// Heartbeat timer management
const getHeartbeatTimer = (socketId) => {
    return heartbeatTimers.get(socketId);
};
const setHeartbeatTimer = (socketId, timer) => {
    heartbeatTimers.set(socketId, timer);
};
const clearHeartbeatTimer = (socketId) => {
    const timer = getHeartbeatTimer(socketId);
    if (timer) {
        clearTimeout(timer);
        heartbeatTimers.delete(socketId);
    }
};
// Create heartbeat timeout handler
const createHeartbeatTimeoutHandler = (io, socket) => async () => {
    console.warn(`Heartbeat timeout for user ${socket.data.userId}`);
    await (0, exports.handleUserOffline)(io, socket);
    socket.disconnect(true);
};
// Start monitoring heartbeat for a socket
const startHeartbeatMonitoring = (io, socket) => {
    const timeout = setTimeout(createHeartbeatTimeoutHandler(io, socket), presence_service_1.PRESENCE_CONFIG.HEARTBEAT_TIMEOUT_MS);
    setHeartbeatTimer(socket.id, timeout);
};
// Stop monitoring heartbeat for a socket
const stopHeartbeatMonitoring = (socketId) => {
    clearHeartbeatTimer(socketId);
};
// Reset heartbeat timer
const resetHeartbeatTimer = (io, socket) => {
    stopHeartbeatMonitoring(socket.id);
    startHeartbeatMonitoring(io, socket);
};
// Public API - Event Handlers
// Handle user coming online
const handleUserOnline = async (io, socket) => {
    const { userId } = socket.data;
    try {
        await (0, presence_service_1.setUserOnline)(userId);
        await broadcastPresenceUpdate(io, userId, client_1.Status.ONLINE, new Date());
        startHeartbeatMonitoring(io, socket);
    }
    catch (error) {
        console.error(`Failed to set user ${userId} online:`, error);
    }
};
exports.handleUserOnline = handleUserOnline;
// Handle user going offline
const handleUserOffline = async (io, socket) => {
    const { userId } = socket.data;
    try {
        stopHeartbeatMonitoring(socket.id);
        await (0, presence_service_1.setUserOffline)(userId);
        // Broadcast after grace period
        setTimeout(async () => {
            try {
                const userStatus = await (0, presence_service_1.getUserStatus)(userId);
                await broadcastPresenceUpdate(io, userId, userStatus.status, userStatus.lastSeenAt);
            }
            catch (error) {
                console.error(`Failed to broadcast offline status for user ${userId}:`, error);
            }
        }, presence_service_1.PRESENCE_CONFIG.OFFLINE_BROADCAST_DELAY_MS);
    }
    catch (error) {
        console.error(`Failed to set user ${userId} offline:`, error);
    }
};
exports.handleUserOffline = handleUserOffline;
// Handle heartbeat ping from client
const handleHeartbeat = async (io, socket, callback) => {
    const { userId } = socket.data;
    try {
        await (0, presence_service_1.updateLastSeen)(userId);
        resetHeartbeatTimer(io, socket);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)({ timestamp: new Date() }));
    }
    catch (error) {
        console.error(`Failed to handle heartbeat for user ${userId}:`, error);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createErrorResponse)((0, socket_utils_1.getErrorMessage)(error, 'Heartbeat failed')));
    }
};
exports.handleHeartbeat = handleHeartbeat;
// Handle get presence request for multiple users
const handleGetPresence = async (socket, userIds, callback) => {
    try {
        const users = await Promise.all(userIds.map(async (userId) => {
            const status = await (0, presence_service_1.getUserStatus)(userId);
            return { userId, ...status };
        }));
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)({ users }));
    }
    catch (error) {
        console.error('Failed to get presence:', error);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createErrorResponse)((0, socket_utils_1.getErrorMessage)(error, 'Failed to get presence')));
    }
};
exports.handleGetPresence = handleGetPresence;
