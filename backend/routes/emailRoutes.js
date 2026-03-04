const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const invoiceEmailService = require('../services/invoiceEmailService');

// Configure multer for in-memory file uploads (PDF attachments)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// @route   POST /api/email/test
// @desc    Send a test email to verify credentials
// @access  Private
router.post('/test', protect, async (req, res) => {
  try {
    const { email } = req.body;
    const targetEmail = email || req.user.email;
    
    const result = await invoiceEmailService.sendTestInvoiceEmail(targetEmail);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email', 
      error: error.message 
    });
  }
});

// @route   POST /api/email/send-invoice
// @desc    Send an invoice PDF via email
// @access  Private
// Expects FormData with fields: email, subject, invoiceData (JSON string), pdf (file)
router.post('/send-invoice', protect, upload.single('pdf'), async (req, res) => {
  try {
    console.log('📧 [emailRoutes] /send-invoice hit');
    console.log('   Body keys:', Object.keys(req.body));
    console.log('   File present:', !!req.file);

    const { email, subject, invoiceData, html } = req.body;

    console.log('📧 Email data received:');
    console.log('   email:', email);
    console.log('   subject:', subject);
    console.log('   html provided:', !!html);
    console.log('   html length:', html ? html.length : 0);
    console.log('   html preview:', html ? html.substring(0, 100) + '...' : 'none');
    console.log('   invoiceData provided:', !!invoiceData);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Recipient email is required' });
    }

    // Parse invoice data if sent as JSON string
    let parsedInvoiceData = null;
    if (invoiceData) {
      try {
        parsedInvoiceData = JSON.parse(invoiceData);
      } catch (e) {
        console.warn('⚠️ Could not parse invoiceData:', e.message);
      }
    }

    // Build HTML content - use provided html, or generate from invoiceData, or minimal fallback
    let htmlContent = html || '';
    if (!htmlContent && parsedInvoiceData) {
      // Generate a professional HTML email from invoice data
      const inv = parsedInvoiceData;
      const items = (inv.items || []).map(item => {
        const name = item.description || item.name || 'Item';
        const qty = item.quantity || 1;
        const rate = item.rate || item.price || 0;
        const lineTotal = qty * rate;
        return `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${qty}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${inv.currency || 'NGN'} ${rate.toLocaleString()}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${inv.currency || 'NGN'} ${lineTotal.toLocaleString()}</td>
        </tr>`;
      }).join('');

      htmlContent = `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Inter, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; background: #F8FAFC; padding: 16px;">
            <div style="max-width:650px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 6px 18px rgba(15,23,42,0.06);">
              <div style="background:#0F172A;color:#fff;padding:18px 22px;font-weight:700;">${inv.senderName || inv.company?.name || inv.businessName || 'Invoice'}</div>
              <div style="padding:20px;">
                <h2 style="margin:0 0 8px 0;color:#0F172A;">Invoice ${inv.invoiceNumber || ''}</h2>
                <p style="color:#334155;margin:0 0 12px 0;">Dear ${inv.clientName || inv.client?.name || inv.toName || 'Customer'},</p>
                <p style="color:#334155;margin:0 0 12px 0;">Please find your invoice attached. Below is a summary.</p>

                <table style="width:100%;border-collapse:collapse;margin:14px 0;">
                  <thead>
                    <tr style="background:#F8FAFC;">
                      <th style="padding:10px;text-align:left;border-bottom:2px solid #e5e7eb;">Description</th>
                      <th style="padding:10px;text-align:center;border-bottom:2px solid #e5e7eb;">Qty</th>
                      <th style="padding:10px;text-align:right;border-bottom:2px solid #e5e7eb;">Rate</th>
                      <th style="padding:10px;text-align:right;border-bottom:2px solid #e5e7eb;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items}
                  </tbody>
                </table>

                <div style="text-align:right;margin-top:8px;">
                  <p style="margin:4px 0;">Subtotal: <strong>${inv.currency || 'NGN'} ${(inv.subtotal || 0).toLocaleString()}</strong></p>
                  ${inv.taxRate ? `<p style="margin:4px 0;">Tax (${inv.taxRate}%): ${inv.currency || 'NGN'} ${(inv.tax || inv.taxAmount || 0).toLocaleString()}</p>` : ''}
                  ${inv.discount ? `<p style="margin:4px 0;color:#ef4444;">Discount: -${inv.currency || 'NGN'} ${(inv.discount || 0).toLocaleString()}</p>` : ''}
                  <h3 style="color:#0F172A;margin:8px 0;">Total: ${inv.currency || 'NGN'} ${(inv.total || 0).toLocaleString()}</h3>
                </div>

                ${inv.dueDate ? `<p style="margin-top:12px;"><strong>Due Date:</strong> ${new Date(inv.dueDate).toLocaleDateString()}</p>` : ''}
                ${inv.notes ? `<p style="color:#666;border-top:1px solid #eee;padding-top:10px;margin-top:12px;"><em>Notes: ${inv.notes}</em></p>` : ''}

                <p style="margin-top:18px;color:#334155;">If you have questions, reply to this email and we'll help.</p>
              </div>
              <div style="background:#F8FAFC;padding:14px;text-align:center;color:#64748b;font-size:12px;">Sent via InvoicePro</div>
            </div>
          </body>
        </html>
      `;
    }

    if (!htmlContent) {
      htmlContent = `<p>Please find your invoice attached.</p>`;
    }

    // Get PDF buffer from multer file upload
    const pdfBuffer = req.file ? req.file.buffer : null;

    console.log('📧 Sending invoice email:');
    console.log('   To:', email);
    console.log('   Subject:', subject);
    console.log('   PDF size:', pdfBuffer ? `${pdfBuffer.length} bytes` : 'No PDF');

    const result = await invoiceEmailService.sendInvoiceEmail({
      email,
      subject: subject || 'Your Invoice',
      htmlContent,
      pdfBuffer,
      invoiceNumber: parsedInvoiceData?.invoiceNumber || 'invoice'
    });

    res.status(200).json({
      success: true,
      message: 'Invoice email sent successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Send invoice email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send invoice email', 
      error: error.message 
    });
  }
});

module.exports = router;
