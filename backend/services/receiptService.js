/**
 * Receipt Service
 * Handles receipt creation, PDF generation, and email sending
 * linked to Invoice model
 */

const Receipt = require('../models/Receipt');
const Invoice = require('../models/Invoice');
const PDFDocument = require('pdfkit');
const stream = require('stream');
const qrCodeService = require('./qrCodeService');
const invoiceEmailService = require('./invoiceEmailService');
const { formatCurrency } = require('../utils/currencyUtils');
const crypto = require('crypto');

/**
 * Create receipt from invoice
 * Called when "Mark as Paid" is clicked
 * @param {string} invoiceId - Invoice ID
 * @param {string} userId - User ID
 * @param {Object} options - Additional options (paymentMethod, etc)
 * @returns {Promise<Object>} - Receipt document
 */
exports.createReceiptFromInvoice = async (invoiceId, userId, options = {}) => {
  try {
    console.log('📝 Creating receipt from invoice:', invoiceId);

    // Check if receipt already exists
    const existingReceipt = await Receipt.findOne({ invoice: invoiceId });
    if (existingReceipt) {
      console.log('⚠️ Receipt already exists for this invoice');
      return existingReceipt;
    }

    // Fetch invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.user.toString() !== userId.toString()) {
      throw new Error('Unauthorized: Invoice does not belong to user');
    }

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Build verification URL
    const publicReceiptId = crypto.randomBytes(16).toString('hex');
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${baseUrl}/verify/${publicReceiptId}`;

    // Generate QR code
    const qrCodeData = await qrCodeService.generateQRCode(verificationUrl);

    // Create receipt document
    const receipt = new Receipt({
      invoice: invoiceId,
      user: userId,
      publicReceiptId,
      receiptNumber,
      invoiceNumber: invoice.invoiceNumber,
      business: {
        name: invoice.company.name,
        logo: invoice.company.logo,
        address: invoice.company.address,
        email: invoice.company.email,
        phone: invoice.company.phone
      },
      customer: {
        name: invoice.client.name,
        email: invoice.client.email,
        phone: invoice.client.phone,
        address: invoice.client.address
      },
      items: invoice.items,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      discount: invoice.discount,
      totalPaid: invoice.total,
      currency: invoice.currency,
      locale: invoice.locale,
      paymentMethod: options.paymentMethod || 'bank_transfer',
      paymentDate: options.paymentDate || new Date(),
      status: 'verified',
      qrCode: qrCodeData,
      verificationUrl
    });

    await receipt.save();
    console.log('✅ Receipt created successfully:', receipt._id);

    return receipt;
  } catch (error) {
    console.error('❌ Error creating receipt:', error.message);
    throw error;
  }
};

/**
 * Generate receipt PDF
 * @param {Object} receipt - Receipt document
 * @returns {Promise<Buffer>} - PDF buffer
 */
exports.generateReceiptPDF = async (receipt) => {
  try {
    console.log('📄 Generating receipt PDF for:', receipt.receiptNumber);

    return new Promise((resolve, reject) => {
      const buffer = [];
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      doc.on('data', chunk => buffer.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffer)));
      doc.on('error', reject);
      // New refined styling for professional receipt (Opay-like)
      const brand = '#0f172a';
      const accent = '#0ea5a4';
      const muted = '#475569';
      const light = '#f8fafc';
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      // Top accent stripe
      doc.rect(doc.page.margins.left, 20, pageWidth, 6).fill(accent);

      // Header: logo left, business details right
      const headerY = 36;
      if (receipt.business.logo && receipt.business.logo.startsWith('data:')) {
        try {
          const imgBuf = Buffer.from(receipt.business.logo.split(',')[1], 'base64');
          doc.image(imgBuf, doc.page.margins.left, headerY, { width: 72, height: 72 });
        } catch (e) {
          // fallback to text title
          doc.fontSize(16).font('Helvetica-Bold').fillColor(brand);
          doc.text(receipt.business.name || 'Business', doc.page.margins.left, headerY);
        }
      } else {
        doc.fontSize(20).font('Helvetica-Bold').fillColor(brand);
        doc.text(receipt.business.name || 'Business', doc.page.margins.left, headerY);
      }

      // Business block on the right
      const businessBlockX = doc.page.width - doc.page.margins.right - 240;
      doc.fontSize(10).font('Helvetica-Bold').fillColor(brand);
      doc.text('Payment Receipt', businessBlockX, headerY);
      doc.moveTo(businessBlockX, headerY + 16);
      doc.fontSize(9).font('Helvetica').fillColor(muted);
      doc.text(`Receipt #: ${receipt.receiptNumber}`, businessBlockX, headerY + 18);
      doc.text(`Paid: ${new Date(receipt.paymentDate).toLocaleDateString()}`, businessBlockX, headerY + 34);

      // Large total centered
      doc.fontSize(28).font('Helvetica-Bold').fillColor(accent);
      doc.text(formatCurrency(receipt.totalPaid, receipt.currency), { align: 'center' });
      doc.moveDown(0.5);

      // Divider
      doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor('#e6eef0').lineWidth(1).stroke();
      doc.moveDown(0.6);

      // Two column details
      const leftX = doc.page.margins.left;
      const rightX = doc.page.width / 2 + 10;
      const startYDetails = doc.y;

      doc.fontSize(10).font('Helvetica-Bold').fillColor(muted);
      doc.text('Paid To', leftX, startYDetails);
      doc.fontSize(10).font('Helvetica').fillColor('#111827');
      doc.text(receipt.business.name || '', leftX, startYDetails + 14);
      doc.text(receipt.business.address || '', leftX, startYDetails + 28);

      doc.fontSize(10).font('Helvetica-Bold').fillColor(muted);
      doc.text('Received From', rightX, startYDetails);
      doc.fontSize(10).font('Helvetica').fillColor('#111827');
      doc.text(receipt.customer.name || '', rightX, startYDetails + 14);
      doc.text(receipt.customer.address || '', rightX, startYDetails + 28);

      doc.moveDown(4);

      // Items table header
      const tableX = doc.page.margins.left;
      const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      doc.fontSize(9).font('Helvetica-Bold').fillColor(muted);
      doc.text('Description', tableX, doc.y, { continued: true, width: tableWidth * 0.6 });
      doc.text('Amount', tableX + tableWidth * 0.6, doc.y, { align: 'right' });
      doc.moveDown(0.4);

      doc.fontSize(9).font('Helvetica').fillColor('#111827');
      receipt.items.forEach((item) => {
        const desc = `${item.quantity} x ${item.name}`;
        doc.text(desc, tableX, doc.y, { continued: true, width: tableWidth * 0.6 });
        doc.text(formatCurrency((item.quantity || 1) * (item.price || item.rate || 0), receipt.currency), tableX + tableWidth * 0.6, doc.y, { align: 'right' });
        doc.moveDown(0.4);
      });

      // Totals
      doc.moveDown(0.6);
      const totalsX = tableX + tableWidth * 0.6;
      doc.fontSize(10).font('Helvetica').fillColor(muted);
      doc.text('Subtotal', totalsX, doc.y, { width: tableWidth * 0.4, align: 'right' });
      doc.text(formatCurrency(receipt.subtotal || 0, receipt.currency), totalsX + 2, doc.y, { align: 'right' });
      doc.moveDown(0.4);
      if (receipt.discount > 0) {
        doc.text('Discount', totalsX, doc.y, { width: tableWidth * 0.4, align: 'right' });
        doc.text(`-${formatCurrency(receipt.discount, receipt.currency)}`, totalsX + 2, doc.y, { align: 'right' });
        doc.moveDown(0.4);
      }
      if (receipt.taxAmount > 0) {
        doc.text('Tax', totalsX, doc.y, { width: tableWidth * 0.4, align: 'right' });
        doc.text(formatCurrency(receipt.taxAmount, receipt.currency), totalsX + 2, doc.y, { align: 'right' });
        doc.moveDown(0.4);
      }

      doc.fontSize(12).font('Helvetica-Bold').fillColor(brand);
      doc.text('TOTAL PAID', totalsX, doc.y, { width: tableWidth * 0.4, align: 'right' });
      doc.text(formatCurrency(receipt.totalPaid, receipt.currency), totalsX + 2, doc.y, { align: 'right' });

      // QR on the right bottom
      doc.moveDown(1.5);
      if (receipt.qrCode && receipt.qrCode.startsWith('data:')) {
        try {
          const qrBuf = Buffer.from(receipt.qrCode.split(',')[1], 'base64');
          const qrX = doc.page.width - doc.page.margins.right - 100;
          doc.image(qrBuf, qrX, doc.y, { width: 90, height: 90 });
          doc.fontSize(9).fillColor(muted);
          doc.text('Scan to verify', qrX, doc.y + 96, { width: 90, align: 'center' });
        } catch (e) {
          console.log('Note: QR embedding skipped');
        }
      }

      // Footer
      doc.moveTo(doc.page.margins.left, doc.page.height - 90).lineTo(doc.page.width - doc.page.margins.right, doc.page.height - 90).strokeColor('#eef2f3').lineWidth(1).stroke();
      doc.fontSize(9).fillColor('#94a3b8');
      doc.text(`Receipt ID: ${receipt.publicReceiptId.toUpperCase()} • Generated: ${new Date().toLocaleString()}`, doc.page.margins.left, doc.page.height - 70, { align: 'center', width: pageWidth });

      doc.end();
    });
  } catch (error) {
    console.error('❌ Error generating receipt PDF:', error.message);
    throw error;
  }
};

/**
 * Send receipt email
 * @param {Object} receipt - Receipt document
 * @param {Buffer} pdfBuffer - Receipt PDF buffer
 * @returns {Promise<Object>} - Email result
 */
exports.sendReceiptEmail = async (receipt, pdfBuffer) => {
  try {
    console.log('📧 Sending receipt email to:', receipt.customer.email);

    const business = receipt.business;
    // Build HTML content for receipt email (professional, simple)
    const itemsHtml = (receipt.items || []).map(item => {
      const name = item.description || item.name || 'Item';
      const qty = item.quantity || 1;
      const rate = item.rate || item.price || 0;
      const lineTotal = (qty * rate) || 0;
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${qty}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${receipt.currency || 'NGN'} ${rate.toLocaleString()}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${receipt.currency || 'NGN'} ${lineTotal.toLocaleString()}</td>
      </tr>`;
    }).join('');

    const htmlContent = `
      <!doctype html>
      <html>
      <body style="font-family: Inter,Segoe UI, Tahoma, sans-serif; background:#f8fafc; padding:20px;">
        <div style="max-width:650px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 6px 18px rgba(15,23,42,0.06);">
          <div style="background:${business && business.color ? business.color : '#0F172A'};color:#fff;padding:16px 20px;font-weight:700;">
            ${business.name || 'Payment Receipt'}
          </div>
          <div style="padding:20px;">
            <h2 style="margin:0 0 8px 0;color:#0F172A;">Receipt ${receipt.receiptNumber}</h2>
            <p style="color:#334155;margin:0 0 12px 0;">Hello ${receipt.customer?.name || 'Customer'},</p>
            <p style="color:#334155;margin:0 0 12px 0;">Thank you for your payment. A receipt has been attached to this email.</p>

            <table style="width:100%;border-collapse:collapse;margin:14px 0;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:10px;text-align:left;border-bottom:2px solid #e5e7eb;">Description</th>
                  <th style="padding:10px;text-align:center;border-bottom:2px solid #e5e7eb;">Qty</th>
                  <th style="padding:10px;text-align:right;border-bottom:2px solid #e5e7eb;">Rate</th>
                  <th style="padding:10px;text-align:right;border-bottom:2px solid #e5e7eb;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="text-align:right;margin-top:8px;">
              <p style="margin:4px 0;">Subtotal: <strong>${receipt.currency || 'NGN'} ${(receipt.subtotal || 0).toLocaleString()}</strong></p>
              ${receipt.taxAmount ? `<p style="margin:4px 0;">Tax: ${receipt.currency || 'NGN'} ${(receipt.taxAmount || 0).toLocaleString()}</p>` : ''}
              ${receipt.discount ? `<p style="margin:4px 0;color:#ef4444;">Discount: -${receipt.currency || 'NGN'} ${(receipt.discount || 0).toLocaleString()}</p>` : ''}
              <h3 style="color:#0F172A;margin:8px 0;">Total Paid: ${receipt.currency || 'NGN'} ${(receipt.totalPaid || 0).toLocaleString()}</h3>
            </div>

            <p style="margin-top:18px;color:#334155;">If you have questions, reply to this email and we'll help.</p>
          </div>
          <div style="background:#f8fafc;padding:14px;text-align:center;color:#64748b;font-size:12px;">Sent via InvoicePro</div>
        </div>
      </body>
      </html>
    `;

    const result = await invoiceEmailService.sendInvoiceEmail({
      email: receipt.customer.email,
      subject: `Payment Receipt ${receipt.receiptNumber}`,
      htmlContent,
      pdfBuffer,
      invoiceNumber: receipt.receiptNumber
    });

    // Track email send
    receipt.emailsSent.push({
      sentTo: receipt.customer.email,
      messageId: result.id
    });
    await receipt.save();

    console.log('✅ Receipt email sent successfully');
    return result;
  } catch (error) {
    console.error('❌ Error sending receipt email:', error.message);
    throw error;
  }
};

/**
 * Get receipt by ID
 * @param {string} receiptId - Receipt model ID
 * @param {string} userId - User ID for authorization
 * @returns {Promise<Object>} - Receipt document
 */
exports.getReceipt = async (receiptId, userId) => {
  try {
    const receipt = await Receipt.findById(receiptId).populate('invoice');

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    if (receipt.user.toString() !== userId) {
      throw new Error('Unauthorized');
    }

    return receipt;
  } catch (error) {
    console.error('❌ Error fetching receipt:', error.message);
    throw error;
  }
};

/**
 * Get receipt by public ID (for verification page)
 * @param {string} publicReceiptId - Public receipt ID
 * @returns {Promise<Object>} - Receipt document (public data only)
 */
exports.getPublicReceipt = async (publicReceiptId) => {
  try {
    const receipt = await Receipt.findOne({ publicReceiptId });

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    if (receipt.status !== 'verified') {
      throw new Error('Receipt has been cancelled or is pending');
    }

    return receipt;
  } catch (error) {
    console.error('❌ Error fetching public receipt:', error.message);
    throw error;
  }
};

/**
 * Get all receipts for user
 * @param {string} userId - User ID
 * @param {number} skip - Pagination skip
 * @param {number} limit - Pagination limit
 * @returns {Promise<Array>} - Receipt documents
 */
exports.getUserReceipts = async (userId, skip = 0, limit = 20) => {
  try {
    const receipts = await Receipt.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('invoice');

    return receipts;
  } catch (error) {
    console.error('❌ Error fetching user receipts:', error.message);
    throw error;
  }
};

/**
 * Resend receipt email
 * @param {string} receiptId - Receipt ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Email result
 */
exports.resendReceiptEmail = async (receiptId, userId) => {
  try {
    const receipt = await exports.getReceipt(receiptId, userId);

    // Generate fresh PDF
    const pdfBuffer = await exports.generateReceiptPDF(receipt);

    // Send email
    const result = await exports.sendReceiptEmail(receipt, pdfBuffer);

    return result;
  } catch (error) {
    console.error('❌ Error resending receipt email:', error.message);
    throw error;
  }
};
