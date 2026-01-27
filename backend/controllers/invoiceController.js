// backend/controllers/invoiceController.js
// Invoice controllers - full implementations

const Invoice = require('../models/Invoice');
const invoiceEmailService = require('../services/invoiceEmailService');
const PDFDocument = require('pdfkit');
const stream = require('stream');

// @desc    Create new invoice
exports.createInvoice = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      items,
      client,
      company,
      dueDate,
      taxRate = 0,
      notes = '',
      terms = '',
      template,
      discount = 0,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one invoice item is required' });
    }

    if (!company || !company.name) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    if (!client || !client.name) {
      return res.status(400).json({ success: false, message: 'Client name is required' });
    }

    // Generate invoice number
    const invoiceNumber = await Invoice.generateInvoiceNumber(userId);

    // Ensure items are in correct format
    const formattedItems = items.map(item => ({
      name: item.name || item.description || 'Item',
      quantity: item.quantity || 1,
      price: item.price || item.rate || 0
    }));

    const invoice = new Invoice({
      user: userId,
      invoiceNumber,
      invoiceDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      company: {
        name: company.name,
        address: company.address || '',
        email: company.email || '',
        phone: company.phone || '',
        logo: company.logo || company.businessLogo || ''
      },
      client: {
        name: client.name,
        address: client.address || '',
        email: client.email || '',
        phone: client.phone || ''
      },
      items: formattedItems,
      taxRate,
      notes,
      terms,
      template: template || 'modern-clean',
      discount,
    });

    await invoice.save();

    res.status(201).json({ success: true, invoice });
  } catch (err) {
    console.error('Create invoice error:', err);
    res.status(500).json({ success: false, message: 'Server error creating invoice', error: err.message });
  }
};

// @desc    Get all invoices for user (basic pagination)
exports.getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Invoice.countDocuments({ user: req.user._id })
    ]);

    res.json({ success: true, invoices, meta: { page, limit, total } });
  } catch (err) {
    console.error('Get invoices error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching invoices' });
  }
};

// @desc    Get single invoice
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (String(invoice.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this invoice' });
    }

    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Get invoice error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching invoice' });
  }
};

// @desc    Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (String(invoice.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this invoice' });
    }

    // Prevent changing protected fields
    const protectedFields = ['user', 'invoiceNumber', '_id', 'createdAt', 'updatedAt'];
    Object.keys(req.body).forEach((key) => {
      if (!protectedFields.includes(key)) {
        invoice[key] = req.body[key];
      }
    });

    await invoice.save();

    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ success: false, message: 'Server error updating invoice' });
  }
};

// @desc    Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (String(invoice.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this invoice' });
    }

    await invoice.deleteOne();
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (err) {
    console.error('Delete invoice error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting invoice' });
  }
};

// @desc    Download invoice PDF (kept simple - placeholder)
exports.downloadPDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (String(invoice.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Stream a generated PDF using pdfkit
    res.setHeader('Content-Type', 'application/pdf');
    const filename = `${invoice.invoiceNumber || 'invoice'}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    // Pipe PDF directly to response
    doc.pipe(res);

    // Header
    doc.fontSize(18).text(invoice.company?.name || 'Invoice', { align: 'left' });
    doc.moveDown(0.25);
    doc.fontSize(10).fillColor('#666').text(`Invoice #: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : ''}`);
    if (invoice.dueDate) doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`);
    doc.moveDown(0.5);

    // Company & Client
    doc.fontSize(12).fillColor('#000').text('Bill From:', { underline: true });
    doc.fontSize(10).text(invoice.company?.name || '');
    if (invoice.company?.address) doc.text(invoice.company.address);
    if (invoice.company?.email) doc.text(invoice.company.email);
    doc.moveDown(0.5);

    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.fontSize(10).text(invoice.client?.name || '');
    if (invoice.client?.address) doc.text(invoice.client.address);
    if (invoice.client?.email) doc.text(invoice.client.email);
    doc.moveDown(0.5);

    // Items
    doc.moveDown(0.5);
    doc.fontSize(11).text('Description', { continued: true, width: 300 });
    doc.text('Qty', { align: 'right', continued: true });
    doc.text('Price', { align: 'right', continued: true });
    doc.text('Total', { align: 'right' });
    doc.moveDown(0.25);

    (invoice.items || []).forEach((it) => {
      doc.fontSize(10).fillColor('#000').text(it.name, { continued: true, width: 300 });
      doc.text(String(it.quantity), { align: 'right', continued: true });
      doc.text(`₦${(it.price || 0).toLocaleString()}`, { align: 'right', continued: true });
      const lineTotal = (it.quantity || 0) * (it.price || 0);
      doc.text(`₦${lineTotal.toLocaleString()}`, { align: 'right' });
    });

    doc.moveDown(0.5);
    doc.fontSize(11).text(`Subtotal: ₦${(invoice.subtotal || 0).toLocaleString()}`, { align: 'right' });
    doc.text(`Tax (${invoice.taxRate || 0}%): ₦${(invoice.taxAmount || 0).toLocaleString()}`, { align: 'right' });
    if (invoice.discount) doc.text(`Discount: -₦${invoice.discount.toLocaleString()}`, { align: 'right' });
    doc.moveDown(0.25);
    doc.fontSize(13).text(`Total: ₦${(invoice.total || 0).toLocaleString()}`, { align: 'right' });

    if (invoice.notes) {
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333').text('Notes:');
      doc.fontSize(9).fillColor('#555').text(invoice.notes);
    }

    doc.end();
  } catch (err) {
    console.error('Download PDF error:', err);
    res.status(500).json({ success: false, message: 'Server error generating PDF' });
  }
};

// @desc    Send invoice via email
// Accepts optional PDF in req.file.buffer (via multer) or req.body.pdf (base64)
exports.sendInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (String(invoice.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Determine recipient
    const recipient = req.body.email || invoice.client?.email;
    if (!recipient) return res.status(400).json({ success: false, message: 'Recipient email required' });

    // Try to obtain pdf buffer from upload or base64 body
    let pdfBuffer = null;
    if (req.file && req.file.buffer) {
      pdfBuffer = req.file.buffer;
    } else if (req.body.pdf) {
      try {
        pdfBuffer = Buffer.from(req.body.pdf, 'base64');
      } catch (e) {
        pdfBuffer = null;
      }
    }

    // If no PDF provided, generate a simple PDF server-side using pdfkit
    if (!pdfBuffer) {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      const genPromise = new Promise((resolve, reject) => {
        doc.on('end', () => {
          pdfBuffer = Buffer.concat(buffers);
          resolve();
        });
        doc.on('error', (err) => reject(err));
      });

      // Header
      doc.fontSize(18).text(invoice.company?.name || 'Invoice', { align: 'left' });
      doc.moveDown(0.25);
      doc.fontSize(10).fillColor('#666').text(`Invoice #: ${invoice.invoiceNumber}`);
      doc.text(`Date: ${invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : ''}`);
      if (invoice.dueDate) doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`);
      doc.moveDown(0.5);

      // Company & Client
      doc.fontSize(12).fillColor('#000').text('Bill From:', { underline: true });
      doc.fontSize(10).text(invoice.company?.name || '');
      if (invoice.company?.address) doc.text(invoice.company.address);
      if (invoice.company?.email) doc.text(invoice.company.email);
      doc.moveDown(0.5);

      doc.fontSize(12).text('Bill To:', { underline: true });
      doc.fontSize(10).text(invoice.client?.name || '');
      if (invoice.client?.address) doc.text(invoice.client.address);
      if (invoice.client?.email) doc.text(invoice.client.email);
      doc.moveDown(0.5);

      // Items table header
      doc.moveDown(0.5);
      doc.fontSize(11).text('Description', { continued: true, width: 300 });
      doc.text('Qty', { align: 'right', continued: true });
      doc.text('Price', { align: 'right', continued: true });
      doc.text('Total', { align: 'right' });
      doc.moveDown(0.25);

      invoice.items.forEach((it) => {
        doc.fontSize(10).fillColor('#000').text(it.name, { continued: true, width: 300 });
        doc.text(String(it.quantity), { align: 'right', continued: true });
        doc.text(`₦${(it.price || 0).toLocaleString()}`, { align: 'right', continued: true });
        const lineTotal = (it.quantity || 0) * (it.price || 0);
        doc.text(`₦${lineTotal.toLocaleString()}`, { align: 'right' });
      });

      doc.moveDown(0.5);
      doc.fontSize(11).text(`Subtotal: ₦${(invoice.subtotal || 0).toLocaleString()}`, { align: 'right' });
      doc.text(`Tax (${invoice.taxRate || 0}%): ₦${(invoice.taxAmount || 0).toLocaleString()}`, { align: 'right' });
      if (invoice.discount) doc.text(`Discount: -₦${invoice.discount.toLocaleString()}`, { align: 'right' });
      doc.moveDown(0.25);
      doc.fontSize(13).text(`Total: ₦${(invoice.total || 0).toLocaleString()}`, { align: 'right' });

      if (invoice.notes) {
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#333').text('Notes:');
        doc.fontSize(9).fillColor('#555').text(invoice.notes);
      }

      doc.end();

      await genPromise;
    }

    // Build a simple HTML body for the email
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2>Invoice ${invoice.invoiceNumber}</h2>
          <p>Dear ${invoice.client?.name || 'Customer'},</p>
          <p>Please find attached your invoice. Total amount due: <strong>₦${(invoice.total || 0).toLocaleString()}</strong></p>
          <p>Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
          <p>Thank you for your business.</p>
        </body>
      </html>
    `;

    // Send email with attachment using dedicated invoice email service
    const result = await invoiceEmailService.sendInvoiceEmail({
      email: recipient,
      subject: `Invoice ${invoice.invoiceNumber}`,
      htmlContent,
      pdfBuffer,
      invoiceNumber: invoice.invoiceNumber
    });

    // Update invoice sent metadata
    invoice.sentTo = invoice.sentTo || [];
    if (!invoice.sentTo.includes(recipient)) invoice.sentTo.push(recipient);
    invoice.lastSentDate = new Date();
    invoice.status = 'sent';
    await invoice.save();

    res.json({ success: true, message: 'Invoice sent', messageId: result.messageId });
  } catch (err) {
    console.error('Send invoice error:', err);
    res.status(500).json({ success: false, message: 'Server error sending invoice', error: err.message });
  }
};

// @desc    Get invoice statistics
exports.getStats = async (req, res) => {
  try {
    const stats = await Invoice.getUserStats(req.user._id);
    res.json({ success: true, stats });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
};
