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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.editMessage = exports.getConversationMessages = exports.createMessage = void 0;
const middleware_1 = require("../../middleware");
const messageService = __importStar(require("../../services/messages/message.service"));
const notification_service_1 = require("../../services/messages/notification.service");
// Create new message
exports.createMessage = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const userName = req.user?.name;
    const { conversationId, text, replyToId, attachments } = req.body;
    const data = {
        userId,
        conversationId,
        text,
        replyToId,
        attachments,
    };
    const result = await messageService.createMessage(data);
    // Create and broadcast NEW_MESSAGE notifications
    try {
        const io = req.app.get('io');
        if (io) {
            const notifications = await (0, notification_service_1.createNotificationsForMembers)(conversationId, userId, 'NEW_MESSAGE', {
                messageId: result.id,
                actorName: userName || 'Unknown User',
                messageText: result.text.substring(0, 100),
            });
            // Notify each recipient via socket
            notifications.forEach((notification) => {
                io.to(notification.userId).emit('notification:new', notification);
            });
        }
    }
    catch (notifError) {
        console.error('Failed to create message notifications via HTTP:', notifError);
        // Don't fail the request if notifications fail
    }
    res.status(201).json({
        status: 'success',
        data: {
            message: result,
        },
    });
});
// Get conversation messages with pagination
exports.getConversationMessages = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { id: conversationId } = req.params;
    const pagination = {
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        cursor: req.query.cursor,
        sortOrder: req.query.sortOrder || 'asc',
    };
    console.log('[getConversationMessages] Params:', {
        conversationId,
        pagination,
        queryParams: req.query
    });
    const result = await messageService.getConversationMessages(conversationId, userId, pagination);
    console.log('[getConversationMessages] Returning messages:', result.messages.length);
    res.status(200).json({
        status: 'success',
        data: result,
    });
});
// Edit message
exports.editMessage = (0, middleware_1.asyncHandler)(async (req, res) => {
    const actorId = req.user?.id;
    const { id: messageId } = req.params;
    const { text } = req.body;
    const message = await messageService.editMessage(messageId, actorId, text);
    res.status(200).json({
        status: 'success',
        data: { message },
    });
});
// Delete message (soft delete)
exports.deleteMessage = (0, middleware_1.asyncHandler)(async (req, res) => {
    const actorId = req.user?.id;
    const { id: messageId } = req.params;
    const message = await messageService.softDeleteMessage(messageId, actorId);
    res.status(200).json({
        status: 'success',
        data: { message },
    });
});
