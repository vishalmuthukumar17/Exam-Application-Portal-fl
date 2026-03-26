import express from 'express';
import SeatingArrangement from '../models/SeatingArrangement.js';
import { normalizeDepartment } from '../utils/department.js';
import Notification from '../models/Notification.js';

const router = express.Router();

const buildSeatNotifications = (arrangement, type = 'seating_arrangement') => {
  const notifications = [];

  for (const hall of arrangement.halls || []) {
    for (const assignment of hall.assignments || []) {
      notifications.push({
        userId: assignment.studentId,
        type,
        title: type === 'hall_ticket'
          ? `Hall Ticket Ready: ${assignment.examCode || 'Exam'}`
          : `Seating Assigned: ${assignment.examCode || 'Exam'}`,
        message: `${assignment.examName || 'Exam'} is scheduled on ${arrangement.arrangementDate || ''}. Your seat is ${assignment.seatNumber} in ${hall.hallName}.`,
        isRead: false,
        meta: {
          arrangementId: arrangement._id?.toString?.() || arrangement.id || '',
          examCode: assignment.examCode || '',
          examName: assignment.examName || '',
          arrangementDate: arrangement.arrangementDate || '',
          hallName: hall.hallName,
          seatNumber: assignment.seatNumber,
          scopeKey: arrangement.scopeKey,
        },
      });
    }
  }

  return notifications;
};

router.get('/', async (req, res) => {
  try {
    const arrangements = await SeatingArrangement.find()
      .populate('examId', 'examCode examName examDate department')
      .populate('examIds', 'examCode examName examDate department')
      .populate('generatedBy', 'name email department')
      .sort({ updatedAt: -1 });

    res.json(arrangements.map((arrangement) => ({
      ...arrangement.toObject(),
      halls: (arrangement.halls || []).map((hall) => ({
        ...hall,
        assignments: (hall.assignments || []).map((assignment) => ({
          ...assignment,
          department: normalizeDepartment(assignment.department),
        })),
      })),
    })));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching seating arrangements', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      examId: req.body.examId || null,
      halls: (req.body.halls || []).map((hall) => ({
        ...hall,
        assignments: (hall.assignments || []).map((assignment) => ({
          ...assignment,
          department: normalizeDepartment(assignment.department),
        })),
      })),
    };

    const arrangement = await SeatingArrangement.findOneAndUpdate(
      { scopeKey: payload.scopeKey },
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate('examId', 'examCode examName examDate department')
      .populate('examIds', 'examCode examName examDate department')
      .populate('generatedBy', 'name email department');

    const notifications = buildSeatNotifications(arrangement, 'seating_arrangement');

    await Notification.deleteMany({
      type: 'seating_arrangement',
      'meta.scopeKey': arrangement.scopeKey,
    });
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json(arrangement);
  } catch (error) {
    res.status(400).json({ message: 'Error saving seating arrangement', error: error.message });
  }
});

router.post('/:id/send-hall-tickets', async (req, res) => {
  try {
    const arrangement = await SeatingArrangement.findById(req.params.id)
      .populate('examId', 'examCode examName examDate department')
      .populate('examIds', 'examCode examName examDate department')
      .populate('generatedBy', 'name email department');

    if (!arrangement) {
      return res.status(404).json({ message: 'Seating arrangement not found' });
    }

    const notifications = buildSeatNotifications(arrangement, 'hall_ticket');

    await Notification.deleteMany({
      type: 'hall_ticket',
      'meta.arrangementId': arrangement._id.toString(),
    });

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return res.json({
      message: 'Hall tickets sent successfully',
      count: notifications.length,
      arrangementId: arrangement._id.toString(),
    });
  } catch (error) {
    return res.status(400).json({ message: 'Error sending hall tickets', error: error.message });
  }
});

export default router;
