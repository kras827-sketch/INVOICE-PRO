// backend/config/db.js

const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000; // 2 seconds

const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10s timeout per attempt
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error (attempt ${retryCount + 1}/${MAX_RETRIES}): ${error.message}`);

    if (retryCount < MAX_RETRIES - 1) {
      const delay = BASE_DELAY_MS * Math.pow(2, retryCount); // exponential backoff
      console.log(`🔄 Retrying MongoDB connection in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB(retryCount + 1);
    }

    console.error('❌ All MongoDB connection attempts failed. Server will continue running — MongoDB will reconnect automatically when available.');
    // Do NOT call process.exit(1) — let the server stay alive and let Mongoose auto-reconnect
  }
};

module.exports = connectDB;
