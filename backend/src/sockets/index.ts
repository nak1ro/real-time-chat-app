import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { socketAuthMiddleware } from './core/socket.auth';
import { handleConnection } from './handlers/socket.handlers';
import { AuthenticatedSocket } from './core/socket.types';
import { SOCKET_EVENTS } from './core/socket.utils';

// Socket.IO server configuration
const SOCKET_CONFIG = {
    CONNECT_TIMEOUT: 10000,
    PING_TIMEOUT: 5000,
    PING_INTERVAL: 25000,
} as const;

// Initialize Socket.IO server with authentication and handlers
export const initializeSocketIO = (httpServer: HTTPServer): Server => {
    const io = new Server(httpServer, {
        cors: {
            origin: env.corsOrigin,
            credentials: true,
            methods: ['GET', 'POST'],
        },
        connectTimeout: SOCKET_CONFIG.CONNECT_TIMEOUT,
        pingTimeout: SOCKET_CONFIG.PING_TIMEOUT,
        pingInterval: SOCKET_CONFIG.PING_INTERVAL,
    });

    // Apply authentication middleware
    io.use(socketAuthMiddleware);

    io.on(SOCKET_EVENTS.CONNECT, (socket: AuthenticatedSocket) => {
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

    console.log('Socket.IO server initialized');

    return io;
};

// Core exports
export * from './core/socket.types';
export * from './core/socket.auth';
export * from './core/socket.utils';

// Handler exports
export * from './handlers/socket.handlers';
export * from './handlers/socket.rooms';
export * from './handlers/socket.messages';

export * from './handlers/socket.reactions';
export * from './handlers/socket.receipts';
export * from './handlers/socket.presence';
