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

export default router;
