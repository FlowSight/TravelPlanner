const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All user-management routes require authentication
router.use(protect);

// GET /api/users/search?q=... — search users by name or email (for adding trip members)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
    }

    const users = await User.find(
      {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      },
      { projection: { name: 1, email: 1, phone: 1 }, limit: 10 }
    );

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/users — list all users (admin only)
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
