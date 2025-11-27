'use client';

// Chat detail panel component (messages view)
import { useState, useCallback } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import type { Chat, Message } from './types';

interface ChatDetailPanelProps {
  chat: Chat;
  messages: Message[];
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ChatDetailPanel({
  chat,
  messages: initialMessages,
  onBack,
  showBackButton = false,
}: ChatDetailPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const handleSendMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId: chat.id,
      senderId: 'me',
      senderName: 'Me',
      content,
      timestamp: new Date(),
      isOwn: true,
      isRead: false,
    };
    setMessages((prev) => [...prev, newMessage]);
  }, [chat.id]);

  return (
    <div className="flex flex-col h-full">
      <ChatHeader chat={chat} onBack={onBack} showBackButton={showBackButton} />
      <MessageList messages={messages} />
      <MessageInput onSend={handleSendMessage} />
    </div>
  );
}

