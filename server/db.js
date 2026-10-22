const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

let memoryServer = null;

// Connects to MONGO_URI if given, otherwise starts a local MongoDB
// that stores its files in server/data so records survive restarts.
async function connectDB() {
  let uri = process.env.MONGO_URI;

  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbPath = path.join(__dirname, 'data');
    fs.mkdirSync(dbPath, { recursive: true });
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbPath, storageEngine: 'wiredTiger', port: 27027,
        // keep MongoDB's cache small so it fits on a free 512 MB server
        args: ['--wiredTigerCacheSizeGB', '0.25'],
      },
    });
    uri = memoryServer.getUri('hms');
    console.log('Using local database at', dbPath);
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop({ doCleanup: false });
}

module.exports = { connectDB, disconnectDB };
