/**
 * Receipt Routes
 * Handles receipt creation, retrieval, and email management
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const receiptService = require('../services/receiptService');
const Receipt = require('../models/Receipt');

/**
 * POST /api/receipts/create
 * Create receipt from invoice (triggered by mark as paid)
 */
router.post('/create', protect, async (req, res) => {
  try {
    const { invoiceId, paymentMethod, paymentDate, email } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ success: false, message: 'Invoice ID is required' });
    }

    // Create receipt
    const receipt = await receiptService.createReceiptFromInvoice(
      invoiceId,
      req.user._id,
      { paymentMethod, paymentDate }
    );

    // Generate PDF
    const pdfBuffer = await receiptService.generateReceiptPDF(receipt);

    // Update customer email temporarily for this send if custom email provided
    const originalEmail = receipt.customer.email;
    if (email) {
      receipt.customer.email = email;
    }

    // Send email
    await receiptService.sendReceiptEmail(receipt, pdfBuffer);

    // Revert to original
    if (email) {
      receipt.customer.email = originalEmail;
    }

    res.status(201).json({
      success: true,
      message: 'Receipt created and email sent',
      receipt: {
        _id: receipt._id,
        receiptNumber: receipt.receiptNumber,
        publicReceiptId: receipt.publicReceiptId,
        verificationUrl: receipt.verificationUrl
      }
    });

  } catch (error) {
    console.error('❌ Receipt creation error:', error.message);

    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        message: 'Receipt already exists for this invoice'
      });
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating receipt',
      error: error.message
    });
  }
});

/**
 * GET /api/receipts/verify/:publicReceiptId
 * Verify receipt (public, no auth required)
 */
router.get('/verify/:publicReceiptId', async (req, res) => {
  try {
    const receipt = await receiptService.getPublicReceipt(req.params.publicReceiptId);

    // Return only necessary public information
    res.json({
      success: true,
      receipt: {
        receiptNumber: receipt.receiptNumber,
        invoiceNumber: receipt.invoiceNumber,
        business: receipt.business,
        customer: receipt.customer,
        totalPaid: receipt.totalPaid,
        currency: receipt.currency,
        paymentDate: receipt.paymentDate,
        paymentMethod: receipt.paymentMethod,
        status: receipt.status,
        publicReceiptId: receipt.publicReceiptId,
        items: receipt.items,
        subtotal: receipt.subtotal,
        taxRate: receipt.taxRate,
        taxAmount: receipt.taxAmount,
        discount: receipt.discount,
        createdAt: receipt.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Receipt verification error:', error.message);

    if (error.message === 'Receipt not found') {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    res.status(error.message.includes('cancelled') ? 400 : 500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/receipts/:receiptId
 * Get receipt details (private)
 */
router.get('/:receiptId', protect, async (req, res) => {
  try {
    const receipt = await receiptService.getReceipt(req.params.receiptId, req.user._id);

    res.json({
      success: true,
      receipt
    });
  } catch (error) {
    console.error('❌ Fetch receipt error:', error.message);

    if (error.message === 'Unauthorized') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.status(error.message === 'Receipt not found' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
});



/**
 * GET /api/receipts
 * Get all receipts for user (with pagination)
 * Optional: ?invoiceId=xxx to filter by linked invoice
 */
router.get('/', protect, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    // If invoiceId is provided, find receipt for that specific invoice
    if (req.query.invoiceId) {
      const receipt = await Receipt.findOne({
        user: req.user._id,
        invoice: req.query.invoiceId
      }).populate('invoice');

      return res.json({
        success: true,
        receipts: receipt ? [receipt] : [],
        pagination: { page: 1, limit: 1, total: receipt ? 1 : 0, pages: 1 }
      });
    }

    const receipts = await receiptService.getUserReceipts(req.user._id, skip, limit);
    const total = await Receipt.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      receipts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Fetch receipts error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching receipts',
      error: error.message
    });
  }
});

/**
 * GET /api/receipts/:receiptId/pdf
 * Download receipt PDF
 */
router.get('/:receiptId/pdf', protect, async (req, res) => {
  try {
    const receipt = await receiptService.getReceipt(req.params.receiptId, req.user._id);
    const pdfBuffer = await receiptService.generateReceiptPDF(receipt);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${receipt.receiptNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('❌ PDF download error:', error.message);

    if (error.message === 'Unauthorized') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.status(error.message === 'Receipt not found' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/receipts/:receiptId/resend
 * Resend receipt email
 */
router.post('/:receiptId/resend', protect, async (req, res) => {
  try {
    await receiptService.resendReceiptEmail(req.params.receiptId, req.user._id);

    res.json({
      success: true,
      message: 'Receipt email resent successfully'
    });
  } catch (error) {
    console.error('❌ Resend receipt email error:', error.message);

    if (error.message === 'Unauthorized') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.status(error.message === 'Receipt not found' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/receipts/:receiptId/send
 * Send receipt to specific email (might be different from original)
 */
router.post('/:receiptId/send', protect, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const receipt = await receiptService.getReceipt(req.params.receiptId, req.user._id);

    // Update customer email temporarily for this send
    const originalEmail = receipt.customer.email;
    receipt.customer.email = email;

    const pdfBuffer = await receiptService.generateReceiptPDF(receipt);
    await receiptService.sendReceiptEmail(receipt, pdfBuffer);

    // Revert to original
    receipt.customer.email = originalEmail;

    res.json({
      success: true,
      message: `Receipt sent to ${email}`
    });
  } catch (error) {
    console.error('❌ Send receipt email error:', error.message);

    if (error.message === 'Unauthorized') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.status(error.message === 'Receipt not found' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
