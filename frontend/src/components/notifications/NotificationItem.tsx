'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { NotificationType } from '@/types/enums';
import {
  MessageCircle,
  AtSign,
  SmilePlus,
  Reply,
  UserPlus,
  Shield,
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils/date';
import type { NotificationItem as NotificationItemType } from '@/types/notification.types';

interface NotificationItemProps {
  notification: NotificationItemType;
  onClick: (notification: NotificationItemType) => void;
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

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { type, title, preview, timestamp, actor } = notification;

  return (
    <button
      onClick={() => onClick(notification)}
      className="w-full flex items-start gap-3 p-3 md:p-4 text-left rounded-lg hover:bg-muted/50 transition-colors active:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Avatar with type indicator */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10 md:h-11 md:w-11">
          <AvatarImage src={actor.avatarUrl ?? undefined} alt={actor.name} />
          <AvatarFallback className="text-xs font-medium">
            {getInitials(actor.name)}
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
        {preview && (
          <p className="text-sm text-muted-foreground line-clamp-1 md:line-clamp-2">
            {preview}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <span className="flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap ml-2">
        {formatDistanceToNow(timestamp)}
      </span>
    </button>
  );
}

