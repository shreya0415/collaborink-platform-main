import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    calendar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Calendar',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    allDay: { type: Boolean, default: false },
    location: String,
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attendees: [
      {
        user: mongoose.Schema.Types.ObjectId,
        status: {
          type: String,
          enum: ['pending', 'accepted', 'declined', 'tentative'],
          default: 'pending',
        },
        responseTime: Date,
      },
    ],
    type: {
      type: String,
      enum: ['meeting', 'task', 'reminder', 'birthday'],
      default: 'meeting',
    },
    recurrence: {
      type: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
      },
      endDate: Date,
      pattern: String,
    },
    reminders: [
      {
        type: String,
        enum: ['15min', '30min', '1hour', '1day', 'custom'],
        customMinutes: Number,
      },
    ],
    videoCall: {
      enabled: { type: Boolean, default: false },
      provider: {
        type: String,
        enum: ['zoom', 'google-meet', 'teams'],
      },
      link: String,
      accessCode: String,
    },
    attachments: [
      {
        url: String,
        filename: String,
      },
    ],
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    color: String,
    tags: [String],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Event', eventSchema);