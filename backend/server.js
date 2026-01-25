// backend/server.js
// Main server file

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize Firebase FIRST (before any routes use it)
require('./config/firebase');

// Import routes
const authRoutes = require('./routes/authRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const userRoutes = require('./routes/userRoutes');
const emailRoutes = require('./routes/emailRoutes');

// Initialize Express
const app = express();

// Connect to database
connectDB();

// ============================================
// MIDDLEWARE
// ============================================

// CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'InvoicePro API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/email', emailRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'API endpoint not found' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   🚀 InvoicePro API Server Running   ║
  ╠═══════════════════════════════════════╣
  ║   Port: ${PORT}                        ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}        ║
  ║   URL: http://localhost:${PORT}        ║
  ╚═══════════════════════════════════════╝
  `);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});