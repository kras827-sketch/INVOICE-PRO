// backend/routes/invoiceRoutes.js
// Fixed routes file with correct imports

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Import ALL controller functions
const {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  downloadPDF,
  sendInvoice,
  getStats,
} = require('../controllers/invoiceController');

/**
 * CRITICAL: Route Order Matters!
 * Specific routes MUST come BEFORE parameterized routes
 */

// ============================================
// SPECIFIC ROUTES (MUST BE FIRST)
// ============================================

// @route   GET /api/invoices/stats
// @desc    Get user's invoice statistics
// @access  Private
router.get('/stats', protect, getStats);

// ============================================
// CREATE ROUTE
// ============================================

// @route   POST /api/invoices/create
// @desc    Create new invoice
// @access  Private
router.post('/create', protect, createInvoice);

// ============================================
// PDF & EMAIL ROUTES (BEFORE /:id)
// ============================================

// @route   GET /api/invoices/pdf/:id
// @desc    Generate and download invoice PDF
// @access  Private
router.get('/pdf/:id', protect, downloadPDF);

// @route   POST /api/invoices/send/:id
// @desc    Send invoice via email
// @access  Private
router.post('/send/:id', protect, sendInvoice);

// ============================================
// GENERAL COLLECTION ROUTE
// ============================================

// @route   GET /api/invoices
// @desc    Get all user's invoices (with pagination & filters)
// @access  Private
router.get('/', protect, getInvoices);

// ============================================
// PARAMETERIZED ROUTES (MUST BE LAST)
// ============================================

// @route   GET /api/invoices/:id
// @desc    Get single invoice by ID
// @access  Private
router.get('/:id', protect, getInvoice);

// @route   PUT /api/invoices/:id
// @desc    Update invoice
// @access  Private
router.put('/:id', protect, updateInvoice);

// @route   DELETE /api/invoices/:id
// @desc    Delete invoice
// @access  Private
router.delete('/:id', protect, deleteInvoice);

module.exports = router;