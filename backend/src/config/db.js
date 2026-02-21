const { MongoClient } = require('mongodb');
const dns = require('dns');
require('dotenv').config();

// Use Google DNS to fix Node.js SRV/TXT lookup timeouts on some networks
dns.setServers(['8.8.8.8', '8.8.4.4']);

let db;
let client;

const connectDB = async () => {
  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db(); // uses database name from the URI
    console.log(`MongoDB connected: ${db.databaseName}`);

    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ phone: 1 }, { unique: true, sparse: true });
    await db.collection('places').createIndex(
      { name: 'text', country: 'text', city: 'text', notes: 'text' }
    );
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

const getDb = () => db;
const getClient = () => client;

// Test-only helpers to inject an in-memory db
function _setDb(testDb) { db = testDb; }
function _setClient(testClient) { client = testClient; }

module.exports = { connectDB, getDb, getClient, _setDb, _setClient };
