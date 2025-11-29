'use client';

import { useRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui';
import { MessageBubble } from './MessageBubble';
import { MessageContextMenu } from './MessageContextMenu';
import type { Message } from '@/types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
}

interface ContextMenuState {
  message: Message;
  position: { x: number; y: number };
  isOwnMessage: boolean;
}

export function MessageList({
  messages,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleContextMenu = (message: Message, position: { x: number; y: number }) => {
    const isOwnMessage = message.userId === currentUserId;
    setContextMenu({ message, position, isOwnMessage });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  const shouldShowAvatar = (index: number): boolean => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const currentMessage = messages[index];
    return prevMessage.userId !== currentMessage.userId;
  };

  return (
    <ScrollArea className="h-full">
      <div className="px-4 py-4 space-y-3">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.userId === currentUserId}
            showAvatar={shouldShowAvatar(index)}
            onContextMenu={handleContextMenu}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {contextMenu && (
        <MessageContextMenu
          message={contextMenu.message}
          currentUserId={currentUserId}
          position={contextMenu.position}
          isOwnMessage={contextMenu.isOwnMessage}
          onClose={handleCloseContextMenu}
          onReply={(msg) => {
            onReply?.(msg);
          }}
          onCopy={handleCopy}
          onEdit={(msg) => {
            onEdit?.(msg);
          }}
          onDelete={(id) => {
            onDelete?.(id);
          }}
        />
      )}
    </ScrollArea>
  );
}
