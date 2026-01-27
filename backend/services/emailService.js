const nodemailer = require('nodemailer');

/**
 * EMAIL SERVICE - Administrative Emails Only
 * Handles non-OTP, non-invoice emails
 * - Welcome emails
 * - Payment receipts  
 * - Test emails
 * 
 * ⚠️ IMPORTANT: Do NOT add OTP emails here (use otpService)
 * ⚠️ IMPORTANT: Do NOT add invoice emails here (use invoiceEmailService)
 */

// Initialize transporter based on environment
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
    // Default fallback to Gmail
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      pool: {
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 2000,
        rateLimit: 5
      }
    });
  }
};

/**
 * Send Welcome Email
 * Sent when user signs up
 */
exports.sendWelcomeEmail = async (options) => {
  try {
    const { email, userName } = options;

    if (!email) {
      throw new Error('Email required');
    }

    const transporter = getTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
          .header { color: #667eea; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          .content { color: #333; line-height: 1.6; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin-top: 20px; }
          .features { margin: 20px 0; }
          .feature-item { margin: 10px 0; padding-left: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">👋 Welcome to Invoice Generator SaaS!</div>
          <p>Hello ${userName || 'User'},</p>
          <p>Thank you for signing up! We're excited to have you on board.</p>
          <div class="features">
            <strong>Get started with these features:</strong>
            <div class="feature-item">✅ Create professional invoices in seconds</div>
            <div class="feature-item">✅ Choose from 4 beautiful templates</div>
            <div class="feature-item">✅ Download as PDF or send via email</div>
            <div class="feature-item">✅ Track payments and manage clients</div>
          </div>
          <p><a href="https://app.invoicegenerator.com/dashboard" class="button">Go to Dashboard</a></p>
          <p>Need help? Contact our support team at support@invoicegenerator.com</p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Welcome to Invoice Generator SaaS, ${userName || 'User'}!`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Welcome email error:', error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

/**
 * Send Payment Receipt Email
 * Sent after successful payment
 */
exports.sendPaymentReceiptEmail = async (options) => {
  try {
    const { email, plan, amount, reference, userName } = options;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
          .success { color: #28a745; font-size: 20px; margin-bottom: 20px; }
          .receipt-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .receipt-table td { padding: 10px; border-bottom: 1px solid #ddd; }
          .receipt-table .label { font-weight: bold; width: 40%; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✅ Payment Received!</div>
          <p>Hello ${userName || 'User'},</p>
          <p>Thank you for your payment. Your subscription has been activated.</p>
          <table class="receipt-table">
            <tr>
              <td class="label">Plan:</td>
              <td>${plan.toUpperCase()} PLAN</td>
            </tr>
            <tr>
              <td class="label">Amount:</td>
              <td>₦${(amount / 100).toLocaleString('en-NG')}</td>
            </tr>
            <tr>
              <td class="label">Reference:</td>
              <td>${reference}</td>
            </tr>
            <tr>
              <td class="label">Date:</td>
              <td>${new Date().toLocaleDateString()}</td>
            </tr>
          </table>
          <p>Your new features are now active. Start creating invoices!</p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Payment Receipt - Invoice Generator SaaS',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Payment receipt email error:', error);
    throw new Error(`Failed to send payment receipt: ${error.message}`);
  }
};

/**
 * Send Test Email
 * For testing email configuration
 */
exports.sendTestEmail = async (email) => {
  try {
    const transporter = getTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
          <h1 style="color: #667eea;">✅ Email Configuration Test</h1>
          <p>This is a test email to verify your email service is working correctly.</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          <p style="color: #666; font-size: 12px;">If you received this, your email configuration is working!</p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Test Email - Invoice Generator SaaS',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Test email sent successfully'
    };
  } catch (error) {
    throw new Error(`Email test failed: ${error.message}`);
  }
};

module.exports = exports;
