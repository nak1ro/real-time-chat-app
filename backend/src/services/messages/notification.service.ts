import { NotificationType } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { NotFoundError, AuthorizationError } from '../../middleware';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '../shared/service-constants';

// Type definitions
export interface CreateNotificationData {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    conversationId?: string;
    messageId?: string;
    actorId?: string;
}

export interface NotificationQueryOptions {
    limit?: number;
    cursor?: string;
    unreadOnly?: boolean;
}

// Helper: Check if user should be notified
export const shouldNotifyUser = async (
    userId: string,
    actorId: string,
    conversationId?: string
): Promise<boolean> => {
    // Don't notify if the user is the actor
    if (userId === actorId) {
        return false;
    }

    // If conversation is specified, verify membership
    if (conversationId) {
        const member = await prisma.conversationMember.findUnique({
            where: {
                userId_conversationId: {
                    userId,
                    conversationId,
                },
            },
        });

        if (!member) {
            return false;
        }
    }

    return true;
};

// Helper: Build notification content
export const buildNotificationContent = (
    type: NotificationType,
    actorName: string,
    context?: { conversationName?: string; messageText?: string }
): { title: string; body: string } => {
    switch (type) {
        case 'NEW_MESSAGE':
            return {
                title: `New message from ${actorName}`,
                body: context?.messageText || 'Sent a message',
            };
        case 'MENTION':
            return {
                title: `${actorName} mentioned you`,
                body: context?.messageText || 'Mentioned you in a message',
            };
        case 'REACTION':
            return {
                title: `${actorName} reacted to your message`,
                body: 'Reacted to your message',
            };
        case 'REPLY':
            return {
                title: `${actorName} replied to you`,
                body: context?.messageText || 'Replied to your message',
            };
        case 'CONVERSATION_INVITE':
            return {
                title: `Added to ${context?.conversationName || 'a conversation'}`,
                body: `${actorName} added you`,
            };
        case 'ROLE_CHANGE':
            return {
                title: 'Your role was updated',
                body: `${actorName} updated your role in ${context?.conversationName || 'a conversation'}`,
            };
        default:
            return {
                title: 'New notification',
                body: 'You have a new notification',
            };
    }
};

// Create a single notification
export const createNotification = async (
    data: CreateNotificationData
): Promise<any> => {
    return await prisma.notification.create({
        data: {
            userId: data.userId,
            type: data.type,
            title: data.title,
            body: data.body,
            conversationId: data.conversationId,
            messageId: data.messageId,
            actorId: data.actorId,
        },
        include: {
            actor: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                },
            },
            conversation: {
                select: {
                    id: true,
                    name: true,
                },
            },
            message: {
                select: {
                    id: true,
                    text: true,
                },
            },
        },
    });
};

// Create notifications for conversation members
export const createNotificationsForMembers = async (
    conversationId: string,
    actorId: string,
    type: NotificationType,
    context: {
        messageId?: string;
        actorName: string;
        conversationName?: string;
        messageText?: string;
    }
): Promise<any[]> => {
    // Get all conversation members except the actor
    const members = await prisma.conversationMember.findMany({
        where: {
            conversationId,
            userId: { not: actorId },
        },
        select: {
            userId: true,
        },
    });

    const { title, body } = buildNotificationContent(type, context.actorName, {
        conversationName: context.conversationName,
        messageText: context.messageText,
    });

    const notifications = await Promise.all(
        members.map((member) =>
            createNotification({
                userId: member.userId,
                type,
                title,
                body,
                conversationId,
                messageId: context.messageId,
                actorId,
            })
        )
    );

    return notifications;
};

// Get user's notifications with pagination
export const getUserNotifications = async (
    userId: string,
    options: NotificationQueryOptions = {}
): Promise<{ notifications: any[]; nextCursor: string | null; hasMore: boolean }> => {
    const limit = Math.min(options.limit || DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT);

    const where: any = {
        userId,
    };

    if (options.unreadOnly) {
        where.isRead = false;
    }

    if (options.cursor) {
        where.createdAt = { lt: new Date(options.cursor) };
    }

    const notifications = await prisma.notification.findMany({
        where,
        take: limit + 1,
        orderBy: { createdAt: 'desc' },
        include: {
            actor: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                },
            },
            conversation: {
                select: {
                    id: true,
                    name: true,
                },
            },
            message: {
                select: {
                    id: true,
                    text: true,
                },
            },
        },
    });

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;

    return {
        notifications: items,
        nextCursor,
        hasMore,
    };
};

// Get unread count for a user
export const getUnreadCount = async (userId: string): Promise<number> => {
    return await prisma.notification.count({
        where: {
            userId,
            isRead: false,
        },
    });
};

// Mark notification as read
export const markAsRead = async (
    notificationId: string,
    userId: string
): Promise<any> => {
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
    });

    if (!notification) {
        throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
        throw new AuthorizationError('You can only mark your own notifications as read');
    }

    if (notification.isRead) {
        return notification;
    }

    return await prisma.notification.update({
        where: { id: notificationId },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });
};

// Mark all user notifications as read
export const markAllAsRead = async (userId: string): Promise<number> => {
    const result = await prisma.notification.updateMany({
        where: {
            userId,
            isRead: false,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });

    return result.count;
};

// Mark all conversation notifications as read
export const markConversationAsRead = async (
    userId: string,
    conversationId: string
): Promise<number> => {
    const result = await prisma.notification.updateMany({
        where: {
            userId,
            conversationId,
            isRead: false,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });

    return result.count;
};
