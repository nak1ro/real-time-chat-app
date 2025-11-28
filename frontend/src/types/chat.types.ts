// Chat UI component types

export type ChatType = 'direct' | 'group' | 'channel';

export interface Chat {
  id: string;
  name: string;
  avatarUrl?: string;
  type: ChatType;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isOnline?: boolean;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  isRead: boolean;
}

export type ChatFilter = 'all' | 'direct' | 'group' | 'channel';

