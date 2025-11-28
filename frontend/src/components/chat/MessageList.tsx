'use client';

import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui';
import { MessageBubble } from './MessageBubble';
import type { Message } from '@/types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

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

  const shouldShowAvatar = (index: number): boolean => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const currentMessage = messages[index];
    return prevMessage.userId !== currentMessage.userId;
  };

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="py-4 space-y-3">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.userId === currentUserId}
            showAvatar={shouldShowAvatar(index)}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
