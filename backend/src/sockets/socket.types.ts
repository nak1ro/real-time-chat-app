import { Server, Socket } from 'socket.io';
import { MessageWithRelations } from '../domain';

// Extended socket data attached to each authenticated socket
export interface SocketData {
    userId: string;
    userName: string;
}

// Type-safe socket with authenticated user data
export interface AuthenticatedSocket extends Socket {
    data: SocketData;
}

// Socket.IO server instance
export type ChatServer = Server;

// Server to client events (server emits, client listens)
export interface ServerToClientEvents {
    'message:new': (message: MessageWithRelations) => void;
    'message:updated': (message: MessageWithRelations) => void;
    'message:deleted': (message: MessageWithRelations) => void;
}

// Standard response types
export interface SuccessResponse<T = any> {
    success: true;
    data?: T;
}

export interface ErrorResponse {
    success: false;
    error: string;
}

export type SocketResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Client to server events (client emits, server listens)
export interface ClientToServerEvents {
    'conversation:join': (
        conversationId: string,
        callback?: (response: SocketResponse<{ conversationId: string }>) => void
    ) => void;
    'conversation:leave': (
        conversationId: string,
        callback?: (response: SocketResponse<{ conversationId: string }>) => void
    ) => void;
    'rooms:get': (callback?: (response: SocketResponse<{ rooms: string[] }>) => void) => void;
    'message:send': (
        data: { conversationId: string; text: string; replyToId?: string },
        callback?: (response: SocketResponse<{ message: MessageWithRelations }>) => void
    ) => void;
    'message:edit': (
        data: { messageId: string; text: string },
        callback?: (response: SocketResponse<{ message: MessageWithRelations }>) => void
    ) => void;
    'message:delete': (
        data: { messageId: string },
        callback?: (response: SocketResponse<{ message: MessageWithRelations }>) => void
    ) => void;
}

// Inter-server events (for horizontal scaling)
export interface InterServerEvents {
    // For future use with Redis adapter
}
