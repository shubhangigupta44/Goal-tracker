const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Goal = require('./models/Goal');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding');

    await User.deleteMany();
    await Goal.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    // Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@company.com',
      password: 'password123', // Model pre-save hashes it again if not handled correctly. Wait, the schema does `bcrypt.hash(this.password)`. So I should pass raw string.
      role: 'Admin',
      department: 'HR'
    });

    // Create Manager
    const manager = await User.create({
      name: 'Manager User',
      email: 'manager@company.com',
      password: 'password123',
      role: 'Manager',
      department: 'Engineering'
    });

    // Create Employee
    const employee = await User.create({
      name: 'Employee User',
      email: 'employee@company.com',
      password: 'password123',
      role: 'Employee',
      managerId: manager._id,
      department: 'Engineering'
    });

    // Create Goals
    await Goal.create({
      employeeId: employee._id,
      thrustArea: 'Productivity',
      title: 'Complete Hackathon Project',
      description: 'Build a fully functional goal tracker within 48 hours.',
      uomType: 'Percentage',
      target: 100,
      weightage: 60,
      status: 'Submitted'
    });

    await Goal.create({
      employeeId: employee._id,
      thrustArea: 'Learning',
      title: 'Learn Advanced React',
      description: 'Complete 3 advanced React patterns courses.',
      uomType: 'Numeric',
      target: 3,
      weightage: 40,
      status: 'Draft'
    });

    console.log('Data Seeded Successfully!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
