/**
 * Migration 001 — Ensure task indexes exist.
 * Safe to run multiple times (ensureIndex is idempotent).
 *
 * Run: node scripts/migrations/001_add_task_indexes.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/collaborink';

async function run() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  await db.collection('tasks').createIndex({ project: 1, column: 1, position: 1 });
  await db.collection('messages').createIndex({ channel: 1, createdAt: -1 });
  await db.collection('messages').createIndex({ directMessage: 1, createdAt: -1 });
  await db.collection('comments').createIndex({ task: 1, createdAt: 1 });
  await db.collection('notifications').createIndex({ recipient: 1, isRead: 1, createdAt: -1 });

  console.log('Migration 001: indexes ensured.');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
