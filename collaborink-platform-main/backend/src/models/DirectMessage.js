import mongoose from 'mongoose';

const directMessageSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
    lastMessage: {
      content: String,
      author: mongoose.Schema.Types.ObjectId,
      timestamp: Date,
    },
    isArchived: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        archivedAt: Date,
      },
    ],
    isMuted: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        mutedAt: Date,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('DirectMessage', directMessageSchema);