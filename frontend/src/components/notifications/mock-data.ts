import { NotificationType } from '@/types/enums';
import type { NotificationItem } from '@/types/notification.types';

// Helper to create dates relative to now
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000);
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    type: NotificationType.NEW_MESSAGE,
    title: 'New message from Sarah Chen',
    preview: 'Hey! Are you coming to the meeting today?',
    timestamp: minutesAgo(2),
    conversationId: 'conv-1',
    messageId: 'msg-101',
    actor: {
      id: 'user-2',
      name: 'Sarah Chen',
      avatarUrl: null,
    },
  },
  {
    id: 'notif-2',
    type: NotificationType.MENTION,
    title: 'Mentioned you in #general',
    preview: '@you check out this new feature we shipped!',
    timestamp: minutesAgo(15),
    conversationId: 'conv-3',
    messageId: 'msg-102',
    actor: {
      id: 'user-3',
      name: 'Alex Rivera',
      avatarUrl: null,
    },
  },
  {
    id: 'notif-3',
    type: NotificationType.REACTION,
    title: 'Reacted 🎉 to your message',
    preview: 'The deployment was successful!',
    timestamp: minutesAgo(42),
    conversationId: 'conv-2',
    messageId: 'msg-50',
    actor: {
      id: 'user-4',
      name: 'Jordan Lee',
      avatarUrl: null,
    },
  },
  {
    id: 'notif-4',
    type: NotificationType.CONVERSATION_INVITE,
    title: 'Invited you to #design-team',
    timestamp: hoursAgo(1),
    conversationId: 'conv-5',
    actor: {
      id: 'user-5',
      name: 'Taylor Smith',
      avatarUrl: null,
    },
  },
  {
    id: 'notif-5',
    type: NotificationType.REPLY,
    title: 'Replied to your message',
    preview: 'Good point! I think we should also consider...',
    timestamp: hoursAgo(2),
    conversationId: 'conv-1',
    messageId: 'msg-103',
    actor: {
      id: 'user-6',
      name: 'Morgan Blake',
      avatarUrl: null,
    },
  },
  {
    id: 'notif-6',
    type: NotificationType.ROLE_CHANGE,
    title: 'Made you an admin in #engineering',
    timestamp: hoursAgo(5),
    conversationId: 'conv-4',
    actor: {
      id: 'user-2',
      name: 'Sarah Chen',
      avatarUrl: null,
    },
  },
  {
    id: 'notif-7',
    type: NotificationType.NEW_MESSAGE,
    title: 'New message from Design Team',
    preview: 'The new mockups are ready for review',
    timestamp: daysAgo(1),
    conversationId: 'conv-5',
    messageId: 'msg-200',
    actor: {
      id: 'user-5',
      name: 'Taylor Smith',
      avatarUrl: null,
    },
  },
  {
    id: 'notif-8',
    type: NotificationType.MENTION,
    title: 'Mentioned you in #random',
    preview: '@you this meme is amazing 😂',
    timestamp: daysAgo(1),
    conversationId: 'conv-6',
    messageId: 'msg-201',
    actor: {
      id: 'user-7',
      name: 'Casey Kim',
      avatarUrl: null,
    },
  },
  {
    id: 'notif-9',
    type: NotificationType.CONVERSATION_INVITE,
    title: 'Invited you to Project Alpha',
    timestamp: daysAgo(2),
    conversationId: 'conv-7',
    actor: {
      id: 'user-3',
      name: 'Alex Rivera',
      avatarUrl: null,
    },
  },
  {
    id: 'notif-10',
    type: NotificationType.REACTION,
    title: 'Reacted ❤️ to your message',
    preview: 'Thanks everyone for the hard work!',
    timestamp: daysAgo(3),
    conversationId: 'conv-4',
    messageId: 'msg-150',
    actor: {
      id: 'user-6',
      name: 'Morgan Blake',
      avatarUrl: null,
    },
  },
];

