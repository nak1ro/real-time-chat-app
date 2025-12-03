"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyUser = exports.handleMarkAllNotificationsRead = exports.handleMarkNotificationRead = exports.handleGetUnreadCount = exports.handleGetNotifications = void 0;
const notification_service_1 = require("../../services/messages/notification.service");
const socket_utils_1 = require("../core/socket.utils");
// Handle notification:getAll event
const handleGetNotifications = async (socket, data, callback) => {
    const { userId } = socket.data;
    try {
        const result = await (0, notification_service_1.getUserNotifications)(userId, data);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)(result));
    }
    catch (error) {
        console.error('Failed to get notifications:', error);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createErrorResponse)((0, socket_utils_1.getErrorMessage)(error, 'Failed to get notifications')));
    }
};
exports.handleGetNotifications = handleGetNotifications;
// Handle notification:getUnreadCount event
const handleGetUnreadCount = async (socket, callback) => {
    const { userId } = socket.data;
    try {
        const count = await (0, notification_service_1.getUnreadCount)(userId);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)({ count }));
    }
    catch (error) {
        console.error('Failed to get unread count:', error);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createErrorResponse)((0, socket_utils_1.getErrorMessage)(error, 'Failed to get unread count')));
    }
};
exports.handleGetUnreadCount = handleGetUnreadCount;
// Handle notification:markRead event
const handleMarkNotificationRead = async (io, socket, data, callback) => {
    const { userId } = socket.data;
    try {
        const notification = await (0, notification_service_1.markAsRead)(data.notificationId, userId);
        // Get updated unread count
        const count = await (0, notification_service_1.getUnreadCount)(userId);
        // Broadcast count update to user
        io.to(userId).emit(socket_utils_1.SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, { count });
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)({ notification }));
    }
    catch (error) {
        console.error('Failed to mark notification as read:', error);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createErrorResponse)((0, socket_utils_1.getErrorMessage)(error, 'Failed to mark notification as read')));
    }
};
exports.handleMarkNotificationRead = handleMarkNotificationRead;
// Handle notification:markAllRead event
const handleMarkAllNotificationsRead = async (io, socket, callback) => {
    const { userId } = socket.data;
    try {
        const markedCount = await (0, notification_service_1.markAllAsRead)(userId);
        // Broadcast count update to user (count should be 0)
        io.to(userId).emit(socket_utils_1.SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, { count: 0 });
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createSuccessResponse)({ count: markedCount }));
    }
    catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        (0, socket_utils_1.invokeCallback)(callback, (0, socket_utils_1.createErrorResponse)((0, socket_utils_1.getErrorMessage)(error, 'Failed to mark all notifications as read')));
    }
};
exports.handleMarkAllNotificationsRead = handleMarkAllNotificationsRead;
// Helper: Notify a user of a new notification
const notifyUser = (io, userId, notification) => {
    console.log('[SOCKET][NOTIFICATIONS] Emitting NOTIFICATION_NEW to user:', userId, 'notificationId:', notification.id);
    io.to(userId).emit(socket_utils_1.SOCKET_EVENTS.NOTIFICATION_NEW, notification);
};
exports.notifyUser = notifyUser;
