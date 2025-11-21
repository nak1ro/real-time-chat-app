import { prisma } from '../db/prisma';
import { AuthenticatedSocket } from './socket.types';
import { filterSocketRooms, formatConversationList } from './socket.utils';

// Get all conversation IDs for a user
const getUserConversationIds = async (userId: string): Promise<string[]> => {
    const memberships = await prisma.conversationMember.findMany({
        where: { userId },
        select: { conversationId: true },
    });

    return memberships.map((m) => m.conversationId);
};

// Verify user has membership in a conversation
const verifyConversationMembership = async (
    userId: string,
    conversationId: string
): Promise<boolean> => {
    const membership = await prisma.conversationMember.findFirst({
        where: { userId, conversationId },
    });

    return membership !== null;
};

// Join all conversation rooms for a user on connect
export const joinUserConversations = async (socket: AuthenticatedSocket): Promise<void> => {
    const { userId, userName } = socket.data;

    try {
        const conversationIds = await getUserConversationIds(userId);

        if (conversationIds.length === 0) {
            console.log(`User ${userName} has no conversations`);
            return;
        }

        await socket.join(conversationIds);

        console.log(
            `User ${userName} joined ${conversationIds.length} rooms: ${formatConversationList(conversationIds)}`
        );
    } catch (error) {
        console.error(`Failed to join conversations for user ${userId}:`, error);
    }
};

// Join a specific conversation room with membership verification
export const joinConversation = async (
    socket: AuthenticatedSocket,
    conversationId: string
): Promise<boolean> => {
    const { userId, userName } = socket.data;

    try {
        const isMember = await verifyConversationMembership(userId, conversationId);

        if (!isMember) {
            console.warn(`User ${userName} attempted to join ${conversationId} without membership`);
            return false;
        }

        await socket.join(conversationId);
        console.log(`User ${userName} joined room: ${conversationId}`);
        
        return true;
    } catch (error) {
        console.error(`Failed to join conversation ${conversationId}:`, error);
        return false;
    }
};

// Leave a specific conversation room
export const leaveConversation = async (
    socket: AuthenticatedSocket,
    conversationId: string
): Promise<void> => {
    const { userName } = socket.data;
    
    await socket.leave(conversationId);
    console.log(`User ${userName} left room: ${conversationId}`);
};

// Leave all conversation rooms on disconnect
export const leaveAllConversations = async (socket: AuthenticatedSocket): Promise<void> => {
    const { userName } = socket.data;
    const rooms = filterSocketRooms(socket.rooms, socket.id);

    if (rooms.length === 0) return;

    for (const room of rooms) {
        await socket.leave(room);
    }

    console.log(`User ${userName} left ${rooms.length} rooms`);
};

// Get current rooms the socket is in
export const getCurrentRooms = (socket: AuthenticatedSocket): string[] => {
    return filterSocketRooms(socket.rooms, socket.id);
};
