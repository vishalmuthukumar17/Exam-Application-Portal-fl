import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  examCode: { type: String, required: true },
  examName: { type: String, required: true },
  examDate: { type: String, required: true }, // Keeping as string for parity, can be Date
  deadline: { type: String, required: true },
  department: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
