'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Trash2 } from 'lucide-react';
import type { Message } from '@/types';
import { MessageReactions } from './MessageReactions';
import { MessageAttachments } from './MessageAttachments';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  currentUserId: string;
  showAvatar?: boolean;
  onContextMenu?: (message: Message, position: { x: number; y: number }) => void;
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

// Truncate text to specified number of lines (approximated by character count)
function truncateText(text: string, maxLength: number = 80): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// Reply preview component
function ReplyPreview({
  replyTo,
  isOwn
}: {
  replyTo: NonNullable<Message['replyTo']>;
  isOwn: boolean;
}) {
  // Check if the reply-to message is deleted using isDeleted field or empty text as fallback
  const isReplyDeleted = ('isDeleted' in replyTo && replyTo.isDeleted) || !replyTo.text || replyTo.text === '';
  const senderName = replyTo.user?.name || 'Unknown';

  const displayText = isReplyDeleted
    ? 'This message was deleted'
    : truncateText(replyTo.text);

  return (
    <div
      className={cn(
        'flex rounded-t-xl overflow-hidden mb-0.5',
        isOwn ? 'bg-primary/20' : 'bg-muted-foreground/10'
      )}
    >
      {/* Accent bar */}
      <div
        className={cn(
          'w-1 flex-shrink-0',
          isOwn ? 'bg-primary-foreground/50' : 'bg-primary'
        )}
      />

      {/* Reply content */}
      <div className="flex flex-col gap-0.5 px-2.5 py-2 min-w-0">
        {/* Sender name */}
        <span
          className={cn(
            'text-xs font-semibold truncate',
            isOwn ? 'text-primary-foreground/80' : 'text-primary'
          )}
        >
          {senderName}
        </span>

        {/* Reply text */}
        <span
          className={cn(
            'text-xs line-clamp-2 break-words',
            isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground',
            isReplyDeleted && 'italic'
          )}
        >
          {displayText}
        </span>
      </div>
    </div>
  );
}

// Deleted message content
function DeletedMessageContent({ isOwn }: { isOwn: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <Trash2
        className={cn(
          'h-3.5 w-3.5 flex-shrink-0',
          isOwn ? 'text-primary-foreground/50' : 'text-muted-foreground/70'
        )}
      />
      <span
        className={cn(
          'italic',
          isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
        )}
      >
        This message was deleted
      </span>
    </div>
  );
}

export function MessageBubble({ message, isOwn, currentUserId, showAvatar = true, onContextMenu }: MessageBubbleProps) {
  const senderName = message.user?.name || 'Unknown';
  const senderAvatar = message.user?.avatarUrl;
  const isRead = (message._count?.receipts ?? 0) > 0;
  const hasReply = !!message.replyTo;

  // Long-press detection for mobile
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = React.useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };

    longPressTimerRef.current = setTimeout(() => {
      if (onContextMenu && touchStartPos.current) {
        onContextMenu(message, touchStartPos.current);
      }
    }, 500); // 500ms for long-press
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPos.current = null;
  };

  const handleTouchMove = () => {
    // Cancel long-press if user moves finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onContextMenu) {
      onContextMenu(message, { x: e.clientX, y: e.clientY });
    }
  };

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

        {/* Message bubble with optional reply preview */}
        <div
          className={cn(
            'rounded-2xl text-sm overflow-hidden',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md',
            // When there's a reply, we need different padding structure
            !hasReply && 'px-3 py-2'
          )}
          onContextMenu={handleRightClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
        >
          {/* Reply preview */}
          {hasReply && message.replyTo && (
            <ReplyPreview replyTo={message.replyTo} isOwn={isOwn} />
          )}

          {/* Message content */}
          <div className={cn(hasReply && 'px-3 py-2')}>
            {message.isDeleted ? (
              <DeletedMessageContent isOwn={isOwn} />
            ) : (
              <>
                {message.text && (
                  <p className="whitespace-pre-wrap break-words">
                    {message.text}
                  </p>
                )}
                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <MessageAttachments attachments={message.attachments} />
                )}
              </>
            )}
          </div>
        </div>

        {/* Reactions */}
        {!message.isDeleted && (
          <MessageReactions
            messageId={message.id}
            currentUserId={currentUserId}
            className={isOwn ? 'justify-end' : 'justify-start'}
          />
        )}

        <div className="flex items-center gap-1 px-1">
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
          {message.isEdited && !message.isDeleted && (
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
