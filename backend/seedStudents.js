import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const students = [
  { name: 'Arun Kumar', email: 'arun.kumar@student.com', department: 'Computer Science', rollNumber: 'CS2025001' },
  { name: 'Karthik Raj', email: 'karthik.raj@student.com', department: 'Mechanical Engineering', rollNumber: 'ME2025001' },
  { name: 'Priya Dharshini', email: 'priya.dharshini@student.com', department: 'Electronics', rollNumber: 'EC2025001' },
  { name: 'Surya Prakash', email: 'surya.prakash@student.com', department: 'Computer Science', rollNumber: 'CS2025002' },
  { name: 'Divya Lakshmi', email: 'divya.lakshmi@student.com', department: 'Information Technology', rollNumber: 'IT2025001' },
  { name: 'Murugan Selvan', email: 'murugan.selvan@student.com', department: 'Civil Engineering', rollNumber: 'CE2025001' },
  { name: 'Kavitha Ravi', email: 'kavitha.ravi@student.com', department: 'Electronics', rollNumber: 'EC2025002' },
  { name: 'Senthil Nathan', email: 'senthil.nathan@student.com', department: 'Mechanical Engineering', rollNumber: 'ME2025002' },
  { name: 'Meena Kumari', email: 'meena.kumari@student.com', department: 'Computer Science', rollNumber: 'CS2025003' },
  { name: 'Rajesh Kannan', email: 'rajesh.kannan@student.com', department: 'Information Technology', rollNumber: 'IT2025002' },
  { name: 'Sangeetha Devi', email: 'sangeetha.devi@student.com', department: 'Civil Engineering', rollNumber: 'CE2025002' },
  { name: 'Vignesh Waran', email: 'vignesh.waran@student.com', department: 'Computer Science', rollNumber: 'CS2025004' },
  { name: 'Anitha Selvi', email: 'anitha.selvi@student.com', department: 'Electronics', rollNumber: 'EC2025003' },
  { name: 'Manikandan Pillai', email: 'manikandan.pillai@student.com', department: 'Mechanical Engineering', rollNumber: 'ME2025003' },
  { name: 'Deepa Sundari', email: 'deepa.sundari@student.com', department: 'Information Technology', rollNumber: 'IT2025003' },
  { name: 'Tamilselvan Murugesan', email: 'tamilselvan.m@student.com', department: 'Civil Engineering', rollNumber: 'CE2025003' },
  { name: 'Nandhini Priya', email: 'nandhini.priya@student.com', department: 'Computer Science', rollNumber: 'CS2025005' },
  { name: 'Balaji Krishnan', email: 'balaji.krishnan@student.com', department: 'Electronics', rollNumber: 'EC2025004' },
  { name: 'Revathi Sundaram', email: 'revathi.sundaram@student.com', department: 'Mechanical Engineering', rollNumber: 'ME2025004' },
  { name: 'Ganesh Babu', email: 'ganesh.babu@student.com', department: 'Information Technology', rollNumber: 'IT2025004' },
  { name: 'Saranya Mohan', email: 'saranya.mohan@student.com', department: 'Civil Engineering', rollNumber: 'CE2025004' },
  { name: 'Dinesh Kumar', email: 'dinesh.kumar@student.com', department: 'Computer Science', rollNumber: 'CS2025006' },
  { name: 'Lakshmi Priya', email: 'lakshmi.priya@student.com', department: 'Electronics', rollNumber: 'EC2025005' },
  { name: 'Prakash Raj', email: 'prakash.raj@student.com', department: 'Mechanical Engineering', rollNumber: 'ME2025005' },
  { name: 'Kanimozhi Thangam', email: 'kanimozhi.t@student.com', department: 'Information Technology', rollNumber: 'IT2025005' },
  { name: 'Vijay Anand', email: 'vijay.anand@student.com', department: 'Civil Engineering', rollNumber: 'CE2025005' },
  { name: 'Pooja Ramasamy', email: 'pooja.ramasamy@student.com', department: 'Computer Science', rollNumber: 'CS2025007' },
  { name: 'Ashwin Kumaran', email: 'ashwin.kumaran@student.com', department: 'Electronics', rollNumber: 'EC2025006' },
  { name: 'Nithya Shree', email: 'nithya.shree@student.com', department: 'Mechanical Engineering', rollNumber: 'ME2025006' },
  { name: 'Saravanan Perumal', email: 'saravanan.perumal@student.com', department: 'Information Technology', rollNumber: 'IT2025006' },
  { name: 'Pavithra Devi', email: 'pavithra.devi@student.com', department: 'Civil Engineering', rollNumber: 'CE2025006' },
  { name: 'Harish Ragav', email: 'harish.ragav@student.com', department: 'Computer Science', rollNumber: 'CS2025008' },
  { name: 'Sowmya Narayanan', email: 'sowmya.narayanan@student.com', department: 'Electronics', rollNumber: 'EC2025007' },
  { name: 'Ravi Chandran', email: 'ravi.chandran@student.com', department: 'Mechanical Engineering', rollNumber: 'ME2025007' },
  { name: 'Bharathi Kannan', email: 'bharathi.kannan@student.com', department: 'Information Technology', rollNumber: 'IT2025007' },
  { name: 'Sathish Kumar', email: 'sathish.kumar@student.com', department: 'Civil Engineering', rollNumber: 'CE2025007' },
  { name: 'Gayathri Shankar', email: 'gayathri.shankar@student.com', department: 'Computer Science', rollNumber: 'CS2025009' },
  { name: 'Mohan Rajan', email: 'mohan.rajan@student.com', department: 'Electronics', rollNumber: 'EC2025008' },
  { name: 'Thenmozhi Vadivu', email: 'thenmozhi.v@student.com', department: 'Mechanical Engineering', rollNumber: 'ME2025008' },
  { name: 'Kumaran Vel', email: 'kumaran.vel@student.com', department: 'Information Technology', rollNumber: 'IT2025008' },
  { name: 'Janani Ramesh', email: 'janani.ramesh@student.com', department: 'Civil Engineering', rollNumber: 'CE2025008' },
  { name: 'Prasanna Venkatesh', email: 'prasanna.v@student.com', department: 'Computer Science', rollNumber: 'CS2025010' },
  { name: 'Vasuki Devi', email: 'vasuki.devi@student.com', department: 'Electronics', rollNumber: 'EC2025009' },
  { name: 'Ilango Adigal', email: 'ilango.adigal@student.com', department: 'Mechanical Engineering', rollNumber: 'ME2025009' },
  { name: 'Madhumitha Srinivasan', email: 'madhumitha.s@student.com', department: 'Information Technology', rollNumber: 'IT2025009' },
  { name: 'Kathiravan Subramani', email: 'kathiravan.s@student.com', department: 'Civil Engineering', rollNumber: 'CE2025009' },
  { name: 'Swathi Palani', email: 'swathi.palani@student.com', department: 'Computer Science', rollNumber: 'CS2025011' },
  { name: 'Arjun Muthusamy', email: 'arjun.muthusamy@student.com', department: 'Electronics', rollNumber: 'EC2025010' },
  { name: 'Indira Ganesan', email: 'indira.ganesan@student.com', department: 'Mechanical Engineering', rollNumber: 'ME2025010' },
  { name: 'Velu Nachiyar', email: 'velu.nachiyar@student.com', department: 'Information Technology', rollNumber: 'IT2025010' },
];

async function seedStudents() {
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
    console.log(`✅ Successfully inserted ${result.length} Tamil-named students!`);
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  Some students already existed (duplicate emails skipped). Others were inserted.');
    } else {
      console.error('Error seeding students:', error.message);
    }
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seedStudents();
