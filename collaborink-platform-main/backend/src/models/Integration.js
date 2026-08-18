import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    name: {
      type: String,
      enum: ['github', 'slack', 'google-workspace', 'zapier', 'stripe', 'jira'],
      required: true,
    },
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'error'],
      default: 'disconnected',
    },
    credentials: {
      accessToken: String,
      refreshToken: String,
      tokenExpiry: Date,
      apiKey: String,
    },
    settings: mongoose.Schema.Types.Mixed,
    connectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    connectedAt: Date,
    lastSyncAt: Date,
    syncStatus: {
      type: String,
      enum: ['idle', 'syncing', 'error'],
      default: 'idle',
    },
    webhookUrl: String,
    webhookSecret: String,
    events: [String],
    errorLog: [
      {
        error: String,
        timestamp: Date,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Integration', integrationSchema);