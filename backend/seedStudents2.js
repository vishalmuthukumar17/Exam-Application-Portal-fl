import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const students = [
  { name: 'Venkatesh Ramani', email: 'venkatesh.ramani@student.com', department: 'Computer Science', rollNumber: 'CS2025012' },
  { name: 'Thangamani Selvi', email: 'thangamani.selvi@student.com', department: 'Electronics', rollNumber: 'EC2025011' },
  { name: 'Prabhu Deva', email: 'prabhu.deva@student.com', department: 'Mechanical Engineering', rollNumber: 'ME2025011' },
  { name: 'Ezhilarasi Mani', email: 'ezhilarasi.mani@student.com', department: 'Information Technology', rollNumber: 'IT2025011' },
  { name: 'Shanmugam Pillai', email: 'shanmugam.pillai@student.com', department: 'Civil Engineering', rollNumber: 'CE2025010' },
  { name: 'Valarmathi Pandian', email: 'valarmathi.pandian@student.com', department: 'Computer Science', rollNumber: 'CS2025013' },
  { name: 'Chellamuthu Raja', email: 'chellamuthu.raja@student.com', department: 'Electronics', rollNumber: 'EC2025012' },
  { name: 'Suganya Devi', email: 'suganya.devi@student.com', department: 'Mechanical Engineering', rollNumber: 'ME2025012' },
  { name: 'Palani Vel', email: 'palani.vel@student.com', department: 'Information Technology', rollNumber: 'IT2025012' },
  { name: 'Rajalakshmi Nadar', email: 'rajalakshmi.nadar@student.com', department: 'Civil Engineering', rollNumber: 'CE2025011' },
  { name: 'Karthikeyan Sundar', email: 'karthikeyan.sundar@student.com', department: 'Computer Science', rollNumber: 'CS2025014' },
  { name: 'Ponni Thilagam', email: 'ponni.thilagam@student.com', department: 'Electronics', rollNumber: 'EC2025013' },
  { name: 'Muthukumar Velan', email: 'muthukumar.velan@student.com', department: 'Mechanical Engineering', rollNumber: 'ME2025013' },
  { name: 'Chithra Lekha', email: 'chithra.lekha@student.com', department: 'Information Technology', rollNumber: 'IT2025013' },
  { name: 'Sundaresan Gopal', email: 'sundaresan.gopal@student.com', department: 'Civil Engineering', rollNumber: 'CE2025012' },
  { name: 'Amudha Valli', email: 'amudha.valli@student.com', department: 'Computer Science', rollNumber: 'CS2025015' },
  { name: 'Thirunavukkarasu Raman', email: 'thirunavukkarasu.r@student.com', department: 'Electronics', rollNumber: 'EC2025014' },
  { name: 'Vaanathi Murugan', email: 'vaanathi.murugan@student.com', department: 'Mechanical Engineering', rollNumber: 'ME2025014' },
  { name: 'Periyasamy Thevar', email: 'periyasamy.thevar@student.com', department: 'Information Technology', rollNumber: 'IT2025014' },
  { name: 'Ranjitha Kumari', email: 'ranjitha.kumari@student.com', department: 'Civil Engineering', rollNumber: 'CE2025013' },
  { name: 'Aravind Swamy', email: 'aravind.swamy@student.com', department: 'Computer Science', rollNumber: 'CS2025016' },
  { name: 'Malathi Ranganathan', email: 'malathi.ranganathan@student.com', department: 'Electronics', rollNumber: 'EC2025015' },
  { name: 'Govindaraj Naicker', email: 'govindaraj.naicker@student.com', department: 'Mechanical Engineering', rollNumber: 'ME2025015' },
  { name: 'Sivakami Sundari', email: 'sivakami.sundari@student.com', department: 'Information Technology', rollNumber: 'IT2025015' },
  { name: 'Dhanush Kumar', email: 'dhanush.kumar@student.com', department: 'Civil Engineering', rollNumber: 'CE2025014' },
  { name: 'Meenakshi Amman', email: 'meenakshi.amman@student.com', department: 'Computer Science', rollNumber: 'CS2025017' },
  { name: 'Yuvaraj Pandian', email: 'yuvaraj.pandian@student.com', department: 'Electronics', rollNumber: 'EC2025016' },
  { name: 'Thamarai Selvi', email: 'thamarai.selvi@student.com', department: 'Mechanical Engineering', rollNumber: 'ME2025016' },
  { name: 'Nagesh Waran', email: 'nagesh.waran@student.com', department: 'Information Technology', rollNumber: 'IT2025016' },
  { name: 'Anjali Devi', email: 'anjali.devi@student.com', department: 'Civil Engineering', rollNumber: 'CE2025015' },
];

async function seedMoreStudents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const docs = students.map(s => ({
      ...s,
      password: '123',
      role: 'student',
      isActive: true,
    }));

    const result = await User.insertMany(docs, { ordered: false });
    console.log(`✅ Inserted ${result.length} more students!`);

    const total = await User.countDocuments({ role: 'student' });
    console.log(`📊 Total students now: ${total}`);
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  Some duplicates skipped.');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seedMoreStudents();
