import { Router } from 'express';
import authRoutes from './auth.routes';
import conversationRoutes from './conversation.routes';
import messageRoutes from './message.routes';
import userRoutes from './user.routes';
import invitationRoutes from './invitation.routes';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/conversations', conversationRoutes);
router.use('/users', userRoutes);
router.use('/invitations', invitationRoutes);
router.use('/', messageRoutes);

export default router;


