'use client';

// Message list component with scrollable area
import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui';
import { MessageBubble } from './MessageBubble';
import type { Message } from './types';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  // Group consecutive messages from the same sender
  const shouldShowAvatar = (index: number): boolean => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const currentMessage = messages[index];
    return prevMessage.senderId !== currentMessage.senderId;
  };

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="py-4 space-y-3">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            showAvatar={shouldShowAvatar(index)}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

