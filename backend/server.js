import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import examRoutes from './routes/examRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import seatingArrangementRoutes from './routes/seatingArrangementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/seating-arrangements', seatingArrangementRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mssg: 'API is running' });
});

// Database connection
// Primary database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ExamAppDB')
  .then(() => {
    console.log('Connected to primary MongoDB');
  })
  .catch((error) => {
    console.error('Primary MongoDB connection error:', error);
  });

// Secondary database connection
const secondaryConn = mongoose.createConnection(
  process.env.SECOND_MONGODB_URI || 'mongodb://localhost:27017/ExamAppDB2',
  { useNewUrlParser: true, useUnifiedTopology: true }
);
secondaryConn.on('connected', () => {
  console.log('Connected to secondary MongoDB');
});
secondaryConn.on('error', (err) => {
  console.error('Secondary MongoDB connection error:', err);
});

// Start server after primary connection
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
