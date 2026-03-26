import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ExamAppDB')
.then(async () => {
  console.log('Connected to MongoDB for seeding');
  
  // Create admin user if it doesn't exist
  const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
  if (!existingAdmin) {
    await User.create({
      name: 'Admin System',
      email: 'admin@gmail.com',
      password: '123',
      role: 'admin',
      department: 'Administration',
    });
    console.log('Admin user seeded.');
  } else {
    console.log('Admin user already exists.');
  }
  
  // Create staff user
  const existingStaff = await User.findOne({ email: 'staff@gmail.com' });
  if (!existingStaff) {
    await User.create({
      name: 'Staff Member',
      email: 'staff@gmail.com',
      password: '123',
      role: 'staff',
      department: 'Computer Science',
    });
    console.log('Staff user seeded.');
  }
  
  // Create student user
  const existingStudent = await User.findOne({ email: 'student@gmail.com' });
  if (!existingStudent) {
    await User.create({
      name: 'Student Member',
      email: 'student@gmail.com',
      password: '123',
      role: 'student',
      department: 'Computer Science',
      rollNumber: 'CS2023001',
    });
    console.log('Student user seeded.');
  }

  mongoose.disconnect();
})
.catch((err) => console.log('SEED ERROR:', err.message || err.toString()));
