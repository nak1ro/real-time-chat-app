// Unified Socket.IO client instance
import { io, Socket } from 'socket.io-client';
import { socketConfig } from '@/lib/config/socket-config';
import type { ServerToClientEvents, ClientToServerEvents } from './events';

// Typed socket instance
export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Singleton socket instance
let socket: TypedSocket | null = null;

// Create socket connection with auth token
export function createSocket(token: string): TypedSocket {
  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
  }

  // Create new socket with auth
  socket = io(socketConfig.url, {
    ...socketConfig.options,
    auth: {
      token,
    },
  }) as TypedSocket;

  return socket;
}

// Get current socket instance
export function getSocket(): TypedSocket | null {
  return socket;
}

// Connect socket
export function connectSocket(): void {
  if (socket && !socket.connected) {
    socket.connect();
  }
}

// Disconnect socket
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Check if socket is connected
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

// Emit event with callback
export function emitWithCallback<T>(
  event: keyof ClientToServerEvents,
  data: unknown,
  callback?: (response: T) => void
): void {
  if (socket && socket.connected) {
    (socket.emit as Function)(event, data, callback);
  } else {
    console.warn(`Socket not connected, cannot emit event: ${event}`);
  }
}

