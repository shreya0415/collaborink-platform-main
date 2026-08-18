// backend/src/services/AuthService.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import bcrypt from 'bcryptjs';

const ACCESS_TOKEN_EXPIRE = '15m';
const REFRESH_TOKEN_EXPIRE = '7d';

export class AuthService {
  static generateTokens(userId) {
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRE,
    });

    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRE,
    });

    return { accessToken, refreshToken };
  }

  static sanitizeUser(user) {
    if (!user) return null;
    const u = user.toObject ? user.toObject() : { ...user };
    delete u.password;
    return u;
  }

  static async signup({ email, password, firstName, lastName }) {
    email = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email });
    if (existing) {
      throw new Error('Email already exists');
    }

    // Password is hashed by the User model's pre-save hook
    const user = new User({
      email,
      password,
      firstName,
      lastName,
    });

    await user.save();

    const workspace = new Workspace({
      name: `${firstName}'s Workspace`,
      owner: user._id,
      members: [{ user: user._id, role: 'owner' }],
    });
    await workspace.save();

    user.workspaces.push(workspace._id);
    await user.save();

    const tokens = this.generateTokens(user._id);
    return { user: this.sanitizeUser(user), tokens };
  }

  static async login(email, password) {
    email = String(email).toLowerCase().trim();
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const tokens = this.generateTokens(user._id);
    return { user: this.sanitizeUser(user), tokens };
  }

  static async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new Error('No refresh token provided');
    }
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) throw new Error('User not found');

      const tokens = this.generateTokens(user._id);
      return tokens;
    } catch (err) {
      throw new Error('Invalid refresh token');
    }
  }

  static async socialAuth(profile, provider) {
    const providerIdField = `${provider}Id`;
    let user = await User.findOne({ [`socialAuth.${provider}Id`]: profile.id });

    if (!user) {
      user = new User({
        email: profile.emails?.[0]?.value ?? `${provider}_${profile.id}@no-reply.collaborink`,
        firstName: profile.name?.givenName ?? 'User',
        lastName: profile.name?.familyName ?? '',
        avatar: profile.photos?.[0]?.value ?? null,
        password: Math.random().toString(36).slice(-8),
        socialAuth: { [providerIdField]: profile.id },
      });

      await user.save();

      const workspace = new Workspace({
        name: `${user.firstName}'s Workspace`,
        owner: user._id,
        members: [{ user: user._id, role: 'owner' }],
      });
      await workspace.save();
      user.workspaces.push(workspace._id);
      await user.save();
    }

    const tokens = this.generateTokens(user._id);
    return { user: this.sanitizeUser(user), tokens };
  }
}