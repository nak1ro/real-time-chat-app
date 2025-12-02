'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui';
import { MessageBubble } from './MessageBubble';
import { MessageContextMenu } from './MessageContextMenu';
import type { Message } from '@/types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  conversationId?: string | null;
  isLoading?: boolean;
  searchQuery?: string;
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
  conversationId,
  isLoading = false,
  searchQuery = '',
  onReply,
  onEdit,
  onDelete,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Handle reply click - scroll to and highlight the original message
  const handleReplyClick = useCallback((messageId: string) => {
    const messageElement = messageRefs.current.get(messageId);

    if (messageElement) {
      // Scroll to the message
      messageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Highlight the message
      setHighlightedMessageId(messageId);

      // Clear highlight after animation completes
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 1500);
    }
  }, []);

  // Register message ref for scroll-to-highlight
  const setMessageRef = useCallback((messageId: string, element: HTMLDivElement | null) => {
    if (element) {
      messageRefs.current.set(messageId, element);
    } else {
      messageRefs.current.delete(messageId);
    }
  }, []);

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

  // Auto-scroll to bottom when messages finish loading
  useEffect(() => {
    if (!isLoading && messages.length > 0 && bottomRef.current) {
      // Use instant scroll on initial load
      bottomRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
    }
  }, [isLoading, messages.length]);

  // Loading skeleton
  if (isLoading) {
    return (
      <ScrollArea className="h-full" ref={scrollContainerRef}>
        <div className="px-4 py-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`flex gap-2 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`h-16 rounded-2xl bg-muted animate-pulse ${i % 3 === 0 ? 'w-3/4' : i % 3 === 1 ? 'w-1/2' : 'w-2/3'
                  }`}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          {searchQuery.trim() ? `No messages found matching "${searchQuery}"` : 'No messages yet. Start the conversation!'}
        </p>
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
    <ScrollArea className="h-full" ref={scrollContainerRef}>
      <div className="px-4 py-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={message.id}
            ref={(el) => setMessageRef(message.id, el)}
            data-message-id={message.id}
          >
            <MessageBubble
              message={message}
              isOwn={message.userId === currentUserId}
              currentUserId={currentUserId}
              showAvatar={shouldShowAvatar(index)}
              isHighlighted={highlightedMessageId === message.id}
              onContextMenu={handleContextMenu}
              onReplyClick={handleReplyClick}
            />
          </div>
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
