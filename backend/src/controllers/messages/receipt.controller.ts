import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware';
import * as receiptService from '../../services/messages/receipt.service';

// Mark messages as read
export const markMessagesAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id: conversationId } = req.params;
    const { upToMessageId } = req.body;

    const result = await receiptService.markMessagesAsRead(
        conversationId,
        userId,
        upToMessageId
    );

    res.status(200).json({
        status: 'success',
        data: result,
    });
});

// Get message read statistics
export const getMessageReadStats = asyncHandler(async (req: Request, res: Response) => {
    const { id: messageId } = req.params;

    const stats = await receiptService.getMessageReadStats(messageId);

    res.status(200).json({
        status: 'success',
        data: stats,
    });
});

// Get unread message count for conversation
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id: conversationId } = req.params;

    const count = await receiptService.getUnreadMessageCount(conversationId, userId);

    res.status(200).json({
        status: 'success',
        data: { unreadCount: count },
    });
});
