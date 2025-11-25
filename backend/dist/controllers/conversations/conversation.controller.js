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
exports.updateMemberRole = exports.removeMember = exports.addMembers = exports.deleteConversation = exports.updateConversation = exports.createChannel = exports.createGroupConversation = exports.createDirectConversation = exports.getConversation = exports.getUserConversations = void 0;
const middleware_1 = require("../../middleware");
const conversationService = __importStar(require("../../services/conversations/conversation.service"));
// Get user conversations
exports.getUserConversations = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const conversations = await conversationService.getUserConversations(userId);
    res.status(200).json({
        status: 'success',
        data: { conversations },
    });
});
// Get conversation by ID
exports.getConversation = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const conversation = await conversationService.getConversationById(id, userId);
    res.status(200).json({
        status: 'success',
        data: { conversation },
    });
});
// Create direct conversation
exports.createDirectConversation = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const dto = {
        userIds: [userId, req.body.otherUserId],
    };
    const conversation = await conversationService.createDirectConversation(dto);
    res.status(201).json({
        status: 'success',
        data: { conversation },
    });
});
// Create group conversation
exports.createGroupConversation = (0, middleware_1.asyncHandler)(async (req, res) => {
    const creatorId = req.user?.id;
    const dto = {
        name: req.body.name,
        creatorId,
        memberIds: req.body.memberIds,
        description: req.body.description,
        avatarUrl: req.body.avatarUrl,
    };
    const conversation = await conversationService.createGroupConversation(dto);
    res.status(201).json({
        status: 'success',
        data: { conversation },
    });
});
// Create channel
exports.createChannel = (0, middleware_1.asyncHandler)(async (req, res) => {
    const creatorId = req.user?.id;
    const dto = {
        name: req.body.name,
        slug: req.body.slug,
        creatorId,
        description: req.body.description,
        isPublic: req.body.isPublic,
        isReadOnly: req.body.isReadOnly,
        avatarUrl: req.body.avatarUrl,
    };
    const conversation = await conversationService.createChannel(dto);
    res.status(201).json({
        status: 'success',
        data: { conversation },
    });
});
// Update conversation
exports.updateConversation = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const conversation = await conversationService.updateConversation(id, userId, req.body);
    res.status(200).json({
        status: 'success',
        data: { conversation },
    });
});
// Delete conversation
exports.deleteConversation = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const conversation = await conversationService.deleteConversation(id, userId);
    res.status(200).json({
        status: 'success',
        data: { conversation },
    });
});
// Add members
exports.addMembers = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const actorId = req.user?.id;
    const { userIds } = req.body;
    const members = await conversationService.addMembers(id, userIds, actorId);
    res.status(200).json({
        status: 'success',
        data: { members },
    });
});
// Remove member
exports.removeMember = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id, userId } = req.params;
    const actorId = req.user?.id;
    await conversationService.removeMember(id, userId, actorId);
    res.status(200).json({
        status: 'success',
        data: { success: true },
    });
});
// Update member role
exports.updateMemberRole = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id, userId } = req.params;
    const actorId = req.user?.id;
    const { role } = req.body;
    const member = await conversationService.updateMemberRole(id, userId, role, actorId);
    res.status(200).json({
        status: 'success',
        data: { member },
    });
});
