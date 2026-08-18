import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    avatar: { type: String, default: null },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['online', 'offline', 'away'], default: 'offline' },
    bio: String,
    phone: String,
    timezone: { type: String, default: 'UTC' },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      twoFactorEnabled: { type: Boolean, default: false },
      darkMode: { type: Boolean, default: true },
      language: { type: String, default: 'en' }
    },
    workspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }],
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    lastLogin: Date
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
