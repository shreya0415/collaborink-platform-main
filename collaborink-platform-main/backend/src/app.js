// backend/src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import path from 'path';
import { fileURLToPath } from 'url';

// routes
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import chatRoutes from './routes/chat.js';
import workspaceRoutes from './routes/workspaces.js';
import fileRoutes from './routes/files.js';
import calendarRoutes from './routes/calendar.js';
import boardRoutes from './routes/boards.js';
import commentRoutes from './routes/comments.js';
import notificationRoutes from './routes/notifications.js';
import searchRoutes from './routes/search.js';
import dmRoutes from './routes/directMessages.js';
import activityRoutes from './routes/activities.js';
import chatsRoutes from './routes/chats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// middleware
import { errorHandler } from './middleware/errorHandler.js';
import logger from './middleware/logger.js';
import { xssSanitizer } from './middleware/xssSanitizer.js';

const app = express();

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
    },
  },
}));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(mongoSanitize());
app.use(xssSanitizer);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

const isTest = process.env.NODE_ENV === 'test';

// General rate limiter — 200 req / 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 200,
  message: { message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Auth rate limiter — 10 req / min per IP (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10000 : 10,
  message: { message: 'Too many auth attempts, please try again later' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// Chat message rate limiter — 30 req / min per authenticated user
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10000 : 30,
  keyGenerator: (req) => req.userId || req.ip,
  message: { message: 'Too many messages, slow down' },
});
app.use('/api/chats/channels', chatLimiter);

// HTTP request logging with response-time
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`, { ip: req.ip });
  });
  next();
});

// health
app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] ?? 'unknown';
  let dbPing = null;
  try {
    const start = Date.now();
    await mongoose.connection.db?.command({ ping: 1 });
    dbPing = Date.now() - start;
  } catch (_) { /* db not ready */ }

  const healthy = dbState === 1;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    db: { status: dbStatus, pingMs: dbPing },
    memory: process.memoryUsage().rss,
  });
});

// routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/dms', dmRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/chats', chatsRoutes);

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found', path: req.path }));

// error handler
app.use(errorHandler);

export default app;
