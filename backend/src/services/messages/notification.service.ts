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

// Helper: Validate user is not the actor
// Helper: Verify user is member of conversation
// Check if user should be notified
// Helper: Build notification title for NEW_MESSAGE type
const buildNewMessageTitle = (actorName: string): string => {
    return `New message from ${actorName}`;
};

// Helper: Build notification title for MENTION type
const buildMentionTitle = (actorName: string): string => {
    return `${actorName} mentioned you`;
};

// Helper: Build notification title for REACTION type
const buildReactionTitle = (actorName: string): string => {
    return `${actorName} reacted to your message`;
};

// Helper: Build notification title for REPLY type
const buildReplyTitle = (actorName: string): string => {
    return `${actorName} replied to you`;
};

// Helper: Build notification title for CONVERSATION_INVITE type
const buildInviteTitle = (_actorName: string, conversationName?: string): string => {
    return `Added to ${conversationName || 'a conversation'}`;
};

// Helper: Build notification title for ROLE_CHANGE type
const buildRoleChangeTitle = (): string => {
    return 'Your role was updated';
};

// Build notification content
export const buildNotificationContent = (
    type: NotificationType,
    actorName: string,
    context?: { conversationName?: string; messageText?: string }
): { title: string; body: string } => {
    switch (type) {
        case 'NEW_MESSAGE':
            return {
                title: buildNewMessageTitle(actorName),
                body: context?.messageText || 'Sent a message',
            };
        case 'MENTION':
            return {
                title: buildMentionTitle(actorName),
                body: context?.messageText || 'Mentioned you in a message',
            };
        case 'REACTION':
            return {
                title: buildReactionTitle(actorName),
                body: 'Reacted to your message',
            };
        case 'REPLY':
            return {
                title: buildReplyTitle(actorName),
                body: context?.messageText || 'Replied to your message',
            };
        case 'CONVERSATION_INVITE':
            return {
                title: buildInviteTitle(actorName, context?.conversationName),
                body: `${actorName} added you`,
            };
        case 'ROLE_CHANGE':
            return {
                title: buildRoleChangeTitle(),
                body: `${actorName} updated your role in ${context?.conversationName || 'a conversation'}`,
            };
        default:
            return {
                title: 'New notification',
                body: 'You have a new notification',
            };
    }
};

// Helper: Log notification creation
const logNotificationCreation = (data: CreateNotificationData): void => {
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
};

// Helper: Log notification creation success
const logNotificationCreationSuccess = (notification: any): void => {
    console.log(
        '[NOTIFICATIONS] Successfully created notification:',
        JSON.stringify({
            id: notification.id,
            createdAt: notification.createdAt,
            userId: notification.userId,
            type: notification.type,
        }, null, 2)
    );
};

// Helper: Log notification creation error
const logNotificationCreationError = (data: CreateNotificationData, error: unknown): void => {
    console.error(
        '[NOTIFICATIONS] FAILED to create notification:',
        {
            error: error instanceof Error ? error.message : error,
            prismaData: data,
        }
    );
};

// Create a single notification
export const createNotification = async (data: CreateNotificationData): Promise<any> => {
    logNotificationCreation(data);

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

        logNotificationCreationSuccess(notification);
        return notification;
    } catch (error) {
        logNotificationCreationError(data, error);
        throw error;
    }
};

// Helper: Get conversation members excluding actor
const getConversationMembersToNotify = async (
    conversationId: string,
    actorId: string
): Promise<string[]> => {
    const members = await prisma.conversationMember.findMany({
        where: {
            conversationId,
            userId: { not: actorId },
        },
        select: { userId: true },
    });

    return members.map((m) => m.userId);
};

// Helper: Create notification for single member
const createMemberNotification = (
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    context: { conversationId?: string; messageId?: string; actorId?: string }
) => {
    return createNotification({
        userId,
        type,
        title,
        body,
        conversationId: context.conversationId,
        messageId: context.messageId,
        actorId: context.actorId,
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
    console.log(
        '[NOTIFICATIONS] Creating notifications for conversation members:',
        JSON.stringify({
            conversationId,
            actorId,
            type,
            context,
        }, null, 2)
    );

    const memberIds = await getConversationMembersToNotify(conversationId, actorId);

    const { title, body } = buildNotificationContent(type, context.actorName, {
        conversationName: context.conversationName,
        messageText: context.messageText,
    });

    const notifications = await Promise.all(
        memberIds.map((userId) => {
            console.log('[NOTIFICATIONS] Creating individual member notification:', { userId });

            return createMemberNotification(
                userId,
                type,
                title,
                body,
                {
                    conversationId,
                    messageId: context.messageId,
                    actorId,
                }
            );
        })
    );

    console.log(
        '[NOTIFICATIONS] Finished creating notifications:',
        notifications.map((n) => ({ id: n.id, userId: n.userId }))
    );

    return notifications;
};

// Helper: Get pagination limit
const getPaginationLimit = (requestedLimit?: number): number => {
    return Math.min(requestedLimit || DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT);
};

// Helper: Build notification where clause
const buildNotificationWhereClause = (userId: string, options: NotificationQueryOptions) => {
    const where: any = {
        userId,
        isRead: false,
    };

    if (options.cursor) {
        where.createdAt = { lt: new Date(options.cursor) };
    }

    return where;
};

// Helper: Extract pagination info from results
const extractPaginationInfo = (notifications: any[], limit: number) => {
    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;

    return { items, hasMore, nextCursor };
};

// Get user's notifications with pagination
export const getUserNotifications = async (
    userId: string,
    options: NotificationQueryOptions = {}
): Promise<{ notifications: any[]; nextCursor: string | null; hasMore: boolean }> => {
    const limit = getPaginationLimit(options.limit);
    const where = buildNotificationWhereClause(userId, options);

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

    const { items, hasMore, nextCursor } = extractPaginationInfo(notifications, limit);

    return {
        notifications: items,
        nextCursor,
        hasMore,
    };
};

// Get unread count for a user
export const getUnreadCount = async (userId: string): Promise<number> => {
    return prisma.notification.count({
        where: {
            userId,
            isRead: false,
        },
    });
};

// Helper: Verify notification ownership
const verifyNotificationOwnership = (notification: any, userId: string): void => {
    if (notification.userId !== userId) {
        throw new AuthorizationError('You can only mark your own notifications as read');
    }
};

// Mark notification as read
export const markAsRead = async (notificationId: string, userId: string): Promise<any> => {
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
    });

    if (!notification) {
        throw new NotFoundError('Notification not found');
    }

    verifyNotificationOwnership(notification, userId);

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
export const markConversationAsRead = async (userId: string, conversationId: string): Promise<number> => {
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
