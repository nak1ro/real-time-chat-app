"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markConversationAsRead = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getUserNotifications = exports.createNotificationsForMembers = exports.createNotification = exports.buildNotificationContent = exports.shouldNotifyUser = void 0;
const prisma_1 = require("../../db/prisma");
const middleware_1 = require("../../middleware");
const service_constants_1 = require("../shared/service-constants");
// Helper: Check if user should be notified
const shouldNotifyUser = async (userId, actorId, conversationId) => {
    // Don't notify if the user is the actor
    if (userId === actorId) {
        return false;
    }
    // If conversation is specified, verify membership
    if (conversationId) {
        const member = await prisma_1.prisma.conversationMember.findUnique({
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
exports.shouldNotifyUser = shouldNotifyUser;
// Helper: Build notification content
const buildNotificationContent = (type, actorName, context) => {
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
exports.buildNotificationContent = buildNotificationContent;
// Create a single notification
const createNotification = async (data) => {
    return await prisma_1.prisma.notification.create({
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
exports.createNotification = createNotification;
// Create notifications for conversation members
const createNotificationsForMembers = async (conversationId, actorId, type, context) => {
    // Get all conversation members except the actor
    const members = await prisma_1.prisma.conversationMember.findMany({
        where: {
            conversationId,
            userId: { not: actorId },
        },
        select: {
            userId: true,
        },
    });
    const { title, body } = (0, exports.buildNotificationContent)(type, context.actorName, {
        conversationName: context.conversationName,
        messageText: context.messageText,
    });
    const notifications = await Promise.all(members.map((member) => (0, exports.createNotification)({
        userId: member.userId,
        type,
        title,
        body,
        conversationId,
        messageId: context.messageId,
        actorId,
    })));
    return notifications;
};
exports.createNotificationsForMembers = createNotificationsForMembers;
// Get user's notifications with pagination
const getUserNotifications = async (userId, options = {}) => {
    const limit = Math.min(options.limit || service_constants_1.DEFAULT_PAGE_LIMIT, service_constants_1.MAX_PAGE_LIMIT);
    const where = {
        userId,
    };
    if (options.unreadOnly) {
        where.isRead = false;
    }
    if (options.cursor) {
        where.createdAt = { lt: new Date(options.cursor) };
    }
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
    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;
    return {
        notifications: items,
        nextCursor,
        hasMore,
    };
};
exports.getUserNotifications = getUserNotifications;
// Get unread count for a user
const getUnreadCount = async (userId) => {
    return await prisma_1.prisma.notification.count({
        where: {
            userId,
            isRead: false,
        },
    });
};
exports.getUnreadCount = getUnreadCount;
// Mark notification as read
const markAsRead = async (notificationId, userId) => {
    const notification = await prisma_1.prisma.notification.findUnique({
        where: { id: notificationId },
    });
    if (!notification) {
        throw new middleware_1.NotFoundError('Notification not found');
    }
    if (notification.userId !== userId) {
        throw new middleware_1.AuthorizationError('You can only mark your own notifications as read');
    }
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
