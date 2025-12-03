"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markConversationAsRead = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getUserNotifications = exports.createNotificationsForMembers = exports.createNotification = exports.buildNotificationContent = void 0;
const prisma_1 = require("../../db/prisma");
const middleware_1 = require("../../middleware");
const service_constants_1 = require("../shared/service-constants");
// Helper: Validate user is not the actor
// Helper: Verify user is member of conversation
// Check if user should be notified
// Helper: Build notification title for NEW_MESSAGE type
const buildNewMessageTitle = (actorName) => {
    return `New message from ${actorName}`;
};
// Helper: Build notification title for REACTION type
const buildReactionTitle = (actorName) => {
    return `${actorName} reacted to your message`;
};
// Helper: Build notification title for REPLY type
const buildReplyTitle = (actorName) => {
    return `${actorName} replied to you`;
};
// Helper: Build notification title for CONVERSATION_INVITE type
const buildInviteTitle = (_actorName, conversationName) => {
    return `Added to ${conversationName || 'a conversation'}`;
};
// Helper: Build notification title for ROLE_CHANGE type
const buildRoleChangeTitle = () => {
    return 'Your role was updated';
};
// Build notification content
const buildNotificationContent = (type, actorName, context) => {
    switch (type) {
        case 'NEW_MESSAGE':
            return {
                title: buildNewMessageTitle(actorName),
                body: context?.messageText || 'Sent a message',
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
exports.buildNotificationContent = buildNotificationContent;
// Helper: Log notification creation
const logNotificationCreation = (data) => {
    console.log('[NOTIFICATIONS] Creating notification:', JSON.stringify({
        targetUser: data.userId,
        type: data.type,
        actorId: data.actorId,
        conversationId: data.conversationId,
        messageId: data.messageId,
        title: data.title,
        body: data.body,
    }, null, 2));
};
// Helper: Log notification creation success
const logNotificationCreationSuccess = (notification) => {
    console.log('[NOTIFICATIONS] Successfully created notification:', JSON.stringify({
        id: notification.id,
        createdAt: notification.createdAt,
        userId: notification.userId,
        type: notification.type,
    }, null, 2));
};
// Helper: Log notification creation error
const logNotificationCreationError = (data, error) => {
    console.error('[NOTIFICATIONS] FAILED to create notification:', {
        error: error instanceof Error ? error.message : error,
        prismaData: data,
    });
};
// Create a single notification
const createNotification = async (data) => {
    logNotificationCreation(data);
    try {
        const notification = await prisma_1.prisma.notification.create({
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
    }
    catch (error) {
        logNotificationCreationError(data, error);
        throw error;
    }
};
exports.createNotification = createNotification;
// Helper: Get conversation members excluding actor
const getConversationMembersToNotify = async (conversationId, actorId) => {
    const members = await prisma_1.prisma.conversationMember.findMany({
        where: {
            conversationId,
            userId: { not: actorId },
        },
        select: { userId: true },
    });
    return members.map((m) => m.userId);
};
// Helper: Create notification for single member
const createMemberNotification = (userId, type, title, body, context) => {
    return (0, exports.createNotification)({
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
const createNotificationsForMembers = async (conversationId, actorId, type, context) => {
    console.log('[NOTIFICATIONS] Creating notifications for conversation members:', JSON.stringify({
        conversationId,
        actorId,
        type,
        context,
    }, null, 2));
    const memberIds = await getConversationMembersToNotify(conversationId, actorId);
    const { title, body } = (0, exports.buildNotificationContent)(type, context.actorName, {
        conversationName: context.conversationName,
        messageText: context.messageText,
    });
    const notifications = await Promise.all(memberIds.map((userId) => {
        console.log('[NOTIFICATIONS] Creating individual member notification:', { userId });
        return createMemberNotification(userId, type, title, body, {
            conversationId,
            messageId: context.messageId,
            actorId,
        });
    }));
    console.log('[NOTIFICATIONS] Finished creating notifications:', notifications.map((n) => ({ id: n.id, userId: n.userId })));
    return notifications;
};
exports.createNotificationsForMembers = createNotificationsForMembers;
// Helper: Get pagination limit
const getPaginationLimit = (requestedLimit) => {
    return Math.min(requestedLimit || service_constants_1.DEFAULT_PAGE_LIMIT, service_constants_1.MAX_PAGE_LIMIT);
};
// Helper: Build notification where clause
const buildNotificationWhereClause = (userId, options) => {
    const where = {
        userId,
        isRead: false,
    };
    if (options.cursor) {
        where.createdAt = { lt: new Date(options.cursor) };
    }
    return where;
};
// Helper: Extract pagination info from results
const extractPaginationInfo = (notifications, limit) => {
    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;
    return { items, hasMore, nextCursor };
};
// Get user's notifications with pagination
const getUserNotifications = async (userId, options = {}) => {
    const limit = getPaginationLimit(options.limit);
    const where = buildNotificationWhereClause(userId, options);
    const notifications = await prisma_1.prisma.notification.findMany({
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
exports.getUserNotifications = getUserNotifications;
// Get unread count for a user
const getUnreadCount = async (userId) => {
    return prisma_1.prisma.notification.count({
        where: {
            userId,
            isRead: false,
        },
    });
};
exports.getUnreadCount = getUnreadCount;
// Helper: Verify notification ownership
const verifyNotificationOwnership = (notification, userId) => {
    if (notification.userId !== userId) {
        throw new middleware_1.AuthorizationError('You can only mark your own notifications as read');
    }
};
// Mark notification as read
const markAsRead = async (notificationId, userId) => {
    const notification = await prisma_1.prisma.notification.findUnique({
        where: { id: notificationId },
    });
    if (!notification) {
        throw new middleware_1.NotFoundError('Notification not found');
    }
    verifyNotificationOwnership(notification, userId);
    if (notification.isRead) {
        return notification;
    }
    return await prisma_1.prisma.notification.update({
        where: { id: notificationId },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });
};
exports.markAsRead = markAsRead;
// Mark all user notifications as read
const markAllAsRead = async (userId) => {
    const result = await prisma_1.prisma.notification.updateMany({
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
exports.markAllAsRead = markAllAsRead;
// Mark all conversation notifications as read
const markConversationAsRead = async (userId, conversationId) => {
    const result = await prisma_1.prisma.notification.updateMany({
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
exports.markConversationAsRead = markConversationAsRead;
