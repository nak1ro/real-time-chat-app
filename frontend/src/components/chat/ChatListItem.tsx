'use client';

// Individual chat list item component
import { Avatar, AvatarFallback, AvatarImage, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Chat } from '@/types/chat.types';
import { Users, Megaphone } from 'lucide-react';

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
}

function formatTime(date?: Date): string {
  if (!date) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ChatListItem({ chat, isActive, onClick }: ChatListItemProps) {
  const isGroup = chat.type === 'group';
  const isChannel = chat.type === 'channel';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
        isActive
          ? 'bg-primary/10'
          : 'hover:bg-muted/50 active:bg-muted'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={chat.avatarUrl} alt={chat.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {isChannel ? (
              <Megaphone className="h-5 w-5" />
            ) : isGroup ? (
              <Users className="h-5 w-5" />
            ) : (
              getInitials(chat.name)
            )}
          </AvatarFallback>
        </Avatar>
        {chat.type === 'direct' && chat.isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate">{chat.name}</span>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatTime(chat.lastMessageTime)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-sm text-muted-foreground truncate">
            {chat.lastMessage || 'No messages yet'}
          </span>
          {chat.unreadCount > 0 && (
            <Badge
              variant="default"
              className="h-5 min-w-5 px-1.5 text-xs font-semibold flex-shrink-0"
            >
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

