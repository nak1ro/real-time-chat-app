import { Router } from 'express';
import authRoutes from './auth.routes';
import conversationRoutes from './conversation.routes';
import messageRoutes from './message.routes';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/conversations', conversationRoutes);
router.use('/', messageRoutes);

export default router;


