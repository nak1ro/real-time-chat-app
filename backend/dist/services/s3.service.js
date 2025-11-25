"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBufferToS3 = exports.uploadToS3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
// S3 client configuration
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET;
// Upload file to S3
const uploadToS3 = async (file, folder = 'attachments') => {
    const fileExtension = file.originalname.split('.').pop();
    const filename = `${folder}/${(0, uuid_1.v4)()}.${fileExtension}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
    });
    await s3Client.send(command);
    // Return public URL
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
};
exports.uploadToS3 = uploadToS3;
// Upload buffer to S3 (for thumbnails)
const uploadBufferToS3 = async (buffer, filename, mimeType) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: mimeType,
    });
    await s3Client.send(command);
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
};
exports.uploadBufferToS3 = uploadBufferToS3;
