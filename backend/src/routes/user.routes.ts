import { Router } from 'express';
import * as userController from '../controllers/users/user.controller';
import * as presenceController from '../controllers/users/presence.controller';
import * as permissionsController from '../controllers/users/permissions.controller';
import { authenticate } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User routes
router.get('/me', userController.getCurrentUser);
router.patch('/me', userController.updateCurrentUser);
router.get('/search', userController.searchUsers);
router.get('/:id', userController.getUserById);

// Presence routes
router.get('/:userId/presence', presenceController.getUserPresence);
router.post('/presence/bulk', presenceController.getBulkPresences);
router.post('/presence/heartbeat', presenceController.updatePresenceHeartbeat);

// Permission routes
router.get('/permissions', permissionsController.checkPermissions);

export default router;
