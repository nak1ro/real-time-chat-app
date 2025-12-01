import { Router } from 'express';
import * as invitationController from '../controllers/conversations/invitation.controller';
import { authenticate } from '../middleware';

const router = Router();

// All invitation routes require authentication
router.use(authenticate);

// Accept or decline invitations
router.post('/:invitationId/accept', invitationController.acceptInvitation);
router.post('/:invitationId/decline', invitationController.declineInvitation);

export default router;
