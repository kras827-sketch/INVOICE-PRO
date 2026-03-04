/**
 * OTP Service - Generate, send, and verify OTP codes
 * Using SMTP/Nodemailer for reliable email delivery
 */

const nodemailer = require('nodemailer');
const {
  generateOTPEmailSignup,
  generateOTPEmailPasswordReset,
  generateOTPEmailPlainText,
} = require('./emailTemplates');

// Initialize SMTP transporter
const getTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: parseInt(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log(`📧 Configured OTP Email Service: SMTP (${process.env.EMAIL_HOST || 'smtp.gmail.com'})`);
  return transporter;
};

// Initialize SMTP on module load
const initTransporter = async () => {
  try {
    console.log('🔧 Initializing email service (SMTP)...');
    const transporter = getTransporter();
    // Optionally skip verification (useful when outbound SMTP is blocked)
    if (process.env.SKIP_SMTP_VERIFY === 'true') {
      console.log('⚠️ SKIP_SMTP_VERIFY is set — skipping SMTP verification at startup');
      return false;
    }

    // Verify transporter connectivity and credentials
    try {
      await transporter.verify();
      console.log(`📧 Email Service: SMTP (${process.env.EMAIL_HOST || 'smtp.gmail.com'})`);
      console.log('✅ Email service initialized and ready!');
      return true;
    } catch (verifyErr) {
      console.warn('⚠️ SMTP transporter verification failed:', verifyErr.message);
      console.warn('ℹ️ Server will continue to run. Email sending may fail until SMTP connectivity is restored.');
      console.warn('ℹ️ To skip verification in development set SKIP_SMTP_VERIFY=true in backend/.env');
      // Do NOT throw here — return false to allow server startup
      return false;
    }
  } catch (error) {
    console.error(`⚠️ Email service initialization failed: ${error.message}`);
    return false;
  }
};

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get OTP expiry time (5 minutes from now)
function getOTPExpiry() {
  return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
}

// Helper to get the base URL for links
const getBaseUrl = () => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
};

// Send OTP via email with styled templates
// logoUrl is optional and used to brand the email with the user's business logo
async function sendOTPEmail(email, otp, purpose = 'signup', logoUrl = '') {
  try {
    // Validate email format
    if (!email || !email.includes('@')) {
      console.error(`❌ Invalid email format: ${email}`);
      return { success: false, error: 'Invalid email format' };
    }

    // Initialize SMTP transporter
    const transporter = getTransporter();

    const subject = purpose === 'signup' 
      ? 'Verify your InvoicePro account'
      : 'Reset your InvoicePro password';

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const htmlContent = purpose === 'signup'
      ? generateOTPEmailSignup(otp, email, logoUrl, baseUrl)
      : generateOTPEmailPasswordReset(otp, email, logoUrl, baseUrl);

    const plainTextContent = generateOTPEmailPlainText(otp, purpose);

    console.log(`📤 Sending OTP email to: ${email}`);
    console.log(`   Purpose: ${purpose}`);
    console.log(`   From: ${process.env.EMAIL_USER}`);
    console.log(`   Subject: ${subject}`);

    // Send email via SMTP
    const result = await transporter.sendMail({
      from: `"InvoicePro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: htmlContent,
      text: plainTextContent,
    });

    console.log(`✅ Email sent successfully!`);
    console.log(`   Message ID: ${result.messageId}`);
    
    return { success: true, messageId: result.messageId };

  } catch (error) {
    // Log full error for debugging
    console.error(`\n❌ FAILED TO SEND OTP EMAIL TO ${email}`);
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.error(`Error Message: ${error.message}`);
    console.error(`Service: SMTP (${process.env.EMAIL_SERVICE || 'gmail'})`);
    console.error(`SMTP User: ${process.env.EMAIL_USER ? '✓ Set' : '❌ NOT SET'}`);
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error(`\n💡 SMTP CREDENTIALS MISSING:`);
      console.error(`   - Set EMAIL_USER and EMAIL_PASS in backend/.env`);
      console.error(`   - For Gmail, ensure App Passwords or OAuth are configured`);
    }
    
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Attempt fallback: create an Ethereal test account so emails can still be inspected when SMTP is blocked
    try {
      console.log('🔁 Attempting Ethereal fallback to send OTP email (useful for dev/staging)...');
      const testAccount = await nodemailer.createTestAccount();
      const etherealTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      const fallbackResult = await etherealTransporter.sendMail({
        from: `"InvoicePro (Ethereal)" <${testAccount.user}>`,
        to: email,
        subject,
        html: htmlContent,
        text: plainTextContent
      });

      const previewUrl = nodemailer.getTestMessageUrl(fallbackResult);
      console.log('✅ Ethereal fallback email sent. Preview URL:', previewUrl);

      // In development, return the preview URL so frontend/tests can access the message
      return { success: true, messageId: fallbackResult.messageId, previewUrl };
    } catch (fallbackErr) {
      console.error('❌ Ethereal fallback also failed:', fallbackErr.message);
      return { success: false, error: 'Email delivery failed. Please try again.' };
    }
  }
}

// Verify OTP code
function verifyOTP(storedCode, storedExpiry, providedCode) {
  // Check if OTP has expired
  if (new Date() > storedExpiry) {
    return { valid: false, reason: 'expired' };
  }

  // Check if codes match
  if (storedCode !== providedCode) {
    return { valid: false, reason: 'invalid' };
  }

  return { valid: true };
}

module.exports = {
  generateOTP,
  getOTPExpiry,
  sendOTPEmail,
  verifyOTP,
  initTransporter,
};
