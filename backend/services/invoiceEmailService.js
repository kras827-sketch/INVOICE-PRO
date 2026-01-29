const nodemailer = require('nodemailer');

/**
 * 🧩 INVOICE EMAIL SERVICE
 * Completely decoupled from authentication email logic
 * Dedicated to sending invoices with PDF attachments to clients
 */

// Initialize transporter based on environment configuration
const getTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // TLS, not SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Gmail App Password (16 chars)
      },
      pool: {
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 2000,
        rateLimit: 5
      },
      logger: true,
      debug: true
    });
  } else if (process.env.EMAIL_SERVICE === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else {
    // Default fallback to Gmail with robust handling
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT === '465', 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // Disable pooling for serverless/Vercel to prevent timeouts
      pool: false, 
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      }
    });
  }
};

/**
 * Send Invoice Email to Client
 * Purpose: Deliver professional invoice PDF to client's email
 * 
 * @param {Object} options - Email configuration
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.htmlContent - HTML email body
 * @param {Buffer} options.pdfBuffer - PDF file buffer (optional)
 * @param {string} options.invoiceNumber - Invoice number for filename
 * 
 * @returns {Object} - { success: true, messageId, response }
 * @throws {Error} - Specific error message if sending fails
 */
exports.sendInvoiceEmail = async (options) => {
  try {
    const { email, subject, htmlContent, pdfBuffer, invoiceNumber } = options;

    // Validate required fields
    if (!email || !htmlContent) {
      throw new Error('Email and HTML content are required');
    }

    console.log('📧 Invoice Email Service - Sending');
    console.log('  Recipient:', email);
    console.log('  Subject:', subject);
    console.log('  PDF attached:', !!pdfBuffer ? `Yes (${pdfBuffer.length} bytes)` : 'No');

    // Initialize transporter
    const transporter = getTransporter();
    console.log('✅ Email transporter initialized');

    // Build mail options with optional PDF attachment
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: subject || `Invoice ${invoiceNumber}`,
      html: htmlContent,
      attachments: pdfBuffer ? [
        {
          filename: `${invoiceNumber || 'invoice'}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ] : []
    };

    // Send email
    console.log('📤 Sending invoice email from:', mailOptions.from);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Invoice email sent successfully');
    console.log('   Message ID:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };

  } catch (error) {
    console.error('❌ Invoice email sending error:', error.message);
    console.error('   Stack:', error.stack);
    throw new Error(`Failed to send invoice email: ${error.message}`);
  }
};

/**
 * Send Test Invoice Email
 * Purpose: Verify email configuration is working
 * 
 * @param {string} email - Test recipient email
 * @returns {Object} - { success: true, messageId, message }
 * @throws {Error} - Specific error message if test fails
 */
exports.sendTestInvoiceEmail = async (email) => {
  try {
    if (!email) {
      throw new Error('Email address required for test');
    }

    console.log('📧 Invoice Email Service - Test Email');
    console.log('  Recipient:', email);

    const transporter = getTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
          <h1 style="color: #2563eb;">✅ Invoice Email Configuration Test</h1>
          <p style="color: #333; line-height: 1.6;">
            This test email confirms that your invoice email delivery system is configured correctly.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9fafb;">
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #1f2937;">Service:</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; color: #6b7280;">Invoice Email Service</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #1f2937;">Status:</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; color: #16a34a; font-weight: bold;">✅ Operational</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #1f2937;">Sent At:</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; color: #6b7280;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
          <p style="color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
            If you received this email, your invoice email service is working correctly and ready to send client invoices.
          </p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: '✅ Invoice Email Service - Configuration Test',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Test invoice email sent successfully'
    };

  } catch (error) {
    console.error('❌ Test invoice email error:', error.message);
    throw new Error(`Invoice email test failed: ${error.message}`);
  }
};

module.exports = exports;
