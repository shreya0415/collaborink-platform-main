import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'task_created',
        'task_updated',
        'task_completed',
        'task_moved',
        'comment_added',
        'file_uploaded',
        'meeting_created',
        'member_joined',
        'project_created',
        'project_updated',
        'project_deleted',
        'channel_created',
        'board_updated',
        'task_deleted',
        'comment_added',
      ],
      required: true,
    },
    action: String,
    resource: {
      type: String,
      enum: ['task', 'project', 'file', 'message', 'meeting', 'member', 'board'],
    },
    resourceId: mongoose.Schema.Types.ObjectId,
    relatedUser: mongoose.Schema.Types.ObjectId,
    details: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expireAfterSeconds: 2592000 }, // 30 days TTL
    },
  },
  { timestamps: true }
);

export default mongoose.model('Activity', activitySchema);