import express from 'express';
import User from '../models/User.js';
import Exam from '../models/Exam.js';
import Application from '../models/Application.js';
import { normalizeDepartment } from '../utils/department.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users.map((user) => ({
      ...user.toObject(),
      department: normalizeDepartment(user.department),
    })));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Add a user
router.post('/', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      department: normalizeDepartment(req.body.department),
    };
    const user = new User(payload);
    await user.save();
    res.status(201).json({
      ...user.toObject(),
      department: normalizeDepartment(user.department),
    });
  } catch (error) {
    res.status(400).json({ message: 'Error adding user', error: error.message });
  }
});

// Update a user
router.put('/:id', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      department: req.body.department ? normalizeDepartment(req.body.department) : req.body.department,
    };
    const user = await User.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.json(user ? {
      ...user.toObject(),
      department: normalizeDepartment(user.department),
    } : user);
  } catch (error) {
    res.status(400).json({ message: 'Error updating user', error: error.message });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await User.findByIdAndDelete(req.params.id);

    if (user.role === 'student') {
      await Application.deleteMany({ studentId: user._id });
    } else if (user.role === 'staff') {
      const staffExams = await Exam.find({ createdBy: user._id });
      const staffExamIds = staffExams.map(e => e._id);
      await Exam.deleteMany({ createdBy: user._id });
      await Application.deleteMany({ examId: { $in: staffExamIds } });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// Change password
router.put('/:id/password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.password !== oldPassword) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
});

export default router;
