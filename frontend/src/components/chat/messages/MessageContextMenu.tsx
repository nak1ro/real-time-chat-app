'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Copy, Reply, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import type { Message } from '@/types';
import { ReactionPicker } from '../reactions/ReactionPicker';
import { useToggleReaction } from '@/hooks';
import { MENU_WIDTH, MENU_ITEM_HEIGHT, VIEWPORT_PADDING } from './messages.utils';

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

// Calculate optimal menu position based on viewport and click position
function calculateMenuPosition(
  position: { x: number; y: number },
  isOwnMessage: boolean,
  menuHeight: number
): MenuPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let x = position.x;
  let y = position.y;
  let horizontalPlacement: 'left' | 'right' = isOwnMessage ? 'left' : 'right';

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

  // Vertical positioning
  let verticalPlacement: 'top' | 'bottom' = 'bottom';
  if (spaceBottom >= menuHeight + VIEWPORT_PADDING) {
    y = position.y;
  } else if (spaceTop >= menuHeight + VIEWPORT_PADDING) {
    y = position.y - menuHeight;
    verticalPlacement = 'top';
  } else {
    y = spaceBottom >= spaceTop
      ? viewportHeight - menuHeight - VIEWPORT_PADDING
      : VIEWPORT_PADDING;
    verticalPlacement = spaceBottom >= spaceTop ? 'bottom' : 'top';
  }

  x = Math.max(VIEWPORT_PADDING, Math.min(x, viewportWidth - MENU_WIDTH - VIEWPORT_PADDING));
  y = Math.max(VIEWPORT_PADDING, Math.min(y, viewportHeight - menuHeight - VIEWPORT_PADDING));

  return { x, y, placement: { horizontal: horizontalPlacement, vertical: verticalPlacement } };
}

// Menu item button component
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

function MenuItem({ icon, label, onClick, variant = 'default' }: MenuItemProps) {
  const isDestructive = variant === 'destructive';
  return (
    <Button
      role="menuitem"
      variant="ghost"
      onClick={onClick}
      className={cn(
        'w-full justify-start gap-3 h-10',
        isDestructive && 'text-destructive hover:bg-destructive/10 focus:bg-destructive/10'
      )}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}

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
  const { mutate: toggleReaction } = useToggleReaction();

  const isOwnMessage = isOwnMessageProp ?? message.userId === currentUserId;
  const canCopy = !message.isDeleted;
  const canEdit = isOwnMessage && !message.isDeleted;
  const canDelete = isOwnMessage && !message.isDeleted;

  // Calculate menu height based on visible items
  const menuItemCount = 1 + (canCopy ? 1 : 0) + (canEdit ? 1 : 0) + (canDelete ? 1 : 0);
  const menuHeight = menuItemCount * MENU_ITEM_HEIGHT + 16;

  // Setup event listeners for closing menu
  const setupCloseListeners = useCallback(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (!target.closest('[role="dialog"]')) onClose();
      }
    };

    const handleTouchOutside = (event: TouchEvent) => {
      const target = event.target as Element;
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (!target.closest('[role="dialog"]')) onClose();
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const handleScroll = () => onClose();

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

  // Initialize menu position
  useEffect(() => {
    const newPosition = calculateMenuPosition(position, isOwnMessage, menuHeight);
    setMenuPosition(newPosition);
    requestAnimationFrame(() => setIsVisible(true));
  }, [position, isOwnMessage, menuHeight]);

  // Setup close listeners
  useEffect(() => {
    return setupCloseListeners();
  }, [setupCloseListeners]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newPosition = calculateMenuPosition(position, isOwnMessage, menuHeight);
      setMenuPosition(newPosition);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, isOwnMessage, menuHeight]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  if (!menuPosition) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-[9998] md:hidden"
        onClick={onClose}
        onTouchStart={onClose}
      />

      {/* Menu container */}
      <div
        className="fixed z-[9999]"
        style={{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }}
        role="dialog"
      >
        {/* Reaction picker */}
        <div
          className={cn(
            'absolute bottom-full left-0 mb-2 transition-all duration-150 ease-out origin-bottom-left',
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          )}
        >
          <ReactionPicker
            onReactionSelect={(emoji) => {
              toggleReaction({ messageId: message.id, emoji });
              onClose();
            }}
          />
        </div>

        {/* Menu items */}
        <div
          ref={menuRef}
          role="menu"
          aria-label="Message actions"
          className={cn(
            'min-w-[160px] py-2 rounded-xl shadow-lg bg-popover border border-border',
            'transition-all duration-150 ease-out',
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
            menuPosition.placement.vertical === 'top' && 'origin-bottom',
            menuPosition.placement.vertical === 'bottom' && 'origin-top'
          )}
          style={{ width: `${MENU_WIDTH}px` }}
        >
          <MenuItem
            icon={<Reply className="h-4 w-4 text-muted-foreground" />}
            label="Reply"
            onClick={() => handleAction(() => onReply(message))}
          />

          {canCopy && (
            <MenuItem
              icon={<Copy className="h-4 w-4 text-muted-foreground" />}
              label="Copy"
              onClick={() => handleAction(() => onCopy(message.text))}
            />
          )}

          {canEdit && (
            <MenuItem
              icon={<Edit className="h-4 w-4 text-muted-foreground" />}
              label="Edit"
              onClick={() => handleAction(() => onEdit(message))}
            />
          )}

          {canDelete && (
            <MenuItem
              icon={<Trash2 className="h-4 w-4" />}
              label="Delete"
              onClick={() => handleAction(() => onDelete(message.id))}
              variant="destructive"
            />
          )}
        </div>
      </div>
    </>
  );
}
