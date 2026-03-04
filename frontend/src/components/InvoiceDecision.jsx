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
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            Create Invoice
          </button>
        </div>
      </div>
    );
  }

  // Navigate to dedicated Send Email page
  const navigateToSendPage = () => {
    const id = savedInvoice?._id || invoiceData?._id || invoiceData?.id;
    if (!id) {
      toast.error('Missing invoice ID to send');
      return;
    }

    navigate(`/invoice/${id}/send`, {
      state: {
        invoiceData,
        pdfBlob,
        savedInvoice
      }
    });
  };

  // Handle Download
  const handleDownload = async () => {
    try {
      setLoading(true);
      await downloadInvoicePDF(invoiceData, invoiceData.template || 'modern-clean');
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
                ? 'bg-gray-800 border-gray-700 hover:border-emerald-500 hover:bg-gray-750'
                : 'bg-white border-gray-200 hover:border-emerald-500 hover:bg-emerald-50'
            } disabled:opacity-50 text-left group`}
          >
            <div className="flex items-start mb-4">
              <div className="p-3 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition mr-4">
                <Download className="w-6 h-6 text-emerald-600" />
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

            <div className={`flex items-center gap-2 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} font-semibold`}>
              <span>Download Now →</span>
            </div>
          </button>

          {/* Send Email Option */}
          <button
            onClick={navigateToSendPage}
            disabled={loading}
            className={`p-8 rounded-xl border-2 transition ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 hover:border-brand-emerald hover:bg-gray-750'
                : 'bg-white border-gray-200 hover:border-brand-emerald hover:bg-emerald-50'
            } disabled:opacity-50 text-left group`}
          >
            <div className="flex items-start mb-4">
              <div className="p-3 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition mr-4">
                <Mail className="w-6 h-6 text-brand-emerald" />
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

            <div className={`flex items-center gap-2 ${isDarkMode ? 'text-emerald-400' : 'text-brand-emerald'} font-semibold`}>
              <span>Send Email →</span>
            </div>
          </button>
        </div>

        {/* Send Email handled by dedicated page */}

      </div>
    </div>
  );
}


