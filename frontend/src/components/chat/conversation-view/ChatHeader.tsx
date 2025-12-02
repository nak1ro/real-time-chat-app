'use client';

import { useState, useMemo } from 'react';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Button,
    Input,
} from '@/components/ui';
import { ArrowLeft, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types';

// Utility function to get initials from a name
function getInitials(name: string | null): string {
    if (!name) return '?';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Utility function to determine the display name for the conversation
function getDisplayName(conversation: Conversation, currentUserId?: string): string {
    // Logic for DIRECT conversations: show the other member's name
    if (conversation.type === 'DIRECT' && conversation.members.length > 0) {
        const otherMember = currentUserId
            ? conversation.members.find((m) => m.userId !== currentUserId && m.user)
            : conversation.members.find((m) => m.user);
        return otherMember?.user?.name || 'Unknown';
    }

    // Fallback for GROUP/CHANNEL
    if (conversation.name) return conversation.name;
    return 'Unnamed';
}

// Utility function to determine the avatar URL for the conversation
function getAvatarUrl(conversation: Conversation, currentUserId?: string): string | undefined {
    // Logic for DIRECT conversations: use the other user's avatar
    if (conversation.type === 'DIRECT' && conversation.members.length > 0) {
        const otherMember = currentUserId
            ? conversation.members.find((m) => m.userId !== currentUserId && m.user)
            : conversation.members.find((m) => m.user);
        return otherMember?.user?.avatarUrl || undefined;
    }
    // Fallback for GROUP/CHANNEL
    return conversation.avatarUrl || undefined;
}

interface ChatHeaderProps {
    conversation: Conversation;
    // Current user ID to help determine the other user in DIRECT conversations
    currentUserId?: string;
    // Presence of the other user (for DIRECT)
    isOnline?: boolean;
    onBack?: () => void;
    showBackButton?: boolean;
    onOpenDetails?: () => void;
    // Search state props
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

export function ChatHeader({
    conversation,
    currentUserId,
    onBack,
    showBackButton = false,
    onOpenDetails,
    searchQuery = '',
    onSearchChange,
}: ChatHeaderProps) {
    const [showSearch, setShowSearch] = useState(false);

    // Memoize the display name and avatar URL
    const { displayName, avatarUrl } = useMemo(() => {
        return {
            displayName: getDisplayName(conversation, currentUserId),
            avatarUrl: getAvatarUrl(conversation, currentUserId),
        };
    }, [conversation, currentUserId]);

    return (
        <div className="border-b border-border gradient-header">
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

                {/* Clickable area for avatar and name to open conversation details */}
                <button
                    className="flex items-center gap-3 flex-1 min-w-0 hover:bg-muted/50 rounded-lg p-1 -ml-1 transition-colors"
                    onClick={onOpenDetails}
                >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={avatarUrl} alt={displayName} />
                        <AvatarFallback className="gradient-avatar-primary text-white text-sm">
                            {getInitials(displayName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 text-left">
                        <h2 className="font-semibold truncate">{displayName}</h2>
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
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            className="pl-9 h-9"
                            autoFocus
                        />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setShowSearch(false);
                            onSearchChange?.('');
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