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
exports.markConversationAsRead = exports.markAllAsRead = exports.markAsRead = exports.getUnreadNotificationCount = exports.getUserNotifications = void 0;
const middleware_1 = require("../../middleware");
const notificationService = __importStar(require("../../services/messages/notification.service"));
// Get user notifications
exports.getUserNotifications = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const options = {
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        cursor: req.query.cursor,
        unreadOnly: req.query.unreadOnly === 'true',
    };
    const result = await notificationService.getUserNotifications(userId, options);
    res.status(200).json({
        status: 'success',
        data: result,
    });
});
// Get unread notification count
exports.getUnreadNotificationCount = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const count = await notificationService.getUnreadCount(userId);
    res.status(200).json({
        status: 'success',
        data: { unreadCount: count },
    });
});
// Mark notification as read
exports.markAsRead = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { id: notificationId } = req.params;
    const notification = await notificationService.markAsRead(notificationId, userId);
    res.status(200).json({
        status: 'success',
        data: { notification },
    });
});
// Mark all notifications as read
exports.markAllAsRead = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const count = await notificationService.markAllAsRead(userId);
    res.status(200).json({
        status: 'success',
        data: {
            message: 'All notifications marked as read',
            count,
        },
    });
});
// Mark conversation notifications as read
exports.markConversationAsRead = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { id: conversationId } = req.params;
    const count = await notificationService.markConversationAsRead(userId, conversationId);
    res.status(200).json({
        status: 'success',
        data: {
            message: 'Conversation notifications marked as read',
            count,
        },
    });
});
