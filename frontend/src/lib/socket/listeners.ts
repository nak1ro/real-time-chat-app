// Socket event listener helpers
import type { TypedSocket } from './socket-client';
import type { Notification } from '@/types';
import { SOCKET_EVENTS, type ServerToClientEvents } from './events';

type EventName = keyof ServerToClientEvents;
type EventHandler<E extends EventName> = ServerToClientEvents[E];

// Register a single event listener
export function onSocketEvent<E extends EventName>(
  socket: TypedSocket,
  event: E,
  handler: EventHandler<E>
): () => void {
  socket.on(event, handler as any);
  return () => socket.off(event, handler as any);
}

// Register multiple event listeners, returns cleanup function
export function registerSocketListeners(
  socket: TypedSocket,
  listeners: Partial<{ [E in EventName]: EventHandler<E> }>
): () => void {
  const cleanups: (() => void)[] = [];

  for (const [event, handler] of Object.entries(listeners)) {
    if (handler) {
      socket.on(event as EventName, handler as any);
      cleanups.push(() => socket.off(event as EventName, handler as any));
    }
  }

  return () => cleanups.forEach((cleanup) => cleanup());
}

// Create a message listener
export function createMessageListeners(socket: TypedSocket, handlers: {
  onNew?: ServerToClientEvents[typeof SOCKET_EVENTS.MESSAGE_NEW];
  onUpdated?: ServerToClientEvents[typeof SOCKET_EVENTS.MESSAGE_UPDATED];
  onDeleted?: ServerToClientEvents[typeof SOCKET_EVENTS.MESSAGE_DELETED];
}): () => void {
  return registerSocketListeners(socket, {
    [SOCKET_EVENTS.MESSAGE_NEW]: handlers.onNew,
    [SOCKET_EVENTS.MESSAGE_UPDATED]: handlers.onUpdated,
    [SOCKET_EVENTS.MESSAGE_DELETED]: handlers.onDeleted,
  });
}

// Create a presence listener
export function createPresenceListener(
  socket: TypedSocket,
  handler: ServerToClientEvents[typeof SOCKET_EVENTS.PRESENCE_UPDATE]
): () => void {
  return onSocketEvent(socket, SOCKET_EVENTS.PRESENCE_UPDATE, handler);
}

// Create a notification listener
export function createNotificationListeners(
    socket: TypedSocket,
    handlers: {
      onNew?: (notification: Notification) => void;
      onCountUpdated?: (payload: { count: number }) => void;
    }
): () => void {
  if (handlers.onNew) {
    console.log('[NOTIFICATION] Subscribing to', SOCKET_EVENTS.NOTIFICATION_NEW);
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, handlers.onNew);
  }

  if (handlers.onCountUpdated) {
    console.log('[NOTIFICATION] Subscribing to', SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED);
    socket.on(SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, handlers.onCountUpdated);
  }

  return () => {
    if (handlers.onNew) {
      console.log('[NOTIFICATION] Unsubscribing from', SOCKET_EVENTS.NOTIFICATION_NEW);
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, handlers.onNew);
    }
    if (handlers.onCountUpdated) {
      console.log('[NOTIFICATION] Unsubscribing from', SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED);
      socket.off(SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, handlers.onCountUpdated);
    }
  };
}

// Create a reaction listener
export function createReactionListener(
  socket: TypedSocket,
  handler: ServerToClientEvents[typeof SOCKET_EVENTS.REACTION_UPDATED]
): () => void {
  return onSocketEvent(socket, SOCKET_EVENTS.REACTION_UPDATED, handler);
}

// Create a receipt listener
export function createReceiptListener(
  socket: TypedSocket,
  handler: ServerToClientEvents[typeof SOCKET_EVENTS.RECEIPT_UPDATE]
): () => void {
  return onSocketEvent(socket, SOCKET_EVENTS.RECEIPT_UPDATE, handler);
}

// Create a moderation listener
export function createModerationListener(
  socket: TypedSocket,
  handler: ServerToClientEvents[typeof SOCKET_EVENTS.MODERATION_UPDATED]
): () => void {
  return onSocketEvent(socket, SOCKET_EVENTS.MODERATION_UPDATED, handler);
}
