// backend/src/routes/auth.js
import express from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Signup
router.post(
  '/signup',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
  ],
  AuthController.signup
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  AuthController.login
);

// Refresh token
router.post('/refresh', AuthController.refreshToken);

// Get current user
router.get('/me', authMiddleware, AuthController.getCurrentUser);

// Update profile
router.put('/profile', authMiddleware, AuthController.updateProfile);

// Change password
router.post('/change-password', authMiddleware, AuthController.changePassword);

// Logout
router.post('/logout', authMiddleware, AuthController.logout);

export default router;