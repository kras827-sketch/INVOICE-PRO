// src/services/emailTemplates.js
import { formatCurrency as _formatCurrency } from '../utils/currencyUtils';

/**
 * Generate premium invoice email HTML
 * Brand: Navy #0F172A, Emerald #059669, Slate #334155, White #F8FAFC
 */
export const generateInvoiceEmailHTML = (invoiceData, businessLogo) => {
  const formatCurrency = (amount) => {
    return _formatCurrency(amount, invoiceData.currency || 'NGN');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const subtotal = invoiceData.items.reduce((sum, item) =>
    sum + (item.quantity * item.price), 0
  );
  const tax = (subtotal * invoiceData.taxRate) / 100;
  const discount = invoiceData.discount || 0;
  const total = subtotal + tax - discount;

  const logoBlock = businessLogo
    ? `<img src="${businessLogo}" alt="Logo" style="height:44px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />`
    : `<div style="font-family:'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:32px; font-weight:800; letter-spacing:-1px; text-align:center; margin-bottom:0px;">
        <span style="color:#ffffff;">Invoice</span><span style="color:#10b981;">Pro</span>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Invoice ${invoiceData.invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Main Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0F172A;padding:32px 40px;text-align:center;">
              ${logoBlock}
            </td>
          </tr>

          <!-- Emerald Accent Bar -->
          <tr><td style="height:4px;background:linear-gradient(90deg,#16A34A,#22c55e,#4ade80);"></td></tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px;">

              <!-- Greeting -->
              <p style="margin:0 0 20px;font-size:16px;color:#334155;line-height:1.6;">
                Hi <strong style="color:#0F172A;">${invoiceData.clientName}</strong>,
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
                Please find your invoice details below. A PDF copy is attached for your records.
              </p>

              <!-- Amount Due Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#f0fdf4;border:2px solid #059669;border-radius:12px;padding:28px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#059669;font-weight:700;">Amount Due</p>
                    <p style="margin:0;font-size:36px;font-weight:800;color:#0F172A;letter-spacing:-1px;">${formatCurrency(total)}</p>
                    ${invoiceData.dueDate ? `<p style="margin:10px 0 0;font-size:13px;color:#64748b;">Due by <strong>${formatDate(invoiceData.dueDate)}</strong></p>` : ''}
                  </td>
                </tr>
              </table>

              <!-- Invoice Details Grid -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                <tr style="background:#f8fafc;">
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;width:50%;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:600;">Invoice Number</p>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#0F172A;">${invoiceData.invoiceNumber}</p>
                  </td>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:600;">Invoice Date</p>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#0F172A;">${formatDate(invoiceData.invoiceDate)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:600;">From</p>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#0F172A;">${invoiceData.businessName}</p>
                    <p style="margin:2px 0 0;font-size:13px;color:#64748b;">${invoiceData.businessEmail || ''}</p>
                  </td>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:600;">Bill To</p>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#0F172A;">${invoiceData.clientName}</p>
                    <p style="margin:2px 0 0;font-size:13px;color:#64748b;">${invoiceData.clientEmail || ''}</p>
                  </td>
                </tr>
              </table>

              <!-- Items Table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                <tr style="background:#0F172A;">
                  <td style="padding:12px 16px;font-size:12px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:0.5px;">Item</td>
                  <td style="padding:12px 16px;font-size:12px;font-weight:700;color:#ffffff;text-align:center;text-transform:uppercase;letter-spacing:0.5px;">Qty</td>
                  <td style="padding:12px 16px;font-size:12px;font-weight:700;color:#ffffff;text-align:right;text-transform:uppercase;letter-spacing:0.5px;">Rate</td>
                  <td style="padding:12px 16px;font-size:12px;font-weight:700;color:#ffffff;text-align:right;text-transform:uppercase;letter-spacing:0.5px;">Amount</td>
                </tr>
                ${invoiceData.items.map((item, idx) => `
                <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="padding:14px 16px;font-size:14px;color:#0F172A;font-weight:500;border-bottom:1px solid #f1f5f9;">${item.name}${item.description ? `<br><span style="font-size:12px;color:#94a3b8;font-weight:400;">${item.description}</span>` : ''}</td>
                  <td style="padding:14px 16px;font-size:14px;color:#334155;text-align:center;border-bottom:1px solid #f1f5f9;">${item.quantity}</td>
                  <td style="padding:14px 16px;font-size:14px;color:#334155;text-align:right;border-bottom:1px solid #f1f5f9;">${formatCurrency(item.price)}</td>
                  <td style="padding:14px 16px;font-size:14px;color:#0F172A;text-align:right;font-weight:600;border-bottom:1px solid #f1f5f9;">${formatCurrency(item.quantity * item.price)}</td>
                </tr>
                `).join('')}
              </table>

              <!-- Totals -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-left:auto;width:260px;margin-bottom:28px;">
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#64748b;">Subtotal</td>
                  <td style="padding:8px 0;font-size:14px;color:#0F172A;text-align:right;font-weight:500;">${formatCurrency(subtotal)}</td>
                </tr>
                ${invoiceData.taxRate > 0 ? `
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#64748b;">Tax (${invoiceData.taxRate}%)</td>
                  <td style="padding:8px 0;font-size:14px;color:#0F172A;text-align:right;font-weight:500;">${formatCurrency(tax)}</td>
                </tr>` : ''}
                ${discount > 0 ? `
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#64748b;">Discount</td>
                  <td style="padding:8px 0;font-size:14px;color:#ef4444;text-align:right;font-weight:500;">-${formatCurrency(discount)}</td>
                </tr>` : ''}
                <tr>
                  <td colspan="2" style="padding:0;"><div style="height:1px;background:#e2e8f0;margin:4px 0;"></div></td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;font-size:16px;color:#ffffff;font-weight:700;background:#059669;border-radius:8px 0 0 8px;">TOTAL</td>
                  <td style="padding:12px 16px;font-size:16px;color:#ffffff;font-weight:700;background:#059669;text-align:right;border-radius:0 8px 8px 0;">${formatCurrency(total)}</td>
                </tr>
              </table>

              <!-- CTA Label -->
              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 28px;">
                <tr>
                  <td style="border-radius:10px;background:#0F172A;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;text-align:center;">
                    View &amp; Pay &darr;
                  </td>
                </tr>
              </table>

              <!-- Payment Details -->
              ${invoiceData.bankDetails && invoiceData.bankDetails.bankName ? `
              <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:20px;border-radius:10px;margin-bottom:20px;">
                <p style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#0F172A;font-weight:700;">Payment Details</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:#64748b;width:120px;">Bank Name:</td>
                    <td style="padding:4px 0;font-size:14px;color:#0F172A;font-weight:600;">${invoiceData.bankDetails.bankName}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:#64748b;">Account Name:</td>
                    <td style="padding:4px 0;font-size:14px;color:#0F172A;font-weight:600;">${invoiceData.bankDetails.accountName}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:#64748b;">Account No:</td>
                    <td style="padding:4px 0;font-size:14px;color:#0F172A;font-weight:600;">${invoiceData.bankDetails.accountNumber}</td>
                  </tr>
                </table>
              </div>` : ''}

              <!-- Notes -->
              ${invoiceData.notes ? `
              <div style="background:#f0fdf4;border-left:4px solid #059669;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:16px;">
                <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#059669;font-weight:700;">Notes</p>
                <p style="margin:0;font-size:13px;line-height:1.5;color:#334155;">${invoiceData.notes}</p>
              </div>` : ''}

              ${invoiceData.terms ? `
              <div style="background:#f8fafc;border-left:4px solid #94a3b8;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:16px;">
                <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:700;">Payment Terms</p>
                <p style="margin:0;font-size:13px;line-height:1.5;color:#334155;">${invoiceData.terms}</p>
              </div>` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0F172A;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#ffffff;">${invoiceData.businessName}</p>
              <p style="margin:0 0 16px;font-size:12px;color:#94a3b8;">${invoiceData.businessEmail || ''}${invoiceData.businessPhone ? ` &middot; ${invoiceData.businessPhone}` : ''}</p>
              <div style="height:1px;background:#1e293b;margin:0 0 16px;"></div>
              <p style="margin:0;font-size:11px;color:#64748b;">Powered by <strong style="color:#059669;">InvoicePro</strong> &middot; &copy; ${new Date().getFullYear()}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Generate branded OTP email HTML
 */
export const generateOTPEmailHTML = (otpCode, businessName = 'InvoicePro') => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Main Card -->
        <table role="presentation" width="500" cellpadding="0" cellspacing="0" style="max-width:500px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0F172A;padding:36px 40px;text-align:center;">
              <div style="display:flex;justify-content:center;margin-bottom:16px;">
                <div style="width:48px;height:48px;background:#16A34A;border-radius:12px;display:flex;align-items:center;justify-content:center;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:auto;">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
              </div>
            </td>
          </tr>

          <!-- Emerald Accent Bar -->
          <tr><td style="height:4px;background:linear-gradient(90deg,#16A34A,#22c55e,#4ade80);"></td></tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;">

              <p style="margin:0 0 24px;font-size:16px;color:#334155;text-align:center;line-height:1.5;">
                Your one-time verification code is ready.
              </p>

              <!-- OTP Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#f0fdf4;border:2px solid #059669;border-radius:12px;padding:32px;text-align:center;">
                    <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#059669;font-weight:700;">Your Verification Code</p>
                    <div style="display:inline-block;background:#0F172A;padding:14px 28px;border-radius:10px;">
                      <span style="font-size:36px;font-weight:800;color:#ffffff;letter-spacing:8px;font-family:'Courier New',monospace;">${otpCode}</span>
                    </div>
                    <p style="margin:16px 0 0;font-size:13px;color:#ef4444;font-weight:600;">&#9201; Valid for 5 minutes only</p>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
                      <strong>&#128274; Security Notice:</strong> Never share this code with anyone. ${businessName} staff will never ask for your OTP.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#64748b;text-align:center;line-height:1.5;">
                If you didn't request this code, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0F172A;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">
                &copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.
              </p>
              <p style="margin:0;font-size:11px;color:#64748b;">
                Powered by <strong style="color:#059669;">InvoicePro</strong> &middot; This is an automated email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export default {
  generateInvoiceEmailHTML,
  generateOTPEmailHTML
};
