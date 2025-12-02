'use client';

import { Avatar, AvatarFallback, AvatarImage, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Users, Megaphone } from 'lucide-react';
import type { Conversation, Message } from '@/types';
import type { ConversationMember } from '@/types/conversation.types';
import {JSX} from "react";

interface ChatListItemProps {
  conversation: Conversation;
  currentUserId?: string;
  lastMessage?: Message | null;
  unreadCount?: number;
  isOnline?: boolean;
  isActive: boolean;
  onClick: () => void;
}

// Formats the time for display in the chat list
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

// Generates initials from a name
function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
}

// Gets the other member in a direct conversation
function getOtherMember(
    conversation: Conversation,
    currentUserId?: string
): ConversationMember | undefined {
  if (conversation.type !== 'DIRECT' || !conversation.members || conversation.members.length === 0) {
    return undefined;
  }

  if (currentUserId) {
    return conversation.members.find((m) => m.userId !== currentUserId && m.user);
  }

  return conversation.members.find((m) => m.user);
}

// Determines the display name for the conversation
function getDisplayName(conversation: Conversation, currentUserId?: string): string {
  if (conversation.type === 'DIRECT') {
    const otherMember = getOtherMember(conversation, currentUserId);
    return otherMember?.user?.name || 'Unknown';
  }

  if (conversation.name) return conversation.name;

  return 'Unnamed';
}

// Generates a preview text for the last message
function getLastMessagePreview(message?: Message | null): string {
  if (!message) return 'No messages yet';
  if (message.isDeleted) return 'Message deleted';
  return message.text;
}

// Renders the Avatar Fallback content based on conversation type (FIXED TS2322: now allows string return)
function renderAvatarFallback(
    conversation: Conversation,
    displayName: string
): JSX.Element | string {
  const isChannel = conversation.type === 'CHANNEL';
  const isGroup = conversation.type === 'GROUP';

  if (isChannel) {
    return <Megaphone className="h-5 w-5" />;
  }
  if (isGroup) {
    return <Users className="h-5 w-5" />;
  }
  // Returns string, so the return type must be JSX.Element | string
  return getInitials(displayName);
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
  const isDirect = conversation.type === 'DIRECT';

  const otherMember = isDirect ? getOtherMember(conversation, currentUserId) : undefined;
  const displayName = getDisplayName(conversation, currentUserId);

  // Use other user's avatar for direct, otherwise use conversation avatar
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
              {renderAvatarFallback(conversation, displayName)}
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