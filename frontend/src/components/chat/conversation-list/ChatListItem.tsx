'use client';

import { Avatar, AvatarFallback, AvatarImage, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Users, Megaphone } from 'lucide-react';
import type { Conversation, Message } from '@/types';
import type { ConversationMember } from '@/types/conversation.types';

interface ChatListItemProps {
  conversation: Conversation;
  currentUserId?: string;
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

/**
 * Get the other member in a direct conversation (excluding the current user)
 */
function getOtherMember(
  conversation: Conversation,
  currentUserId?: string
): ConversationMember | undefined {
  // Guard against missing members array
  if (conversation.type !== 'DIRECT' || !conversation.members || conversation.members.length === 0) {
    return undefined;
  }

  // If we have a currentUserId, find the member that is NOT the current user
  if (currentUserId) {
    return conversation.members.find((m) => m.userId !== currentUserId && m.user);
  }

  // Fallback: return the first member with a user (legacy behavior)
  return conversation.members.find((m) => m.user);
}

function getDisplayName(conversation: Conversation, currentUserId?: string): string {
  // For direct conversations, always show the other user's name (ignore conversation.name)
  if (conversation.type === 'DIRECT') {
    const otherMember = getOtherMember(conversation, currentUserId);
    return otherMember?.user?.name || 'Unknown';
  }

  // For groups/channels, use the conversation name if available
  if (conversation.name) return conversation.name;

  return 'Unnamed';
}

function getLastMessagePreview(message?: Message | null): string {
  if (!message) return 'No messages yet';
  if (message.isDeleted) return 'Message deleted';
  return message.text;
}

export function ChatListItem({
  conversation,
  currentUserId,
  lastMessage,
  unreadCount = 0,
  isOnline = false,
  isActive,
  onClick,
}: ChatListItemProps) {
  const isGroup = conversation.type === 'GROUP';
  const isChannel = conversation.type === 'CHANNEL';
  const isDirect = conversation.type === 'DIRECT';

  // For direct conversations, get the other user's info
  const otherMember = isDirect ? getOtherMember(conversation, currentUserId) : undefined;
  const displayName = getDisplayName(conversation, currentUserId);

  // For direct convos, use the other user's avatar; otherwise use conversation avatar
  const avatarUrl = isDirect
    ? otherMember?.user?.avatarUrl
    : conversation.avatarUrl;

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
          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
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
        {isDirect && isOnline && (
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
