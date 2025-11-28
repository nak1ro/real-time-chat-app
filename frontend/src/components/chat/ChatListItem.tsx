'use client';

import { Avatar, AvatarFallback, AvatarImage, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Users, Megaphone } from 'lucide-react';
import type { Conversation, Message } from '@/types';

interface ChatListItemProps {
  conversation: Conversation;
  lastMessage?: Message | null;
  unreadCount?: number;
  isOnline?: boolean;
  isActive: boolean;
  onClick: () => void;
}

function formatTime(date?: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'short' });
  } else {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getDisplayName(conversation: Conversation): string {
  if (conversation.name) return conversation.name;
  if (conversation.type === 'DIRECT' && conversation.members.length > 0) {
    const otherMember = conversation.members.find((m) => m.user);
    return otherMember?.user?.name || 'Unknown';
  }
  return 'Unnamed';
}

function getLastMessagePreview(message?: Message | null): string {
  if (!message) return 'No messages yet';
  if (message.isDeleted) return 'Message deleted';
  return message.text;
}

export function ChatListItem({
  conversation,
  lastMessage,
  unreadCount = 0,
  isOnline = false,
  isActive,
  onClick,
}: ChatListItemProps) {
  const isGroup = conversation.type === 'GROUP';
  const isChannel = conversation.type === 'CHANNEL';
  const displayName = getDisplayName(conversation);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
        isActive ? 'bg-primary/10' : 'hover:bg-muted/50 active:bg-muted'
      )}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={conversation.avatarUrl || undefined} alt={displayName} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {isChannel ? (
              <Megaphone className="h-5 w-5" />
            ) : isGroup ? (
              <Users className="h-5 w-5" />
            ) : (
              getInitials(displayName)
            )}
          </AvatarFallback>
        </Avatar>
        {conversation.type === 'DIRECT' && isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate">{displayName}</span>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatTime(lastMessage?.createdAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-sm text-muted-foreground truncate">
            {getLastMessagePreview(lastMessage)}
          </span>
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="h-5 min-w-5 px-1.5 text-xs font-semibold flex-shrink-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
