import express from 'express';
import User from '../models/User.js';
import { normalizeDepartment } from '../utils/department.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (user) {
      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated. Please contact admin.' });
      }
      res.json({
        message: 'Login successful',
        user: {
          ...user.toObject(),
          department: normalizeDepartment(user.department),
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

router.get('/session/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ valid: false, message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ valid: false, message: 'Account is deactivated. Please contact admin.' });
    }

    return res.json({
      valid: true,
      user: {
        ...user.toObject(),
        department: normalizeDepartment(user.department),
      }
    });
  } catch (error) {
    return res.status(500).json({ valid: false, message: 'Error validating session', error: error.message });
  }
});

export default router;
