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

    const statusMap = await presenceService.getUsersStatus(userIds);

    // Convert Map to array format
    const statuses = Array.from(statusMap.entries()).map(([userId, status]) => ({
        userId,
        ...status,
    }));

    res.status(200).json({
        status: 'success',
        data: { users: statuses },
    });
});

// Update presence heartbeat
export const updatePresenceHeartbeat = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    await presenceService.updateLastSeen(userId);

    res.status(200).json({
        status: 'success',
        data: { message: 'Heartbeat updated' },
    });
});
