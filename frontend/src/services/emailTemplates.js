// src/services/emailTemplates.js
// Professional HTML email templates for invoices and OTP

/**
 * Generate beautiful invoice email HTML
 * Professional design that competes with Stripe/Paystack
 */
export const generateInvoiceEmailHTML = (invoiceData, businessLogo) => {
  const formatCurrency = (amount) => {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2 });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const subtotal = invoiceData.items.reduce((sum, item) => 
    sum + (item.quantity * item.price), 0
  );
  
  const tax = (subtotal * invoiceData.taxRate) / 100;
  const discount = invoiceData.discount || 0;
  const total = subtotal + tax - discount;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: #f5f7fa;
                margin: 0;
                padding: 20px;
                color: #333;
            }
            .email-container {
                background: #ffffff;
                max-width: 600px;
                margin: 0 auto;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                color: white;
                padding: 40px;
                text-align: center;
            }
            .header h1 {
                margin: 0 0 10px 0;
                font-size: 28px;
                font-weight: 700;
            }
            .logo {
                height: 50px;
                margin-bottom: 15px;
            }
            .content {
                padding: 40px;
            }
            .greeting {
                font-size: 16px;
                margin-bottom: 20px;
                line-height: 1.6;
            }
            .invoice-details {
                background: #f8f9fa;
                border-left: 4px solid #2563eb;
                padding: 20px;
                margin: 30px 0;
                border-radius: 4px;
            }
            .invoice-details-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 15px;
            }
            .detail-item {
                font-size: 14px;
            }
            .detail-label {
                color: #666;
                font-size: 12px;
                text-transform: uppercase;
                margin-bottom: 4px;
            }
            .detail-value {
                font-weight: 600;
                color: #333;
            }
            .table {
                width: 100%;
                border-collapse: collapse;
                margin: 30px 0;
            }
            .table thead {
                background: #f8f9fa;
                border-bottom: 2px solid #e2e8f0;
            }
            .table th {
                padding: 12px;
                text-align: left;
                font-weight: 600;
                color: #333;
                font-size: 13px;
            }
            .table td {
                padding: 12px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 14px;
            }
            .table tr:hover {
                background: #f8f9fa;
            }
            .totals {
                margin-top: 30px;
                display: flex;
                justify-content: flex-end;
            }
            .totals-table {
                width: 300px;
            }
            .total-row {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 20px;
                padding: 10px 0;
                border-bottom: 1px solid #e2e8f0;
                font-size: 14px;
            }
            .total-row.grand {
                background: #2563eb;
                color: white;
                padding: 15px;
                margin-top: 10px;
                font-weight: 700;
                font-size: 16px;
                border: none;
                border-radius: 4px;
            }
            .total-row.grand border-bottom {
                border-bottom: none;
            }
            .cta-button {
                display: inline-block;
                background: #2563eb;
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 4px;
                font-weight: 600;
                margin: 30px 0;
                text-align: center;
                transition: background 0.3s;
            }
            .cta-button:hover {
                background: #1e40af;
            }
            .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
                font-size: 12px;
                color: #666;
            }
            .footer-link {
                color: #2563eb;
                text-decoration: none;
            }
            .from-to-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin: 30px 0;
                font-size: 13px;
            }
            .from-to-item h3 {
                margin: 0 0 8px 0;
                color: #2563eb;
                font-size: 12px;
                text-transform: uppercase;
                font-weight: 600;
            }
            .from-to-item p {
                margin: 4px 0;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <!-- HEADER -->
            <div class="header">
                ${businessLogo ? `<img src="${businessLogo}" alt="Logo" class="logo">` : ''}
                <h1>Invoice</h1>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Invoice #${invoiceData.invoiceNumber}</p>
            </div>

            <!-- CONTENT -->
            <div class="content">
                <div class="greeting">
                    <p>Hi <strong>${invoiceData.clientName}</strong>,</p>
                    <p>We've created an invoice for you. Please review the details below.</p>
                </div>

                <!-- INVOICE DETAILS -->
                <div class="invoice-details">
                    <div class="invoice-details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Invoice Number</div>
                            <div class="detail-value">${invoiceData.invoiceNumber}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Invoice Date</div>
                            <div class="detail-value">${formatDate(invoiceData.invoiceDate)}</div>
                        </div>
                        ${invoiceData.dueDate ? `
                        <div class="detail-item">
                            <div class="detail-label">Due Date</div>
                            <div class="detail-value">${formatDate(invoiceData.dueDate)}</div>
                        </div>
                        ` : ''}
                        <div class="detail-item">
                            <div class="detail-label">Total Amount</div>
                            <div class="detail-value" style="color: #2563eb; font-size: 18px;">
                                ${formatCurrency(total)}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- FROM & TO -->
                <div class="from-to-section">
                    <div class="from-to-item">
                        <h3>From</h3>
                        <p><strong>${invoiceData.businessName}</strong></p>
                        <p>${invoiceData.businessAddress}</p>
                        <p>${invoiceData.businessEmail}</p>
                    </div>
                    <div class="from-to-item">
                        <h3>Bill To</h3>
                        <p><strong>${invoiceData.clientName}</strong></p>
                        <p>${invoiceData.clientAddress}</p>
                        ${invoiceData.clientEmail ? `<p>${invoiceData.clientEmail}</p>` : ''}
                    </div>
                </div>

                <!-- ITEMS TABLE -->
                <table class="table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Rate</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoiceData.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td style="text-align: center;">${item.quantity}</td>
                            <td style="text-align: right;">${formatCurrency(item.price)}</td>
                            <td style="text-align: right;"><strong>${formatCurrency(item.quantity * item.price)}</strong></td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>

                <!-- TOTALS -->
                <div class="totals">
                    <div class="totals-table">
                        <div class="total-row">
                            <span>Subtotal</span>
                            <span>${formatCurrency(subtotal)}</span>
                        </div>
                        ${invoiceData.taxRate > 0 ? `
                        <div class="total-row">
                            <span>Tax (${invoiceData.taxRate}%)</span>
                            <span>${formatCurrency(tax)}</span>
                        </div>
                        ` : ''}
                        ${discount > 0 ? `
                        <div class="total-row">
                            <span>Discount</span>
                            <span style="color: #ef4444;">-${formatCurrency(discount)}</span>
                        </div>
                        ` : ''}
                        <div class="total-row grand">
                            <span>TOTAL</span>
                            <span>${formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>

                <!-- CTA BUTTON -->
                <center>
                    <a href="#" class="cta-button">View Invoice & Pay</a>
                </center>

                <!-- NOTES -->
                ${invoiceData.notes ? `
                <div style="background: #f0f4ff; padding: 15px; border-radius: 4px; margin-top: 20px;">
                    <p style="margin: 0 0 8px 0; color: #2563eb; font-weight: 600; font-size: 12px; text-transform: uppercase;">
                        Notes
                    </p>
                    <p style="margin: 0; color: #666; font-size: 13px; white-space: pre-wrap;">
                        ${invoiceData.notes}
                    </p>
                </div>
                ` : ''}

                ${invoiceData.terms ? `
                <div style="background: #f0f4ff; padding: 15px; border-radius: 4px; margin-top: 15px;">
                    <p style="margin: 0 0 8px 0; color: #2563eb; font-weight: 600; font-size: 12px; text-transform: uppercase;">
                        Payment Terms
                    </p>
                    <p style="margin: 0; color: #666; font-size: 13px; white-space: pre-wrap;">
                        ${invoiceData.terms}
                    </p>
                </div>
                ` : ''}
            </div>

            <!-- FOOTER -->
            <div class="footer">
                <p style="margin: 0 0 10px 0;">
                    <strong>${invoiceData.businessName}</strong>
                </p>
                <p style="margin: 0;">
                    ${invoiceData.businessEmail} | ${invoiceData.businessPhone || 'No phone provided'}
                </p>
                <p style="margin: 15px 0 0 0; color: #999;">
                    This is an automated email from InvoicePro. Please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Generate branded OTP email HTML
 */
export const generateOTPEmailHTML = (otpCode, businessName = 'InvoicePro') => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                margin: 0;
                padding: 20px;
                color: #333;
            }
            .email-container {
                background: white;
                max-width: 500px;
                margin: 0 auto;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                color: white;
                padding: 40px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 700;
            }
            .content {
                padding: 40px;
                text-align: center;
            }
            .greeting {
                font-size: 16px;
                margin-bottom: 30px;
                color: #333;
            }
            .otp-card {
                background: #f0f4ff;
                border: 2px dashed #2563eb;
                padding: 30px;
                border-radius: 8px;
                margin: 30px 0;
            }
            .otp-label {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 10px;
            }
            .otp-code {
                font-size: 48px;
                font-weight: 700;
                color: #2563eb;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
                margin: 0;
            }
            .expiry {
                font-size: 13px;
                color: #ef4444;
                margin-top: 15px;
                font-weight: 600;
            }
            .info {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 30px 0;
                border-radius: 4px;
                font-size: 13px;
                color: #856404;
            }
            .footer {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
                font-size: 12px;
                color: #666;
            }
            .footer-link {
                color: #2563eb;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <!-- HEADER -->
            <div class="header">
                <h1>🔐 ${businessName}</h1>
                <p style="margin: 8px 0 0 0; opacity: 0.9;">Secure Verification</p>
            </div>

            <!-- CONTENT -->
            <div class="content">
                <div class="greeting">
                    <p>Your One-Time Password (OTP) is ready to use.</p>
                </div>

                <!-- OTP CARD -->
                <div class="otp-card">
                    <div class="otp-label">Your Verification Code</div>
                    <p class="otp-code">${otpCode}</p>
                    <div class="expiry">⏱️ Valid for 5 minutes only</div>
                </div>

                <!-- INFO -->
                <div class="info">
                    <strong>🔒 Security Notice:</strong> Never share this code with anyone. ${businessName} staff will never ask for your OTP.
                </div>

                <p style="color: #666; font-size: 14px;">
                    This is a single-use code. If you didn't request this, please ignore this email.
                </p>
            </div>

            <!-- FOOTER -->
            <div class="footer">
                <p style="margin: 0 0 8px 0;">
                    © ${new Date().getFullYear()} ${businessName}. All rights reserved.
                </p>
                <p style="margin: 0; color: #999;">
                    This is an automated email. Please do not reply.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

export default {
  generateInvoiceEmailHTML,
  generateOTPEmailHTML
};
