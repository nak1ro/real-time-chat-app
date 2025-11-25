import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware';
import * as permissionsService from '../../services/users/permissions.service';

// Check user permissions
export const checkPermissions = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { conversationId, action } = req.query;

    if (typeof conversationId !== 'string') {
        res.status(400).json({
            status: 'error',
            message: 'conversationId is required',
        });
        return;
    }

    let canPerform = false;

    switch (action) {
        case 'sendMessage':
            canPerform = await permissionsService.canSendMessage(userId, conversationId);
            break;
        case 'manageMembers':
            canPerform = await permissionsService.canManageMembers(userId, conversationId);
            break;
        case 'moderateMessage':
            canPerform = await permissionsService.canModerateMessage(userId, conversationId);
            break;
        default:
            res.status(400).json({
                status: 'error',
                message: 'Invalid action',
            });
            return;
    }

    res.status(200).json({
        status: 'success',
        data: { canPerform },
    });
});
