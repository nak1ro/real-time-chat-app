// Socket event constants and payload types
import type { Message, Notification } from '@/types';
import type { Status, MessageDeliveryStatus } from '@/types/enums';

// Event names matching backend
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  ERROR: 'error',

  // Conversations
  CONVERSATION_JOIN: 'conversation:join',
  CONVERSATION_LEAVE: 'conversation:leave',

  // Rooms
  ROOMS_GET: 'rooms:get',

  // Messages (client -> server)
  MESSAGE_SEND: 'message:send',
  MESSAGE_EDIT: 'message:edit',
  MESSAGE_DELETE: 'message:delete',

  // Messages (server -> client)
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',

  // Mentions
  MENTION_NEW: 'mention:new',

  // Presence
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_HEARTBEAT: 'presence:heartbeat',
  PRESENCE_GET: 'presence:get',

  // Receipts
  RECEIPT_READ: 'receipt:read',
  RECEIPT_DELIVERED: 'receipt:delivered',
  RECEIPT_UPDATE: 'receipt:update',
  RECEIPT_GET_STATS: 'receipt:getStats',

  // Reactions
  REACTION_TOGGLE: 'reaction:toggle',
  REACTION_UPDATED: 'reaction:updated',

  // Notifications
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_GET_ALL: 'notification:getAll',
  NOTIFICATION_GET_UNREAD_COUNT: 'notification:getUnreadCount',
  NOTIFICATION_MARK_READ: 'notification:markRead',
  NOTIFICATION_MARK_ALL_READ: 'notification:markAllRead',
  NOTIFICATION_COUNT_UPDATED: 'notification:countUpdated',

  // Moderation
  MODERATION_ACTION: 'moderation:action',
  MODERATION_UPDATED: 'moderation:updated',
} as const;

// Presence data structure
export interface PresenceData {
  userId: string;
  status: Status | null;
  lastSeenAt: Date | null;
  timestamp: Date;
}

// Receipt update payload
export interface ReceiptUpdatePayload {
  conversationId: string;
  messageId: string;
  userId: string;
  status: MessageDeliveryStatus;
  seenAt: Date | null;
  timestamp: Date;
}

// Bulk receipt update
export interface BulkReceiptUpdate {
  conversationId: string;
  userId: string;
  lastReadMessageId: string;
  messagesAffected: number;
  timestamp: Date;
}

// Reaction update payload (matches backend socket.reactions.ts emit)
export interface ReactionUpdatePayload {
  messageId: string;
  emoji: string;
  userId: string;
  action: 'added' | 'removed';
}

// Notification count update (matches backend socket.notifications.ts emit)
export interface NotificationCountUpdate {
  count: number;
}

// Moderation update payload (matches backend socket.moderation.ts emit)
export interface ModerationUpdatePayload {
  action: 'MUTE' | 'UNMUTE' | 'BAN' | 'UNBAN' | 'KICK' | 'DELETE_MESSAGE' | 'MAKE_ADMIN' | 'REMOVE_ADMIN' | 'PIN_MESSAGE';
  conversationId: string;
  targetUserId?: string;
  messageId?: string;
  actorId: string;
  actorName: string;
  reason?: string;
  expiresAt?: Date | null;
}

// Socket response types
export interface SocketSuccessResponse<T = unknown> {
  success: true;
  data?: T;
}

export interface SocketErrorResponse {
  success: false;
  error: string;
}

export type SocketResponse<T = unknown> = SocketSuccessResponse<T> | SocketErrorResponse;

// Server to client events (what we listen to)
export interface ServerToClientEvents {
  [SOCKET_EVENTS.MESSAGE_NEW]: (message: Message) => void;
  [SOCKET_EVENTS.MESSAGE_UPDATED]: (message: Message) => void;
  [SOCKET_EVENTS.MESSAGE_DELETED]: (message: Message) => void;
  [SOCKET_EVENTS.PRESENCE_UPDATE]: (data: PresenceData) => void;
  [SOCKET_EVENTS.RECEIPT_UPDATE]: (data: ReceiptUpdatePayload | BulkReceiptUpdate) => void;
  [SOCKET_EVENTS.REACTION_UPDATED]: (data: ReactionUpdatePayload) => void;
  [SOCKET_EVENTS.NOTIFICATION_NEW]: (notification: Notification) => void;
  [SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED]: (data: NotificationCountUpdate) => void;
  [SOCKET_EVENTS.MENTION_NEW]: (data: { messageId: string; conversationId: string }) => void;
  [SOCKET_EVENTS.MODERATION_UPDATED]: (data: ModerationUpdatePayload) => void;
}

// Client to server events (what we emit)
export interface ClientToServerEvents {
  [SOCKET_EVENTS.CONVERSATION_JOIN]: (
    conversationId: string,
    callback?: (response: SocketResponse<{ conversationId: string }>) => void
  ) => void;
  [SOCKET_EVENTS.CONVERSATION_LEAVE]: (
    conversationId: string,
    callback?: (response: SocketResponse<{ conversationId: string }>) => void
  ) => void;
  [SOCKET_EVENTS.ROOMS_GET]: (
    callback?: (response: SocketResponse<{ rooms: string[] }>) => void
  ) => void;
  [SOCKET_EVENTS.MESSAGE_SEND]: (
    data: { conversationId: string; text: string; replyToId?: string },
    callback?: (response: SocketResponse<{ message: Message }>) => void
  ) => void;
  [SOCKET_EVENTS.MESSAGE_EDIT]: (
    data: { messageId: string; text: string },
    callback?: (response: SocketResponse<{ message: Message }>) => void
  ) => void;
  [SOCKET_EVENTS.MESSAGE_DELETE]: (
    data: { messageId: string },
    callback?: (response: SocketResponse<{ message: Message }>) => void
  ) => void;
  [SOCKET_EVENTS.PRESENCE_HEARTBEAT]: (
    callback?: (response: SocketResponse<{ timestamp: Date }>) => void
  ) => void;
  [SOCKET_EVENTS.PRESENCE_GET]: (
    userIds: string[],
    callback?: (response: SocketResponse<{ users: PresenceData[] }>) => void
  ) => void;
  [SOCKET_EVENTS.RECEIPT_READ]: (
    data: { conversationId: string; upToMessageId?: string },
    callback?: (response: SocketResponse<{ messagesAffected: number; lastMessageId: string | null }>) => void
  ) => void;
  [SOCKET_EVENTS.RECEIPT_DELIVERED]: (
    data: { messageId: string; conversationId: string },
    callback?: (response: SocketResponse<{ success: boolean }>) => void
  ) => void;
  [SOCKET_EVENTS.REACTION_TOGGLE]: (
    data: { messageId: string; emoji: string },
    callback?: (response: SocketResponse<{ action: 'added' | 'removed' }>) => void
  ) => void;
  [SOCKET_EVENTS.MODERATION_ACTION]: (
    data: {
      conversationId: string;
      action: 'MUTE' | 'UNMUTE' | 'BAN' | 'UNBAN' | 'KICK' | 'DELETE_MESSAGE' | 'MAKE_ADMIN' | 'REMOVE_ADMIN' | 'PIN_MESSAGE';
      targetUserId?: string;
      messageId?: string;
      reason?: string;
      expiresAt?: string;
    },
    callback?: (response: SocketResponse<{ message: string }>) => void
  ) => void;
}

