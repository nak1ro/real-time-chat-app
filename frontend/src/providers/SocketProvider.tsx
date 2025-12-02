'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SocketContext, type SocketStatus } from '@/context/SocketContext';
import { useAuth } from '@/hooks/useAuth';
import {
  createSocket,
  getSocket,
  disconnectSocket,
  type TypedSocket,
} from '@/lib/socket/socket-client';
import { SOCKET_EVENTS, type SocketResponse } from '@/lib/socket/events';
import { socketConfig } from '@/lib/config/socket-config';

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to socket
  const connect = useCallback(() => {
    if (!token) {
      console.warn('[SocketProvider] Cannot connect socket: no auth token');
      return;
    }

    console.log('[SocketProvider] Initiating socket connection...');
    setStatus('connecting');

    const newSocket = createSocket(token);
    console.log('[SocketProvider] Socket created, connecting to:', socketConfig.url);

    // Connection handlers
    newSocket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('[SocketProvider] Socket connected successfully, socket.id:', newSocket.id);
      setStatus('connected');
      setSocket(newSocket);

      // Send IMMEDIATE heartbeat to reset server's timeout timer
      console.log('[SocketProvider] Sending initial heartbeat...');
      newSocket.emit(SOCKET_EVENTS.PRESENCE_HEARTBEAT);

      // Start heartbeat interval for subsequent pings
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      heartbeatRef.current = setInterval(() => {
        console.log('[SocketProvider] Sending heartbeat...');
        newSocket.emit(SOCKET_EVENTS.PRESENCE_HEARTBEAT);
      }, socketConfig.heartbeatInterval);
    });

    newSocket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('[SocketProvider] Socket disconnected, reason:', reason);
      setStatus('disconnected');

      // Stop heartbeat
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    });

    newSocket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
      console.error('[SocketProvider] Socket connection error:', error.message);
      console.error('[SocketProvider] Error details:', error);
      setStatus('error');
    });

    // Actually connect
    newSocket.connect();
  }, [token]);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    // Stop heartbeat
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    disconnectSocket();
    setSocket(null);
    setStatus('disconnected');
  }, []);

  // Join a conversation room
  const joinConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    const currentSocket = getSocket();
    console.log('[SocketProvider] joinConversation called:', {
      conversationId,
      hasSocket: !!currentSocket,
      isConnected: currentSocket?.connected,
    });

    if (!currentSocket?.connected) {
      console.warn('[SocketProvider] Cannot join conversation: socket not connected');
      return false;
    }

    return new Promise((resolve) => {
      console.log('[SocketProvider] Emitting conversation:join event...');
      currentSocket.emit(
        SOCKET_EVENTS.CONVERSATION_JOIN,
        conversationId,
        (response: SocketResponse<{ conversationId: string }>) => {
          console.log('[SocketProvider] conversation:join response:', response);
          if (response.success) {
            console.log('[SocketProvider] Successfully joined conversation:', conversationId);
            resolve(true);
          } else {
            console.error('[SocketProvider] Failed to join conversation:', response.error);
            resolve(false);
          }
        }
      );
    });
  }, []);

  // Leave a conversation room
  const leaveConversation = useCallback(async (conversationId: string): Promise<void> => {
    const currentSocket = getSocket();
    if (!currentSocket?.connected) {
      console.log('[SocketProvider] Cannot leave conversation: socket not connected');
      return;
    }

    return new Promise((resolve) => {
      console.log('[SocketProvider] Emitting conversation:leave event:', conversationId);
      currentSocket.emit(
        SOCKET_EVENTS.CONVERSATION_LEAVE,
        conversationId,
        () => {
          console.log('[SocketProvider] Left conversation:', conversationId);
          resolve();
        }
      );
    });
  }, []);

  // Auto-connect when authenticated, disconnect when not
  useEffect(() => {
    if (isAuthenticated && token) {
      // Small delay to ensure token is stored
      const timer = setTimeout(connect, socketConfig.authReconnectDelay);
      return () => clearTimeout(timer);
    } else {
      disconnect();
    }
  }, [isAuthenticated, token, connect, disconnect]);

  // Handle tab visibility changes - restore presence when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && socket?.connected) {
        console.log('[SocketProvider] Tab became visible, sending heartbeat to restore online status...');
        socket.emit(SOCKET_EVENTS.PRESENCE_HEARTBEAT);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      disconnectSocket();
    };
  }, []);

  // Memoize context value
  const contextValue = useMemo(
    () => ({
      socket,
      status,
      isConnected: status === 'connected',
      connect,
      disconnect,
      joinConversation,
      leaveConversation,
    }),
    [socket, status, connect, disconnect, joinConversation, leaveConversation]
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

