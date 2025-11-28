'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui';
import { Search } from 'lucide-react';
import { ChatListItem } from './ChatListItem';
import { ChatFilter, type ConversationFilter } from './ChatFilter';
import type { Conversation, Message } from '@/types';

interface ConversationWithMeta {
  conversation: Conversation;
  lastMessage?: Message | null;
  unreadCount?: number;
  isOnline?: boolean;
}

interface ChatListPanelProps {
  conversations: ConversationWithMeta[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

function getDisplayName(conversation: Conversation): string {
  if (conversation.name) return conversation.name;
  if (conversation.type === 'DIRECT' && conversation.members.length > 0) {
    const otherMember = conversation.members.find((m) => m.user);
    return otherMember?.user?.name || 'Unknown';
  }
  return 'Unnamed';
}

export function ChatListPanel({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: ChatListPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ConversationFilter>('ALL');

  const filteredConversations = useMemo(() => {
    return conversations.filter(({ conversation, lastMessage }) => {
      if (filter !== 'ALL' && conversation.type !== filter) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = getDisplayName(conversation).toLowerCase();
        const messageText = lastMessage?.text?.toLowerCase() || '';
        return name.includes(query) || messageText.includes(query);
      }
      return true;
    });
  }, [conversations, filter, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 p-3 space-y-3 border-b border-border bg-background">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <ChatFilter value={filter} onChange={setFilter} />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery || filter !== 'ALL' ? 'No chats found' : 'No chats yet'}
            </div>
          ) : (
            filteredConversations.map(({ conversation, lastMessage, unreadCount, isOnline }) => (
              <ChatListItem
                key={conversation.id}
                conversation={conversation}
                lastMessage={lastMessage}
                unreadCount={unreadCount}
                isOnline={isOnline}
                isActive={conversation.id === selectedConversationId}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
