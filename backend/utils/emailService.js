// utils/emailService.js
// Lightweight wrapper that delegates invoice email sending to the SMTP invoice service
// This replaces the previous Resend-based implementation.

try {
  module.exports = require('../services/invoiceEmailService');
} catch (err) {
  // Fallback: export a stub that throws helpful error
  module.exports = {
    sendInvoiceEmail: async () => { throw new Error('Invoice email service not initialized'); },
    sendTestInvoiceEmail: async () => { throw new Error('Invoice email service not initialized'); }
  };
}
