const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id: id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { name, email, phone, password } = req.body;

      // Check if user already exists
      if (email) {
        const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingEmail) {
          return res.status(400).json({ success: false, message: 'Email already registered' });
        }
      }
      if (phone) {
        const existingPhone = await User.findOne({ phone: phone.trim() });
        if (existingPhone) {
          return res.status(400).json({ success: false, message: 'Phone already registered' });
        }
      }

      const user = await User.create({ name, email, phone, password });
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [body('password').notEmpty().withMessage('Password is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email, phone, password } = req.body;

      // Find user by email or phone (include password for comparison)
      let user;
      if (email) {
        user = await User.findOne({ email: email.toLowerCase().trim() }, { includePassword: true });
      } else if (phone) {
        user = await User.findOne({ phone: phone.trim() }, { includePassword: true });
      } else {
        return res.status(400).json({ success: false, message: 'Provide email or phone to login' });
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await User.comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken(user._id);
      res.json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// GET /api/auth/me — get current user
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/password — update password
router.put(
  '/password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { currentPassword, newPassword } = req.body;

      // Fetch user with password
      const user = await User.findById(req.user._id, { includePassword: true });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isMatch = await User.comparePassword(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      // Hash and update
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newPassword, salt);
      await User.col().updateOne(
        { _id: user._id },
        { $set: { password: hashed, updatedAt: new Date() } }
      );

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
