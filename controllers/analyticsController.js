const asyncHandler = require('express-async-handler');
const Goal = require('../models/Goal');
const User = require('../models/User');

// @desc    Get Analytics Dashboard Data
// @route   GET /api/analytics/dashboard
// @access  Private (Admin/Manager)
const getDashboardStats = asyncHandler(async (req, res) => {
  let userQuery = {};
  let goalQuery = {};

  if (req.user.role === 'Manager') {
    const employees = await User.find({ managerId: req.user._id }).select('_id');
    const employeeIds = employees.map((emp) => emp._id);
    userQuery = { _id: { $in: employeeIds } };
    goalQuery = { employeeId: { $in: employeeIds } };
  } else if (req.user.role === 'Employee') {
    res.status(403);
    throw new Error('Not authorized for analytics');
  }

  const totalEmployees = await User.countDocuments(userQuery);
  const totalGoals = await Goal.countDocuments(goalQuery);
  
  const goalsByStatus = await Goal.aggregate([
    { $match: goalQuery },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  res.json({
    totalEmployees,
    totalGoals,
    goalsByStatus,
  });
});

module.exports = {
  getDashboardStats,
};
