const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { getDb } = require('../config/db');

const COLLECTION = 'users';

function col() {
  return getDb().collection(COLLECTION);
}

async function findById(id, opts = {}) {
  const _id = typeof id === 'string' ? new ObjectId(id) : id;
  const projection = opts.includePassword ? {} : { password: 0 };
  return col().findOne({ _id }, { projection });
}

async function findOne(filter, opts = {}) {
  const projection = opts.includePassword ? {} : { password: 0 };
  return col().findOne(filter, { projection });
}

async function find(filter = {}, opts = {}) {
  const projection = opts.projection || { password: 0 };
  let cursor = col().find(filter, { projection });
  if (opts.limit) cursor = cursor.limit(opts.limit);
  return cursor.toArray();
}

async function create(data) {
  if (!data.name) throw new Error('Name is required');
  if (!data.email && !data.phone) throw new Error('Either email or phone number is required');
  if (!data.password || data.password.length < 6)
    throw new Error('Password must be at least 6 characters');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  const doc = {
    name: data.name?.trim(),
    email: data.email?.toLowerCase().trim() || null,
    phone: data.phone?.trim() || null,
    password: hashedPassword,
    role: data.role || 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await col().insertOne(doc);
  const { password, ...userWithoutPassword } = doc;
  return { ...userWithoutPassword, _id: result.insertedId };
}

async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = { findById, findOne, find, create, comparePassword, col };
