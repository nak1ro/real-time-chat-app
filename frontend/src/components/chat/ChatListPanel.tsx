'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Input, Tabs, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { Search } from 'lucide-react';
import { ChatListItem } from './ChatListItem';
import { UserListItem } from './UserListItem';
import { ChatFilter, type ConversationFilter } from './ChatFilter';
import type { Conversation, Message } from '@/types';
import type { User } from '@/types/user.types';
import { conversationApi } from '@/lib/api';
import { useConversations, useAuth } from '@/hooks';

interface ConversationWithMeta {
  conversation: Conversation;
  lastMessage?: Message | null;
  unreadCount?: number;
  isOnline?: boolean;
}

interface ChatListPanelProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onPreviewConversation?: (conversation: Conversation) => void;
}

function getDisplayName(conversation: Conversation, currentUserId?: string): string {
  if (conversation.name) return conversation.name;
  if (conversation.type === 'DIRECT' && conversation.members.length > 0) {
    // Find the other user (not the current user)
    const otherMember = currentUserId
      ? conversation.members.find((m) => m.userId !== currentUserId && m.user)
      : conversation.members.find((m) => m.user);
    return otherMember?.user?.name || 'Unknown';
  }
  return 'Unnamed';
}

export function ChatListPanel({
  selectedConversationId,
  onSelectConversation,
  onPreviewConversation,
}: ChatListPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ConversationFilter>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'lastMessage'>('lastMessage');
  const [searchMode, setSearchMode] = useState<'LOCAL' | 'GLOBAL'>('LOCAL');
  const [globalResults, setGlobalResults] = useState<{
    conversations: Conversation[];
    users: User[];
  }>({ conversations: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);

  // Track previous selected conversation to detect changes
  const prevSelectedIdRef = useRef(selectedConversationId);

  const { user: currentUser } = useAuth();
  const { data: conversations = [], isLoading, error } = useConversations();

  const conversationsWithMeta = useMemo<ConversationWithMeta[]>(() => {
    return conversations.map((conversation) => ({
      conversation,
      lastMessage: conversation.messages?.[0] || null,
      unreadCount: 0,
      isOnline: false,
    }));
  }, [conversations]);

  // Debounced global search
  useEffect(() => {
    if (searchMode === 'GLOBAL' && searchQuery.trim()) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        conversationApi
          .search(searchQuery, filter === 'ALL' ? undefined : filter)
          .then((results) => {
            setGlobalResults(results);
          })
          .catch((err) => {
            console.error('Search failed', err);
          })
          .finally(() => {
            setIsSearching(false);
          });
      }, 500);

      return () => clearTimeout(timer);
    } else if (searchMode === 'GLOBAL' && !searchQuery.trim()) {
      setGlobalResults({ conversations: [], users: [] });
    }
  }, [searchQuery, searchMode, filter]);

  // Clear results when switching modes
  useEffect(() => {
    setSearchQuery('');
    setGlobalResults({ conversations: [], users: [] });
  }, [searchMode]);

  // Reset to local mode when a conversation is selected (and it changed)
  useEffect(() => {
    if (
      selectedConversationId &&
      selectedConversationId !== prevSelectedIdRef.current &&
      searchMode === 'GLOBAL'
    ) {
      setSearchMode('LOCAL');
      setFilter('ALL'); // Also reset filter to ensure the conversation is visible
    }
    // Update ref
    prevSelectedIdRef.current = selectedConversationId;
  }, [selectedConversationId, searchMode]);

  const filteredConversations = useMemo(() => {
    if (searchMode === 'GLOBAL') return []; // Handled separately

    const filtered = conversationsWithMeta.filter(({ conversation, lastMessage }) => {
      if (filter !== 'ALL' && conversation.type !== filter) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = getDisplayName(conversation, currentUser?.id).toLowerCase();
        const messageText = lastMessage?.text?.toLowerCase() || '';
        return name.includes(query) || messageText.includes(query);
      }
      return true;
    });

    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = getDisplayName(a.conversation, currentUser?.id);
        const nameB = getDisplayName(b.conversation, currentUser?.id);
        return nameA.localeCompare(nameB);
      } else {
        // Sort by last message timestamp (most recent first)
        const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(0);
        const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      }
    });
  }, [conversationsWithMeta, filter, searchQuery, searchMode, currentUser?.id, sortBy]);

  const handleGlobalConversationClick = (conversation: Conversation) => {
    // If it's a channel and user is not a member, preview it
    if (conversation.type === 'CHANNEL') {
      const isMember = conversation.members?.some(m => m.userId === currentUser?.id);
      if (!isMember && onPreviewConversation) {
        onPreviewConversation(conversation);
        return;
      }
    }

    onSelectConversation(conversation.id);
  };

  const handleUserResultClick = async (userId: string) => {
    try {
      // Get or create a direct conversation with this user
      const conversation = await conversationApi.createDirect({ otherUserId: userId });
      onSelectConversation(conversation.id);
    } catch (err) {
      console.error('Failed to open direct conversation', err);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header - fixed at top */}
      <div className="flex-shrink-0 p-3 space-y-3 border-b border-border bg-background">
        <Tabs
          value={searchMode}
          onValueChange={(value) => {
            const newMode = value as 'LOCAL' | 'GLOBAL';
            setSearchMode(newMode);
            // Reset filter when switching modes
            if (newMode === 'GLOBAL') {
              setFilter('DIRECT'); // Default to DIRECT for global search
            } else {
              setFilter('ALL'); // Default to ALL for local search
            }
          }}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="LOCAL" className="text-xs">
              My Chats
            </TabsTrigger>
            <TabsTrigger value="GLOBAL" className="text-xs">
              Global Search
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={
              searchMode === 'LOCAL'
                ? 'Search my chats...'
                : 'Search people and conversations...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <ChatFilter value={filter} onChange={setFilter} mode={searchMode} />
        {searchMode === 'LOCAL' && (
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'lastMessage')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastMessage">Recent First</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Scrollable list area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-2 space-y-1">
          {searchMode === 'LOCAL' ? (
            isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Loading chats...
              </div>
            ) : error ? (
              <div className="py-8 text-center text-sm text-destructive">
                Failed to load chats:{' '}
                {error instanceof Error ? error.message : 'Unknown error'}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {searchQuery || filter !== 'ALL' ? 'No chats found' : 'No chats yet'}
              </div>
            ) : (
              filteredConversations.map(
                ({ conversation, lastMessage, unreadCount, isOnline }) => (
                  <ChatListItem
                    key={conversation.id}
                    conversation={conversation}
                    currentUserId={currentUser?.id}
                    lastMessage={lastMessage}
                    unreadCount={unreadCount}
                    isOnline={isOnline}
                    isActive={conversation.id === selectedConversationId}
                    onClick={() => onSelectConversation(conversation.id)}
                  />
                )
              )
            )
          ) : // GLOBAL mode
            isSearching ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : globalResults.conversations.length === 0 &&
              globalResults.users.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {searchQuery
                  ? 'No matching results found'
                  : 'Type to search globally'}
              </div>
            ) : (
              <>
                {globalResults.conversations.map((conversation) => (
                  <ChatListItem
                    key={conversation.id}
                    conversation={conversation}
                    currentUserId={currentUser?.id}
                    lastMessage={null}
                    unreadCount={0}
                    isOnline={false}
                    isActive={conversation.id === selectedConversationId}
                    onClick={() => handleGlobalConversationClick(conversation)}
                  />
                ))}

                {globalResults.users.map((user) => (
                  <UserListItem
                    key={user.id}
                    user={user}
                    isActive={false}
                    onClick={() => handleUserResultClick(user.id)}
                  />
                ))}
              </>
            )}
        </div>
      </div>
    </div>
  );
}
