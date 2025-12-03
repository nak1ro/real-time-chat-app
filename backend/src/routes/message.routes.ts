import { Router } from 'express';
import * as messageController from '../controllers/messages/message.controller';
import * as attachmentController from '../controllers/messages/attachment.controller';

import * as reactionController from '../controllers/messages/reaction.controller';
import * as receiptController from '../controllers/messages/receipt.controller';
import * as notificationController from '../controllers/messages/notification.controller';
import { authenticate } from '../middleware';
import multer from 'multer';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    },
});

// Message routes
router.post('/messages', messageController.createMessage);
router.get('/conversations/:id/messages', messageController.getConversationMessages);
router.patch('/messages/:id', messageController.editMessage);
router.delete('/messages/:id', messageController.deleteMessage);

// Attachment routes
router.post('/attachments/upload', upload.single('file'), attachmentController.uploadAttachment);
router.get('/messages/:id/attachments', attachmentController.getMessageAttachments);



// Reaction routes
router.post('/messages/:id/reactions', reactionController.toggleReaction);
router.get('/messages/:id/reactions', reactionController.getMessageReactions);

// Receipt routes (read status)
router.post('/conversations/:id/read', receiptController.markMessagesAsRead);
router.get('/messages/:id/receipts', receiptController.getMessageReadStats);
router.get('/conversations/:id/unread', receiptController.getUnreadCount);

// Notification routes
router.get('/notifications', notificationController.getUserNotifications);
router.get('/notifications/unread/count', notificationController.getUnreadNotificationCount);
router.patch('/notifications/:id/read', notificationController.markAsRead);
router.post('/notifications/read-all', notificationController.markAllAsRead);
router.post('/conversations/:id/notifications/read', notificationController.markConversationAsRead);

export default router;
