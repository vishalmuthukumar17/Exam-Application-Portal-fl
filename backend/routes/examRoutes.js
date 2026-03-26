import express from 'express';
import Exam from '../models/Exam.js';
import Application from '../models/Application.js';
import { normalizeDepartment } from '../utils/department.js';

const router = express.Router();

// Get all exams
router.get('/', async (req, res) => {
  try {
    const exams = await Exam.find().populate('createdBy', 'name email');
    res.json(exams.map((exam) => ({
      ...exam.toObject(),
      department: normalizeDepartment(exam.department),
    })));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exams', error: error.message });
  }
});
// Add an exam
router.post('/', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      department: normalizeDepartment(req.body.department),
    };
    console.log("Incoming Exam payload:", payload);
    const exam = new Exam(payload);
    await exam.save();
    console.log("Exam successfully saved:", exam);
    res.status(201).json({
      ...exam.toObject(),
      department: normalizeDepartment(exam.department),
    });
  } catch (error) {
    console.error("Exam validation error:", error);
    res.status(400).json({ message: 'Error adding exam', error: error.message });
  }
});

// Update an exam
router.put('/:id', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      department: req.body.department ? normalizeDepartment(req.body.department) : req.body.department,
    };
    const exam = await Exam.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.json(exam ? {
      ...exam.toObject(),
      department: normalizeDepartment(exam.department),
    } : exam);
  } catch (error) {
    res.status(400).json({ message: 'Error updating exam', error: error.message });
  }
});

// Delete an exam
router.delete('/:id', async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    // Cleanup applications dependent on this exam
    await Application.deleteMany({ examId: req.params.id });

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting exam', error: error.message });
  }
});

export default router;
