import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        user: mongoose.Schema.Types.ObjectId,
        joinedAt: Date,
        leftAt: Date,
        duration: Number,
      },
    ],
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    recordingUrl: String,
    transcript: String,
    summary: String,
    aiGenerated: { type: Boolean, default: false },
    actionItems: [
      {
        description: String,
        assignee: mongoose.Schema.Types.ObjectId,
        dueDate: Date,
        completed: { type: Boolean, default: false },
      },
    ],
    notes: String,
    attachments: [
      {
        url: String,
        filename: String,
      },
    ],
    startTime: Date,
    endTime: Date,
    duration: Number,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Meeting', meetingSchema);