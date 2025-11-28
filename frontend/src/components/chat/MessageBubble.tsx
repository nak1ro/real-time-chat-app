'use client';

// Individual message bubble component
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';
import type { ChatMessage } from '@/types/chat.types';

interface MessageBubbleProps {
  message: ChatMessage;
  showAvatar?: boolean;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function MessageBubble({ message, showAvatar = true }: MessageBubbleProps) {
  const isOwn = message.isOwn;

  return (
    <div
      className={cn(
        'flex gap-2 max-w-[85%] sm:max-w-[75%]',
        isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {/* Avatar (only for others) */}
      {!isOwn && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-auto">
          <AvatarImage src={message.senderAvatarUrl} alt={message.senderName} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {getInitials(message.senderName)}
          </AvatarFallback>
        </Avatar>
      )}
      {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

      {/* Message content */}
      <div
        className={cn(
          'flex flex-col gap-1',
          isOwn ? 'items-end' : 'items-start'
        )}
      >
        {/* Sender name (for group chats, only show for others) */}
        {!isOwn && showAvatar && (
          <span className="text-xs font-medium text-muted-foreground px-1">
            {message.senderName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'px-3 py-2 rounded-2xl text-sm',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Time and read status */}
        <div className="flex items-center gap-1 px-1">
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
          {isOwn && (
            <span className="text-muted-foreground">
              {message.isRead ? (
                <CheckCheck className="h-3 w-3 text-primary" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

