const asyncHandler = require('express-async-handler');
const Goal = require('../models/Goal');
const User = require('../models/User');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc    Get goals
// @route   GET /api/goals
// @access  Private
const getGoals = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'Employee') {
    query.employeeId = req.user._id;
  } else if (req.user.role === 'Manager') {
    // Find all employees managed by this manager
    const employees = await User.find({ managerId: req.user._id }).select('_id');
    const employeeIds = employees.map((emp) => emp._id);
    query.employeeId = { $in: employeeIds };
  }
  // Admin gets all, so query remains {}

  const goals = await Goal.find(query).populate('employeeId', 'name email department');
  res.json(goals);
});

// @desc    Create a new goal
// @route   POST /api/goals
// @access  Private (Employee, Admin/Manager for Shared)
const createGoal = asyncHandler(async (req, res) => {
  const { thrustArea, title, description, uomType, target, weightage, isShared, employeeId } = req.body;

  // Enforce Max 8 goals limit for an employee
  const empId = isShared ? employeeId : req.user._id;
  const count = await Goal.countDocuments({ employeeId: empId });
  if (count >= 8) {
    res.status(400);
    throw new Error('Maximum limit of 8 goals reached');
  }

  const goal = await Goal.create({
    employeeId: empId,
    thrustArea,
    title,
    description,
    uomType,
    target,
    weightage,
    isShared: isShared || false,
    status: isShared ? 'Approved' : 'Draft',
    isLocked: isShared ? true : false,
  });

  res.status(201).json(goal);
});

// @desc    Update a goal
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  // Ensure user owns goal or is admin/manager
  if (goal.employeeId.toString() !== req.user.id && req.user.role === 'Employee') {
    res.status(401);
    throw new Error('User not authorized');
  }

  if (goal.isLocked && req.user.role !== 'Admin') {
    res.status(400);
    throw new Error('Goal is locked and cannot be edited');
  }

  const oldData = { ...goal.toObject() };
  
  // If shared, employees can only edit weightage
  if (goal.isShared && req.user.role === 'Employee') {
    goal.weightage = req.body.weightage || goal.weightage;
  } else {
    // Normal edit
    goal.thrustArea = req.body.thrustArea || goal.thrustArea;
    goal.title = req.body.title || goal.title;
    goal.description = req.body.description || goal.description;
    goal.uomType = req.body.uomType || goal.uomType;
    goal.target = req.body.target || goal.target;
    goal.weightage = req.body.weightage || goal.weightage;
  }

  const updatedGoal = await goal.save();

  await logAudit(updatedGoal._id, req.user._id, 'UPDATE_DRAFT', { old: oldData, new: updatedGoal });

  res.json(updatedGoal);
});

// @desc    Submit goals for approval
// @route   POST /api/goals/submit
// @access  Private (Employee)
const submitGoals = asyncHandler(async (req, res) => {
  const goals = await Goal.find({ employeeId: req.user._id });
  
  const totalWeightage = goals.reduce((acc, goal) => acc + goal.weightage, 0);

  if (totalWeightage !== 100) {
    res.status(400);
    throw new Error(`Total weightage must be exactly 100%. Current is ${totalWeightage}%`);
  }

  await Goal.updateMany(
    { employeeId: req.user._id, status: { $in: ['Draft', 'Rejected'] } },
    { $set: { status: 'Submitted' } }
  );

  res.json({ message: 'Goals submitted successfully' });
});

// @desc    Approve/Reject goal
// @route   PUT /api/goals/:id/approve
// @access  Private (Manager/Admin)
const approveGoal = asyncHandler(async (req, res) => {
  const { status, weightage, target, rejectionReason } = req.body;
  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  const oldData = { ...goal.toObject() };

  if (status === 'Approved') {
    goal.status = 'Approved';
    goal.isLocked = true;
    if (weightage) goal.weightage = weightage;
    if (target) goal.target = target;
  } else if (status === 'Rejected') {
    goal.status = 'Rejected';
    goal.rejectionReason = rejectionReason || 'No reason provided';
  } else {
    res.status(400);
    throw new Error('Invalid status');
  }

  const updatedGoal = await goal.save();
  await logAudit(updatedGoal._id, req.user._id, `MANAGER_${status.toUpperCase()}`, { old: oldData, new: updatedGoal });

  res.json(updatedGoal);
});

// @desc    Update check-in (Q1, Q2, Q3, Q4)
// @route   PUT /api/goals/:id/checkin
// @access  Private
const updateCheckin = asyncHandler(async (req, res) => {
  const { quarter, achievement, status, managerComment } = req.body; // quarter should be 'q1', 'q2', etc.
  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  if (goal.status !== 'Approved') {
    res.status(400);
    throw new Error('Can only check in on approved goals');
  }

  const validQuarters = ['q1', 'q2', 'q3', 'q4'];
  if (!validQuarters.includes(quarter)) {
    res.status(400);
    throw new Error('Invalid quarter');
  }

  const oldData = { ...goal.toObject() };

  if (req.user.role === 'Employee') {
    goal[quarter].achievement = achievement !== undefined ? achievement : goal[quarter].achievement;
    goal[quarter].status = status || goal[quarter].status;
    goal[quarter].updatedAt = Date.now();
  } else if (req.user.role === 'Manager' || req.user.role === 'Admin') {
    goal[quarter].managerComment = managerComment !== undefined ? managerComment : goal[quarter].managerComment;
  }

  const updatedGoal = await goal.save();
  await logAudit(updatedGoal._id, req.user._id, 'CHECKIN_UPDATE', { old: oldData, new: updatedGoal });

  res.json(updatedGoal);
});

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  submitGoals,
  approveGoal,
  updateCheckin
};
