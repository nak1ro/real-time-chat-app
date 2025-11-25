import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware';
import * as presenceService from '../../services/users/presence.service';

// Get user presence
export const getUserPresence = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const status = await presenceService.getUserStatus(userId);

    res.status(200).json({
        status: 'success',
        data: { status },
    });
});

// Get bulk presences
export const getBulkPresences = asyncHandler(async (req: Request, res: Response) => {
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
        res.status(400).json({
            status: 'error',
            message: 'userIds must be an array',
        });
        return;
    }

    const statuses = await Promise.all(
        userIds.map(async (userId: string) => ({
            userId,
            status: await presenceService.getUserStatus(userId),
        }))
    );

    res.status(200).json({
        status: 'success',
        data: { users: statuses },
    });
});
