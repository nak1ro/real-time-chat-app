import { Server, Socket } from 'socket.io';

// Extended socket data
export interface SocketData {
    userId: string;
    userName: string;
}

// Type-safe socket with user data
export interface AuthenticatedSocket extends Socket {
    data: SocketData;
}

// Server type with CORS
export type ChatServer = Server;

// Socket events (will be extended as we add features)
export interface ServerToClientEvents {
    // Will be populated with real-time events
}

export interface ClientToServerEvents {
    // Will be populated with client events
}

export interface InterServerEvents {
    // For multi-server setups
}

