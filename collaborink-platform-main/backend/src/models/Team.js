import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    avatar: String,
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['lead', 'member', 'viewer'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    channels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }],
    permissions: {
      canCreateProject: { type: Boolean, default: true },
      canDeleteProject: { type: Boolean, default: false },
      canManageMembers: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Team', teamSchema);
