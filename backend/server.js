// backend/server.js
// Main server file

// Load environment variables FIRST - before any other imports
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { initTransporter } = require('./services/otpService');

// Initialize Firebase FIRST (before any routes use it)
require('./config/firebase');

// Import routes
const authRoutes = require('./routes/authRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');
const emailRoutes = require('./routes/emailRoutes');

// Initialize Express
const app = express();

// Connect to database
connectDB();

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// Gzip compression
app.use(compression());

// Rate limiting (100 requests per 15 minutes per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser - increased limit for base64 images (logos)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Email diagnostics endpoint (for debugging)
app.get('/api/health/email', (req, res) => {
  const emailConfig = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    userSet: !!process.env.EMAIL_USER,
    passSet: !!process.env.EMAIL_PASS,
    configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
  };
  
  res.json({
    status: 'ok',
    email: emailConfig,
    message: emailConfig.configured ? `Email service (${emailConfig.service}) configured` : 'Email service NOT configured - OTP will fail'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/analytics', analyticsRoutes);
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

// Initialize email service (SMTP)
initTransporter().then((initialized) => {
  const emailStatus = initialized ? `SMTP (${process.env.EMAIL_SERVICE || 'gmail'})` : 'SMTP (unverified)';
  const extraNote = initialized ? '' : ' (email verification failed or skipped; emails may not send)';

  app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════╗
  ║   🚀 InvoicePro API Server Running   ║
  ╠═══════════════════════════════════════╣
  ║   Port: ${PORT}                        ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}        ║
  ╠═══════════════════════════════════════╣
  ║   Email: ${emailStatus}${extraNote}             ║
  ║   URL: http://localhost:${PORT}        ║
  ╚═══════════════════════════════════════╝
    `);
  });

}).catch((err) => {
  // This should be rare — initTransporter now returns false on verify failures instead of throwing.
  console.error('⚠️ Email service initialization unexpected error:', err?.message || err);
  console.log('ℹ️ Server will start but email features may not work');
  // Still start the server even if email init threw
  app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════╗
  ║   🚀 InvoicePro API Server Running   ║
  ║   (Email service offline)             ║
  ╠═══════════════════════════════════════╣
  ║   Port: ${PORT}                        ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}        ║
  ║   URL: http://localhost:${PORT}        ║
  ╚═══════════════════════════════════════╝
    `);
  });
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Do not exit — allow server to continue running
});