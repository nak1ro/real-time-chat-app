import { AttachmentType } from '@prisma/client';
import { prisma } from '../db/prisma';
import { BadRequestError } from '../middleware';
import { uploadToS3 } from './s3.service';

// Constants

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIMETYPES: Record<string, AttachmentType> = {
    // Images
    'image/jpeg': 'IMAGE',
    'image/png': 'IMAGE',
    'image/gif': 'IMAGE',
    'image/webp': 'IMAGE',
    // Videos
    'video/mp4': 'VIDEO',
    'video/webm': 'VIDEO',
    'video/quicktime': 'VIDEO',
    // Audio
    'audio/mpeg': 'AUDIO',
    'audio/wav': 'AUDIO',
    'audio/webm': 'AUDIO',
    // Documents
    'application/pdf': 'DOCUMENT',
    'application/msword': 'DOCUMENT',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCUMENT',
    'application/vnd.ms-excel': 'DOCUMENT',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'DOCUMENT',
};

// Types

export interface AttachmentData {
    url: string;
    thumbnailUrl?: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    type: AttachmentType;
    width?: number;
    height?: number;
    durationMs?: number;
}

export interface AttachmentUploadResult extends AttachmentData {
    id?: string;
}

// Helper Functions

// Validate file before upload
const validateFile = (file: Express.Multer.File): void => {
    if (!file) {
        throw new BadRequestError('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestError(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    if (!ALLOWED_MIMETYPES[file.mimetype]) {
        throw new BadRequestError(`File type ${file.mimetype} is not allowed`);
    }
};

// Determine attachment type from mime type
const determineAttachmentType = (mimeType: string): AttachmentType => {
    return ALLOWED_MIMETYPES[mimeType] || 'OTHER';
};

// Extract metadata from file (basic implementation)
const extractMetadata = async (file: Express.Multer.File): Promise<{
    width?: number;
    height?: number;
    durationMs?: number;
}> => {
    // Basic implementation - would use sharp for images, ffmpeg for videos
    // For now, return empty metadata
    // TODO: Implement proper metadata extraction
    return {};
};

// Public API

// Upload attachment file
export const uploadAttachment = async (
    userId: string,
    file: Express.Multer.File
): Promise<AttachmentUploadResult> => {
    validateFile(file);

    // Upload to S3
    const url = await uploadToS3(file, 'attachments');

    // Determine type
    const type = determineAttachmentType(file.mimetype);

    // Extract metadata
    const metadata = await extractMetadata(file);

    return {
        url,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        type,
        ...metadata,
    };
};

// Attach files to a message
export const attachFilesToMessage = async (
    messageId: string,
    attachments: AttachmentData[]
) => {
    if (!attachments || attachments.length === 0) {
        return;
    }

    return await prisma.attachment.createMany({
        data: attachments.map((att) => ({
            messageId,
            url: att.url,
            fileName: att.fileName,
            mimeType: att.mimeType,
            sizeBytes: att.sizeBytes,
            type: att.type,
            width: att.width,
            height: att.height,
            durationMs: att.durationMs,
            thumbnailUrl: att.thumbnailUrl,
        })),
    });
};

// Get attachments for a message
export const getMessageAttachments = async (messageId: string) => {
    return await prisma.attachment.findMany({
        where: { messageId },
        orderBy: { createdAt: 'asc' },
    });
};
