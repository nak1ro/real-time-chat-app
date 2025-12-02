'use client';

import { cn } from '@/lib/utils';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢'];

interface ReactionPickerProps {
    onReactionSelect: (emoji: string) => void;
    className?: string;
}

export function ReactionPicker({ onReactionSelect, className }: ReactionPickerProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-1 p-1.5 bg-popover border border-border rounded-full shadow-md animate-in fade-in zoom-in duration-200",
                className
            )}
        >
            {REACTION_EMOJIS.map((emoji) => (
                <button
                    key={emoji}
                    onClick={(e) => {
                        e.stopPropagation();
                        onReactionSelect(emoji);
                    }}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center text-xl rounded-full",
                        "hover:bg-accent hover:scale-110 transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20",
                        "cursor-pointer select-none"
                    )}
                    aria-label={`React with ${emoji}`}
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
}
