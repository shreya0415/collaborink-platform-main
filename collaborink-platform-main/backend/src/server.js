// backend/src/server.js
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB, connectRedis } from './config/database.js';
import logger from './middleware/logger.js';
import Channel from './models/Channel.js';
import DirectMessage from './models/DirectMessage.js';

const PORT = process.env.PORT || 3000;

// Keep a map of userId -> socketId (optional, for presence/DMs)
const activeUsers = new Map();

async function startServer() {
  try {
    // Connect databases
    await connectDB();
    // connectRedis returns a client or throws; we'll attempt but not fail if Redis unavailable
    try {
      await connectRedis();
    } catch (err) {
      logger.warn('Redis connection failed (continuing without redis):', err?.message || err);
    }

    const server = http.createServer(app);

    // Create Socket.IO server
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Make io available to route handlers/controllers via req.app.get('io')
    app.set('io', io);

    io.on('connection', (socket) => {
      logger.info(`Socket connected ${socket.id}`);

      // Optional: receive authenticated userId from client after connect
      socket.on('user:online', (data) => {
        try {
          const userId = typeof data === 'string' ? data : data?.userId;
          if (userId) {
            activeUsers.set(userId, socket.id);
            socket.data.userId = userId;
            if (data?.userName) socket.data.userName = data.userName;
            // Join per-user room for targeted notifications
            socket.join(`user:${userId}`);
            io.emit('user:status-update', { userId, status: 'online' });
            logger.info(`User online: ${userId}`);
          }
        } catch (err) {
          logger.error('user:online handler error', err);
        }
      });

      // Join a room (frontend should send a room name like `project:<projectId>`)
      socket.on('room:join', (roomId) => {
        try {
          if (!roomId) return;
          socket.join(roomId);
          logger.info(`Socket ${socket.id} joined room ${roomId}`);
        } catch (err) {
          logger.error('room:join handler error', err);
        }
      });

      // Join per-channel chat room
      socket.on('chat:join', async ({ channelId }) => {
        try {
          if (!channelId) return;
          socket.join(`channel:${channelId}`);

          // Also join the project room if channel has a project
          const channel = await Channel.findById(channelId).select('project').lean();
          if (channel?.project) {
            socket.join(`project:${channel.project}`);
          }

          const userId = socket.data?.userId;
          if (userId) {
            socket.to(`channel:${channelId}`).emit('user:joined', {
              channelId,
              userId,
              userName: socket.data.userName || userId,
            });
          }

          logger.info(`Socket ${socket.id} joined channel:${channelId}`);
        } catch (err) {
          logger.error('chat:join error', err);
        }
      });

      socket.on('chat:leave', ({ channelId }) => {
        try {
          if (!channelId) return;
          socket.leave(`channel:${channelId}`);
          const userId = socket.data?.userId;
          if (userId) {
            socket.to(`channel:${channelId}`).emit('user:left', { channelId, userId });
          }
        } catch (err) {
          logger.error('chat:leave error', err);
        }
      });

      // Chat typing indicator forwarded to channel room
      socket.on('chat:typing', (data) => {
        try {
          if (!data?.channelId) return;
          socket.to(`channel:${data.channelId}`).emit('typing', {
            userId: socket.data?.userId,
            userName: data.userName || socket.data?.userId,
            channelId: data.channelId,
            isTyping: Boolean(data.isTyping),
          });
        } catch (err) {
          logger.error('chat:typing error', err);
        }
      });

      // DM room — validate participant before joining
      socket.on('dm:join', async ({ threadId }) => {
        try {
          if (!threadId) return;
          const userId = socket.data?.userId;

          if (userId) {
            const thread = await DirectMessage.findById(threadId).select('participants').lean();
            if (!thread) return;
            const isParticipant = thread.participants.some(p => p.toString() === userId);
            if (!isParticipant) return;
          }

          socket.join(`dm:${threadId}`);
          const userId2 = socket.data?.userId;
          if (userId2) {
            socket.to(`dm:${threadId}`).emit('dm:opened', { threadId, userId: userId2 });
          }
        } catch (err) {
          logger.error('dm:join error', err);
        }
      });

      socket.on('dm:leave', ({ threadId }) => {
        try {
          if (!threadId) return;
          socket.leave(`dm:${threadId}`);
        } catch (err) {
          logger.error('dm:leave error', err);
        }
      });

      socket.on('dm:typing', (data) => {
        try {
          if (!data?.threadId) return;
          socket.to(`dm:${data.threadId}`).emit('typing', {
            userId: socket.data?.userId,
            threadId: data.threadId,
            isTyping: Boolean(data.isTyping),
          });
        } catch (err) {
          logger.error('dm:typing error', err);
        }
      });

      // Leave a room
      socket.on('room:leave', (roomId) => {
        try {
          if (!roomId) return;
          socket.leave(roomId);
          logger.info(`Socket ${socket.id} left room ${roomId}`);
        } catch (err) {
          logger.error('room:leave handler error', err);
        }
      });

      // Board re-ordering emitted by client -> broadcast updated board to room
      socket.on('board:reorder', (data) => {
        try {
          // data: { room: 'project:<id>', board: { ... } }
          if (!data?.room) return;
          io.to(data.room).emit('board:updated', data.board);
        } catch (err) {
          logger.error('board:reorder handler error', err);
        }
      });

      // Task moved between columns
      socket.on('task:moved', (data) => {
        try {
          // data: { room: 'project:<id>', taskId, fromColumnId, toColumnId, position, userId }
          if (!data?.room) return;
          io.to(data.room).emit('task:moved', data);
        } catch (err) {
          logger.error('task:moved handler error', err);
        }
      });

      // Typing indicator for tasks/comments
      socket.on('task:typing', (data) => {
        try {
          // data: { room: 'project:<id>', taskId, userId, typing: true/false }
          if (!data?.room) return;
          socket.to(data.room).emit('task:typing', data);
        } catch (err) {
          logger.error('task:typing handler error', err);
        }
      });

      // Chat message send (channels / DMs)
      socket.on('message:send', (data) => {
        try {
          // data: { room: 'project:<id>' || 'dm:<id>', message: {...} }
          if (!data?.room || !data?.message) return;
          // persist message in DB in controller/API route if required; here we just forward
          io.to(data.room).emit('message:received', data.message);
        } catch (err) {
          logger.error('message:send handler error', err);
        }
      });

      // Handle disconnect: update presence map and broadcast
      socket.on('disconnect', (reason) => {
        try {
          const userId = socket.data?.userId;
          if (userId && activeUsers.get(userId) === socket.id) {
            activeUsers.delete(userId);
            io.emit('user:status-update', { userId, status: 'offline' });
            logger.info(`User ${userId} went offline`);
          }
          logger.info(`Socket disconnected ${socket.id} (${reason})`);
        } catch (err) {
          logger.error('disconnect handler error', err);
        }
      });

      // Socket error catch
      socket.on('error', (err) => {
        logger.error('Socket error:', err);
      });
    });

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`✅ Server running on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      // Force exit after 10s
      setTimeout(() => {
        logger.warn('Forcing server shutdown');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.error('Failed to start server', err);
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

startServer();