const express = require('express');
const Place = require('../models/Place');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/places — list all places (public)
router.get('/', async (req, res) => {
  try {
    const { country, city, type, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (country) filter.country = { $regex: country, $options: 'i' };
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const places = await Place.find(filter, {
      sort: { country: 1, city: 1, name: 1 },
      skip,
      limit: parseInt(limit),
    });
    const total = await Place.countDocuments(filter);

    res.json({ success: true, count: places.length, total, page: parseInt(page), places });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/places/:id — get single place (public)
router.get('/:id', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ success: false, message: 'Place not found' });
    }
    res.json({ success: true, place });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/places — create place (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const place = await Place.create(req.body);
    res.status(201).json({ success: true, place });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/places/:id — update place (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const place = await Place.findByIdAndUpdate(req.params.id, req.body);
    if (!place) {
      return res.status(404).json({ success: false, message: 'Place not found' });
    }
    res.json({ success: true, place });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/places/:id — delete place (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const place = await Place.findByIdAndDelete(req.params.id);
    if (!place) {
      return res.status(404).json({ success: false, message: 'Place not found' });
    }
    res.json({ success: true, message: 'Place deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
