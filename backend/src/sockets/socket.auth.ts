import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { verifyToken } from '../services/token.service';
import { findUserById } from '../services/user.service';
import { SocketData } from './socket.types';

/**
 * Socket.IO authentication middleware
 * Verifies JWT token and attaches user data to socket
 */
export const socketAuthMiddleware = async (
    socket: Socket,
    next: (err?: ExtendedError) => void
): Promise<void> => {
    try {
        // Extract token from handshake auth or query
        const token =
            socket.handshake.auth.token ||
            socket.handshake.headers.authorization?.replace('Bearer ', '') ||
            (socket.handshake.query.token as string);

        if (!token) {
            return next(new Error('Authentication token required'));
        }

        // Verify token
        const payload = verifyToken(token);

        if (!payload.userId) {
            return next(new Error('Invalid token payload'));
        }

        // Verify user exists
        const user = await findUserById(payload.userId);

        if (!user) {
            return next(new Error('User not found'));
        }

        // Attach user data to socket
        const socketData: SocketData = {
            userId: user.id,
            userName: user.name,
        };

        socket.data = socketData;

        next();
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Authentication failed';
        next(new Error(message));
    }
};

