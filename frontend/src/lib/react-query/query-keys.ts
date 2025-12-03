// Centralized query keys for React Query

export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    detail: (id: string) => [...queryKeys.users.all, id] as const,
    search: (query: string) => [...queryKeys.users.all, 'search', query] as const,
    presence: (id: string) => [...queryKeys.users.all, 'presence', id] as const,
    onlineContacts: () => [...queryKeys.users.all, 'contacts', 'online'] as const,
  },

  // Conversations
  conversations: {
    all: ['conversations'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.conversations.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.conversations.all, id] as const,
    public: () => [...queryKeys.conversations.all, 'public'] as const,
  },

  // Messages
  messages: {
    all: ['messages'] as const,
    list: (conversationId: string) => [...queryKeys.messages.all, 'list', conversationId] as const,
    detail: (id: string) => [...queryKeys.messages.all, id] as const,
    reactions: (messageId: string) => [...queryKeys.messages.all, 'reactions', messageId] as const,
    receipts: (messageId: string) => [...queryKeys.messages.all, 'receipts', messageId] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
  },
} as const;
