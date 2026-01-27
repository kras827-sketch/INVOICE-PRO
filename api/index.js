// api/index.js - Vercel serverless backend entry point
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection (lazy connect)
let isConnected = false;

const connectDB = async () => {
  if (isConnected || !process.env.MONGODB_URI) return;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

// Routes - Initialize Firebase first
try {
  require('../backend/config/firebase');
} catch (err) {
  console.warn('Firebase initialization:', err.message);
}

// API Routes
try {
  app.use('/api/auth', require('../backend/routes/authRoutes'));
  app.use('/api/invoices', require('../backend/routes/invoiceRoutes'));
  app.use('/api/users', require('../backend/routes/userRoutes'));
  app.use('/api/email', require('../backend/routes/emailRoutes'));
} catch (err) {
  console.warn('Backend routes not available:', err.message);
}

// Health check
app.get('/api/health', async (req, res) => {
  await connectDB();
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Export for Vercel
module.exports = app;
