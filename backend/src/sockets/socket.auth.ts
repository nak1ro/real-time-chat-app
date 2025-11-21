import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { verifyToken } from '../services/token.service';
import { findUserById } from '../services/user.service';
import { SocketData } from './socket.types';

// Extract token from socket handshake (auth, header, or query)
const extractToken = (socket: Socket): string | null => {
    return (
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace('Bearer ', '') ||
        (socket.handshake.query.token as string) ||
        null
    );
};

// Create authentication error
const createAuthError = (message: string): ExtendedError => {
    return new Error(message);
};

// Socket.IO authentication middleware
export const socketAuthMiddleware = async (
    socket: Socket,
    next: (err?: ExtendedError) => void
): Promise<void> => {
    try {
        const token = extractToken(socket);

        if (!token) {
            return next(createAuthError('Authentication token required'));
        }

        const payload = verifyToken(token);

        if (!payload.userId) {
            return next(createAuthError('Invalid token payload'));
        }

        const user = await findUserById(payload.userId);

        if (!user) {
            return next(createAuthError('User not found'));
        }

        const socketData: SocketData = {
            userId: user.id,
            userName: user.name,
        };

        socket.data = socketData;

        next();
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Authentication failed';
        next(createAuthError(message));
    }
};
