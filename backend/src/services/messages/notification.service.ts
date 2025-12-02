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
    invitationId?: string;
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
// Create a single notification
export const createNotification = async (
    data: CreateNotificationData
): Promise<any> => {

    console.log(
        '[NOTIFICATIONS] Creating notification:',
        JSON.stringify({
            targetUser: data.userId,
            type: data.type,
            actorId: data.actorId,
            conversationId: data.conversationId,
            messageId: data.messageId,
            title: data.title,
            body: data.body,
        }, null, 2)
    );

    try {
        const notification = await prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                body: data.body,
                conversationId: data.conversationId,
                messageId: data.messageId,
                actorId: data.actorId,
                invitationId: data.invitationId,
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

        console.log(
            '[NOTIFICATIONS] Successfully created notification:',
            JSON.stringify({
                id: notification.id,
                createdAt: notification.createdAt,
                userId: notification.userId,
                type: notification.type,
            }, null, 2)
        );

        return notification;

    } catch (error) {
        console.error(
            '[NOTIFICATIONS] FAILED to create notification:',
            {
                error: error instanceof Error ? error.message : error,
                prismaData: data
            }
        );
        throw error;
    }
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

    console.log(
        '[NOTIFICATIONS] Creating notifications for conversation members:',
        JSON.stringify({
            conversationId,
            actorId,
            type,
            context,
        }, null, 2)
    );

    const members = await prisma.conversationMember.findMany({
        where: {
            conversationId,
            userId: { not: actorId },
        },
        select: { userId: true },
    });

    console.log('[NOTIFICATIONS] Members to notify:', members);

    const { title, body } = buildNotificationContent(type, context.actorName, {
        conversationName: context.conversationName,
        messageText: context.messageText,
    });

    const notifications = await Promise.all(
        members.map((member) => {
            console.log(
                '[NOTIFICATIONS] Creating individual member notification:',
                { userId: member.userId }
            );

            return createNotification({
                userId: member.userId,
                type,
                title,
                body,
                conversationId,
                messageId: context.messageId,
                actorId,
            });
        })
    );

    console.log(
        '[NOTIFICATIONS] Finished creating notifications:',
        notifications.map((n) => ({ id: n.id, userId: n.userId }))
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
        isRead: false,
    };

    // Removed optional check, always filter read notifications
    // if (options.unreadOnly) {
    //     where.isRead = false;
    // }

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
