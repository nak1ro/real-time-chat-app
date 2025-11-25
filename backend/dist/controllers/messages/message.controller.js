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
exports.deleteMessage = exports.editMessage = exports.createMessage = exports.getConversationMessages = void 0;
const middleware_1 = require("../../middleware");
const messageService = __importStar(require("../../services/messages/message.service"));
// Get conversation messages
exports.getConversationMessages = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user?.id;
    const pagination = {
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        cursor: req.query.cursor,
        sortOrder: req.query.sortOrder || 'desc',
    };
    const result = await messageService.getConversationMessages(conversationId, userId, pagination);
    res.status(200).json({
        status: 'success',
        data: result,
    });
});
// Create message
exports.createMessage = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const data = {
        userId,
        conversationId: req.body.conversationId,
        text: req.body.text,
        replyToId: req.body.replyToId,
        attachments: req.body.attachments,
    };
    const message = await messageService.createMessage(data);
    res.status(201).json({
        status: 'success',
        data: { message },
    });
});
// Edit message
exports.editMessage = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const { text } = req.body;
    const message = await messageService.editMessage(id, userId, text);
    res.status(200).json({
        status: 'success',
        data: { message },
    });
});
// Delete message
exports.deleteMessage = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const message = await messageService.softDeleteMessage(id, userId);
    res.status(200).json({
        status: 'success',
        data: { message },
    });
});
