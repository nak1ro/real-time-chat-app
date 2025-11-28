'use client';

import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import type { Conversation, Message } from '@/types';

interface ChatDetailPanelProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  isOnline?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
  onSendMessage: (text: string) => void;
  isSending?: boolean;
}

export function ChatDetailPanel({
  conversation,
  messages,
  currentUserId,
  isOnline = false,
  onBack,
  showBackButton = false,
  onSendMessage,
  isSending = false,
}: ChatDetailPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        conversation={conversation}
        isOnline={isOnline}
        onBack={onBack}
        showBackButton={showBackButton}
      />
      <MessageList messages={messages} currentUserId={currentUserId} />
      <MessageInput onSend={onSendMessage} disabled={isSending} />
    </div>
  );
}
