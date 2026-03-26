import mongoose from 'mongoose';

const seatingAssignmentSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  rollNumber: { type: String, default: '' },
  department: { type: String, required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  examCode: { type: String, default: '' },
  examName: { type: String, default: '' },
  seatNumber: { type: String, required: true },
  rowNumber: { type: Number, required: true },
  columnNumber: { type: Number, required: true },
}, { _id: false });

const seatingHallSchema = new mongoose.Schema({
  hallName: { type: String, required: true },
  rows: { type: Number, required: true },
  columns: { type: Number, required: true },
  capacity: { type: Number, required: true },
  assignments: [seatingAssignmentSchema],
}, { _id: false });

const seatingArrangementSchema = new mongoose.Schema({
  scopeKey: { type: String, required: true, unique: true },
  title: { type: String, default: '' },
  arrangementDate: { type: String, default: '' },
  examIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }],
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', default: null },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalStudents: { type: Number, required: true },
  totalAssigned: { type: Number, required: true },
  unassignedCount: { type: Number, required: true },
  halls: [seatingHallSchema],
}, { timestamps: true });

const SeatingArrangement = mongoose.model('SeatingArrangement', seatingArrangementSchema);
export default SeatingArrangement;
