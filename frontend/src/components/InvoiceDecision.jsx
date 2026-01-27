import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Save, FileText, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Invoice Decision Page
 * Asks user: Send to email or save to dashboard?
 * Appears after user clicks Download PDF
 */
export default function InvoiceDecision() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const { firebaseUser } = useAuth();
  
  const invoiceData = location.state?.invoiceData || null;
  const pdfBlob = location.state?.pdfBlob || null;
  const savedInvoice = location.state?.savedInvoice || null;

  console.log('📄 [DECISION] Component loaded');
  console.log('📄 [DECISION] Received state:', {
    hasInvoiceData: !!invoiceData,
    invoiceNumber: invoiceData?.invoiceNumber,
    hasPdfBlob: !!pdfBlob,
    pdfSize: pdfBlob?.size,
    hasSavedInvoice: !!savedInvoice,
    invoiceId: savedInvoice?._id
  });

  const [loading, setLoading] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(invoiceData?.toEmail || '');

  // Redirect back if no invoice data
  if (!invoiceData || !pdfBlob) {
    console.warn('⚠️ [DECISION] Missing required data, redirecting back');
    console.warn('⚠️ [DECISION] invoiceData:', invoiceData);
    console.warn('⚠️ [DECISION] pdfBlob:', pdfBlob);
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
      console.log('📧 [DECISION] Sending invoice to email:', confirmEmail);

      // Get auth token
      let token;
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();
      } else {
        token = localStorage.getItem('token');
      }

      if (!token) {
        throw new Error('Authentication required');
      }

      // Build form data with PDF
      const formData = new FormData();
      formData.append('email', confirmEmail);
      formData.append('subject', `Invoice ${invoiceData.invoiceNumber}`);
      formData.append('html', generateSimpleInvoiceHTML(invoiceData));
      formData.append('pdf', pdfBlob, `${invoiceData.invoiceNumber}.pdf`);

      // Send email
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/email/send-invoice`;
      const response = await axios.post(apiUrl, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('✅ [DECISION] Email sent successfully');
      
      // Update invoice status to sent
      if (savedInvoice?._id) {
        try {
          await axios.put(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/invoices/${savedInvoice._id}`,
            { status: 'sent' },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
        } catch (err) {
          console.warn('Failed to update invoice status:', err);
        }
      }

      toast.success('✅ Invoice sent successfully to ' + confirmEmail);
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('❌ [DECISION] Email send error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to send email';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle save to dashboard (no email)
  const handleSaveDashboard = async () => {
    try {
      setLoading(true);
      console.log('💾 [DECISION] Saving invoice to dashboard (no email)');

      // Get auth token
      let token;
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();
      } else {
        token = localStorage.getItem('token');
      }

      if (!token) {
        throw new Error('Authentication required');
      }

      // Update invoice status to draft (saved but not sent)
      if (savedInvoice?._id) {
        try {
          await axios.put(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/invoices/${savedInvoice._id}`,
            { status: 'draft' },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
        } catch (err) {
          console.warn('Failed to update invoice status:', err);
        }
      }

      console.log('✅ [DECISION] Invoice saved to dashboard');
      
      // Navigate to thank you page
      navigate('/thank-you', {
        state: {
          title: 'Thank you',
          message: 'Your invoice has been saved successfully and is now available on your dashboard.',
          action: 'View Dashboard',
          actionUrl: '/dashboard'
        }
      });

    } catch (error) {
      console.error('❌ [DECISION] Save error:', error);
      toast.error(error.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} py-12 px-4`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Invoice Ready
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Invoice <span className="font-semibold">{invoiceData.invoiceNumber}</span> has been created successfully
          </p>
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {loading ? 'Sending...' : 'Send Invoice'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Decision Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Send Email Option */}
          <button
            onClick={() => setShowEmailConfirm(true)}
            disabled={loading}
            className={`p-8 rounded-xl border-2 transition ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-750'
                : 'bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50'
            } disabled:opacity-50 text-left group`}
          >
            <div className="flex items-start mb-4">
              <div className="p-3 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition mr-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Send to Client
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Recommended
                </p>
              </div>
            </div>

            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              Send the invoice PDF directly to your client's email address
            </p>

            <div className={`flex items-center gap-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} font-semibold`}>
              <span>Send Now →</span>
            </div>
          </button>

          {/* Save to Dashboard Option */}
          <button
            onClick={handleSaveDashboard}
            disabled={loading}
            className={`p-8 rounded-xl border-2 transition ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 hover:border-green-500 hover:bg-gray-750'
                : 'bg-white border-gray-200 hover:border-green-500 hover:bg-green-50'
            } disabled:opacity-50 text-left group`}
          >
            <div className="flex items-start mb-4">
              <div className="p-3 rounded-lg bg-green-100 group-hover:bg-green-200 transition mr-4">
                <Save className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Save for Later
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Alternative
                </p>
              </div>
            </div>

            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              Save the invoice to your dashboard. You can send it later from there.
            </p>

            <div className={`flex items-center gap-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'} font-semibold`}>
              <span>Save to Dashboard →</span>
            </div>
          </button>
        </div>

        {/* Invoice Summary */}
        <div className={`mt-8 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Invoice Summary
          </h3>
          <div className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="flex justify-between">
              <span>Invoice #:</span>
              <span className="font-semibold">{invoiceData.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Client:</span>
              <span className="font-semibold">{invoiceData.toName}</span>
            </div>
            <div className="flex justify-between">
              <span>Email:</span>
              <span className="font-semibold">{invoiceData.toEmail}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className="font-semibold">Total Amount:</span>
              <span className="font-bold text-lg text-blue-600">
                ₦{(invoiceData.total || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
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
