'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage, Button } from '@/components/ui';
import { NotificationType } from '@/types/enums';
import {
  MessageCircle,
  AtSign,
  SmilePlus,
  Reply,
  UserPlus,
  Shield,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils/date';
import type { Notification } from '@/types/notification.types';

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  onAcceptInvitation?: (invitationId: string) => Promise<void>;
  onDeclineInvitation?: (invitationId: string) => Promise<void>;
}

// Get icon based on notification type
function getNotificationIcon(type: NotificationType) {
  const iconClass = 'h-3.5 w-3.5';

  switch (type) {
    case NotificationType.NEW_MESSAGE:
      return <MessageCircle className={iconClass} />;
    case NotificationType.MENTION:
      return <AtSign className={iconClass} />;
    case NotificationType.REACTION:
      return <SmilePlus className={iconClass} />;
    case NotificationType.REPLY:
      return <Reply className={iconClass} />;
    case NotificationType.CONVERSATION_INVITE:
      return <UserPlus className={iconClass} />;
    case NotificationType.ROLE_CHANGE:
      return <Shield className={iconClass} />;
    default:
      return <MessageCircle className={iconClass} />;
  }
}

// Get icon background color based on type
function getIconBgClass(type: NotificationType) {
  switch (type) {
    case NotificationType.NEW_MESSAGE:
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case NotificationType.MENTION:
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case NotificationType.REACTION:
      return 'bg-pink-500/10 text-pink-600 dark:text-pink-400';
    case NotificationType.REPLY:
      return 'bg-green-500/10 text-green-600 dark:text-green-400';
    case NotificationType.CONVERSATION_INVITE:
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
    case NotificationType.ROLE_CHANGE:
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

// Get initials from name
function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function NotificationItem({ notification, onClick, onAcceptInvitation, onDeclineInvitation }: NotificationItemProps) {
  const { type, title, body, createdAt, actor, invitationId, isRead } = notification;
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [actionTaken, setActionTaken] = useState(false);

  const isInvite = type === NotificationType.CONVERSATION_INVITE && invitationId && !isRead && !actionTaken;
  const isPending = isAccepting || isDeclining;

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!invitationId || !onAcceptInvitation || isPending) return;

    setIsAccepting(true);
    try {
      await onAcceptInvitation(invitationId);
      setActionTaken(true);
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!invitationId || !onDeclineInvitation || isPending) return;

    setIsDeclining(true);
    try {
      await onDeclineInvitation(invitationId);
      setActionTaken(true);
    } catch (error) {
      console.error('Failed to decline invitation:', error);
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <div
      className="w-full text-left rounded-lg hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <button
        onClick={() => onClick(notification)}
        className="w-full flex items-start gap-3 p-3 md:p-4"
        disabled={isPending}
      >
        {/* Avatar with type indicator */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-10 w-10 md:h-11 md:w-11">
            <AvatarImage src={actor?.avatarUrl ?? undefined} alt={actor?.name || 'User'} />
            <AvatarFallback className="text-xs font-medium">
              {actor?.name ? getInitials(actor.name) : '?'}
            </AvatarFallback>
          </Avatar>
          {/* Type icon badge */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 p-1 rounded-full ${getIconBgClass(type)} ring-2 ring-background`}
          >
            {getNotificationIcon(type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-sm font-medium leading-snug">{title}</p>
          {body && (
            <p className="text-sm text-muted-foreground line-clamp-1 md:line-clamp-2">
              {body}
            </p>
          )}
        </div>

        {/* Timestamp */}
        <span className="flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap ml-2">
          {formatDistanceToNow(createdAt)}
        </span>
      </button>

      {/* Invitation Action Buttons */}
      {isInvite && onAcceptInvitation && onDeclineInvitation && (
        <div className="flex items-center gap-2 px-3 md:px-4 pb-3 md:pb-4 pt-0">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isPending}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isAccepting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Accept
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDecline}
            disabled={isPending}
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            {isDeclining ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Declining...
              </>
            ) : (
              <>
                <X className="h-3.5 w-3.5 mr-1.5" />
                Decline
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
