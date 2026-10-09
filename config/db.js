const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer = null;

async function connectDB() {
  try {
    mongoose.set('strictQuery', false);

    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      memoryServer = await MongoMemoryServer.create({
        binary: {
          version: '7.0.14'
        }
      });
      mongoUri = memoryServer.getUri('college_event_manager');
      console.log('Using in-memory MongoDB for local development');
    }

    await mongoose.connect(mongoUri, {
      dbName: 'college_event_manager'
    });

    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

module.exports = connectDB;
