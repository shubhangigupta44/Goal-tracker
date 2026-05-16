const mongoose = require('mongoose');

const checkInSchema = mongoose.Schema({
  achievement: { type: mongoose.Schema.Types.Mixed, default: null }, // Can be number or date
  status: { type: String, enum: ['Not Started', 'On Track', 'Completed'], default: 'Not Started' },
  managerComment: { type: String, default: '' },
  updatedAt: { type: Date, default: null }
}, { _id: false });

const goalSchema = mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    thrustArea: { type: String, required: [true, 'Please add a thrust area'] },
    title: { type: String, required: [true, 'Please add a title'] },
    description: { type: String, required: [true, 'Please add a description'] },
    uomType: {
      type: String,
      enum: ['Numeric', 'Percentage', 'Timeline', 'Zero-based'],
      required: true,
    },
    target: { type: mongoose.Schema.Types.Mixed, required: true }, // Number or Date String
    weightage: {
      type: Number,
      required: true,
      min: 10,
      max: 100,
    },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Approved', 'Rejected'],
      default: 'Draft',
    },
    isLocked: { type: Boolean, default: false },
    isShared: { type: Boolean, default: false }, // Assigned by Manager/Admin
    rejectionReason: { type: String, default: '' },
    q1: { type: checkInSchema, default: () => ({}) },
    q2: { type: checkInSchema, default: () => ({}) },
    q3: { type: checkInSchema, default: () => ({}) },
    q4: { type: checkInSchema, default: () => ({}) },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Goal', goalSchema);
