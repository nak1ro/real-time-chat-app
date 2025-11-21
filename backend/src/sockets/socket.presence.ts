import { Server } from 'socket.io';
import { Status } from '@prisma/client';
import { AuthenticatedSocket, SocketResponse, PresenceData } from './socket.types';
import {
    setUserOnline,
    setUserOffline,
    updateLastSeen,
    getUserStatus,
    PRESENCE_CONFIG,
} from '../services/presence.service';
import { getUserConversationIds } from './socket.rooms';
import {
    SOCKET_EVENTS,
    createSuccessResponse,
    createErrorResponse,
    invokeCallback,
    getErrorMessage,
} from './socket.utils';

// State management for heartbeat timers
const heartbeatTimers = new Map<string, NodeJS.Timeout>();

// Helper Functions

// Create presence data payload
const createPresenceData = (
    userId: string,
    status: Status | null,
    lastSeenAt: Date | null
): PresenceData => ({
    userId,
    status,
    lastSeenAt,
    timestamp: new Date(),
});

// Broadcast presence to all user's conversation rooms
const broadcastPresenceToConversations = async (
    io: Server,
    userId: string,
    presenceData: PresenceData
): Promise<void> => {
    const conversationIds = await getUserConversationIds(userId);

    if (conversationIds.length === 0) return;

    for (const conversationId of conversationIds) {
        io.to(conversationId).emit(SOCKET_EVENTS.PRESENCE_UPDATE, presenceData);
    }

    console.log(`Broadcasted presence for user ${userId}: ${presenceData.status}`);
};

// Broadcast presence update
const broadcastPresenceUpdate = async (
    io: Server,
    userId: string,
    status: Status | null,
    lastSeenAt: Date | null
): Promise<void> => {
    try {
        const presenceData = createPresenceData(userId, status, lastSeenAt);
        await broadcastPresenceToConversations(io, userId, presenceData);
    } catch (error) {
        console.error(`Failed to broadcast presence for user ${userId}:`, error);
    }
};

// Heartbeat timer management
const getHeartbeatTimer = (socketId: string): NodeJS.Timeout | undefined => {
    return heartbeatTimers.get(socketId);
};

const setHeartbeatTimer = (socketId: string, timer: NodeJS.Timeout): void => {
    heartbeatTimers.set(socketId, timer);
};

const clearHeartbeatTimer = (socketId: string): void => {
    const timer = getHeartbeatTimer(socketId);
    if (timer) {
        clearTimeout(timer);
        heartbeatTimers.delete(socketId);
    }
};

// Create heartbeat timeout handler
const createHeartbeatTimeoutHandler = (
    io: Server,
    socket: AuthenticatedSocket
) => async (): Promise<void> => {
    console.warn(`Heartbeat timeout for user ${socket.data.userId}`);
    await handleUserOffline(io, socket);
    socket.disconnect(true);
};

// Start monitoring heartbeat for a socket
const startHeartbeatMonitoring = (io: Server, socket: AuthenticatedSocket): void => {
    const timeout = setTimeout(
        createHeartbeatTimeoutHandler(io, socket),
        PRESENCE_CONFIG.HEARTBEAT_TIMEOUT_MS
    );

    setHeartbeatTimer(socket.id, timeout);
};

// Stop monitoring heartbeat for a socket
const stopHeartbeatMonitoring = (socketId: string): void => {
    clearHeartbeatTimer(socketId);
};

// Reset heartbeat timer
const resetHeartbeatTimer = (io: Server, socket: AuthenticatedSocket): void => {
    stopHeartbeatMonitoring(socket.id);
    startHeartbeatMonitoring(io, socket);
};

// Public API - Event Handlers

// Handle user coming online
export const handleUserOnline = async (
    io: Server,
    socket: AuthenticatedSocket
): Promise<void> => {
    const { userId } = socket.data;

    try {
        await setUserOnline(userId);
        await broadcastPresenceUpdate(io, userId, Status.ONLINE, new Date());
        startHeartbeatMonitoring(io, socket);
    } catch (error) {
        console.error(`Failed to set user ${userId} online:`, error);
    }
};

// Handle user going offline
export const handleUserOffline = async (
    io: Server,
    socket: AuthenticatedSocket
): Promise<void> => {
    const { userId } = socket.data;

    try {
        stopHeartbeatMonitoring(socket.id);
        await setUserOffline(userId);

        // Broadcast after grace period
        setTimeout(async () => {
            try {
                const userStatus = await getUserStatus(userId);
                await broadcastPresenceUpdate(
                    io,
                    userId,
                    userStatus.status,
                    userStatus.lastSeenAt
                );
            } catch (error) {
                console.error(`Failed to broadcast offline status for user ${userId}:`, error);
            }
        }, PRESENCE_CONFIG.OFFLINE_BROADCAST_DELAY_MS);
    } catch (error) {
        console.error(`Failed to set user ${userId} offline:`, error);
    }
};

// Handle heartbeat ping from client
export const handleHeartbeat = async (
    io: Server,
    socket: AuthenticatedSocket,
    callback?: (response: SocketResponse<{ timestamp: Date }>) => void
): Promise<void> => {
    const { userId } = socket.data;

    try {
        await updateLastSeen(userId);
        resetHeartbeatTimer(io, socket);

        invokeCallback(callback, createSuccessResponse({ timestamp: new Date() }));
    } catch (error) {
        console.error(`Failed to handle heartbeat for user ${userId}:`, error);
        invokeCallback(
            callback,
            createErrorResponse(getErrorMessage(error, 'Heartbeat failed'))
        );
    }
};

// Handle get presence request for multiple users
export const handleGetPresence = async (
    socket: AuthenticatedSocket,
    userIds: string[],
    callback?: (
        response: SocketResponse<{
            users: Array<{
                userId: string;
                status: Status | null;
                lastSeenAt: Date | null;
            }>;
        }>
    ) => void
): Promise<void> => {
    try {
        const users = await Promise.all(
            userIds.map(async (userId) => {
                const status = await getUserStatus(userId);
                return { userId, ...status };
            })
        );

        invokeCallback(callback, createSuccessResponse({ users }));
    } catch (error) {
        console.error('Failed to get presence:', error);
        invokeCallback(
            callback,
            createErrorResponse(getErrorMessage(error, 'Failed to get presence'))
        );
    }
};
