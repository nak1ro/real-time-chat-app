'use client';

import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui';
import {cn} from '@/lib/utils';
import type {User} from '@/types/user.types';

interface UserListItemProps {
    user: User;
    isActive: boolean;
    onClick: () => void;
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

function formatLastSeen(date?: Date | string | null): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return d.toLocaleDateString([], {weekday: 'short'});
    } else {
        return d.toLocaleDateString([], {month: 'short', day: 'numeric'});
    }
}

export function UserListItem({user, isActive, onClick}: UserListItemProps) {
    const displayName = user.name;
    const isOnline = user.status === 'ONLINE';

    const rightText = isOnline
        ? 'Online'
        : user.lastSeenAt
            ? `Last seen ${formatLastSeen(user.lastSeenAt)}`
            : '';

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
                    <AvatarImage src={user.avatarUrl || undefined} alt={displayName}/>
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {getInitials(displayName)}
                    </AvatarFallback>
                </Avatar>
                {isOnline && (
                    <span
                        className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background"/>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{displayName}</span>
                    {rightText && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
              {rightText}
            </span>
                    )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-sm text-muted-foreground truncate">
            Start a direct conversation
          </span>
                </div>
            </div>
        </button>
    );
}
