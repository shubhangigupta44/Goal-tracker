const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/analyticsController');
const { protect, managerOrAdmin } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, managerOrAdmin, getDashboardStats);

module.exports = router;
