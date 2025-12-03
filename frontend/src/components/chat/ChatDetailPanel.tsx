'use client';

import { useState } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { ArrowLeft, Search, MoreVertical, Trash2, Ban, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types';

interface ChatHeaderProps {
  conversation: Conversation;
  currentUserId?: string;
  isOnline?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
  onOpenDetails?: () => void;
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

function getDisplayName(conversation: Conversation, currentUserId?: string): string {
  if (conversation.name) return conversation.name;
  if (conversation.type === 'DIRECT' && conversation.members.length > 0) {
    // Find the other user (not the current user)
    const otherMember = currentUserId
      ? conversation.members.find((m) => m.userId !== currentUserId && m.user)
      : conversation.members.find((m) => m.user);
    return otherMember?.user?.name || 'Unknown';
  }
  return 'Unnamed';
}

function getSubtitle(conversation: Conversation, isOnline: boolean): React.ReactNode {
  if (conversation.type === 'DIRECT') {
    return isOnline ? (
      <span className="text-emerald-600 dark:text-emerald-400">Online</span>
    ) : (
      'Offline'
    );
  }
  if (conversation.type === 'GROUP') {
    const memberCount = conversation.members.length;
    return `${memberCount} member${memberCount !== 1 ? 's' : ''}`;
  }
  return 'Channel';
}

export function ChatHeader({
  conversation,
  currentUserId,
  isOnline = false,
  onBack,
  showBackButton = false,
  onOpenDetails,
}: ChatHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const displayName = getDisplayName(conversation, currentUserId);

  return (
    <div className="border-b border-border bg-background">
      <div className="flex items-center gap-2 h-14 px-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Clickable avatar and name to open conversation details */}
        <button
          className="flex items-center gap-3 flex-1 min-w-0 hover:bg-muted/50 rounded-lg p-1 -ml-1 transition-colors"
          onClick={onOpenDetails}
        >
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={conversation.avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-left">
            <h2 className="font-semibold truncate">{displayName}</h2>
            <p className="text-xs text-muted-foreground">
              {getSubtitle(conversation, isOnline)}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
            className={cn(showSearch && 'bg-muted')}
          >
            <Search className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete chat
              </DropdownMenuItem>
              {conversation.type === 'DIRECT' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Ban className="h-4 w-4 mr-2" />
                    Block user
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showSearch && (
        <div className="px-3 pb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search in chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
              autoFocus
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            className="h-9 w-9"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
