import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { socketAuthMiddleware } from './socket.auth';
import { handleConnection } from './socket.handlers';
import { AuthenticatedSocket } from './socket.types';

/**
 * Initialize Socket.IO server with authentication
 */
export const initializeSocketIO = (httpServer: HTTPServer): Server => {
    const io = new Server(httpServer, {
        cors: {
            origin: env.corsOrigin,
            credentials: true,
            methods: ['GET', 'POST'],
        },
        // Connection timeout
        connectTimeout: 10000,
        // Ping settings
        pingTimeout: 5000,
        pingInterval: 25000,
    });

    // Apply authentication middleware
    io.use(socketAuthMiddleware);

    // Handle connections
    io.on('connection', (socket: AuthenticatedSocket) => {
        handleConnection(io, socket);
    });

    // Handle connection errors
    io.engine.on('connection_error', (err) => {
        console.error('Socket connection error:', {
            message: err.message,
            code: err.code,
            context: err.context,
        });
    });

    console.log('🔌 Socket.IO server initialized');

    return io;
};

export * from './socket.types';
export * from './socket.auth';
export * from './socket.handlers';

