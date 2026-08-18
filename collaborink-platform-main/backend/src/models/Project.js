import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    avatar: String,
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['owner', 'lead', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['planning', 'active', 'on-hold', 'completed'],
      default: 'planning',
    },
    visibility: {
      type: String,
      enum: ['private', 'team', 'public'],
      default: 'team',
    },
    startDate: Date,
    endDate: Date,
    budget: Number,
    currency: {
      type: String,
      default: 'USD',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    boardView: {
      type: String,
      enum: ['kanban', 'list', 'timeline', 'calendar'],
      default: 'kanban',
    },
    customFields: [
      {
        name: String,
        type: String,
        values: [String],
      },
    ],
    settings: {
      allowComments: { type: Boolean, default: true },
      allowAttachments: { type: Boolean, default: true },
      autoArchiveAfterDays: Number,
    },
    tags: [String],
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
    },
    archived: {
      type: Boolean,
      default: false,
    },
    activityLog: [
      {
        action: String,
        userId: mongoose.Schema.Types.ObjectId,
        timestamp: { type: Date, default: Date.now },
        details: mongoose.Schema.Types.Mixed,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);