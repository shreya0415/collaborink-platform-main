import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: String,
    fileType: {
      type: String,
      required: true,
    },
    size: Number,
    mimeType: String,
    url: {
      type: String,
      required: true,
    },
    thumbnailUrl: String,
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
    },
    versions: [
      {
        versionNumber: Number,
        url: String,
        uploadedBy: mongoose.Schema.Types.ObjectId,
        uploadedAt: { type: Date, default: Date.now },
        changeLog: String,
      },
    ],
    accessControl: [
      {
        user: mongoose.Schema.Types.ObjectId,
        permission: {
          type: String,
          enum: ['view', 'comment', 'edit', 'manage'],
          default: 'view',
        },
      },
    ],
    isPublic: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    tags: [String],
    starred: [mongoose.Schema.Types.ObjectId], // Users who starred
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('File', fileSchema);