import { Status } from '@prisma/client';
import { prisma } from '../db/prisma';
import { NotFoundError } from '../middleware';

// Constants
export const PRESENCE_CONFIG = {
    GRACE_PERIOD_MS: 5000,
    HEARTBEAT_TIMEOUT_MS: 30000,
    OFFLINE_BROADCAST_DELAY_MS: 5100,
} as const;

// State management for grace period disconnections
const pendingDisconnections = new Map<string, NodeJS.Timeout>();

// Helper Functions

// Clear pending offline timeout for a user
const clearPendingOffline = (userId: string): void => {
    const timeout = pendingDisconnections.get(userId);
    if (timeout) {
        clearTimeout(timeout);
        pendingDisconnections.delete(userId);
    }
};

// Check if user has pending offline status
const hasPendingOffline = (userId: string): boolean => {
    return pendingDisconnections.has(userId);
};

// Update user status in database
const updateUserStatus = async (
    userId: string,
    status: Status
): Promise<void> => {
    await prisma.user.update({
        where: { id: userId },
        data: {
            status,
            lastSeenAt: new Date(),
        },
    });

    console.log(`User ${userId} status: ${status}`);
};

// Public API

// Set user status to ONLINE
export const setUserOnline = async (userId: string): Promise<void> => {
    clearPendingOffline(userId);
    await updateUserStatus(userId, Status.ONLINE);
};

// Set user status to OFFLINE with optional grace period
export const setUserOffline = async (
    userId: string,
    immediate: boolean = false
): Promise<void> => {
    if (immediate) {
        await updateUserStatus(userId, Status.OFFLINE);
        return;
    }

    if (hasPendingOffline(userId)) {
        return;
    }

    const timeout = setTimeout(async () => {
        await updateUserStatus(userId, Status.OFFLINE);
        pendingDisconnections.delete(userId);
    }, PRESENCE_CONFIG.GRACE_PERIOD_MS);

    pendingDisconnections.set(userId, timeout);
};

// Update only the lastSeenAt timestamp
export const updateLastSeen = async (userId: string): Promise<void> => {
    await prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() },
    });
};

// Get single user's presence status
export const getUserStatus = async (
    userId: string
): Promise<{ status: Status | null; lastSeenAt: Date | null }> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            status: true,
            lastSeenAt: true,
        },
    });

    if (!user) {
        throw new NotFoundError('User');
    }

    return {
        status: user.status,
        lastSeenAt: user.lastSeenAt,
    };
};

// Get multiple users' presence status
export const getUsersStatus = async (
    userIds: string[]
): Promise<Map<string, { status: Status | null; lastSeenAt: Date | null }>> => {
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
            id: true,
            status: true,
            lastSeenAt: true,
        },
    });

    const statusMap = new Map();

    for (const user of users) {
        statusMap.set(user.id, {
            status: user.status,
            lastSeenAt: user.lastSeenAt,
        });
    }

    return statusMap;
};

// Cancel any pending offline status
export const cancelPendingOffline = (userId: string): void => {
    if (hasPendingOffline(userId)) {
        clearPendingOffline(userId);
        console.log(`Cancelled pending offline for user ${userId}`);
    }
};
