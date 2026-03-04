/**
 * Test SMTP Email Setup
 * Usage: node backend/scripts/test-smtp-setup.js
 */
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

(async () => {
  try {
    console.log('🔧 Verifying SMTP transporter...');
    const info = await transporter.verify();
    console.log('✅ Transporter verified:', info);
    console.log('\n📤 Sending test email to:', process.env.EMAIL_TEST_TO || process.env.EMAIL_USER);

    const res = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.EMAIL_TEST_TO || process.env.EMAIL_USER,
      subject: 'SMTP Setup Test - InvoicePro',
      text: 'This is a test email to verify SMTP configuration for InvoicePro.'
    });

    console.log('✅ Test email sent:', res.messageId);
  } catch (err) {
    console.error('❌ SMTP test failed:', err.message);
    process.exitCode = 1;
  }
})();
