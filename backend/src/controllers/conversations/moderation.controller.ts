import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware';
import * as moderationService from '../../services/conversations/moderation.service';
import { ModerationActionType } from '@prisma/client';

// Apply moderation action
export const applyModerationAction = asyncHandler(async (req: Request, res: Response) => {
    const actorId = (req as any).user?.id;
    const { id: conversationId } = req.params;
    const { action, targetUserId, messageId, reason, expiresAt } = req.body;

    await moderationService.applyModerationAction({
        actorId,
        conversationId,
        action: action as ModerationActionType,
        targetUserId,
        messageId,
        reason,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.status(200).json({
        status: 'success',
        data: {
            message: `Moderation action ${action} applied successfully`,
        },
    });
});

// Get active mute for user
export const getActiveMute = asyncHandler(async (req: Request, res: Response) => {
    const { id: conversationId, userId } = req.params;

    const mute = await moderationService.getActiveMute(userId, conversationId);

    res.status(200).json({
        status: 'success',
        data: { mute },
    });
});
