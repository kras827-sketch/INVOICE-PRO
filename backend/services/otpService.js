/**
 * OTP Service - Generate, send, and verify OTP codes
 */

const nodemailer = require('nodemailer');
const {
  generateOTPEmailSignup,
  generateOTPEmailPasswordReset,
  generateOTPEmailPlainText,
} = require('./emailTemplates');

// Create transporter with explicit SMTP configuration
const createTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  
  if (emailService === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      },
      connectionTimeout: 10000,
      socketTimeout: 10000
    });
  }
  
  // Default to explicit Gmail SMTP configuration (not using service: 'gmail')
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '465'), // Default to 465 (SSL) if not specified
    secure: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT === '465', // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Vercel/Serverless optimizations
    pool: false, // Disable pooling in serverless to avoid hanging connections
    attachDataUrls: true,
    tls: {
      rejectUnauthorized: false, // Help with some strict server varifications
      ciphers: 'SSLv3'
    }
  });
};

const transporter = createTransporter();

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
      return { success: false };
    }

    const subject = purpose === 'signup' 
      ? 'Verify your InvoicePro account'
      : 'Reset your InvoicePro password';

    const baseUrl = getBaseUrl();

    const htmlContent = purpose === 'signup'
      ? generateOTPEmailSignup(otp, email, logoUrl, baseUrl)
      : generateOTPEmailPasswordReset(otp, email, logoUrl, baseUrl);

    const plainTextContent = generateOTPEmailPlainText(otp, purpose);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html: htmlContent,
      text: plainTextContent,
    });

    console.log(`✅ OTP sent to ${email} for ${purpose} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Log the full technical error internally
    console.error(`❌ Failed to send OTP email to ${email}:`, {
      errorMessage: error.message,
      errorCode: error.code,
      errorResponse: error.response,
      details: error.toString()
    });
    
    // Return generic failure - do NOT expose SMTP/technical details
    return { success: false };
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
};
