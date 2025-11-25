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
exports.getMessageAttachments = exports.uploadAttachment = void 0;
const middleware_1 = require("../../middleware");
const attachmentService = __importStar(require("../../services/messages/attachment.service"));
// Upload attachment
exports.uploadAttachment = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const file = req.file;
    if (!file) {
        res.status(400).json({
            status: 'error',
            message: 'No file provided',
        });
        return;
    }
    const result = await attachmentService.uploadAttachment(userId, file);
    res.status(200).json({
        status: 'success',
        data: { attachment: result },
    });
});
// Get message attachments
exports.getMessageAttachments = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id: messageId } = req.params;
    const attachments = await attachmentService.getMessageAttachments(messageId);
    res.status(200).json({
        status: 'success',
        data: { attachments },
    });
});
