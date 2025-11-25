"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const messageController = __importStar(require("../controllers/messages/message.controller"));
const attachmentController = __importStar(require("../controllers/messages/attachment.controller"));
const mentionController = __importStar(require("../controllers/messages/mention.controller"));
const reactionController = __importStar(require("../controllers/messages/reaction.controller"));
const receiptController = __importStar(require("../controllers/messages/receipt.controller"));
const notificationController = __importStar(require("../controllers/messages/notification.controller"));
const middleware_1 = require("../middleware");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(middleware_1.authenticate);
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
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
// Mention routes
router.get('/mentions', mentionController.getUserMentions);
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
exports.default = router;
