const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const invoiceEmailService = require('../services/invoiceEmailService');
const otpService = require('../services/otpService');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const multer = require('multer');

// Use memory storage - small PDFs only (keeps code minimal and avoids extra deps)
const upload = multer({ storage: multer.memoryStorage() });

/**
 * EMAIL ROUTES
 */

// POST /api/email/send-invoice - Send invoice via email
// Accepts multipart/form-data with optional `pdf` file
router.post('/send-invoice', protect, upload.single('pdf'), async (req, res) => {
  try {
    console.log('📧 Email route hit');
    console.log('🔐 User:', req.user?.email);
    const { email, subject, html, invoiceNumber, clientName, amount, dueDate } = req.body;
    
    console.log('📋 Request body keys:', Object.keys(req.body).join(', '));
    console.log('📎 File received:', !!req.file, req.file?.size, 'bytes');

    if (!email) {
      console.error('❌ No email provided');
      return res.status(400).json({ message: 'Email required' });
    }

    // If HTML not provided, generate a simple template
    let htmlContent = html || generateSimpleInvoiceHTML({
      invoiceNumber,
      clientName,
      amount,
      dueDate
    });

    // If a file was uploaded, use its buffer
    let pdfBuffer = null;
    if (req.file && req.file.buffer) {
      pdfBuffer = req.file.buffer;
      console.log('✅ Using PDF from file upload:', pdfBuffer.length, 'bytes');
    } else if (req.body.pdf) {
      // If client sent base64 in body
      const maybeBase64 = req.body.pdf;
      if (typeof maybeBase64 === 'string') {
        try {
          pdfBuffer = Buffer.from(maybeBase64, 'base64');
          console.log('✅ Using PDF from base64:', pdfBuffer.length, 'bytes');
        } catch (err) {
          console.warn('⚠️ Failed to decode base64 PDF:', err.message);
          pdfBuffer = null;
        }
      }
    }

    console.log('📤 Sending email to:', email);
    console.log('📑 Subject:', subject);
    console.log('📎 Attachment:', pdfBuffer ? `${pdfBuffer.length} bytes` : 'none');

    // Use dedicated invoice email service for sending invoices
    const result = await invoiceEmailService.sendInvoiceEmail({
      email,
      subject: subject || `Invoice ${invoiceNumber || 'Receipt'}`,
      htmlContent,
      pdfBuffer,
      invoiceNumber: invoiceNumber || 'INV'
    });

    console.log('✅ Email sent successfully:', result.messageId);
    res.status(200).json({
      success: true,
      message: 'Invoice sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('❌ Send invoice error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice',
      error: error.message
    });
  }
});

// Helper function to generate simple HTML for invoice
const generateSimpleInvoiceHTML = ({ invoiceNumber, clientName, amount, dueDate }) => {
  return `
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <h2>Invoice ${invoiceNumber || 'Receipt'}</h2>
      <p>Dear ${clientName || 'Valued Customer'},</p>
      <p>Please find your invoice details below:</p>
      <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #f0f0f0;">
          <td style="padding: 10px; border: 1px solid #ddd;">Invoice Number</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${invoiceNumber || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">Amount Due</td>
          <td style="padding: 10px; border: 1px solid #ddd;">₦${amount || 0}</td>
        </tr>
        <tr style="background-color: #f0f0f0;">
          <td style="padding: 10px; border: 1px solid #ddd;">Due Date</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}</td>
        </tr>
      </table>
      <p>Thank you for your business!</p>
      <p>Best regards,<br>Your Company</p>
    </body>
    </html>
  `;
};

// POST /api/email/send-otp - Send OTP via email (uses OTP service)
router.post('/send-otp', protect, async (req, res) => {
  try {
    const { email, otp, purpose = 'signup' } = req.body;
    const userId = req.user._id || req.user.uid;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP required' });
    }

    // Get user name
    const user = await User.findById(userId);
    const userName = user?.name || user?.displayName || 'User';
    const logoUrl = user?.businessProfile?.logoUrl || '';

    // Use OTP service for sending OTP emails
    const result = await otpService.sendOTPEmail(email, otp, purpose, logoUrl);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

// POST /api/email/send-welcome - Send welcome email
router.post('/send-welcome', protect, async (req, res) => {
  try {
    const userId = req.user.uid;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const result = await emailService.sendWelcomeEmail({
      email: user.email,
      userName: user.displayName
    });

    res.status(200).json({
      success: true,
      message: 'Welcome email sent',
      messageId: result.messageId
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to send welcome email',
      error: error.message
    });
  }
});

// POST /api/email/send-payment-receipt - Send payment receipt
router.post('/send-payment-receipt', protect, async (req, res) => {
  try {
    const { plan, amount, reference } = req.body;
    const userId = req.user.uid;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const result = await emailService.sendPaymentReceiptEmail({
      email: user.email,
      plan,
      amount,
      reference,
      userName: user.displayName
    });

    res.status(200).json({
      success: true,
      message: 'Payment receipt sent',
      messageId: result.messageId
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to send payment receipt',
      error: error.message
    });
  }
});

// POST /api/email/test - Test email configuration (admin only)
router.post('/test', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }

    const result = await emailService.sendTestEmail(email);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: 'Email test failed',
      error: error.message
    });
  }
});

module.exports = router;
