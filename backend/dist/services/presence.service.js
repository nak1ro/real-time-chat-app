"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelPendingOffline = exports.getUsersStatus = exports.getUserStatus = exports.updateLastSeen = exports.setUserOffline = exports.setUserOnline = exports.PRESENCE_CONFIG = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../db/prisma");
const middleware_1 = require("../middleware");
// Constants
exports.PRESENCE_CONFIG = {
    GRACE_PERIOD_MS: 5000,
    HEARTBEAT_TIMEOUT_MS: 30000,
    OFFLINE_BROADCAST_DELAY_MS: 5100,
};
// State management for grace period disconnections
const pendingDisconnections = new Map();
// Helper Functions
// Clear pending offline timeout for a user
const clearPendingOffline = (userId) => {
    const timeout = pendingDisconnections.get(userId);
    if (timeout) {
        clearTimeout(timeout);
        pendingDisconnections.delete(userId);
    }
};
// Check if user has pending offline status
const hasPendingOffline = (userId) => {
    return pendingDisconnections.has(userId);
};
// Update user status in database
const updateUserStatus = async (userId, status) => {
    await prisma_1.prisma.user.update({
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
const setUserOnline = async (userId) => {
    clearPendingOffline(userId);
    await updateUserStatus(userId, client_1.Status.ONLINE);
};
exports.setUserOnline = setUserOnline;
// Set user status to OFFLINE with optional grace period
const setUserOffline = async (userId, immediate = false) => {
    if (immediate) {
        await updateUserStatus(userId, client_1.Status.OFFLINE);
        return;
    }
    if (hasPendingOffline(userId)) {
        return;
    }
    const timeout = setTimeout(async () => {
        await updateUserStatus(userId, client_1.Status.OFFLINE);
        pendingDisconnections.delete(userId);
    }, exports.PRESENCE_CONFIG.GRACE_PERIOD_MS);
    pendingDisconnections.set(userId, timeout);
};
exports.setUserOffline = setUserOffline;
// Update only the lastSeenAt timestamp
const updateLastSeen = async (userId) => {
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() },
    });
};
exports.updateLastSeen = updateLastSeen;
// Get single user's presence status
const getUserStatus = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            status: true,
            lastSeenAt: true,
        },
    });
    if (!user) {
        throw new middleware_1.NotFoundError('User');
    }
    return {
        status: user.status,
        lastSeenAt: user.lastSeenAt,
    };
};
exports.getUserStatus = getUserStatus;
// Get multiple users' presence status
const getUsersStatus = async (userIds) => {
    const users = await prisma_1.prisma.user.findMany({
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
exports.getUsersStatus = getUsersStatus;
// Cancel any pending offline status
const cancelPendingOffline = (userId) => {
    if (hasPendingOffline(userId)) {
        clearPendingOffline(userId);
        console.log(`Cancelled pending offline for user ${userId}`);
    }
};
exports.cancelPendingOffline = cancelPendingOffline;
