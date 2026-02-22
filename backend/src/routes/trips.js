const express = require('express');
const { ObjectId } = require('mongodb');
const Trip = require('../models/Trip');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All trip routes require authentication
router.use(protect);

// GET /api/trips — list trips for current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const trips = await Trip.find(
      { $or: [{ owner: userId }, { 'members.user': userId }] },
      { sort: { updatedAt: -1 } }
    );

    // Populate owner & members for each trip
    for (const trip of trips) {
      await Trip.populateTrip(trip);
    }

    res.json({ success: true, count: trips.length, trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/trips/:id — get single trip (members only)
router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (!Trip.isMember(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied — you are not a member of this trip' });
    }

    await Trip.populateTripFull(trip);

    res.json({ success: true, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/trips — create trip
router.post('/', async (req, res) => {
  try {
    const tripData = { ...req.body, owner: req.user._id };
    const trip = await Trip.create(tripData);
    await Trip.populateTrip(trip);

    res.status(201).json({ success: true, trip });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/trips/:id — update trip (editors only)
router.put('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (!Trip.canEdit(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied — you cannot edit this trip' });
    }

    // Prevent changing the owner
    delete req.body.owner;

    const updated = await Trip.findByIdAndUpdate(req.params.id, req.body);
    await Trip.populateTripFull(updated);

    res.json({ success: true, trip: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/trips/:id/members — add member to trip (owner only)
router.post('/:id/members', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (trip.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the owner can add members' });
    }

    const { userId, role = 'editor' } = req.body;

    // Check if already a member
    const existing = (trip.members || []).find((m) => m.user.toString() === userId);
    if (existing) {
      return res.status(400).json({ success: false, message: 'User is already a member' });
    }

    trip.members = trip.members || [];
    trip.members.push({ user: new ObjectId(userId), role });
    await Trip.save(trip);

    await Trip.populateTrip(trip);

    res.json({ success: true, trip });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/trips/:id/members/:userId — remove member (owner only)
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (trip.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the owner can remove members' });
    }

    trip.members = (trip.members || []).filter((m) => m.user.toString() !== req.params.userId);
    await Trip.save(trip);

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/trips/:id/places — add place to trip's places list (editors)
router.post('/:id/places', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (!Trip.canEdit(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { placeId, customPlace } = req.body;
    if (!placeId && !customPlace) {
      return res.status(400).json({ success: false, message: 'placeId or customPlace is required' });
    }

    const places = trip.places || [];

    if (placeId) {
      // Add reference to global place (idempotent)
      if (places.some((p) => p && p.toString && p.toString() === placeId)) {
        return res.json({ success: true, message: 'Place already in list' });
      }
      places.push(new ObjectId(placeId));
    } else {
      // Add custom inline place (trip-local)
      places.push({
        _id: new ObjectId().toString(),
        custom: true,
        name: (customPlace.name || '').trim(),
        city: (customPlace.city || '').trim() || null,
        country: (customPlace.country || '').trim() || null,
        type: (customPlace.type || '').trim() || null,
        notes: (customPlace.notes || '').trim() || null,
        googleMapUrl: (customPlace.googleMapUrl || '').trim() || null,
      });
    }

    trip.places = places;
    await Trip.save(trip);
    await Trip.populateTripFull(trip);

    res.json({ success: true, trip });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/trips/:id/places/:placeId — remove place from trip's places list (editors)
router.delete('/:id/places/:placeId', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (!Trip.canEdit(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    trip.places = (trip.places || []).filter((p) => {
      // Custom inline place: compare _id string
      if (p && typeof p === 'object' && p.custom) return p._id !== req.params.placeId;
      // ObjectId reference
      return p.toString() !== req.params.placeId;
    });
    await Trip.save(trip);
    await Trip.populateTripFull(trip);

    res.json({ success: true, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/trips/:id — delete trip (owner only)
router.delete('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (trip.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the owner can delete a trip' });
    }

    await Trip.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Trip deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
