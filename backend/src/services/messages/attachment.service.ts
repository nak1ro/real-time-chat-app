import { AttachmentType, Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { BadRequestError } from '../../middleware';
import { uploadToS3 } from '../shared/s3.service';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';

type PrismaTransactionClient = Prisma.TransactionClient;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB

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

// Helper: Validate file size
const validateFileSize = (file: Express.Multer.File): void => {
    const isImage = file.mimetype.startsWith('image/');
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
    const fileType = isImage ? 'Image' : 'File';

    if (file.size > maxSize) {
        throw new BadRequestError(`${fileType} size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }
};

// Helper: Validate file type
const validateFileType = (mimeType: string): void => {
    if (!ALLOWED_MIMETYPES[mimeType]) {
        throw new BadRequestError(`File type ${mimeType} is not allowed`);
    }
};

// Helper: Validate file exists
const validateFileExists = (file: Express.Multer.File): void => {
    if (!file) {
        throw new BadRequestError('No file provided');
    }
};

// Validate file before upload
const validateFile = (file: Express.Multer.File): void => {
    validateFileExists(file);
    validateFileSize(file);
    validateFileType(file.mimetype);
};

// Determine attachment type from mime type
const determineAttachmentType = (mimeType: string): AttachmentType => {
    return ALLOWED_MIMETYPES[mimeType] || 'OTHER';
};

// Extract image metadata using sharp
const extractImageMetadata = async (buffer: Buffer): Promise<{ width?: number; height?: number }> => {
    try {
        const metadata = await sharp(buffer).metadata();
        return {
            width: metadata.width,
            height: metadata.height,
        };
    } catch (error) {
        console.error('Failed to extract image metadata:', error);
        return {};
    }
};

// Helper: Write buffer to temporary file
const writeTempFile = (fileName: string, buffer: Buffer): string => {
    const fs = require('fs');
    const tempPath = `/tmp/${Date.now()}-${Math.random()}.${fileName.split('.').pop()}`;
    fs.writeFileSync(tempPath, buffer);
    return tempPath;
};

// Helper: Clean up temporary file
const cleanupTempFile = (filePath: string): void => {
    try {
        const fs = require('fs');
        fs.unlinkSync(filePath);
    } catch (e) {
        // Ignore cleanup errors
    }
};

// Helper: Extract video stream metadata
const parseVideoMetadata = (metadata: any): { width?: number; height?: number; durationMs?: number } => {
    try {
        const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
        return {
            width: videoStream?.width,
            height: videoStream?.height,
            durationMs: metadata.format.duration ? Math.floor(metadata.format.duration * 1000) : undefined,
        };
    } catch (error) {
        console.error('Failed to parse video metadata:', error);
        return {};
    }
};

// Extract video metadata using ffmpeg
const extractVideoMetadata = async (
    buffer: Buffer
): Promise<{ width?: number; height?: number; durationMs?: number }> => {
    return new Promise((resolve) => {
        const tempPath = writeTempFile('video', buffer);

        ffmpeg.ffprobe(tempPath, (err, metadata) => {
            cleanupTempFile(tempPath);

            if (err) {
                console.error('Failed to extract video metadata:', err);
                resolve({});
                return;
            }

            resolve(parseVideoMetadata(metadata));
        });
    });
};

// Extract metadata from file based on type
const extractMetadata = async (
    file: Express.Multer.File
): Promise<{ width?: number; height?: number; durationMs?: number }> => {
    const mimeType = file.mimetype;

    if (mimeType.startsWith('image/')) {
        return await extractImageMetadata(file.buffer);
    }

    if (mimeType.startsWith('video/')) {
        return await extractVideoMetadata(file.buffer);
    }

    return {};
};

// Upload attachment file
export const uploadAttachment = async (
    userId: string,
    file: Express.Multer.File
): Promise<AttachmentUploadResult> => {
    validateFile(file);

    const url = await uploadToS3(file, 'attachments');
    const type = determineAttachmentType(file.mimetype);
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

// Helper: Build attachment data for creation
const buildAttachmentCreateData = (messageId: string, attachment: AttachmentData) => {
    return {
        messageId,
        url: attachment.url,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        type: attachment.type,
        width: attachment.width,
        height: attachment.height,
        durationMs: attachment.durationMs,
        thumbnailUrl: attachment.thumbnailUrl,
    };
};

// Attach files to a message
export const attachFilesToMessage = async (
    messageId: string,
    attachments: AttachmentData[],
    tx?: PrismaTransactionClient
) => {
    if (!attachments || attachments.length === 0) {
        return;
    }

    const client = tx ?? prisma;

    return client.attachment.createMany({
        data: attachments.map((att) => buildAttachmentCreateData(messageId, att)),
    });
};

// Get attachments for a message
export const getMessageAttachments = async (messageId: string) => {
    return prisma.attachment.findMany({
        where: { messageId },
        orderBy: { createdAt: 'asc' },
    });
};
