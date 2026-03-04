import { useState } from 'react';
import { Download, Mail, Eye, Repeat2, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';

/**
 * ReceiptPanel Component
 * Displays receipt management interface within invoice details view
 * Shows buttons for viewing, downloading, and sending receipt
 */
const ReceiptPanel = ({ receipt, invoice, onReceiptUpdate, isDarkMode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendEmail, setSendEmail] = useState(receipt?.customer?.email || '');

  // Download receipt PDF
  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/receipts/${receipt._id}/pdf`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${receipt.receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: '✅ Receipt downloaded' });
    } catch (error) {
      console.error('Download error:', error);
      setMessage({ type: 'error', text: '❌ Failed to download receipt' });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend receipt email
  const handleResend = async () => {
    try {
      setIsLoading(true);
      await api.post(`/receipts/${receipt._id}/resend`);
      setMessage({ type: 'success', text: '✅ Receipt email resent' });
    } catch (error) {
      console.error('Resend error:', error);
      setMessage({ type: 'error', text: '❌ Failed to resend receipt' });
    } finally {
      setIsLoading(false);
    }
  };

  // Send to custom email
  const handleSendCustom = async () => {
    try {
      if (!sendEmail) {
        setMessage({ type: 'error', text: 'Please enter an email address' });
        return;
      }

      setIsLoading(true);
      await api.post(`/receipts/${receipt._id}/send`, {
        email: sendEmail
      });
      setMessage({ type: 'success', text: `✅ Receipt sent to ${sendEmail}` });
      setShowSendModal(false);
    } catch (error) {
      console.error('Send error:', error);
      setMessage({ type: 'error', text: '❌ Failed to send receipt' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!receipt) {
    return null;
  }

  return (
    <div className={`rounded-lg border-2 p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Payment Receipt
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Receipt #{receipt.receiptNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900">
            <span className="text-sm font-medium text-green-700 dark:text-green-300">✓ VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Receipt Details */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Receipt Date
          </p>
          <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {new Date(receipt.paymentDate).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Amount
          </p>
          <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            ₦{receipt.totalPaid.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Payment Method
          </p>
          <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {receipt.paymentMethod?.replace(/_/g, ' ').toUpperCase()}
          </p>
        </div>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Status
          </p>
          <p className="text-sm font-medium mt-1 text-green-600 dark:text-green-400">Paid</p>
        </div>
      </div>

      {/* QR Code */}
      {receipt.qrCode && (
        <div className="mb-6 flex flex-col items-center">
          <p className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Verification QR Code
          </p>
          <img
            src={receipt.qrCode}
            alt="Receipt QR Code"
            className="w-32 h-32 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-2"
          />
          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Scan to verify receipt authenticity
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={handleDownload}
          disabled={isLoading}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition ${
            isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700 disabled:text-gray-500'
              : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500'
          }`}
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">Download</span>
        </button>

        <button
          onClick={handleResend}
          disabled={isLoading}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition ${
            isDarkMode
              ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-700 disabled:text-gray-500'
              : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:text-gray-500'
          }`}
        >
          <Repeat2 className="w-4 h-4" />
          <span className="text-sm">Resend</span>
        </button>

        <button
          onClick={() => setShowSendModal(true)}
          disabled={isLoading}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition ${
            isDarkMode
              ? 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-700 disabled:text-gray-500'
              : 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300 disabled:text-gray-500'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span className="text-sm">Send To</span>
        </button>

        <a
          href={receipt.verificationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition ${
            isDarkMode
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm">View Online</span>
        </a>
      </div>

      {/* Email Sends History */}
      {receipt.emailsSent && receipt.emailsSent.length > 0 && (
        <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <p className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Email History
          </p>
          <div className="space-y-2">
            {receipt.emailsSent.map((send, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{send.sentTo}</span>
                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {new Date(send.sentAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {message.text && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? isDarkMode
                ? 'bg-green-900 text-green-200 border border-green-700'
                : 'bg-green-50 text-green-700 border border-green-200'
              : isDarkMode
              ? 'bg-red-900 text-red-200 border border-red-700'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Send Custom Email Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Send Receipt To
            </h4>
            <input
              type="email"
              placeholder="Enter email address"
              value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border mb-4 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSendCustom}
                disabled={isLoading}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  isDarkMode
                    ? 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-700'
                    : 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300'
                }`}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptPanel;
