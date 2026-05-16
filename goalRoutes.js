const express = require('express');
const router = express.Router();
const { getGoals, createGoal, updateGoal, submitGoals, approveGoal, updateCheckin } = require('../controllers/goalController');
const { protect, managerOrAdmin } = require('../middleware/authMiddleware');

router.get('/', protect, getGoals);
router.post('/', protect, createGoal);
router.put('/:id', protect, updateGoal);
router.post('/submit', protect, submitGoals);
router.put('/:id/approve', protect, managerOrAdmin, approveGoal);
router.put('/:id/checkin', protect, updateCheckin);

module.exports = router;
