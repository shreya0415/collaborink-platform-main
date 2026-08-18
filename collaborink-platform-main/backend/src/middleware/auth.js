// backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization || req.headers.Authorization || '';
    const token = header.startsWith('Bearer ') ? header.split(' ')[1] : header;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId || decoded.id || decoded.sub;

    // optional: attach user object
    try {
      const user = await UserModel.findById(req.userId);
      if (user) req.user = user;
    } catch (e) {
      // ignore
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired' });
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const adminMiddleware = async (req, res, next) => {
  try {
    const user = req.user || (await UserModel.findById(req.userId));
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};