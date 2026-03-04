import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Download, Home } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { formatCurrency } from '../utils/currencyUtils';

// Build the public API base URL (no auth interceptor)
const getPublicApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    const base = import.meta.env.VITE_API_URL;
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  return '/api';
};

/**
 * Receipt Verification Page
 * Public page to verify receipt authenticity
 */
const ReceiptVerification = () => {
  const { receipt_id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [receipt, setReceipt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReceipt();
  }, [receipt_id]);

  const loadReceipt = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await axios.get(`${getPublicApiBase()}/receipts/verify/${receipt_id}`);

      if (response.data.success) {
        setReceipt(response.data.receipt);
      } else {
        setError(response.data.message || 'Receipt not found');
      }
    } catch (err) {
      console.error('Error loading receipt:', err);

      if (err.response?.status === 404) {
        setError('Receipt not found. Please check the receipt ID and try again.');
      } else if (err.response?.status === 400) {
        setError(err.response.data.message || 'Receipt status invalid or cancelled.');
      } else {
        setError('Unable to verify receipt. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="modern-spinner spinner-lg spinner-glow"></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Verifying receipt...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`rounded-lg p-8 max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-red-100 dark:bg-red-900">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h1 className={`text-2xl font-bold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Receipt Not Found
          </h1>
          <p className={`text-center mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {error}
          </p>
          <button
            onClick={() => navigate('/')}
            className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Receipt Verified ✓
            </h1>
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            This receipt has been authenticated and verified by {receipt?.business?.name || 'InvoicePro'}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Receipt Content */}
        <div className={`rounded-lg p-8 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          {/* Header */}
          <div className="text-center mb-8 pb-8 border-b border-gray-300 dark:border-gray-700">
            <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              PAYMENT RECEIPT
            </h1>
            <div className={`inline-block px-4 py-2 rounded-full ${
              isDarkMode ? 'bg-green-900' : 'bg-green-100'
            }`}>
              <p className="text-green-600 dark:text-green-400 font-semibold">✓ VERIFIED PAYMENT</p>
            </div>
          </div>

          {/* Business Info */}
          <div className="mb-8 pb-8 border-b border-gray-300 dark:border-gray-700">
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {receipt?.business?.name}
            </h2>
            <div className={`text-sm mt-2 space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {receipt?.business?.address && <p>{receipt.business.address}</p>}
              {receipt?.business?.email && <p>{receipt.business.email}</p>}
              {receipt?.business?.phone && <p>{receipt.business.phone}</p>}
            </div>
          </div>

          {/* Receipt Details */}
          <div className="grid grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-300 dark:border-gray-700">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Receipt Number
              </p>
              <p className={`text-lg font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {receipt?.receiptNumber}
              </p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Invoice Number
              </p>
              <p className={`text-lg font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {receipt?.invoiceNumber}
              </p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Payment Date
              </p>
              <p className={`text-lg font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {new Date(receipt?.paymentDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Payment Method
              </p>
              <p className={`text-lg font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {receipt?.paymentMethod?.replace(/_/g, ' ').toUpperCase()}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-8 pb-8 border-b border-gray-300 dark:border-gray-700">
            <h3 className={`text-sm font-semibold uppercase mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Bill To
            </h3>
            <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
              <p className="font-semibold text-lg">{receipt?.customer?.name}</p>
              {receipt?.customer?.email && <p className="text-sm">{receipt.customer.email}</p>}
              {receipt?.customer?.phone && <p className="text-sm">{receipt.customer.phone}</p>}
              {receipt?.customer?.address && <p className="text-sm">{receipt.customer.address}</p>}
            </div>
          </div>

          {/* Items */}
          <div className="mb-8 pb-8 border-b border-gray-300 dark:border-gray-700">
            <h3 className={`text-sm font-semibold uppercase mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Items
            </h3>
            <div className="space-y-3">
              {receipt?.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.name}
                    </p>
                    {item.description && (
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.quantity} × ₦{item.price.toLocaleString()}
                    </p>
                    <p className={`text-sm font-semibold text-green-600 dark:text-green-400`}>
                      ₦{(item.quantity * item.price).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="mb-8">
            <div className="flex justify-end mb-3">
              <div className="w-full md:w-80">
                {receipt?.subtotal && (
                  <div className="flex justify-between mb-2">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>
                      ₦{receipt.subtotal.toLocaleString()}
                    </span>
                  </div>
                )}

                {receipt?.taxAmount > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Tax ({receipt.taxRate}%)
                    </span>
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>
                      ₦{receipt.taxAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                {receipt?.discount > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Discount</span>
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>
                      -₦{receipt.discount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-3 flex justify-between">
                  <span className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Total Paid
                  </span>
                  <span className={`font-bold text-lg text-green-600 dark:text-green-400`}>
                    ₦{receipt?.totalPaid?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-2">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Thank you for your business!
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Receipt ID: {receipt?.publicReceiptId?.substring(0, 12).toUpperCase()}...
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Generated: {new Date(receipt?.createdAt).toLocaleDateString()} at{' '}
              {new Date(receipt?.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Download Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => window.print()}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Download className="w-5 h-5" />
            Print or Save as PDF
          </button>
        </div>

        {/* Security Notice */}
        <div className={`mt-8 p-4 rounded-lg border ${
          isDarkMode
            ? 'bg-blue-900 border-blue-700'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
            ✓ This receipt has been verified as authentic. It was issued by {receipt?.business?.name} and confirms
            payment of ₦{receipt?.totalPaid?.toLocaleString()} on{' '}
            {new Date(receipt?.paymentDate).toLocaleDateString()}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptVerification;
