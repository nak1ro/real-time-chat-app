'use client';

import {useEffect, useRef, useState, useCallback} from 'react';
import {Copy, Reply, Edit, Trash2} from 'lucide-react';
import {cn} from '@/lib/utils';
import type {Message} from '@/types';

export interface MessageContextMenuProps {
    message: Message;
    currentUserId: string;
    position: { x: number; y: number };
    isOwnMessage?: boolean;
    onClose: () => void;
    onReply: (message: Message) => void;
    onCopy: (text: string) => void;
    onEdit: (message: Message) => void;
    onDelete: (messageId: string) => void;
}

interface MenuPosition {
    x: number;
    y: number;
    placement: {
        horizontal: 'left' | 'right';
        vertical: 'top' | 'bottom';
    };
}

const MENU_WIDTH = 160;
const MENU_ITEM_HEIGHT = 40;
const VIEWPORT_PADDING = 12;

export function MessageContextMenu({
                                       message,
                                       currentUserId,
                                       position,
                                       isOwnMessage: isOwnMessageProp,
                                       onClose,
                                       onReply,
                                       onCopy,
                                       onEdit,
                                       onDelete,
                                   }: MessageContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const isOwnMessage = isOwnMessageProp ?? message.userId === currentUserId;
    const canCopy = !message.isDeleted;
    const canEdit = isOwnMessage && !message.isDeleted;
    const canDelete = isOwnMessage && !message.isDeleted;

    // Calculate number of menu items to determine menu height
    // Reply is always shown, others are conditional
    const menuItemCount = 1 + (canCopy ? 1 : 0) + (canEdit ? 1 : 0) + (canDelete ? 1 : 0);
    const menuHeight = menuItemCount * MENU_ITEM_HEIGHT + 16; // 16px for padding

    // Calculate optimal menu position
    const calculatePosition = useCallback(() => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = position.x;
        let y = position.y;

        // Determine horizontal placement based on message ownership
        let horizontalPlacement: 'left' | 'right' = isOwnMessage ? 'left' : 'right';

        // Calculate available space in each direction
        const spaceLeft = position.x;
        const spaceRight = viewportWidth - position.x;
        const spaceTop = position.y;
        const spaceBottom = viewportHeight - position.y;

        // Horizontal positioning
        if (horizontalPlacement === 'left') {
            if (spaceLeft >= MENU_WIDTH + VIEWPORT_PADDING) {
                x = position.x - MENU_WIDTH;
            } else if (spaceRight >= MENU_WIDTH + VIEWPORT_PADDING) {
                x = position.x;
                horizontalPlacement = 'right';
            } else {
                x = Math.max(VIEWPORT_PADDING, (viewportWidth - MENU_WIDTH) / 2);
            }
        } else {
            if (spaceRight >= MENU_WIDTH + VIEWPORT_PADDING) {
                x = position.x;
            } else if (spaceLeft >= MENU_WIDTH + VIEWPORT_PADDING) {
                x = position.x - MENU_WIDTH;
                horizontalPlacement = 'left';
            } else {
                x = Math.max(VIEWPORT_PADDING, (viewportWidth - MENU_WIDTH) / 2);
            }
        }

        // Vertical positioning - prefer below click point
        let verticalPlacement: 'top' | 'bottom' = 'bottom';
        if (spaceBottom >= menuHeight + VIEWPORT_PADDING) {
            y = position.y;
        } else if (spaceTop >= menuHeight + VIEWPORT_PADDING) {
            y = position.y - menuHeight;
            verticalPlacement = 'top';
        } else {
            if (spaceBottom >= spaceTop) {
                y = viewportHeight - menuHeight - VIEWPORT_PADDING;
            } else {
                y = VIEWPORT_PADDING;
                verticalPlacement = 'top';
            }
        }

        // Final boundary checks
        x = Math.max(VIEWPORT_PADDING, Math.min(x, viewportWidth - MENU_WIDTH - VIEWPORT_PADDING));
        y = Math.max(VIEWPORT_PADDING, Math.min(y, viewportHeight - menuHeight - VIEWPORT_PADDING));

        return {
            x,
            y,
            placement: {
                horizontal: horizontalPlacement,
                vertical: verticalPlacement,
            },
        };
    }, [position, isOwnMessage, menuHeight]);

    // Calculate position on mount and when dependencies change
    useEffect(() => {
        const newPosition = calculatePosition();
        setMenuPosition(newPosition);
        // Small delay for animation
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
    }, [calculatePosition]);

    // Handle click outside to close menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleTouchOutside = (event: TouchEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        // Handle ESC key
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        // Handle scroll to close
        const handleScroll = () => {
            onClose();
        };

        // Add listeners with slight delay to prevent immediate close
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleTouchOutside);
            document.addEventListener('keydown', handleEscKey);
            window.addEventListener('scroll', handleScroll, true);
        }, 10);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleTouchOutside);
            document.removeEventListener('keydown', handleEscKey);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [onClose]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const newPosition = calculatePosition();
            setMenuPosition(newPosition);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [calculatePosition]);

    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    // Don't render until position is calculated
    if (!menuPosition) {
        return null;
    }

    return (
        <>
            {/* Backdrop for mobile - invisible but captures touches */}
            <div
                className="fixed inset-0 z-[9998] md:hidden"
                onClick={onClose}
                onTouchStart={onClose}
            />

            {/* Context Menu */}
            <div
                ref={menuRef}
                role="menu"
                aria-label="Message actions"
                className={cn(
                    'fixed z-[9999] min-w-[160px] py-2 rounded-xl shadow-lg',
                    'bg-popover border border-border',
                    'transition-all duration-150 ease-out',
                    isVisible
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-95',
                    // Add subtle origin transform based on placement
                    menuPosition.placement.vertical === 'top' && 'origin-bottom',
                    menuPosition.placement.vertical === 'bottom' && 'origin-top'
                )}
                style={{
                    left: `${menuPosition.x}px`,
                    top: `${menuPosition.y}px`,
                    width: `${MENU_WIDTH}px`,
                }}
            >
                {/* Reply */}
                <button
                    role="menuitem"
                    onClick={() => handleAction(() => onReply(message))}
                    className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
                        'hover:bg-accent focus:bg-accent focus:outline-none',
                        'text-foreground transition-colors'
                    )}
                >
                    <Reply className="h-4 w-4 text-muted-foreground"/>
                    <span>Reply</span>
                </button>

                {/* Copy - only for non-deleted messages */}
                {canCopy && (
                    <button
                        role="menuitem"
                        onClick={() => handleAction(() => onCopy(message.text))}
                        className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
                            'hover:bg-accent focus:bg-accent focus:outline-none',
                            'text-foreground transition-colors'
                        )}
                    >
                        <Copy className="h-4 w-4 text-muted-foreground"/>
                        <span>Copy</span>
                    </button>
                )}

                {/* Edit - only for own messages */}
                {canEdit && (
                    <button
                        role="menuitem"
                        onClick={() => handleAction(() => onEdit(message))}
                        className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
                            'hover:bg-accent focus:bg-accent focus:outline-none',
                            'text-foreground transition-colors'
                        )}
                    >
                        <Edit className="h-4 w-4 text-muted-foreground"/>
                        <span>Edit</span>
                    </button>
                )}

                {/* Delete - only for own messages */}
                {canDelete && (
                    <button
                        role="menuitem"
                        onClick={() => handleAction(() => onDelete(message.id))}
                        className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
                            'hover:bg-destructive/10 focus:bg-destructive/10 focus:outline-none',
                            'text-destructive transition-colors'
                        )}
                    >
                        <Trash2 className="h-4 w-4"/>
                        <span>Delete</span>
                    </button>
                )}
            </div>
        </>
    );
}
