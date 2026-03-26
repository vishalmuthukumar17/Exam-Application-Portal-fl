import express from 'express';
import Application from '../models/Application.js';

const router = express.Router();

// Get all applications
router.get('/', async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('studentId', 'name email rollNumber department')
      .populate('examId', 'examCode examName department')
      .populate('reviewedBy', 'name');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
});

// Add an application
router.post('/', async (req, res) => {
  try {
    const application = new Application(req.body);
    await application.save();
    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ message: 'Error adding application', error: error.message });
  }
});

// Update an application
router.put('/:id', async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(application);
  } catch (error) {
    res.status(400).json({ message: 'Error updating application', error: error.message });
  }
});

// Delete an application
router.delete('/:id', async (req, res) => {
  try {
    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting application', error: error.message });
  }
});

export default router;
