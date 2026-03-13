
# 📧 SMTP Email Service Setup Guide

## Overview

The project now uses SMTP via Nodemailer for sending OTPs and invoice emails. This guide explains configuring SMTP credentials (Gmail, Mailgun SMTP, SendGrid SMTP, etc.).

## ✅ Quick Setup

1. Add SMTP credentials to your backend `.env` file (backend/.env):

```bash
EMAIL_SERVICE=gmail                 # Optional: e.g., 'gmail', 'hotmail', etc.
EMAIL_HOST=smtp.gmail.com          # Optional
EMAIL_PORT=587                     # 465 for SSL, 587 for TLS
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password-or-app-password
EMAIL_FROM="InvoicePro <your-email@example.com>"  # Optional
EMAIL_TEST_TO=your-email@example.com # Optional test recipient
```

- For Gmail, use an App Password when 2FA is enabled. See Google account security settings.
- Never commit these secrets to git. Use environment variables in production.

## 🚀 Restart Your Server

```bash
cd backend
npm run dev
```

You should see logs indicating SMTP is configured (e.g., `Configured Invoice Email Service: SMTP (gmail):587`).

> **New configuration options (optional)**
> - `EMAIL_SERVICE` – provider name for nodemailer (e.g. `gmail`, `hotmail`).
> - `EMAIL_CONN_TIMEOUT`, `EMAIL_GREETING_TIMEOUT`, `EMAIL_SOCKET_TIMEOUT` – override default 30‑second timeouts used by Nodemailer.
> - `SMTP_VERIFY_RETRIES` – number of verification attempts during initialization (default 3). Useful when network is flaky.

## 🧪 Verify SMTP Setup

Run the provided test script to verify the transporter and send a test email:

```bash
cd backend
node scripts/test-smtp-setup.js
```

Expected output:

```
🔧 Verifying SMTP transporter...
✅ Transporter verified: true
📤 Sending test email to: your-email@example.com
✅ Test email sent: <messageId>
```

## 🧬 How Email Flows Work Now

- OTP emails (signup/reset) are sent via `backend/services/otpService.js` using Nodemailer.
- Invoice emails with PDF attachments are sent via `backend/services/invoiceEmailService.js` using Nodemailer.

## 🔄 Testing the Full Flow

1. **Signup Flow**
   - Go to: http://localhost:5173/signup
   - Enter email and password
   - An OTP is generated and sent via SMTP
   - Enter OTP to complete signup

2. **Forgot Password Flow**
   - Go to: http://localhost:5173/forgot-password
   - Enter email
   - An OTP is sent via SMTP
   - Enter OTP and reset password

3. **Send Invoice Flow**
   - Create an invoice in dashboard
   - Click "Send"
   - Preview and send; PDF attached and delivered via SMTP

## ❓ Common Issues & Fixes

- "SMTP credentials missing": Ensure `EMAIL_USER` and `EMAIL_PASS` are set in `backend/.env`.
- Gmail authentication failures: use an App Password, or configure OAuth for production.
- Emails marked as spam: set proper `EMAIL_FROM` and consider using a verified SMTP provider.
- Outbound SMTP blocked / network timeout (e.g. ETIMEDOUT):
  - Set `SKIP_SMTP_VERIFY=true` in `backend/.env` to bypass the startup verification check and allow the app to run while you troubleshoot.
  - You can also tune the verification by setting `SMTP_VERIFY_RETRIES` (e.g. `3`) and raising timeouts (`EMAIL_CONN_TIMEOUT=60000`).
  - The server will still start, **but emails won’t be delivered until connectivity is restored.**
  - Fix your firewall or choose a reachable provider/port; there is no automatic fallback.

## 📞 Helpful Links

- Gmail App Passwords: https://support.google.com/accounts/answer/185833
- Nodemailer docs: https://nodemailer.com/about/

---

**Troubleshooting Help**:
- Run: `node backend/scripts/test-smtp-setup.js`
- Check backend logs for SMTP errors
- Ensure your environment variables are loaded

