import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware';
import * as mentionService from '../../services/messages/mention.service';

// Get mentions for current user
export const getUserMentions = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        cursor: req.query.cursor as string,
    };

    const result = await mentionService.getMentionsForUser(userId, options);

    res.status(200).json({
        status: 'success',
        data: result,
    });
});
