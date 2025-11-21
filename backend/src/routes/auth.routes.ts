import { Router } from 'express';
import { authController } from '../controllers';
import { authenticate } from '../middleware';

const router = Router();

// Register new user
router.post('/register', authController.registerUser);

// Login
router.post('/login', authController.loginUser);

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

// Refresh token
router.post('/refresh', authenticate, authController.refreshToken);

// Logout
router.post('/logout', authenticate, authController.logoutUser);

export default router;


