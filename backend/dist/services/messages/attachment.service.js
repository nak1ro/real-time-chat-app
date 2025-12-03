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
// Helper: Validate file size
const validateFileSize = (file) => {
    if (file.size > MAX_FILE_SIZE) {
        throw new middleware_1.BadRequestError(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }
};
// Helper: Validate file type
const validateFileType = (mimeType) => {
    if (!ALLOWED_MIMETYPES[mimeType]) {
        throw new middleware_1.BadRequestError(`File type ${mimeType} is not allowed`);
    }
};
// Helper: Validate file exists
const validateFileExists = (file) => {
    if (!file) {
        throw new middleware_1.BadRequestError('No file provided');
    }
};
// Validate file before upload
const validateFile = (file) => {
    validateFileExists(file);
    validateFileSize(file);
    validateFileType(file.mimetype);
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
// Helper: Write buffer to temporary file
const writeTempFile = (fileName, buffer) => {
    const fs = require('fs');
    const tempPath = `/tmp/${Date.now()}-${Math.random()}.${fileName.split('.').pop()}`;
    fs.writeFileSync(tempPath, buffer);
    return tempPath;
};
// Helper: Clean up temporary file
const cleanupTempFile = (filePath) => {
    try {
        const fs = require('fs');
        fs.unlinkSync(filePath);
    }
    catch (e) {
        // Ignore cleanup errors
    }
};
// Helper: Extract video stream metadata
const parseVideoMetadata = (metadata) => {
    try {
        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        return {
            width: videoStream?.width,
            height: videoStream?.height,
            durationMs: metadata.format.duration ? Math.floor(metadata.format.duration * 1000) : undefined,
        };
    }
    catch (error) {
        console.error('Failed to parse video metadata:', error);
        return {};
    }
};
// Extract video metadata using ffmpeg
const extractVideoMetadata = async (buffer) => {
    return new Promise((resolve) => {
        const tempPath = writeTempFile('video', buffer);
        fluent_ffmpeg_1.default.ffprobe(tempPath, (err, metadata) => {
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
const extractMetadata = async (file) => {
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
const uploadAttachment = async (userId, file) => {
    validateFile(file);
    const url = await (0, s3_service_1.uploadToS3)(file, 'attachments');
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
exports.uploadAttachment = uploadAttachment;
// Helper: Build attachment data for creation
const buildAttachmentCreateData = (messageId, attachment) => {
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
const attachFilesToMessage = async (messageId, attachments, tx) => {
    if (!attachments || attachments.length === 0) {
        return;
    }
    const client = tx ?? prisma_1.prisma;
    return client.attachment.createMany({
        data: attachments.map((att) => buildAttachmentCreateData(messageId, att)),
    });
};
exports.attachFilesToMessage = attachFilesToMessage;
// Get attachments for a message
const getMessageAttachments = async (messageId) => {
    return prisma_1.prisma.attachment.findMany({
        where: { messageId },
        orderBy: { createdAt: 'asc' },
    });
};
exports.getMessageAttachments = getMessageAttachments;
