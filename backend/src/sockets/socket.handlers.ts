import { Server } from 'socket.io';
import { AuthenticatedSocket } from './socket.types';

/**
 * Handle socket connection events
 */
export const handleConnection = (io: Server, socket: AuthenticatedSocket): void => {
    const { userId, userName } = socket.data;

    console.log(`✅ User connected: ${userName} (${userId}) - Socket: ${socket.id}`);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        console.log(`❌ User disconnected: ${userName} (${userId}) - Reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error(`Socket error for user ${userId}:`, error);
    });

    // More handlers will be added here (messages, typing, etc.)
};

