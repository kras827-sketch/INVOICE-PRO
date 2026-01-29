import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Download, FileText, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { downloadInvoicePDF } from '../services/pdfGenerator';
import toast from 'react-hot-toast';

/**
 * Invoice Decision Page (Post-Invoice Action Page)
 * Options: Download Invoice or Send via Email
 */
export default function InvoiceDecision() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  
  const invoiceData = location.state?.invoiceData || null;
  const pdfBlob = location.state?.pdfBlob || null;
  const savedInvoice = location.state?.savedInvoice || null;

  const [loading, setLoading] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(invoiceData?.toEmail || '');

  // Redirect back if no invoice data
  if (!invoiceData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            No Invoice Found
          </h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Please create an invoice first
          </p>
          <button
            onClick={() => navigate('/invoice/create')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Create Invoice
          </button>
        </div>
      </div>
    );
  }

  // Handle sending to email
  const handleSendEmail = async () => {
    if (!confirmEmail || !confirmEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      // Build form data with PDF
      const formData = new FormData();
      formData.append('email', confirmEmail);
      formData.append('subject', `Invoice ${invoiceData.invoiceNumber}`);
      formData.append('html', generateSimpleInvoiceHTML(invoiceData));
      
      // Use existing blob if available, otherwise simplified flow handles it
      if (pdfBlob) {
        formData.append('pdf', pdfBlob, `${invoiceData.invoiceNumber}.pdf`);
      }

      await api.post('/email/send-invoice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update status to sent if we have the ID
      if (savedInvoice?._id) {
        try {
          await api.put(`/invoices/${savedInvoice._id}`, { status: 'sent' });
        } catch (err) {
          console.warn('Failed to update invoice status:', err);
        }
      }

      toast.success('✅ Invoice sent successfully!');
      
      // Redirect to Thank You Page
      navigate('/thank-you', {
        state: {
          title: 'Email Sent!',
          subTitle: `Invoice sent to ${confirmEmail}`,
          message: 'The invoice has been successfully emailed to your client. You can track its status in the dashboard.'
        }
      });

    } catch (error) {
      console.error('❌ [DECISION] Email send error:', error);
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  // Handle Download
  const handleDownload = async () => {
    try {
      setLoading(true);
      await downloadInvoicePDF(invoiceData);
      toast.success('✅ Invoice downloaded');
      
      // Redirect to Thank You Page
      setTimeout(() => {
        navigate('/thank-you', {
          state: {
            title: 'Download Complete!',
            subTitle: 'Invoice PDF has been downloaded.',
            message: 'A copy of the invoice has also been saved to your dashboard.'
          }
        });
      }, 1000);

    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} py-12 px-4`}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Invoice completed successfully
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Invoice <span className="font-semibold">{invoiceData.invoiceNumber}</span> has been created. What would you like to do next?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Download Option */}
          <button
            onClick={handleDownload}
            disabled={loading}
            className={`p-8 rounded-xl border-2 transition ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-750'
                : 'bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50'
            } disabled:opacity-50 text-left group`}
          >
            <div className="flex items-start mb-4">
              <div className="p-3 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition mr-4">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Download Invoice
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Save as PDF
                </p>
              </div>
            </div>

            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              Download a high-quality PDF version of this invoice for your records.
            </p>

            <div className={`flex items-center gap-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} font-semibold`}>
              <span>Download Now →</span>
            </div>
          </button>

          {/* Send Email Option */}
          <button
            onClick={() => setShowEmailConfirm(true)}
            disabled={loading}
            className={`p-8 rounded-xl border-2 transition ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 hover:border-purple-500 hover:bg-gray-750'
                : 'bg-white border-gray-200 hover:border-purple-500 hover:bg-purple-50'
            } disabled:opacity-50 text-left group`}
          >
            <div className="flex items-start mb-4">
              <div className="p-3 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition mr-4">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Send via Email
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Professional Template
                </p>
              </div>
            </div>

            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              Email the invoice PDF directly to your client with a professional message.
            </p>

            <div className={`flex items-center gap-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} font-semibold`}>
              <span>Send Email →</span>
            </div>
          </button>
        </div>

        {/* Email Confirmation Modal */}
        {showEmailConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full p-6`}>
              <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Confirm Email Address
              </h2>
              
              <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Invoice will be sent to:
              </p>

              <input
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border mb-6 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="client@example.com"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmailConfirm(false)}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 rounded-lg transition ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {loading ? 'Sending...' : 'Send Invoice'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Helper function to generate simple HTML for email
function generateSimpleInvoiceHTML(invoiceData) {
  return `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #f3f4f6; padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .total { font-size: 18px; font-weight: bold; color: #2563eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Invoice ${invoiceData.invoiceNumber}</h1>
        </div>

        <div class="section">
          <div class="section-title">From</div>
          <strong>${invoiceData.businessName}</strong><br>
          ${invoiceData.businessEmail}<br>
          ${invoiceData.businessPhone || ''}
        </div>

        <div class="section">
          <div class="section-title">Bill To</div>
          <strong>${invoiceData.toName}</strong><br>
          ${invoiceData.toEmail}<br>
          ${invoiceData.toPhone || ''}
        </div>

        <div class="section">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Rate</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(invoiceData.items || []).map(item => `
                <tr>
                  <td>${item.description || item.name || 'Item'}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">₦${(item.rate || item.price || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: right;">₦${(item.quantity * (item.rate || item.price || 0)).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div style="text-align: right;">
            <div style="margin-bottom: 10px;">
              Subtotal: <strong>₦${(invoiceData.subtotal || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong>
            </div>
            ${invoiceData.tax ? `
              <div style="margin-bottom: 10px;">
                Tax (${invoiceData.taxRate}%): <strong>₦${invoiceData.tax.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong>
              </div>
            ` : ''}
            ${invoiceData.discount ? `
              <div style="margin-bottom: 10px;">
                Discount: <strong style="color: red;">-₦${invoiceData.discount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong>
              </div>
            ` : ''}
            <div class="total">
              Total: ₦${(invoiceData.total || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div class="section">
          <p style="text-align: center; color: #666; font-size: 12px;">
            Thank you for your business!
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
