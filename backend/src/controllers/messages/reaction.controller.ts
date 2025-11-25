import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware';
import * as reactionService from '../../services/messages/reaction.service';

// Toggle reaction (add or remove)
export const toggleReaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id: messageId } = req.params;
    const { emoji } = req.body;

    const result = await reactionService.toggleReaction({
        userId,
        messageId,
        emoji,
    });

    res.status(200).json({
        status: 'success',
        data: result,
    });
});

// Get message reactions
export const getMessageReactions = asyncHandler(async (req: Request, res: Response) => {
    const { id: messageId } = req.params;

    const reactions = await reactionService.getMessageReactions(messageId);

    res.status(200).json({
        status: 'success',
        data: { reactions },
    });
});
