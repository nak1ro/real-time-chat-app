"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessageAttachments = exports.attachFilesToMessage = exports.uploadAttachment = void 0;
const prisma_1 = require("../db/prisma");
const middleware_1 = require("../middleware");
const s3_service_1 = require("./s3.service");
// Constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIMETYPES = {
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
// Helper Functions
// Validate file before upload
const validateFile = (file) => {
    if (!file) {
        throw new middleware_1.BadRequestError('No file provided');
    }
    if (file.size > MAX_FILE_SIZE) {
        throw new middleware_1.BadRequestError(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }
    if (!ALLOWED_MIMETYPES[file.mimetype]) {
        throw new middleware_1.BadRequestError(`File type ${file.mimetype} is not allowed`);
    }
};
// Determine attachment type from mime type
const determineAttachmentType = (mimeType) => {
    return ALLOWED_MIMETYPES[mimeType] || 'OTHER';
};
// Extract metadata from file (basic implementation)
const extractMetadata = async (file) => {
    // Basic implementation - would use sharp for images, ffmpeg for videos
    // For now, return empty metadata
    // TODO: Implement proper metadata extraction
    return {};
};
// Public API
// Upload attachment file
const uploadAttachment = async (userId, file) => {
    validateFile(file);
    // Upload to S3
    const url = await (0, s3_service_1.uploadToS3)(file, 'attachments');
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
exports.uploadAttachment = uploadAttachment;
// Attach files to a message
const attachFilesToMessage = async (messageId, attachments) => {
    if (!attachments || attachments.length === 0) {
        return;
    }
    return await prisma_1.prisma.attachment.createMany({
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
exports.attachFilesToMessage = attachFilesToMessage;
// Get attachments for a message
const getMessageAttachments = async (messageId) => {
    return await prisma_1.prisma.attachment.findMany({
        where: { messageId },
        orderBy: { createdAt: 'asc' },
    });
};
exports.getMessageAttachments = getMessageAttachments;
