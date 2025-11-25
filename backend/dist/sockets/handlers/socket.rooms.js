"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentRooms = exports.leaveAllConversations = exports.leaveConversation = exports.joinConversation = exports.joinUserConversations = exports.verifyConversationMembership = exports.getUserConversationIds = void 0;
const prisma_1 = require("../../db/prisma");
const socket_utils_1 = require("../core/socket.utils");
// Get all conversation IDs for a user
const getUserConversationIds = async (userId) => {
    const memberships = await prisma_1.prisma.conversationMember.findMany({
        where: { userId },
        select: { conversationId: true },
    });
    return memberships.map((m) => m.conversationId);
};
exports.getUserConversationIds = getUserConversationIds;
// Verify user has membership in a conversation
const verifyConversationMembership = async (userId, conversationId) => {
    const membership = await prisma_1.prisma.conversationMember.findFirst({
        where: { userId, conversationId },
    });
    return membership !== null;
};
exports.verifyConversationMembership = verifyConversationMembership;
// Join all conversation rooms for a user on connect
const joinUserConversations = async (socket) => {
    const { userId, userName } = socket.data;
    try {
        const conversationIds = await (0, exports.getUserConversationIds)(userId);
        if (conversationIds.length === 0) {
            console.log(`User ${userName} has no conversations`);
            return;
        }
        await socket.join(conversationIds);
        console.log(`User ${userName} joined ${conversationIds.length} rooms: ${(0, socket_utils_1.formatConversationList)(conversationIds)}`);
    }
    catch (error) {
        console.error(`Failed to join conversations for user ${userId}:`, error);
    }
};
exports.joinUserConversations = joinUserConversations;
// Join a specific conversation room with membership verification
const joinConversation = async (socket, conversationId) => {
    const { userId, userName } = socket.data;
    try {
        const isMember = await (0, exports.verifyConversationMembership)(userId, conversationId);
        if (!isMember) {
            console.warn(`User ${userName} attempted to join ${conversationId} without membership`);
            return false;
        }
        await socket.join(conversationId);
        console.log(`User ${userName} joined room: ${conversationId}`);
        return true;
    }
    catch (error) {
        console.error(`Failed to join conversation ${conversationId}:`, error);
        return false;
    }
};
exports.joinConversation = joinConversation;
// Leave a specific conversation room
const leaveConversation = async (socket, conversationId) => {
    const { userName } = socket.data;
    await socket.leave(conversationId);
    console.log(`User ${userName} left room: ${conversationId}`);
};
exports.leaveConversation = leaveConversation;
// Leave all conversation rooms on disconnect
const leaveAllConversations = async (socket) => {
    const { userName } = socket.data;
    const rooms = (0, socket_utils_1.filterSocketRooms)(socket.rooms, socket.id);
    if (rooms.length === 0)
        return;
    for (const room of rooms) {
        await socket.leave(room);
    }
    console.log(`User ${userName} left ${rooms.length} rooms`);
};
exports.leaveAllConversations = leaveAllConversations;
// Get current rooms the socket is in
const getCurrentRooms = (socket) => {
    return (0, socket_utils_1.filterSocketRooms)(socket.rooms, socket.id);
};
exports.getCurrentRooms = getCurrentRooms;
