const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

// @desc    Get users (for Admin or Manager viewing team)
// @route   GET /api/users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'Manager') {
    // Manager can only see their employees
    query.managerId = req.user._id;
  } else if (req.user.role === 'Employee') {
     res.status(403);
     throw new Error('Employees cannot view user list');
  }

  const users = await User.find(query).select('-password').populate('managerId', 'name email');
  res.json(users);
});

module.exports = {
  getMe,
  getUsers,
};
