'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
}

function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function MessageBubble({ message, isOwn, showAvatar = true }: MessageBubbleProps) {
  const senderName = message.user?.name || 'Unknown';
  const senderAvatar = message.user?.avatarUrl;
  const isRead = (message._count?.receipts ?? 0) > 0;

  return (
    <div
      className={cn(
        'flex gap-2 max-w-[85%] sm:max-w-[75%]',
        isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {!isOwn && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-auto">
          <AvatarImage src={senderAvatar || undefined} alt={senderName} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {getInitials(senderName)}
          </AvatarFallback>
        </Avatar>
      )}
      {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

      <div className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        {!isOwn && showAvatar && (
          <span className="text-xs font-medium text-muted-foreground px-1">
            {senderName}
          </span>
        )}

        <div
          className={cn(
            'px-3 py-2 rounded-2xl text-sm',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md',
            message.isDeleted && 'italic opacity-60'
          )}
        >
          <p className="whitespace-pre-wrap break-words">
            {message.isDeleted ? 'This message was deleted' : message.text}
          </p>
        </div>

        <div className="flex items-center gap-1 px-1">
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
          {message.isEdited && (
            <span className="text-[10px] text-muted-foreground">(edited)</span>
          )}
          {isOwn && (
            <span className="text-muted-foreground">
              {isRead ? (
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
