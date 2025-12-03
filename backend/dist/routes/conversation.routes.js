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
const express_1 = require("express");
const conversationController = __importStar(require("../controllers/conversations/conversation.controller"));
const moderationController = __importStar(require("../controllers/conversations/moderation.controller"));
const invitationController = __importStar(require("../controllers/conversations/invitation.controller"));
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// All conversation routes require authentication
router.use(middleware_1.authenticate);
// Public channels (must be before /:id routes to avoid conflicts)
router.get('/public', conversationController.listPublicChannels);
router.get('/search', conversationController.search);
router.post('/public/:slug/join', conversationController.joinChannelBySlug);
// Conversation CRUD
router.post('/direct', conversationController.createDirectConversation);
router.post('/', conversationController.createGroupOrChannel);
router.get('/', conversationController.listUserConversations);
router.get('/:id', conversationController.getConversationById);
router.get('/:id/attachments', conversationController.getAttachments);
router.patch('/:id', conversationController.updateConversation);
router.delete('/:id', conversationController.deleteConversation);
// Member management
router.post('/:id/members', conversationController.addMembers);
router.delete('/:id/members/:memberId', conversationController.removeMember);
router.post('/:id/leave', conversationController.leaveConversation);
router.patch('/:id/members/:memberId/role', conversationController.updateMemberRole);
// Invitations
router.post('/:id/invitations', invitationController.inviteMembersToConversation);
// Moderation
router.post('/:id/moderation', moderationController.applyModerationAction);
router.get('/:id/moderation/mutes/:userId', moderationController.getActiveMute);
// Utilities
router.post('/slug', conversationController.generateSlug);
exports.default = router;
