import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware';
import * as notificationService from '../../services/messages/notification.service';

// Get user notifications
export const getUserNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        cursor: req.query.cursor as string,
        unreadOnly: req.query.unreadOnly === 'true',
    };

    const result = await notificationService.getUserNotifications(userId, options);

    res.status(200).json({
        status: 'success',
        data: result,
    });
});

// Get unread notification count
export const getUnreadNotificationCount = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    const count = await notificationService.getUnreadCount(userId);

    res.status(200).json({
        status: 'success',
        data: { unreadCount: count },
    });
});

// Mark notification as read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id: notificationId } = req.params;

    const notification = await notificationService.markAsRead(notificationId, userId);

    res.status(200).json({
        status: 'success',
        data: { notification },
    });
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    const count = await notificationService.markAllAsRead(userId);

    res.status(200).json({
        status: 'success',
        data: {
            message: 'All notifications marked as read',
            count,
        },
    });
});

// Mark conversation notifications as read
export const markConversationAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id: conversationId } = req.params;

    const count = await notificationService.markConversationAsRead(userId, conversationId);

    res.status(200).json({
        status: 'success',
        data: {
            message: 'Conversation notifications marked as read',
            count,
        },
    });
});
