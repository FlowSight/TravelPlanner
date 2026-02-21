const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');

const COLLECTION = 'places';

function col() {
  return getDb().collection(COLLECTION);
}

async function findById(id) {
  return col().findOne({ _id: typeof id === 'string' ? new ObjectId(id) : id });
}

async function findOne(filter) {
  return col().findOne(filter);
}

async function find(filter = {}, opts = {}) {
  let cursor = col().find(filter);
  if (opts.sort) cursor = cursor.sort(opts.sort);
  if (opts.skip) cursor = cursor.skip(opts.skip);
  if (opts.limit) cursor = cursor.limit(opts.limit);
  return cursor.toArray();
}

async function countDocuments(filter = {}) {
  return col().countDocuments(filter);
}

async function create(data) {
  if (!data.name) throw new Error('Place name is required');
  if (!data.country) throw new Error('Country is required');

  const doc = {
    name: data.name?.trim(),
    country: data.country?.trim(),
    city: data.city?.trim() || null,
    type: data.type || 'other',
    fee: data.fee?.trim() || 'Free',
    googleMapUrl: data.googleMapUrl?.trim() || null,
    timing: data.timing?.trim() || null,
    timeToCover: data.timeToCover?.trim() || null,
    highlight: data.highlight?.trim() || null,
    notes: data.notes?.trim() || null,
    imageUrl: data.imageUrl?.trim() || null,
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

module.exports = { findById, findOne, find, countDocuments, create, findByIdAndUpdate, findByIdAndDelete, col };
