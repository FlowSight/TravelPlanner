const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');

const COLLECTION = 'trips';

function col() {
  return getDb().collection(COLLECTION);
}

// Helper: check if a user is a member (owner or explicit member)
function isMember(trip, userId) {
  const uid = userId.toString();
  if (trip.owner.toString() === uid) return true;
  return (trip.members || []).some((m) => m.user.toString() === uid);
}

// Helper: check if a user can edit (owner or editor member)
function canEdit(trip, userId) {
  const uid = userId.toString();
  if (trip.owner.toString() === uid) return true;
  const member = (trip.members || []).find((m) => m.user.toString() === uid);
  return member && member.role === 'editor';
}

async function findById(id) {
  return col().findOne({ _id: typeof id === 'string' ? new ObjectId(id) : id });
}

async function find(filter = {}, opts = {}) {
  let cursor = col().find(filter);
  if (opts.sort) cursor = cursor.sort(opts.sort);
  return cursor.toArray();
}

async function create(data) {
  if (!data.title) throw new Error('Trip title is required');
  if (!data.owner) throw new Error('Owner is required');

  const doc = {
    title: data.title?.trim(),
    description: data.description?.trim() || null,
    destination: data.destination?.trim() || null,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    owner: typeof data.owner === 'string' ? new ObjectId(data.owner) : data.owner,
    members: (data.members || []).map((m) => ({
      user: typeof m.user === 'string' ? new ObjectId(m.user) : m.user,
      role: m.role || 'editor',
    })),
    itinerary: data.itinerary || [],
    places: (data.places || []).map((p) => (typeof p === 'string' ? new ObjectId(p) : p)),
    notes: data.notes?.trim() || null,
    documents: data.documents || [],
    status: data.status || 'planning',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await col().insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

async function findByIdAndUpdate(id, data) {
  const _id = typeof id === 'string' ? new ObjectId(id) : id;
  return col().findOneAndUpdate(
    { _id },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
}

async function findByIdAndDelete(id) {
  const _id = typeof id === 'string' ? new ObjectId(id) : id;
  return col().findOneAndDelete({ _id });
}

async function save(trip) {
  const { _id, ...data } = trip;
  await col().updateOne({ _id }, { $set: { ...data, updatedAt: new Date() } });
  return trip;
}

// Populate owner and members.user with user info (name, email)
async function populateTrip(trip) {
  if (!trip) return null;
  const User = require('./User');

  // Populate owner
  if (trip.owner) {
    const ownerDoc = await User.findById(trip.owner);
    if (ownerDoc) {
      trip.owner = { _id: ownerDoc._id, name: ownerDoc.name, email: ownerDoc.email };
    }
  }

  // Populate members
  if (trip.members && trip.members.length) {
    for (const member of trip.members) {
      if (member.user) {
        const userDoc = await User.findById(member.user);
        if (userDoc) {
          member.user = { _id: userDoc._id, name: userDoc.name, email: userDoc.email };
        }
      }
    }
  }

  return trip;
}

// Populate including itinerary places and trip places list
async function populateTripFull(trip) {
  if (!trip) return null;
  await populateTrip(trip);
  const Place = require('./Place');

  // Populate itinerary activity places
  if (trip.itinerary) {
    for (const day of trip.itinerary) {
      if (day.activities) {
        for (const activity of day.activities) {
          if (activity.place) {
            const placeDoc = await Place.findById(activity.place);
            if (placeDoc) activity.place = placeDoc;
          }
        }
      }
    }
  }

  // Populate trip places list (skip custom inline places)
  if (trip.places && trip.places.length) {
    const populatedPlaces = [];
    for (const entry of trip.places) {
      if (entry && typeof entry === 'object' && entry.custom) {
        // Custom place — already inline, keep as-is
        populatedPlaces.push(entry);
      } else {
        const placeDoc = await Place.findById(entry);
        if (placeDoc) populatedPlaces.push(placeDoc);
      }
    }
    trip.places = populatedPlaces;
  } else {
    trip.places = [];
  }

  return trip;
}

module.exports = {
  findById,
  find,
  create,
  findByIdAndUpdate,
  findByIdAndDelete,
  save,
  isMember,
  canEdit,
  populateTrip,
  populateTripFull,
  col,
};
