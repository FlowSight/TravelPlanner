/**
 * Test setup — spins up an in-memory MongoDB, wires it into the app's db module,
 * and provides helpers for creating test users / tokens.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

let mongod;
let client;
let db;

// Must match what config/db.js exposes
const dbModule = require('../src/config/db');

/**
 * Start in-memory MongoDB, connect, and inject the db into the app module.
 */
async function setup() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  client = new MongoClient(uri);
  await client.connect();
  db = client.db('testdb');

  // Inject test db/client through the internal setters so models' captured
  // getDb/getClient references return the in-memory db.
  dbModule._setDb(db);
  dbModule._setClient(client);

  // Create indexes (same as production connectDB)
  await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
  await db.collection('users').createIndex({ phone: 1 }, { unique: true, sparse: true });
  await db.collection('places').createIndex(
    { name: 'text', country: 'text', city: 'text', notes: 'text' }
  );
}

/**
 * Drop all collections between tests to keep them isolated.
 */
async function clearDB() {
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.collection(col.name).deleteMany({});
  }
}

/**
 * Disconnect and stop in-memory MongoDB.
 */
async function teardown() {
  if (client) await client.close();
  if (mongod) await mongod.stop();
}

/**
 * Seed a test user and return { user, token }.
 */
async function createTestUser(overrides = {}) {
  const salt = await bcrypt.genSalt(10);
  const plain = overrides.password || 'testpass123';
  const hashed = await bcrypt.hash(plain, salt);

  const doc = {
    name: overrides.name || 'Test User',
    email: overrides.email || 'test@example.com',
    ...(overrides.phone ? { phone: overrides.phone } : {}),
    password: hashed,
    role: overrides.role || 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection('users').insertOne(doc);
  const user = { ...doc, _id: result.insertedId };

  const secret = process.env.JWT_SECRET || 'test_jwt_secret';
  const token = jwt.sign({ id: user._id.toString() }, secret, { expiresIn: '1d' });

  return { user, token, plainPassword: plain };
}

/**
 * Seed a test place and return the document.
 */
async function createTestPlace(overrides = {}) {
  const doc = {
    name: overrides.name || 'Test Temple',
    country: overrides.country || 'Thailand',
    city: overrides.city || 'Bangkok',
    type: overrides.type || 'history',
    fee: overrides.fee || 'Free',
    googleMapUrl: overrides.googleMapUrl || null,
    timing: overrides.timing || 'Daytime',
    timeToCover: overrides.timeToCover || '1-2 hours',
    highlight: overrides.highlight || 'Beautiful temple',
    notes: overrides.notes || 'Test notes',
    imageUrl: overrides.imageUrl || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection('places').insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

module.exports = {
  setup,
  clearDB,
  teardown,
  createTestUser,
  createTestPlace,
  getDb: () => db,
};
