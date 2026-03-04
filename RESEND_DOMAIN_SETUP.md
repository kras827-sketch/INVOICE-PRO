# SMTP / Domain Notes

This project no longer depends on Resend. Email sending now uses SMTP via Nodemailer. If you previously followed a Resend domain verification guide, you can ignore it.

If you plan to send email from a custom domain (e.g., `noreply@yourdomain.com`), make sure you have proper DNS entries for SPF, DKIM and optionally DMARC configured with your SMTP provider to improve deliverability.

Common steps:

- Add SPF TXT record that includes your SMTP provider's sending servers.
- Configure DKIM signing via your SMTP provider (they will provide DNS records).
- Optionally add a DMARC policy to monitor/reject fraudulent email.

Ask your SMTP provider for the exact DNS records required.
