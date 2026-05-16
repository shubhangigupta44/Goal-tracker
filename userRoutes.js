const express = require('express');
const router = express.Router();
const { getMe, getUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMe);
router.get('/', protect, getUsers);

module.exports = router;
