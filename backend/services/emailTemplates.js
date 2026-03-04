/**
 * Email Templates for InvoicePro (Backend)
 * Brand: Navy #0F172A, Emerald #059669, Slate #334155, White #F8FAFC
 * Used for OTP emails and invoice emails sent from the server
 */

const cleanLogoUrl = (url) => {
  if (!url) return '';
  return url.replace(/([^:]\/)\/+/g, "$1/");
};

// ─── Shared Email Shell ────────────────────────────────────────────────────
const emailWrapper = (content, logoUrl) => {
  const logoBlock = logoUrl
    ? `<img src="${cleanLogoUrl(logoUrl)}" alt="InvoicePro" width="48" height="48" style="display:block;border-radius:12px;margin:0 auto 16px;" />`
    : `<div style="font-family:'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:28px; font-weight:800; letter-spacing:-0.5px; text-align:center; margin-bottom:16px;">
        <span style="color:#0F172A;">Invoice</span><span style="color:#16A34A;">Pro</span>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>InvoicePro</title>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f0fdf4;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Logo -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              ${logoBlock}
            </td>
          </tr>
        </table>

        <!-- Main Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
          <!-- Emerald Accent Bar -->
          <tr><td style="height:4px;background:linear-gradient(90deg,#16A34A,#22c55e,#4ade80);"></td></tr>
          <tr>
            <td style="padding:40px 44px;">
              ${content}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;">
          <tr>
            <td align="center" style="padding:24px 44px 0;">
              <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">&copy; ${new Date().getFullYear()} InvoicePro &middot; Professional invoicing, simplified.</p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">This is an automated message. Please do not reply.</p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`.trim();
};

// ─── Signup OTP Template ───────────────────────────────────────────────────
const generateOTPEmailSignup = (otp, email, logoUrl, baseUrl) => {
  const digits = otp.split('');
  const digitCells = digits.map(d =>
    `<td style="width:44px;height:52px;text-align:center;font-size:28px;font-weight:700;font-family:'Courier New',Consolas,monospace;color:#ffffff;background-color:#0F172A;border-radius:8px;letter-spacing:0;">${d}</td>`
  ).join(`<td style="width:8px;"></td>`);

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0F172A;line-height:32px;">Verify your email</h1>
    <p style="margin:0 0 28px;font-size:15px;line-height:24px;color:#475569;">
      Enter this code to finish signing up for InvoicePro. The code is valid for <strong style="color:#0F172A;">10 minutes</strong>.
    </p>

    <!-- OTP Code -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 28px;">
      <tr>
        ${digitCells}
      </tr>
    </table>

    <div style="height:1px;background:#e2e8f0;margin:0 0 20px;"></div>

    <!-- Security Notes -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td width="28" valign="top" style="padding-top:2px;">
          <div style="width:20px;height:20px;border-radius:50%;background-color:#f0fdf4;text-align:center;line-height:20px;font-size:11px;color:#16A34A;">&#10003;</div>
        </td>
        <td style="padding-left:10px;">
          <p style="margin:0;font-size:13px;line-height:20px;color:#64748b;">
            This code was requested for <strong style="color:#0F172A;">${email}</strong>
          </p>
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:10px;">
      <tr>
        <td width="28" valign="top" style="padding-top:2px;">
          <div style="width:20px;height:20px;border-radius:50%;background-color:#fefce8;text-align:center;line-height:20px;font-size:11px;color:#ca8a04;">&#9888;</div>
        </td>
        <td style="padding-left:10px;">
          <p style="margin:0;font-size:13px;line-height:20px;color:#64748b;">
            If you didn't create an InvoicePro account, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  `;
  return emailWrapper(content, logoUrl);
};

// ─── Invoice Email Template ────────────────────────────────────────────────
const generateInvoiceEmailHTML = (invoiceData) => {
  const {
    invoiceNumber,
    clientName,
    amount,
    currency,
    dueDate,
    paymentLink
  } = invoiceData;

  let formattedAmount;
  try {
    formattedAmount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency || 'NGN' }).format(amount);
  } catch(e) {
    formattedAmount = `${currency || 'NGN'} ${parseFloat(amount || 0).toFixed(2)}`;
  }

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0F172A;line-height:32px;">Invoice ${invoiceNumber}</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#475569;">
      Hello ${clientName}, here is your invoice for recent services.
    </p>

    <!-- Amount Due Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:#f0fdf4;border:2px solid #059669;border-radius:12px;padding:28px;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#059669;font-weight:700;">Amount Due</p>
          <p style="margin:0;font-size:32px;font-weight:800;color:#0F172A;letter-spacing:-1px;">${formattedAmount}</p>
          <p style="margin:10px 0 0;font-size:13px;color:#64748b;">Due by ${dueDate}</p>
        </td>
      </tr>
    </table>

    <!-- Action Button -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 28px;">
      <tr>
        <td style="border-radius:10px;background:#059669;">
          <a href="${paymentLink || '#'}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">View &amp; Pay Invoice &rarr;</a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#475569;">
      A PDF copy of your invoice is attached to this email for your records.
    </p>

    <div style="height:1px;background:#e2e8f0;margin:0 0 20px;"></div>

    <p style="margin:0;font-size:12px;line-height:18px;color:#94a3b8;">
      Having trouble with the button? Copy this link: <a href="${paymentLink || '#'}" style="color:#059669;text-decoration:none;">${paymentLink || '#'}</a>
    </p>
  `;

  return emailWrapper(content, invoiceData.businessLogo || '');
};

// ─── Password Reset OTP Template ───────────────────────────────────────────
const generateOTPEmailPasswordReset = (otp, email, logoUrl, baseUrl) => {
  const digits = otp.split('');
  const digitCells = digits.map(d =>
    `<td style="width:44px;height:52px;text-align:center;font-size:28px;font-weight:700;font-family:'Courier New',Consolas,monospace;color:#ffffff;background-color:#0F172A;border-radius:8px;letter-spacing:0;">${d}</td>`
  ).join(`<td style="width:8px;"></td>`);

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0F172A;line-height:32px;">Reset your password</h1>
    <p style="margin:0 0 28px;font-size:15px;line-height:24px;color:#475569;">
      We received a request to reset the password for <strong style="color:#0F172A;">${email}</strong>. Use the code below within <strong>10 minutes</strong>.
    </p>

    <!-- OTP Code -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 28px;">
      <tr>
        ${digitCells}
      </tr>
    </table>

    <div style="height:1px;background:#e2e8f0;margin:0 0 20px;"></div>

    <!-- Security Warning -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;">
          <p style="margin:0;font-size:13px;line-height:20px;color:#92400e;">
            <strong>&#128274; Security notice:</strong> If you didn't request a password reset, please change your password immediately. Never share this code — InvoicePro staff will never ask for it.
          </p>
        </td>
      </tr>
    </table>
  `;
  return emailWrapper(content, logoUrl);
};

// ─── Plain Text Fallback ───────────────────────────────────────────────────
const generateOTPEmailPlainText = (otp, purpose) => {
  const action = purpose === 'signup' ? 'verify your email address' : 'reset your password';
  return `
InvoicePro — ${purpose === 'signup' ? 'Email Verification' : 'Password Reset'}

Your verification code is: ${otp}

Use this code to ${action}. It expires in 10 minutes.

If you didn't request this, you can safely ignore this email.

— InvoicePro
  `.trim();
};

module.exports = {
  generateOTPEmailSignup,
  generateOTPEmailPasswordReset,
  generateOTPEmailPlainText,
  generateInvoiceEmailHTML
};
