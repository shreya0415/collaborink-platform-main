import express from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import Workspace from '../models/Workspace.js';
import Team from '../models/Team.js';
import Invite from '../models/Invite.js';
import User from '../models/User.js';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';

const router = express.Router();

router.use(authMiddleware);

// Create workspace
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
  ],
  async (req, res) => {
    try {
      const workspace = new Workspace({
        name: req.body.name,
        description: req.body.description,
        owner: req.userId,
        members: [{ user: req.userId, role: 'owner' }],
      });

      await workspace.save();
      await workspace.populate('owner members.user');

      // Add to user's workspaces
      await User.findByIdAndUpdate(req.userId, {
        $push: { workspaces: workspace._id },
      });

      res.status(201).json(workspace);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get workspace
router.get('/:workspaceId', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId)
      .populate('owner')
      .populate('members.user')
      .populate('teams')
      .populate('projects');

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user workspaces
router.get('/', async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { owner: req.userId },
        { 'members.user': req.userId },
      ],
    })
      .populate('owner')
      .populate('members.user');

    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update workspace
router.put('/:workspaceId', async (req, res) => {
  try {
    const workspace = await Workspace.findByIdAndUpdate(
      req.params.workspaceId,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Invite member to workspace
router.post(
  '/:workspaceId/invites',
  [
    body('email').isEmail(),
    body('role').optional().isIn(['member', 'admin']),
  ],
  async (req, res) => {
    try {
      const { email, role = 'member', message } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invite = new Invite({
        workspace: req.params.workspaceId,
        invitedEmail: email,
        invitedBy: req.userId,
        invitedUser: existingUser?._id,
        role,
        token,
        expiresAt,
        message,
      });

      await invite.save();

      // Send invite email (implement with SendGrid)
      // await sendInviteEmail(email, invite.token);

      res.status(201).json(invite);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Accept workspace invite
router.post('/:workspaceId/invites/:token/accept', async (req, res) => {
  try {
    const invite = await Invite.findOne({
      workspace: req.params.workspaceId,
      token: req.params.token,
      status: 'pending',
    });

    if (!invite) {
      return res.status(404).json({ message: 'Invite not found or expired' });
    }

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ message: 'Invite has expired' });
    }

    // Add user to workspace
    await Workspace.findByIdAndUpdate(
      req.params.workspaceId,
      {
        $push: {
          members: { user: req.userId, role: invite.role },
        },
      }
    );

    // Add workspace to user
    await User.findByIdAndUpdate(req.userId, {
      $push: { workspaces: req.params.workspaceId },
    });

    // Update invite
    invite.status = 'accepted';
    invite.acceptedAt = new Date();
    invite.invitedUser = req.userId;
    await invite.save();

    res.json({ message: 'Invite accepted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get workspace invites
router.get('/:workspaceId/invites', async (req, res) => {
  try {
    const invites = await Invite.find({ workspace: req.params.workspaceId })
      .populate('invitedBy')
      .populate('invitedUser');

    res.json(invites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Join workspace via invite code
router.post('/:workspaceId/join', async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ message: 'inviteCode is required' });

    const workspace = await Workspace.findOne({
      $or: [
        { _id: req.params.workspaceId, inviteCode: inviteCode.toUpperCase() },
        { inviteCode: inviteCode.toUpperCase() },
      ],
    });
    if (!workspace) return res.status(404).json({ message: 'Invalid invite code' });

    const isMember = workspace.members.some(m => m.user.toString() === req.userId);
    if (isMember) return res.status(400).json({ message: 'Already a member' });

    workspace.members.push({ user: req.userId, role: 'member' });
    await workspace.save();

    await User.findByIdAndUpdate(req.userId, { $addToSet: { workspaces: workspace._id } });

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove member from workspace
router.delete(
  '/:workspaceId/members/:memberId',
  async (req, res) => {
    try {
      await Workspace.findByIdAndUpdate(
        req.params.workspaceId,
        { $pull: { members: { user: req.params.memberId } } }
      );

      await User.findByIdAndUpdate(req.params.memberId, {
        $pull: { workspaces: req.params.workspaceId },
      });

      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Workspace stats
router.get('/:workspaceId/stats', async (req, res) => {
  try {
    const Project = (await import('../models/Project.js')).default;
    const Task = (await import('../models/Task.js')).default;
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const projects = await Project.find({ workspace: req.params.workspaceId, archived: { $ne: true } });
    const projectIds = projects.map(p => p._id);
    const [totalTasks, completedTasks] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'done' }),
    ]);

    res.json({
      totalProjects: projects.length,
      totalMembers: workspace.members.length,
      totalTasks,
      completedTasks,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Workspace recent activity
router.get('/:workspaceId/activity', async (req, res) => {
  try {
    const Activity = (await import('../models/Activity.js')).default;
    const activities = await Activity.find({ workspace: req.params.workspaceId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('user', 'firstName lastName avatar');
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;