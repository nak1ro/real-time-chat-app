'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ChatListPanel,
  ChatDetailPanel,
  EmptyChatState,
} from '@/components/chat';
import { cn } from '@/lib/utils';
import { useAuth, useConversations, useMessages, useCreateMessage } from '@/hooks';
import type { Conversation, Message } from '@/types';

export default function ChatsPage() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Fetch conversations
  const { data: conversations = [], isLoading: isLoadingConversations } = useConversations();

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: isLoadingMessages } = useMessages(
    selectedConversationId || undefined
  );

  // Create message mutation
  const createMessage = useCreateMessage();

  // Get selected conversation
  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  // Get messages for selected conversation
  const messages = useMemo(
    () => messagesData?.messages || [],
    [messagesData]
  );

  // Build conversations with metadata for the list panel
  const conversationsWithMeta = useMemo(() => {
    return conversations.map((conversation) => ({
      conversation,
      lastMessage: null as Message | null, // TODO: Add last message from API or cache
      unreadCount: 0, // TODO: Add unread count from API
      isOnline: false, // TODO: Add presence status
    }));
  }, [conversations]);

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    setMobileView('detail');
  }, []);

  // Handle back navigation (mobile)
  const handleBack = useCallback(() => {
    setMobileView('list');
  }, []);

  // Handle send message
  const handleSendMessage = useCallback((text: string) => {
    if (!selectedConversationId || !text.trim()) return;

    createMessage.mutate({
      conversationId: selectedConversationId,
      text: text.trim(),
    });
  }, [selectedConversationId, createMessage]);

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex">
      {/* Chat List Panel */}
      <div
        className={cn(
          'w-full md:w-[340px] lg:w-[360px] border-r border-border bg-background flex-shrink-0',
          mobileView === 'detail' ? 'hidden md:flex md:flex-col' : 'flex flex-col'
        )}
      >
        <ChatListPanel
          conversations={conversationsWithMeta}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Chat Detail Panel */}
      <div
        className={cn(
          'flex-1 bg-background',
          mobileView === 'list' ? 'hidden md:flex md:flex-col' : 'flex flex-col'
        )}
      >
        {selectedConversation && user ? (
          <ChatDetailPanel
            key={selectedConversation.id}
            conversation={selectedConversation}
            messages={messages}
            currentUserId={user.id}
            onBack={handleBack}
            showBackButton={mobileView === 'detail'}
            onSendMessage={handleSendMessage}
            isSending={createMessage.isPending}
          />
        ) : (
          <EmptyChatState />
        )}
      </div>
    </div>
  );
}
