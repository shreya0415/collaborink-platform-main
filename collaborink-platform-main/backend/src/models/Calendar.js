import mongoose from 'mongoose';

const calendarSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      default: 'My Calendar',
    },
    color: {
      type: String,
      default: '#3B82F6',
    },
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],
    isShared: { type: Boolean, default: false },
    sharedWith: [
      {
        user: mongoose.Schema.Types.ObjectId,
        permission: {
          type: String,
          enum: ['view', 'edit', 'admin'],
          default: 'view',
        },
      },
    ],
    isDefault: { type: Boolean, default: false },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Calendar', calendarSchema);