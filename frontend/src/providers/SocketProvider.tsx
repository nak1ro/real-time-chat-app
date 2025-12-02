'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SocketContext, type SocketStatus } from '@/context/SocketContext';
import { useAuth } from '@/hooks/useAuth';
import { createSocket, getSocket, disconnectSocket, type TypedSocket } from '@/lib/socket/socket-client';
import { SOCKET_EVENTS, type SocketResponse } from '@/lib/socket/events';
import { socketConfig } from '@/lib/config/socket-config';

interface SocketProviderProps {
    children: React.ReactNode;
}

// Hook to manage socket connection lifecycle
function useSocketConnection(token: string | null, isAuthenticated: boolean) {
    const [socket, setSocket] = useState<TypedSocket | null>(null);
    const [status, setStatus] = useState<SocketStatus>('disconnected');
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

    const startHeartbeat = useCallback((socketInstance: TypedSocket) => {
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        socketInstance.emit(SOCKET_EVENTS.PRESENCE_HEARTBEAT); // Initial heartbeat
        heartbeatRef.current = setInterval(() => {
            socketInstance.emit(SOCKET_EVENTS.PRESENCE_HEARTBEAT);
        }, socketConfig.heartbeatInterval);
    }, []);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
        }
    }, []);

    const connect = useCallback(() => {
        if (!token) return;
        setStatus('connecting');
        const newSocket = createSocket(token);

        newSocket.on(SOCKET_EVENTS.CONNECT, () => {
            setStatus('connected');
            setSocket(newSocket);
            startHeartbeat(newSocket);
        });

        newSocket.on(SOCKET_EVENTS.DISCONNECT, () => {
            setStatus('disconnected');
            stopHeartbeat();
        });

        newSocket.on(SOCKET_EVENTS.CONNECT_ERROR, () => setStatus('error'));
        newSocket.connect();
    }, [token, startHeartbeat, stopHeartbeat]);

    const disconnect = useCallback(() => {
        stopHeartbeat();
        disconnectSocket();
        setSocket(null);
        setStatus('disconnected');
    }, [stopHeartbeat]);

    // Auto-connect/disconnect based on auth
    useEffect(() => {
        if (isAuthenticated && token) {
            const timer = setTimeout(connect, socketConfig.authReconnectDelay);
            return () => clearTimeout(timer);
        } else {
            disconnect();
        }
    }, [isAuthenticated, token, connect, disconnect]);

    // Handle visibility change for heartbeat
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && socket?.connected) socket.emit(SOCKET_EVENTS.PRESENCE_HEARTBEAT);
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [socket]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopHeartbeat();
            disconnectSocket();
        };
    }, [stopHeartbeat]);

    return { socket, status, connect, disconnect };
}

// Hook to manage socket room operations
function useSocketRoom() {
    const joinConversation = useCallback(async (conversationId: string): Promise<boolean> => {
        const currentSocket = getSocket();
        if (!currentSocket?.connected) return false;

        return new Promise((resolve) => {
            currentSocket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, conversationId, (response) => {
                resolve(response.success);
            });
        });
    }, []);

    const leaveConversation = useCallback(async (conversationId: string): Promise<void> => {
        const currentSocket = getSocket();
        if (!currentSocket?.connected) return;

        return new Promise((resolve) => {
            currentSocket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, conversationId, () => resolve());
        });
    }, []);

    return { joinConversation, leaveConversation };
}

export function SocketProvider({ children }: SocketProviderProps) {
    const { token, isAuthenticated } = useAuth();
    const { socket, status, connect, disconnect } = useSocketConnection(token, isAuthenticated);
    const { joinConversation, leaveConversation } = useSocketRoom();

    const contextValue = useMemo(() => ({
        socket,
        status,
        isConnected: status === 'connected',
        connect,
        disconnect,
        joinConversation,
        leaveConversation,
    }), [socket, status, connect, disconnect, joinConversation, leaveConversation]);

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
}
