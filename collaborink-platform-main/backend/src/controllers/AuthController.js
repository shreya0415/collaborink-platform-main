// backend/src/controllers/AuthController.js
import { AuthService } from '../services/AuthService.js';
import { validationResult } from 'express-validator';

export class AuthController {
  static #setRefreshCookie(res, token) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  static async signup(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const result = await AuthService.signup(req.body);
      AuthController.#setRefreshCookie(res, result.tokens.refreshToken);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      AuthController.#setRefreshCookie(res, result.tokens.refreshToken);
      res.json(result);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }

  static async refreshToken(req, res) {
    try {
      const token = req.body.refreshToken || AuthController.#parseCookieToken(req);
      const tokens = await AuthService.refreshAccessToken(token);
      AuthController.#setRefreshCookie(res, tokens.refreshToken);
      res.json(tokens);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }

  static #parseCookieToken(req) {
    const raw = req.headers.cookie || '';
    const match = raw.match(/(?:^|;\s*)refreshToken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  static async getCurrentUser(req, res) {
    try {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(req.userId).populate('workspaces').populate('teams');

      if (!user) return res.status(404).json({ message: 'User not found' });

      res.json(AuthService.sanitizeUser(user));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateProfile(req, res) {
    try {
      const User = (await import('../models/User.js')).default;
      const { firstName, lastName, bio, avatar, timezone } = req.body;

      const user = await User.findByIdAndUpdate(
        req.userId,
        { firstName, lastName, bio, avatar, timezone },
        { new: true, runValidators: true }
      );

      res.json(AuthService.sanitizeUser(user));
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async changePassword(req, res) {
    try {
      const User = (await import('../models/User.js')).default;
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.userId).select('+password');

      if (!(await user.comparePassword(currentPassword))) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      user.password = newPassword;
      await user.save();

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async logout(req, res) {
    try {
      res.clearCookie('refreshToken');
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}