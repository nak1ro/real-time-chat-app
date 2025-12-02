'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
    useMessageReactions,
    useToggleReaction,
    useReactionSocketListeners,
} from '@/hooks';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface MessageReactionsProps {
    messageId: string;
    currentUserId: string;
    className?: string;
}

interface GroupedReaction {
    emoji: string;
    count: number;
    hasReacted: boolean;
    users: string[]; // List of user names
}

export function MessageReactions({ messageId, currentUserId, className }: MessageReactionsProps) {
    // Fetch reactions
    const { data } = useMessageReactions(messageId);
    // Ensure reactions is always an array (defensive check for API response edge cases)
    const reactions = Array.isArray(data) ? data : [];

    // Listen for real-time updates
    useReactionSocketListeners({ messageId });

    // Toggle reaction mutation
    const { mutate: toggleReaction, isPending: isTogglingReaction } = useToggleReaction();

    // Group reactions by emoji
    const groupedReactions = useMemo(() => {
        const groups: Record<string, GroupedReaction> = {};

        reactions.forEach((reaction) => {
            if (!groups[reaction.emoji]) {
                groups[reaction.emoji] = {
                    emoji: reaction.emoji,
                    count: 0,
                    hasReacted: false,
                    users: [],
                };
            }

            groups[reaction.emoji].count++;
            if (reaction.userId === currentUserId) {
                groups[reaction.emoji].hasReacted = true;
            }
            if (reaction.user?.name) {
                groups[reaction.emoji].users.push(reaction.user.name);
            }
        });

        return Object.values(groups).sort((a, b) => b.count - a.count);
    }, [reactions, currentUserId]);

    const handleToggle = (emoji: string) => {
        if (isTogglingReaction) return;
        toggleReaction({ messageId, emoji });
    };

    if (groupedReactions.length === 0) {
        return null;
    }

    return (
        <div className={cn("flex flex-wrap gap-1.5 mt-1.5", className)}>
            <TooltipProvider>
                {groupedReactions.map((group) => (
                    <Tooltip key={group.emoji}>
                        <TooltipTrigger asChild>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent message click
                                    handleToggle(group.emoji);
                                }}
                                disabled={isTogglingReaction}
                                className={cn(
                                    "flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border transition-colors",
                                    "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                    group.hasReacted
                                        ? "bg-primary/10 border-primary/30 text-primary"
                                        : "bg-muted/50 border-transparent text-muted-foreground"
                                )}
                            >
                                <span>{group.emoji}</span>
                                <span className="font-medium">{group.count}</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="text-xs max-w-[200px] break-words">
                                {group.users.length > 0 ? (
                                    <>
                                        {group.users.slice(0, 5).join(', ')}
                                        {group.users.length > 5 && ` +${group.users.length - 5} more`}
                                    </>
                                ) : (
                                    'Reacted'
                                )}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
        </div>
    );
}
