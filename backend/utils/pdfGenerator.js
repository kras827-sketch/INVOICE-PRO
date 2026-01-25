// utils/pdfGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate professional invoice PDF
 * @param {Object} invoice - Invoice data from database
 * @param {string} outputPath - Where to save PDF
 * @returns {Promise} - Resolves when PDF is created
 */
const generateInvoicePDF = (invoice, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });

      // Pipe to file
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Colors
      const primaryColor = '#4F46E5';
      const textColor = '#1F2937';
      const grayColor = '#6B7280';

      // Header
      doc.fillColor(primaryColor)
         .fontSize(28)
         .text('INVOICE', 50, 50);

      // Company logo (if exists)
      if (invoice.companyLogo && fs.existsSync(invoice.companyLogo)) {
        doc.image(invoice.companyLogo, 450, 50, { width: 100 });
      }

      // Company details (Business Name)
      doc.fillColor(textColor)
         .fontSize(12)
         .text(invoice.businessName || invoice.companyName, 50, 100, { bold: true })
         .fontSize(10)
         .fillColor(grayColor)
         .text(invoice.businessAddress || invoice.companyAddress, 50, 120)
         .text(invoice.businessEmail || invoice.companyEmail, 50, 135);
      
      if (invoice.businessPhone) {
        doc.text(invoice.businessPhone, 50, 150);
      }

      // Invoice details (right side)
      doc.fillColor(textColor)
         .fontSize(10)
         .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 100)
         .text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 400, 115);

      if (invoice.dueDate) {
        doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 130);
      }

      // Bill to
      doc.fontSize(12)
         .fillColor(textColor)
         .text('BILL TO:', 50, 180)
         .fontSize(11)
         .text(invoice.clientName, 50, 200)
         .fontSize(10)
         .fillColor(grayColor)
         .text(invoice.clientEmail, 50, 215)
         .text(invoice.clientAddress, 50, 230);

      // Line items table
      const tableTop = 300;
      const itemX = 50;
      const descX = 200;
      const qtyX = 350;
      const priceX = 420;
      const amountX = 490;

      // Table header
      doc.fillColor(primaryColor)
         .fontSize(10)
         .text('ITEM', itemX, tableTop)
         .text('DESCRIPTION', descX, tableTop)
         .text('QTY', qtyX, tableTop)
         .text('PRICE', priceX, tableTop)
         .text('AMOUNT', amountX, tableTop);

      // Draw line under header
      doc.moveTo(50, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke(primaryColor);

      // Table rows
      let yPosition = tableTop + 30;
      doc.fillColor(textColor).fontSize(9);

      invoice.items.forEach((item) => {
        doc.text(item.name, itemX, yPosition, { width: 140 })
           .text(item.description || '', descX, yPosition, { width: 140 })
           .text(item.quantity.toString(), qtyX, yPosition)
           .text(`$${item.price.toFixed(2)}`, priceX, yPosition)
           .text(`$${item.amount.toFixed(2)}`, amountX, yPosition);
        
        yPosition += 25;
      });

      // Totals section
      yPosition += 20;
      const totalsX = 400;

      doc.fontSize(10)
         .text('Subtotal:', totalsX, yPosition)
         .text(`$${invoice.subtotal.toFixed(2)}`, amountX, yPosition);

      yPosition += 20;
      doc.text(`Tax (${invoice.taxRate}%):`, totalsX, yPosition)
         .text(`$${invoice.taxAmount.toFixed(2)}`, amountX, yPosition);

      yPosition += 20;
      doc.fillColor(primaryColor)
         .fontSize(12)
         .text('Total:', totalsX, yPosition)
         .text(`$${invoice.total.toFixed(2)}`, amountX, yPosition);

      // Notes
      if (invoice.notes) {
        doc.fillColor(textColor)
           .fontSize(10)
           .text('Notes:', 50, yPosition + 40)
           .fillColor(grayColor)
           .fontSize(9)
           .text(invoice.notes, 50, yPosition + 60, { width: 500 });
      }

      // Footer
      doc.fontSize(8)
         .fillColor(grayColor)
         .text('Thank you for your business!', 50, 750, { align: 'center' });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF };