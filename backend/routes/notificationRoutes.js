import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('userId', 'name email department')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    ).populate('userId', 'name email department');
    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: 'Error updating notification', error: error.message });
  }
});

export default router;
