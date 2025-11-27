'use client';

// Chats page - Telegram-like chat layout
import { useState, useMemo } from 'react';
import {
  ChatListPanel,
  ChatDetailPanel,
  EmptyChatState,
  mockChats,
  mockMessages,
} from '@/components/chat';
import { cn } from '@/lib/utils';

export default function ChatsPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Get selected chat and messages
  const selectedChat = useMemo(
    () => mockChats.find((c) => c.id === selectedChatId) || null,
    [selectedChatId]
  );

  const selectedMessages = useMemo(
    () => (selectedChatId ? mockMessages[selectedChatId] || [] : []),
    [selectedChatId]
  );

  // Handle chat selection
  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setMobileView('detail');
  };

  // Handle back navigation (mobile)
  const handleBack = () => {
    setMobileView('list');
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex">
      {/* Chat List Panel */}
      <div
        className={cn(
          'w-full md:w-[340px] lg:w-[360px] border-r border-border bg-background flex-shrink-0',
          // Mobile: show/hide based on view
          mobileView === 'detail' ? 'hidden md:flex md:flex-col' : 'flex flex-col'
        )}
      >
        <ChatListPanel
          chats={mockChats}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
        />
      </div>

      {/* Chat Detail Panel */}
      <div
        className={cn(
          'flex-1 bg-background',
          // Mobile: show/hide based on view
          mobileView === 'list' ? 'hidden md:flex md:flex-col' : 'flex flex-col'
        )}
      >
        {selectedChat ? (
          <ChatDetailPanel
            key={selectedChat.id}
            chat={selectedChat}
            messages={selectedMessages}
            onBack={handleBack}
            showBackButton={mobileView === 'detail'}
          />
        ) : (
          <EmptyChatState />
        )}
      </div>
    </div>
  );
}
