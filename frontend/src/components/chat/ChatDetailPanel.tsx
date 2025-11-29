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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header - fixed at top */}
      <div className="flex-shrink-0">
        <ChatHeader
          conversation={conversation}
          isOnline={isOnline}
          onBack={onBack}
          showBackButton={showBackButton}
        />
      </div>
      
      {/* Message list - scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MessageList messages={messages} currentUserId={currentUserId} />
      </div>
      
      {/* Input - fixed at bottom */}
      <div className="flex-shrink-0">
        <MessageInput onSend={onSendMessage} disabled={isSending} />
      </div>
    </div>
  );
}
