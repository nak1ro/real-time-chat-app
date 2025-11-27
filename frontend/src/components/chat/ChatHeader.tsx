'use client';

// Chat header component
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
import type { Chat } from './types';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  chat: Chat;
  onBack?: () => void;
  showBackButton?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ChatHeader({ chat, onBack, showBackButton = false }: ChatHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="border-b border-border bg-background">
      <div className="flex items-center gap-2 h-14 px-3">
        {/* Back button (mobile only) */}
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

        {/* Avatar and info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={chat.avatarUrl} alt={chat.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials(chat.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="font-semibold truncate">{chat.name}</h2>
            <p className="text-xs text-muted-foreground">
              {chat.type === 'direct' ? (
                chat.isOnline ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Online</span>
                ) : (
                  'Offline'
                )
              ) : chat.type === 'group' ? (
                'Group chat'
              ) : (
                'Channel'
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Search toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
            className={cn(showSearch && 'bg-muted')}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Menu */}
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
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Ban className="h-4 w-4 mr-2" />
                Block user
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* In-chat search (expandable) */}
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

