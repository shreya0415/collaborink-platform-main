import express from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import Calendar from '../models/Calendar.js';
import Event from '../models/Event.js';
import Notification from '../models/Notification.js';

const router = express.Router();

router.use(authMiddleware);

// Create calendar
router.post(
  '/',
  [
    body('workspace').notEmpty(),
    body('name').notEmpty().trim(),
    body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  ],
  async (req, res) => {
    try {
      const calendar = new Calendar({
        workspace: req.body.workspace,
        owner: req.userId,
        name: req.body.name,
        color: req.body.color,
      });

      await calendar.save();

      res.status(201).json(calendar);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get user calendars
router.get('/', async (req, res) => {
  try {
    const calendars = await Calendar.find({
      $or: [
        { owner: req.userId },
        { 'sharedWith.user': req.userId },
      ],
    }).populate('owner events');

    res.json(calendars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create event
router.post(
  '/events',
  [
    body('calendar').notEmpty(),
    body('title').notEmpty().trim(),
    body('startTime').notEmpty().isISO8601(),
    body('endTime').notEmpty().isISO8601(),
  ],
  async (req, res) => {
    try {
      const event = new Event({
        calendar: req.body.calendar,
        title: req.body.title,
        description: req.body.description,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        allDay: req.body.allDay || false,
        location: req.body.location,
        organizer: req.userId,
        type: req.body.type || 'meeting',
        attendees: req.body.attendees || [],
        recurrence: req.body.recurrence,
        reminders: req.body.reminders,
        videoCall: req.body.videoCall,
      });

      await event.save();

      // Add to calendar
      await Calendar.findByIdAndUpdate(req.body.calendar, {
        $push: { events: event._id },
      });

      // Send notifications to attendees
      if (event.attendees && event.attendees.length > 0) {
        await Notification.insertMany(
          event.attendees.map(attendee => ({
            recipient: attendee.user,
            sender: req.userId,
            type: 'meeting_invite',
            title: 'Meeting Invitation',
            message: `You have been invited to "${event.title}"`,
            resourceId: event._id,
            resourceType: 'event',
          }))
        );
      }

      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get calendar events
router.get('/:calendarId/events', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { calendar: req.params.calendarId };

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const events = await Event.find(query)
      .populate('organizer')
      .populate('attendees.user')
      .sort({ startTime: 1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update event
router.put('/:eventId', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.eventId,
      req.body,
      { new: true }
    ).populate('organizer attendees.user');

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Respond to event invitation
router.post(
  '/events/:eventId/respond',
  [body('response').isIn(['accepted', 'declined', 'tentative'])],
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.eventId);

      const attendee = event.attendees.find(
        a => a.user.toString() === req.userId
      );

      if (!attendee) {
        return res.status(404).json({ message: 'Attendee not found' });
      }

      attendee.status = req.body.response;
      attendee.responseTime = new Date();

      await event.save();

      res.json(event);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete event
router.delete('/:eventId', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.eventId,
      { status: 'cancelled' },
      { new: true }
    );

    res.json({ message: 'Event cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;