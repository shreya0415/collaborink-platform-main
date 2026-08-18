import mongoose from 'mongoose';
import crypto from 'crypto';

function generateInviteCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    avatar: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
      default: generateInviteCode,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['owner', 'admin', 'member', 'guest'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    settings: {
      isPrivate: { type: Boolean, default: false },
      allowPublicJoin: { type: Boolean, default: false },
      inviteOnly: { type: Boolean, default: true },
    },
    storage: { used: { type: Number, default: 0 }, limit: { type: Number, default: 100 * 1024 * 1024 * 1024 } },
    activityLog: [
      {
        action: String,
        userId: mongoose.Schema.Types.ObjectId,
        timestamp: { type: Date, default: Date.now },
        details: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Workspace', workspaceSchema);
