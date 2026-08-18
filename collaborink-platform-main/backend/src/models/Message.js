import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
    },
    directMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DirectMessage',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'code', 'system'],
      default: 'text',
    },
    attachments: [
      {
        url: String,
        filename: String,
        fileType: String,
        size: Number,
      },
    ],
    reactions: [
      {
        emoji: String,
        users: [mongoose.Schema.Types.ObjectId],
        count: Number,
      },
    ],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    thread: {
      parentMessage: mongoose.Schema.Types.ObjectId,
      replies: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Message',
        },
      ],
      replyCount: { type: Number, default: 0 },
    },
    edited: {
      isEdited: { type: Boolean, default: false },
      editedAt: Date,
      editHistory: [
        {
          content: String,
          editedAt: Date,
        },
      ],
    },
    isPinned: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: mongoose.Schema.Types.ObjectId,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ directMessage: 1, createdAt: -1 });
messageSchema.index({ author: 1 });

export default mongoose.model('Message', messageSchema);