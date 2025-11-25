import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware';
import * as attachmentService from '../../services/messages/attachment.service';

// Upload attachment
export const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const file = req.file;

    if (!file) {
        res.status(400).json({
            status: 'error',
            message: 'No file provided',
        });
        return;
    }

    const result = await attachmentService.uploadAttachment(userId, file);

    res.status(200).json({
        status: 'success',
        data: { attachment: result },
    });
});

// Get message attachments
export const getMessageAttachments = asyncHandler(async (req: Request, res: Response) => {
    const { id: messageId } = req.params;

    const attachments = await attachmentService.getMessageAttachments(messageId);

    res.status(200).json({
        status: 'success',
        data: { attachments },
    });
});
