import { Router } from 'express';
import * as userController from '../controllers/users/user.controller';
import * as presenceController from '../controllers/users/presence.controller';
import * as permissionsController from '../controllers/users/permissions.controller';
import { authenticate } from '../middleware';
import multer from 'multer';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Configure multer for avatar uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB limit for avatars
    },
});

// User routes
router.get('/me', userController.getCurrentUser);
router.patch('/me', upload.single('avatar'), userController.updateCurrentUser);
router.get('/search', userController.searchUsers);
router.get('/contacts/online', presenceController.getOnlineContacts);
router.get('/:id', userController.getUserById);

// Presence routes
router.get('/:userId/presence', presenceController.getUserPresence);
router.post('/presence/bulk', presenceController.getBulkPresences);
router.post('/presence/heartbeat', presenceController.updatePresenceHeartbeat);

// Permission routes
router.get('/permissions', permissionsController.checkPermissions);

export default router;
