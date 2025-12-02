'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import type { Message } from '@/types';
import { MessageReactions } from '../reactions/MessageReactions';
import { MessageAttachments } from '../attachments/MessageAttachments';
import { MessageStatusIcon } from './MessageStatusIcon';
import { getMessageStatus } from '@/lib/utils/receiptHelpers';
import { formatTime, getInitials, truncateText } from './messages.utils';

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    currentUserId: string;
    conversationId?: string;
    showAvatar?: boolean;
    isHighlighted?: boolean;
    onContextMenu?: (message: Message, position: { x: number; y: number }) => void;
    onReplyClick?: (messageId: string) => void;
}


// Reply preview component for quoted messages
function ReplyPreview({
    replyTo,
    isOwn,
    onClick,
}: {
    replyTo: NonNullable<Message['replyTo']>;
    isOwn: boolean;
    onClick?: () => void;
}) {
    // Check if reply-to message is deleted
    const isReplyDeleted =
        ('isDeleted' in replyTo && replyTo.isDeleted) ||
        !replyTo.text ||
        replyTo.text === '';
    const senderName = replyTo.user?.name || 'Unknown';
    const displayText = isReplyDeleted ? 'This message was deleted' : truncateText(replyTo.text);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
        }
    };

    return (
        <div
            className={cn(
                'flex rounded-t-xl overflow-hidden mb-0.5 cursor-pointer transition-colors',
                isOwn
                    ? 'bg-primary/20 hover:bg-primary/30'
                    : 'bg-muted-foreground/10 hover:bg-muted-foreground/20'
            )}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
        >
            {/* Accent bar */}
            <div
                className={cn(
                    'w-1 flex-shrink-0',
                    isOwn ? 'bg-primary-foreground/50' : 'bg-primary'
                )}
            />

            {/* Reply content */}
            <div className="flex flex-col gap-0.5 px-2.5 py-2 min-w-0">
                {/* Sender name */}
                <span
                    className={cn(
                        'text-xs font-semibold truncate',
                        isOwn ? 'text-primary-foreground/80' : 'text-primary'
                    )}
                >
                    {senderName}
                </span>

                {/* Reply text */}
                <span
                    className={cn(
                        'text-xs line-clamp-2 break-words',
                        isOwn
                            ? 'text-primary-foreground/60'
                            : 'text-muted-foreground',
                        isReplyDeleted && 'italic'
                    )}
                >
                    {displayText}
                </span>
            </div>
        </div>
    );
}

// Deleted message content display
function DeletedMessageContent({ isOwn }: { isOwn: boolean }) {
    return (
        <div className="flex items-center gap-1.5">
            <Trash2
                className={cn(
                    'h-3.5 w-3.5 flex-shrink-0',
                    isOwn ? 'text-primary-foreground/50' : 'text-muted-foreground/70'
                )}
            />
            <span
                className={cn(
                    'italic',
                    isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
                )}
            >
                This message was deleted
            </span>
        </div>
    );
}

export function MessageBubble({
    message,
    isOwn,
    currentUserId,
    conversationId,
    showAvatar = true,
    isHighlighted = false,
    onContextMenu,
    onReplyClick,
}: MessageBubbleProps) {
    const senderName = message.user?.name || 'Unknown';
    const senderAvatar = message.user?.avatarUrl;
    const hasReply = !!message.replyTo;

    // Touch handlers for long-press detection on mobile
    const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const touchStartPos = React.useRef<{ x: number; y: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
        longPressTimerRef.current = setTimeout(() => {
            if (onContextMenu && touchStartPos.current) {
                onContextMenu(message, touchStartPos.current);
            }
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        touchStartPos.current = null;
    };

    const handleTouchMove = () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };

    const handleRightClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onContextMenu) {
            onContextMenu(message, { x: e.clientX, y: e.clientY });
        }
    };

    return (
        <div
            className={cn(
                'flex gap-2 max-w-[85%] sm:max-w-[75%] rounded-2xl transition-all duration-300',
                isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto',
                isHighlighted && 'bg-accent/50 ring-2 ring-accent animate-highlight-fade'
            )}
        >
            {!isOwn && showAvatar && (
                <Avatar className="h-8 w-8 flex-shrink-0 mt-auto">
                    <AvatarImage src={senderAvatar || undefined} alt={senderName} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(senderName)}
                    </AvatarFallback>
                </Avatar>
            )}
            {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

            <div className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
                {!isOwn && showAvatar && (
                    <span className="text-xs font-medium text-muted-foreground px-1">
                        {senderName}
                    </span>
                )}

                {/* Message bubble with optional reply preview */}
                <div
                    className={cn(
                        'rounded-2xl text-sm overflow-hidden',
                        isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md',
                        !hasReply && 'px-3 py-2'
                    )}
                    onContextMenu={handleRightClick}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                >
                    {hasReply && message.replyTo && (
                        <ReplyPreview
                            replyTo={message.replyTo}
                            isOwn={isOwn}
                            onClick={() => onReplyClick?.(message.replyTo!.id)}
                        />
                    )}

                    {/* Message content */}
                    <div className={cn(hasReply && 'px-3 py-2')}>
                        {message.isDeleted ? (
                            <DeletedMessageContent isOwn={isOwn} />
                        ) : (
                            <>
                                {message.text && (
                                    <p className="whitespace-pre-wrap break-words">
                                        {message.text}
                                    </p>
                                )}
                                {message.attachments && message.attachments.length > 0 && (
                                    <MessageAttachments attachments={message.attachments} />
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Reactions display */}
                {!message.isDeleted && (
                    <MessageReactions
                        messageId={message.id}
                        currentUserId={currentUserId}
                        conversationId={conversationId}
                        reactions={message.reactions}
                        className={isOwn ? 'justify-end' : 'justify-start'}
                    />
                )}

                {/* Message metadata */}
                <div className="flex items-center gap-1 px-1">
                    <span className="text-[10px] text-muted-foreground">
                        {formatTime(message.createdAt)}
                    </span>
                    {message.isEdited && !message.isDeleted && (
                        <span className="text-[10px] text-muted-foreground">(edited)</span>
                    )}
                    {isOwn && (
                        <MessageStatusIcon
                            status={getMessageStatus(message, currentUserId)}
                            className="w-3 h-3"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
