'use client';

// Chat list panel component
import { useState, useMemo } from 'react';
import { Input, ScrollArea } from '@/components/ui';
import { Search } from 'lucide-react';
import { ChatListItem } from './ChatListItem';
import { ChatFilter } from './ChatFilter';
import type { Chat, ChatFilter as ChatFilterType } from './types';

interface ChatListPanelProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export function ChatListPanel({ chats, selectedChatId, onSelectChat }: ChatListPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ChatFilterType>('all');

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      // Filter by type
      if (filter !== 'all' && chat.type !== filter) {
        return false;
      }
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          chat.name.toLowerCase().includes(query) ||
          chat.lastMessage?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [chats, filter, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-3 space-y-3 border-b border-border">
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

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredChats.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery || filter !== 'all' ? 'No chats found' : 'No chats yet'}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === selectedChatId}
                onClick={() => onSelectChat(chat.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

