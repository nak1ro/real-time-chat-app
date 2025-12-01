import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware';
import * as invitationService from '../../services/invitations/invitation.service';

export const inviteMembers = asyncHandler(async (req: Request, res: Response) => {
    const inviterId = (req as any).user?.id;
    const { id: conversationId } = req.params;
    const { userIds } = req.body;

    const invitations = await invitationService.createInvitations(
        conversationId,
        inviterId,
        userIds
    );

    res.status(200).json({
        status: 'success',
        data: { invitations }
    });
});

export const acceptInvitation = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id: conversationId } = req.params;

    await invitationService.acceptInvitation(conversationId, userId);

    res.status(200).json({
        status: 'success',
        message: 'Joined conversation successfully'
    });
});

export const rejectInvitation = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id: conversationId } = req.params;

    await invitationService.rejectInvitation(conversationId, userId);

    res.status(200).json({
        status: 'success',
        message: 'Invitation rejected'
    });
});
