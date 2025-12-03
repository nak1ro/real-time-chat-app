"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
        // Auto-read messages on join
        try {
            // We need to import these dynamically or move them to avoid circular deps if possible,
            // but for now let's assume imports work or we'll fix them.
            // Actually, let's add the imports at the top.
            const { markMessagesAsRead } = await Promise.resolve().then(() => __importStar(require('../../services/messages/receipt.service')));
            const { broadcastBulkReadUpdate } = await Promise.resolve().then(() => __importStar(require('./socket.receipts')));
            // Mark all messages as read for this user
            const result = await markMessagesAsRead(conversationId, userId);
            if (result.messagesAffected > 0 && result.lastMessageId) {
                broadcastBulkReadUpdate(socket.nsp.server, // Access io instance from socket namespace
                conversationId, userId, result.lastMessageId, result.messagesAffected);
            }
        }
        catch (error) {
            console.error(`Failed to auto-read messages on join for user ${userId}:`, error);
        }
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
