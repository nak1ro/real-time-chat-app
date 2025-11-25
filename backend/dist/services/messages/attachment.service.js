"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessageAttachments = exports.attachFilesToMessage = exports.uploadAttachment = void 0;
const prisma_1 = require("../../db/prisma");
const middleware_1 = require("../../middleware");
const s3_service_1 = require("../shared/s3.service");
const sharp_1 = __importDefault(require("sharp"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
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
// Extract image metadata using sharp
const extractImageMetadata = async (buffer) => {
    try {
        const metadata = await (0, sharp_1.default)(buffer).metadata();
        return {
            width: metadata.width,
            height: metadata.height,
        };
    }
    catch (error) {
        console.error('Failed to extract image metadata:', error);
        return {};
    }
};
// Extract video metadata using ffmpeg
const extractVideoMetadata = async (buffer) => {
    return new Promise((resolve) => {
        // Create a temporary file path (ffmpeg needs a file path, not just a buffer)
        const tempPath = `/tmp/${Date.now()}-${Math.random()}.mp4`;
        const fs = require('fs');
        try {
            // Write buffer to temp file
            fs.writeFileSync(tempPath, buffer);
            fluent_ffmpeg_1.default.ffprobe(tempPath, (err, metadata) => {
                // Clean up temp file
                try {
                    fs.unlinkSync(tempPath);
                }
                catch (e) {
                    // Ignore cleanup errors
                }
                if (err) {
                    console.error('Failed to extract video metadata:', err);
                    resolve({});
                    return;
                }
                try {
                    const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
                    resolve({
                        width: videoStream?.width,
                        height: videoStream?.height,
                        durationMs: metadata.format.duration
                            ? Math.floor(metadata.format.duration * 1000)
                            : undefined,
                    });
                }
                catch (error) {
                    console.error('Failed to parse video metadata:', error);
                    resolve({});
                }
            });
        }
        catch (error) {
            console.error('Failed to process video file:', error);
            // Clean up temp file if it exists
            try {
                fs.unlinkSync(tempPath);
            }
            catch (e) {
                // Ignore cleanup errors
            }
            resolve({});
        }
    });
};
// Extract metadata from file based on type
const extractMetadata = async (file) => {
    const mimeType = file.mimetype;
    // Extract image metadata
    if (mimeType.startsWith('image/')) {
        return await extractImageMetadata(file.buffer);
    }
    // Extract video metadata
    if (mimeType.startsWith('video/')) {
        return await extractVideoMetadata(file.buffer);
    }
    // No metadata for other types
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
