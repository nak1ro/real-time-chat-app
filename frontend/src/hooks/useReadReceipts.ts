'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SOCKET_EVENTS } from '@/lib/socket/events';
import { getSocket, isSocketConnected } from '@/lib/socket';
import { Message } from '@/types';
import { shouldMarkAsDelivered, shouldMarkAsRead } from '@/lib/utils/receiptHelpers';

interface UseReadReceiptsOptions {
    conversationId: string | undefined | null;
    currentUserId: string;
    messages: Message[];
    scrollContainerRef: React.RefObject<HTMLElement | null>;
}

interface QueuedReceipt {
    type: 'delivered' | 'read';
    payload: any;
}

export function useReadReceipts({
    conversationId,
    currentUserId,
    messages,
    scrollContainerRef,
}: UseReadReceiptsOptions) {
    const [pendingReadIds, setPendingReadIds] = useState<Set<string>>(new Set());
    const [isObserving, setIsObserving] = useState(false);

    const flushTimeoutRef = useRef<NodeJS.Timeout>();
    const messageRefs = useRef<Map<string, HTMLElement>>(new Map());
    const emittedReceiptsRef = useRef<Set<string>>(new Set());
    const offlineQueueRef = useRef<QueuedReceipt[]>([]);

    // Helper to check if socket is connected
    const socketConnected = useCallback(() => {
        const socket = getSocket();
        return socket && isSocketConnected();
    }, []);

    // Emit delivered receipt
    const emitDelivered = useCallback(
        (messageId: string) => {
            if (!conversationId) return;

            const key = `${messageId}-delivered`;
            if (emittedReceiptsRef.current.has(key)) return;

            const payload = { messageId, conversationId };

            if (!socketConnected()) {
                // Queue for later
                offlineQueueRef.current.push({ type: 'delivered', payload });
                console.log('[useReadReceipts] Queued RECEIPT_DELIVERED (offline):', messageId);
                return;
            }

            const socket = getSocket();
            if (!socket) return;

            socket.emit(SOCKET_EVENTS.RECEIPT_DELIVERED, payload);
            emittedReceiptsRef.current.add(key);
            console.log('[useReadReceipts] Emitted RECEIPT_DELIVERED:', messageId);
        },
        [conversationId, socketConnected]
    );

    // Emit read receipts (batched)
    const emitRead = useCallback(
        (messageIds: string[]) => {
            if (!conversationId || messageIds.length === 0) return;

            // Filter out already emitted
            const newIds = messageIds.filter((id) => {
                const key = `${id}-read`;
                return !emittedReceiptsRef.current.has(key);
            });

            if (newIds.length === 0) return;

            // Find the latest message ID (last in array)
            const lastMessageId = newIds[newIds.length - 1];
            const payload = { conversationId, upToMessageId: lastMessageId };

            if (!socketConnected()) {
                // Queue for later
                offlineQueueRef.current.push({ type: 'read', payload });
                console.log('[useReadReceipts] Queued RECEIPT_READ (offline):', newIds.length, 'messages');
                return;
            }

            const socket = getSocket();
            if (!socket) return;

            socket.emit(SOCKET_EVENTS.RECEIPT_READ, payload);

            // Mark as emitted
            newIds.forEach((id) => {
                emittedReceiptsRef.current.add(`${id}-read`);
            });

            console.log('[useReadReceipts] Emitted RECEIPT_READ:', newIds.length, 'messages');
        },
        [conversationId, socketConnected]
    );

    // Debounced flush function
    const debouncedFlushReadReceipts = useCallback(() => {
        // Clear existing timeout
        if (flushTimeoutRef.current) {
            clearTimeout(flushTimeoutRef.current);
        }

        // Set new timeout to batch multiple reads
        flushTimeoutRef.current = setTimeout(() => {
            if (pendingReadIds.size > 0) {
                const ids = Array.from(pendingReadIds);
                emitRead(ids);
                setPendingReadIds(new Set());
            }
        }, 500); // 500ms debounce delay
    }, [pendingReadIds, emitRead]);

    // Register/update message ref
    const registerMessageRef = useCallback((messageId: string, element: HTMLElement | null) => {
        if (element) {
            messageRefs.current.set(messageId, element);
        } else {
            messageRefs.current.delete(messageId);
        }
    }, []);

    // Setup IntersectionObserver for viewport detection
    useEffect(() => {
        if (!conversationId || !scrollContainerRef.current || messages.length === 0) {
            setIsObserving(false);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const messageId = entry.target.getAttribute('data-message-id');
                        if (!messageId) return;

                        const message = messages.find((m) => m.id === messageId);
                        if (!message) return;

                        // Only mark as read if appropriate
                        if (shouldMarkAsRead(message, currentUserId, pendingReadIds)) {
                            setPendingReadIds((prev) => new Set(prev).add(messageId));
                            debouncedFlushReadReceipts();
                        }
                    }
                });
            },
            {
                threshold: 0.5, // 50% of message must be visible
                root: scrollContainerRef.current,
            }
        );

        // Observe all message elements
        messageRefs.current.forEach((element) => {
            if (element) observer.observe(element);
        });

        setIsObserving(true);

        return () => {
            observer.disconnect();
            setIsObserving(false);
        };
    }, [messages, conversationId, currentUserId, scrollContainerRef, pendingReadIds, debouncedFlushReadReceipts]);

    // Handle visibility changes - flush pending reads when tab is hidden
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && pendingReadIds.size > 0) {
                console.log('[useReadReceipts] Tab hidden, flushing pending reads');
                const ids = Array.from(pendingReadIds);
                emitRead(ids);
                setPendingReadIds(new Set());
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [pendingReadIds, emitRead]);

    // Flush offline queue when reconnected
    useEffect(() => {
        if (!socketConnected()) return;

        const socket = getSocket();
        if (!socket) return;

        const handleConnect = () => {
            console.log('[useReadReceipts] Socket reconnected, flushing offline queue');

            while (offlineQueueRef.current.length > 0) {
                const { type, payload } = offlineQueueRef.current.shift()!;
                const event =
                    type === 'delivered'
                        ? SOCKET_EVENTS.RECEIPT_DELIVERED
                        : SOCKET_EVENTS.RECEIPT_READ;
                socket.emit(event, payload);
            }
        };

        socket.on('connect', handleConnect);

        // Flush queue if already connected
        if (offlineQueueRef.current.length > 0) {
            handleConnect();
        }

        return () => {
            socket.off('connect', handleConnect);
        };
    }, [socketConnected]);

    // Cleanup on unmount or conversation change
    useEffect(() => {
        return () => {
            // Clear pending timeout
            if (flushTimeoutRef.current) {
                clearTimeout(flushTimeoutRef.current);
            }

            // Flush any remaining pending reads
            if (pendingReadIds.size > 0 && conversationId) {
                const ids = Array.from(pendingReadIds);
                emitRead(ids);
            }
        };
    }, [conversationId, pendingReadIds, emitRead]);

    // Mark new messages as delivered when received
    useEffect(() => {
        if (!conversationId) return;

        messages.forEach((message) => {
            if (shouldMarkAsDelivered(message, currentUserId)) {
                emitDelivered(message.id);
            }
        });
    }, [messages, conversationId, currentUserId, emitDelivered]);

    return {
        pendingReadIds,
        emitDelivered,
        emitRead,
        isObserving,
        registerMessageRef,
    };
}
