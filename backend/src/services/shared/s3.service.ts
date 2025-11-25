import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// S3 client configuration
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET!;

// Helper Functions

// Build S3 URL
const buildS3Url = (filename: string): string => {
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
};

// Upload file to S3
export const uploadToS3 = async (
    file: Express.Multer.File,
    folder: string = 'attachments'
): Promise<string> => {
    const fileExtension = file.originalname.split('.').pop();
    const filename = `${folder}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
    });

    await s3Client.send(command);

    return buildS3Url(filename);
};

// Upload buffer to S3 (for thumbnails)
export const uploadBufferToS3 = async (
    buffer: Buffer,
    filename: string,
    mimeType: string
): Promise<string> => {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: mimeType,
    });

    await s3Client.send(command);

    return buildS3Url(filename);
};

