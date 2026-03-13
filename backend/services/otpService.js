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

// shared transporter instance (real SMTP only)
let sharedTransporter = null;

// Initialize SMTP transporter configuration (reused by senders)
const createSmtpTransporter = () => {
  const port = parseInt(process.env.EMAIL_PORT) || 587;
  const secure = port === 465; // SSL for 465, STARTTLS for 587

  // include service name if provided (helps Gmail, other providers)
  const transportOptions = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: parseInt(process.env.EMAIL_CONN_TIMEOUT) || 30000,
    greetingTimeout: parseInt(process.env.EMAIL_GREETING_TIMEOUT) || 30000,
    socketTimeout: parseInt(process.env.EMAIL_SOCKET_TIMEOUT) || 30000,
    ...(!secure && { tls: { rejectUnauthorized: false } }),
  };

  if (process.env.EMAIL_SERVICE) {
    transportOptions.service = process.env.EMAIL_SERVICE;
  }

  return nodemailer.createTransport(transportOptions);
};

// expose a getter so callers always use the current transporter
const getTransporter = () => {
  if (sharedTransporter) return sharedTransporter;
  // lazily create one if initTransporter hasn't been called (edge-case)
  sharedTransporter = createSmtpTransporter();
  return sharedTransporter;
};


// Initialize SMTP on module load
/**
 * Attempts to verify the primary SMTP transporter.  If verification fails
 * (timeout, network block, bad credentials) the error is logged and
 * the function returns false.  The transporter remains configured with
 * whatever SMTP settings were provided; no fallback will be created.
 *
 * Returns `true` when real SMTP is healthy, `false` otherwise. */

// helper to attempt verification with retries (default 3 attempts)
async function verifyWithRetries(transporter, retries = parseInt(process.env.SMTP_VERIFY_RETRIES) || 3) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`🔍 Verifying SMTP transporter (attempt ${i}/${retries})...`);
      await transporter.verify();
      return true;
    } catch (err) {
      console.warn(`⚠️ Verification attempt ${i} failed: ${err.message}`);
      if (i < retries) {
        const delay = 1000 * i; // simple backoff
        console.log(`⏱ retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  return false;
}

const initTransporter = async () => {
  try {
    console.log('🔧 Initializing email service (SMTP)...');
    sharedTransporter = createSmtpTransporter();

    // Optionally skip verification (useful when outbound SMTP is blocked)
    if (process.env.SKIP_SMTP_VERIFY === 'true') {
      console.log('⚠️ SKIP_SMTP_VERIFY is set — skipping SMTP verification at startup');
      return false;
    }

    const ok = await verifyWithRetries(sharedTransporter);
    if (ok) {
      console.log(`📧 Email Service: SMTP (${process.env.EMAIL_HOST || 'smtp.gmail.com'}:${process.env.EMAIL_PORT || 587})`);
      console.log('✅ Email service initialized and ready!');
      return true;
    } else {
      console.warn('⚠️ SMTP transporter verification failed after retries');
      console.warn('ℹ️ Server will continue to run. Email sending may fail until SMTP connectivity is restored.');
      console.warn('ℹ️ To bypass verification entirely in development set SKIP_SMTP_VERIFY=true in backend/.env');
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

    // no fallback: let the caller handle the failure
    return { success: false, error: 'Email delivery failed. Please try again.' };
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
