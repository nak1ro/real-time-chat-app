"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentRooms = exports.leaveAllConversations = exports.leaveConversation = exports.joinConversation = exports.joinUserConversations = exports.getUserConversationIds = void 0;
const prisma_1 = require("../db/prisma");
/**
 * Get all conversation IDs that a user is a member of
 */
const getUserConversationIds = async (userId) => {
    const memberships = await prisma_1.prisma.conversationMember.findMany({
        where: { userId },
        select: { conversationId: true },
    });
    return memberships.map((m) => m.conversationId);
};
exports.getUserConversationIds = getUserConversationIds;
/**
 * Join all conversation rooms for a user
 */
const joinUserConversations = async (socket) => {
    const { userId, userName } = socket.data;
    try {
        const conversationIds = await (0, exports.getUserConversationIds)(userId);
        if (conversationIds.length === 0) {
            console.log(`📭 User ${userName} has no conversations to join`);
            return;
        }
        // Join all conversation rooms
        await socket.join(conversationIds);
        console.log(`📬 User ${userName} joined ${conversationIds.length} conversation rooms:`, conversationIds.slice(0, 3).join(', ') + (conversationIds.length > 3 ? '...' : ''));
    }
    catch (error) {
        console.error(`Failed to join conversations for user ${userId}:`, error);
    }
};
exports.joinUserConversations = joinUserConversations;
/**
 * Join a specific conversation room
 */
const joinConversation = async (socket, conversationId) => {
    const { userId, userName } = socket.data;
    try {
        // Verify user is a member of the conversation
        const membership = await prisma_1.prisma.conversationMember.findFirst({
            where: {
                userId,
                conversationId,
            },
        });
        if (!membership) {
            console.warn(`User ${userName} attempted to join conversation ${conversationId} without membership`);
            return false;
        }
        await socket.join(conversationId);
        console.log(`➕ User ${userName} joined conversation room: ${conversationId}`);
        return true;
    }
    catch (error) {
        console.error(`Failed to join conversation ${conversationId}:`, error);
        return false;
    }
};
exports.joinConversation = joinConversation;
/**
 * Leave a specific conversation room
 */
const leaveConversation = async (socket, conversationId) => {
    const { userName } = socket.data;
    await socket.leave(conversationId);
    console.log(`➖ User ${userName} left conversation room: ${conversationId}`);
};
exports.leaveConversation = leaveConversation;
/**
 * Leave all conversation rooms
 */
const leaveAllConversations = async (socket) => {
    const { userName } = socket.data;
    // Get all rooms the socket is in (excluding the default socket.id room)
    const rooms = Array.from(socket.rooms).filter((room) => room !== socket.id);
    for (const room of rooms) {
        await socket.leave(room);
    }
    if (rooms.length > 0) {
        console.log(`🚪 User ${userName} left ${rooms.length} conversation rooms`);
    }
};
exports.leaveAllConversations = leaveAllConversations;
/**
 * Get current rooms the socket is in (excluding default socket.id room)
 */
const getCurrentRooms = (socket) => {
    return Array.from(socket.rooms).filter((room) => room !== socket.id);
};
exports.getCurrentRooms = getCurrentRooms;
