import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware';
import * as messageService from '../../services/messages/message.service';
import { CreateMessageData, PaginationOptions } from '../../domain';

// Create new message
export const createMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { conversationId, text, replyToId, attachments } = req.body;

    const data: CreateMessageData = {
        userId,
        conversationId,
        text,
        replyToId,
        attachments,
    };

    const result = await messageService.createMessage(data);

    res.status(201).json({
        status: 'success',
        data: {
            message: result,
            mentionedUserIds: result.mentionedUserIds,
        },
    });
});

// Get conversation messages with pagination
export const getConversationMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id: conversationId } = req.params;

    const pagination: PaginationOptions = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        cursor: req.query.cursor as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };

    console.log('[getConversationMessages] Params:', {
        conversationId,
        pagination,
        queryParams: req.query
    });

    const result = await messageService.getConversationMessages(
        conversationId,
        userId,
        pagination
    );

    console.log('[getConversationMessages] Returning messages:', result.messages.length);

    res.status(200).json({
        status: 'success',
        data: result,
    });
});

// Edit message
export const editMessage = asyncHandler(async (req: Request, res: Response) => {
    const actorId = (req as any).user?.id;
    const { id: messageId } = req.params;
    const { text } = req.body;

    const message = await messageService.editMessage(messageId, actorId, text);

    res.status(200).json({
        status: 'success',
        data: { message },
    });
});

// Delete message (soft delete)
export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
    const actorId = (req as any).user?.id;
    const { id: messageId } = req.params;

    const message = await messageService.softDeleteMessage(messageId, actorId);

    res.status(200).json({
        status: 'success',
        data: { message },
    });
});
