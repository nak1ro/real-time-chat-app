import { Server } from 'socket.io';
import { AuthenticatedSocket, SocketResponse } from '../core/socket.types';
import {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from '../../services/messages/notification.service';
import {
    SOCKET_EVENTS,
    createSuccessResponse,
    createErrorResponse,
    invokeCallback,
    getErrorMessage,
} from '../core/socket.utils';

// Handle notification:getAll event
export const handleGetNotifications = async (
    socket: AuthenticatedSocket,
    data: { limit?: number; cursor?: string; unreadOnly?: boolean },
    callback?: (response: SocketResponse) => void
): Promise<void> => {
    const { userId } = socket.data;

    try {
        const result = await getUserNotifications(userId, data);

        invokeCallback(callback, createSuccessResponse(result));
    } catch (error) {
        console.error('Failed to get notifications:', error);
        invokeCallback(callback, createErrorResponse(getErrorMessage(error, 'Failed to get notifications')));
    }
};

// Handle notification:getUnreadCount event
export const handleGetUnreadCount = async (
    socket: AuthenticatedSocket,
    callback?: (response: SocketResponse<{ count: number }>) => void
): Promise<void> => {
    const { userId } = socket.data;

    try {
        const count = await getUnreadCount(userId);

        invokeCallback(callback, createSuccessResponse({ count }));
    } catch (error) {
        console.error('Failed to get unread count:', error);
        invokeCallback(callback, createErrorResponse(getErrorMessage(error, 'Failed to get unread count')));
    }
};

// Handle notification:markRead event
export const handleMarkNotificationRead = async (
    io: Server,
    socket: AuthenticatedSocket,
    data: { notificationId: string },
    callback?: (response: SocketResponse) => void
): Promise<void> => {
    const { userId } = socket.data;

    try {
        const notification = await markAsRead(data.notificationId, userId);

        // Get updated unread count
        const count = await getUnreadCount(userId);

        // Broadcast count update to user
        io.to(userId).emit(SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, { count });

        invokeCallback(callback, createSuccessResponse({ notification }));
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
        invokeCallback(callback, createErrorResponse(getErrorMessage(error, 'Failed to mark notification as read')));
    }
};

// Handle notification:markAllRead event
export const handleMarkAllNotificationsRead = async (
    io: Server,
    socket: AuthenticatedSocket,
    callback?: (response: SocketResponse<{ count: number }>) => void
): Promise<void> => {
    const { userId } = socket.data;

    try {
        const markedCount = await markAllAsRead(userId);

        // Broadcast count update to user (count should be 0)
        io.to(userId).emit(SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, { count: 0 });

        invokeCallback(callback, createSuccessResponse({ count: markedCount }));
    } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        invokeCallback(callback, createErrorResponse(getErrorMessage(error, 'Failed to mark all notifications as read')));
    }
};

// Helper: Notify a user of a new notification
export const notifyUser = (io: Server, userId: string, notification: any): void => {
    console.log(
        '[SOCKET][NOTIFICATIONS] Emitting NOTIFICATION_NEW to user:',
        userId,
        'notificationId:',
        notification.id
    );

    io.to(userId).emit(SOCKET_EVENTS.NOTIFICATION_NEW, notification);
};
