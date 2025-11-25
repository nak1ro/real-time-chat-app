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
exports.generateSlug = exports.joinChannelBySlug = exports.listPublicChannels = exports.updateMemberRole = exports.leaveConversation = exports.removeMember = exports.addMembers = exports.updateConversation = exports.getConversationById = exports.listUserConversations = exports.createGroupOrChannel = exports.createDirectConversation = void 0;
const middleware_1 = require("../../middleware");
const conversationService = __importStar(require("../../services/conversations/conversation.service"));
const client_1 = require("@prisma/client");
// Create direct conversation
exports.createDirectConversation = (0, middleware_1.asyncHandler)(async (req, res) => {
    const currentUserId = req.user?.id;
    const { otherUserId } = req.body;
    const conversation = await conversationService.createDirectConversation(currentUserId, otherUserId);
    res.status(201).json({
        status: 'success',
        data: { conversation },
    });
});
// Create group or channel conversation
exports.createGroupOrChannel = (0, middleware_1.asyncHandler)(async (req, res) => {
    const currentUserId = req.user?.id;
    const data = req.body;
    const conversation = await conversationService.createGroupOrChannelConversation(currentUserId, data);
    res.status(201).json({
        status: 'success',
        data: { conversation },
    });
});
// List user's conversations
exports.listUserConversations = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const filters = req.query.type || req.query.isPublic || req.query.name
        ? {
            type: req.query.type,
            isPublic: req.query.isPublic === 'true' ? true : req.query.isPublic === 'false' ? false : undefined,
            name: req.query.name,
        }
        : undefined;
    const conversations = await conversationService.listUserConversations(userId, filters);
    res.status(200).json({
        status: 'success',
        data: { conversations },
    });
});
// Get conversation by ID
exports.getConversationById = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const conversation = await conversationService.getConversationByIdForUser(id, userId);
    res.status(200).json({
        status: 'success',
        data: { conversation },
    });
});
// Update conversation
exports.updateConversation = (0, middleware_1.asyncHandler)(async (req, res) => {
    const actorId = req.user?.id;
    const { id } = req.params;
    const patch = req.body;
    const conversation = await conversationService.updateConversation(id, actorId, patch);
    res.status(200).json({
        status: 'success',
        data: { conversation },
    });
});
// Add members to conversation
exports.addMembers = (0, middleware_1.asyncHandler)(async (req, res) => {
    const actorId = req.user?.id;
    const { id } = req.params;
    const { userIds, role } = req.body;
    const conversation = await conversationService.addConversationMembers(id, actorId, userIds, role || client_1.MemberRole.MEMBER);
    res.status(200).json({
        status: 'success',
        data: { conversation },
    });
});
// Remove member from conversation
exports.removeMember = (0, middleware_1.asyncHandler)(async (req, res) => {
    const actorId = req.user?.id;
    const { id, memberId } = req.params;
    const conversation = await conversationService.removeConversationMember(id, actorId, memberId);
    res.status(200).json({
        status: 'success',
        data: { conversation },
    });
});
// Leave conversation
exports.leaveConversation = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    await conversationService.leaveConversation(id, userId);
    res.status(200).json({
        status: 'success',
        data: {
            message: 'Left conversation successfully',
        },
    });
});
// Update member role
exports.updateMemberRole = (0, middleware_1.asyncHandler)(async (req, res) => {
    const actorId = req.user?.id;
    const { id, memberId } = req.params;
    const { role } = req.body;
    const conversation = await conversationService.updateMemberRole(id, actorId, memberId, role);
    res.status(200).json({
        status: 'success',
        data: { conversation },
    });
});
// List public channels
exports.listPublicChannels = (0, middleware_1.asyncHandler)(async (req, res) => {
    const filters = req.query.name
        ? { name: req.query.name }
        : undefined;
    const channels = await conversationService.listPublicChannels(filters);
    res.status(200).json({
        status: 'success',
        data: { channels },
    });
});
// Join channel by slug
exports.joinChannelBySlug = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { slug } = req.params;
    const conversation = await conversationService.joinChannelBySlug(slug, userId);
    res.status(200).json({
        status: 'success',
        data: { conversation },
    });
});
// Generate slug from name
exports.generateSlug = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { name } = req.body;
    const slug = await conversationService.generateSlug(name);
    res.status(200).json({
        status: 'success',
        data: { slug },
    });
});
