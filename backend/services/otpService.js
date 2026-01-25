/**
 * OTP Service - Generate, send, and verify OTP codes
 */

const nodemailer = require('nodemailer');
const {
  generateOTPEmailSignup,
  generateOTPEmailPasswordReset,
  generateOTPEmailPlainText,
} = require('./emailTemplates');

// Create transporter once
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get OTP expiry time (5 minutes from now)
function getOTPExpiry() {
  return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
}

// Send OTP via email with styled templates
// logoUrl is optional and used to brand the email with the user's business logo
async function sendOTPEmail(email, otp, purpose = 'signup', logoUrl = '') {
  try {
    const subject = purpose === 'signup' 
      ? 'Verify your InvoicePro account'
      : 'Reset your InvoicePro password';

    const htmlContent = purpose === 'signup'
      ? generateOTPEmailSignup(otp, email, logoUrl)
      : generateOTPEmailPasswordReset(otp, email, logoUrl);

    const plainTextContent = generateOTPEmailPlainText(otp, purpose);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html: htmlContent,
      text: plainTextContent,
    });

    console.log(`✅ OTP sent to ${email} for ${purpose}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
    return { success: false, error: error.message };
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
