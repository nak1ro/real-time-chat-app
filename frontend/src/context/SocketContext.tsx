'use client';

import { createContext, useContext } from 'react';
import type { TypedSocket } from '@/lib/socket/socket-client';

// Socket connection status
export type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Socket context value
export interface SocketContextValue {
  socket: TypedSocket | null;
  status: SocketStatus;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  joinConversation: (conversationId: string) => Promise<boolean>;
  leaveConversation: (conversationId: string) => Promise<void>;
}

// Default context value
const defaultContextValue: SocketContextValue = {
  socket: null,
  status: 'disconnected',
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
  joinConversation: async () => false,
  leaveConversation: async () => {},
};

// Create context
export const SocketContext = createContext<SocketContextValue>(defaultContextValue);

// Hook to use socket context
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

