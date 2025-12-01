import { Router } from 'express';
import * as conversationController from '../controllers/conversations/conversation.controller';
import * as moderationController from '../controllers/conversations/moderation.controller';
import * as invitationController from '../controllers/conversations/invitation.controller';
import { authenticate } from '../middleware';

const router = Router();

// All conversation routes require authentication
router.use(authenticate);

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

export default router;
