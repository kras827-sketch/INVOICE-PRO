// utils/emailService.js
const nodemailer = require('nodemailer');

/**
 * Create email transporter
 * Uses configuration from environment variables
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send invoice via email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Email body (plain text)
 * @param {string} options.html - Email body (HTML)
 * @param {string} options.attachmentPath - Path to PDF file
 * @param {string} options.cc - CC email (sender copy)
 * @returns {Promise} - Resolves when email is sent
 */
const sendInvoiceEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"InvoiceFlow" <${process.env.EMAIL_USER}>`,
      to: options.to,
      cc: options.cc || '',
      subject: options.subject || 'New Invoice',
      text: options.text || 'Please find attached invoice.',
      html: options.html || '<p>Please find attached invoice.</p>',
      attachments: [
        {
          filename: options.attachmentName || 'invoice.pdf',
          path: options.attachmentPath
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('❌ Email error:', error);
    throw error;
  }
};

module.exports = { sendInvoiceEmail };