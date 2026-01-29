import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Send, Trash2, CheckCircle, Eye, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import InvoicePreview from './InvoicePreview';
import { downloadInvoicePDF } from '../services/pdfGenerator';
import { generateInvoiceEmailHTML } from '../services/emailTemplates';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function InvoiceViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/invoices/${id}`);
        const fetchedInvoice = res.data.invoice || res.data;
        
        // Normalize Backend Data for Viewer
        const normalized = {
          ...fetchedInvoice,
          // Map Backend Company Fields -> Viewer Expected Fields
          senderName: fetchedInvoice.company?.name || fetchedInvoice.senderName,
          senderEmail: fetchedInvoice.company?.email || fetchedInvoice.senderEmail,
          senderPhone: fetchedInvoice.company?.phone || fetchedInvoice.senderPhone,
          senderAddress: fetchedInvoice.company?.address || fetchedInvoice.senderAddress,
          // Map Backend Client Fields -> Viewer Expected Fields
          clientName: fetchedInvoice.client?.name || fetchedInvoice.clientName,
          clientEmail: fetchedInvoice.client?.email || fetchedInvoice.clientEmail,
          clientPhone: fetchedInvoice.client?.phone || fetchedInvoice.clientPhone,
          clientAddress: fetchedInvoice.client?.address || fetchedInvoice.clientAddress,
          // Map Backend Item Fields -> Viewer Expected Fields
          items: fetchedInvoice.items?.map(item => ({
            ...item,
            description: item.name || item.description,
            rate: item.price !== undefined ? item.price : item.rate
          })) || []
        };
        
        setInvoice(normalized);
      } catch (err) {
        console.error("Error fetching invoice:", err);
        toast.error('Failed to load invoice');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInvoice();
  }, [id, navigate]);

  const handleMarkAsPaid = async () => {
    try {
      await api.put(`/invoices/${id}`, { status: 'paid' });
      setInvoice({ ...invoice, status: 'paid' });
      toast.success('Invoice marked as paid');
    } catch (err) {
      toast.error('Failed to update invoice');
    }
  };

  const handleSendEmail = async () => {
    try {
      setSending(true);
      const recipientEmail = invoice.clientEmail || invoice.toEmail;
      
      if (!recipientEmail) {
        toast.error('No client email address found');
        return;
      }

      // Call backend email endpoint
      await api.post('/email/send-invoice', {
        email: recipientEmail,
        subject: `Invoice ${invoice.invoiceNumber}`,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        amount: invoice.total,
        dueDate: invoice.dueDate
      });

      toast.success('Invoice sent successfully!');
    } catch (err) {
      console.error('Email send error:', err);
      toast.error(err.response?.data?.message || 'Failed to send invoice');
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadInvoicePDF(invoice);
      toast.success('Invoice downloaded');
    } catch (err) {
      toast.error('Failed to download invoice');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      toast.success('Invoice deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to delete invoice');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Invoice not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </button>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Invoice {invoice.invoiceNumber}
          </h1>
          <div className={`px-4 py-2 rounded-full ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {invoice.status === 'paid' ? 'Paid' : invoice.status === 'completed' ? 'Completed' : 'Pending'}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Invoice Preview */}
          <div className="md:col-span-2">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8`}>
              <div className="mb-8">
                <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>INVOICE</p>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {invoice.invoiceNumber}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>FROM</p>
                  <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{invoice.senderName}</p>
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{invoice.senderEmail}</p>
                </div>
                <div>
                  <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>BILL TO</p>
                  <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{invoice.clientName}</p>
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{invoice.clientEmail}</p>
                </div>
              </div>

              {/* Items */}
              <div className="mb-8 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`border-b-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className={`pb-3 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</th>
                      <th className={`pb-3 text-sm font-semibold text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Qty</th>
                      <th className={`pb-3 text-sm font-semibold text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Rate</th>
                      <th className={`pb-3 text-sm font-semibold text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items && invoice.items.map((item, idx) => (
                      <tr key={idx} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className={`py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.description}</td>
                        <td className={`py-3 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.quantity}</td>
                        <td className={`py-3 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>${(parseFloat(item.rate) || 0).toFixed(2)}</td>
                        <td className={`py-3 text-right font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          ${((item.quantity || 0) * (item.rate || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-full md:w-1/3">
                  <div className={`flex justify-between py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span>Subtotal:</span>
                    <span>${invoice.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className={`flex justify-between py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span>Tax ({invoice.taxRate || 0}%):</span>
                    <span>${invoice.tax?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className={`flex justify-between py-2 border-t-2 ${isDarkMode ? 'border-gray-700 text-white text-lg font-bold' : 'border-gray-200 text-gray-900 text-lg font-bold'}`}>
                    <span>Total:</span>
                    <span>${invoice.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className={`p-4 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes:</p>
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Panel */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 h-fit`}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>

              <button
                onClick={handleSendEmail}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Sending...' : 'Send Email'}
              </button>

              {invoice.status !== 'paid' && (
                <button
                  onClick={handleMarkAsPaid}
                  className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark as Paid
                </button>
              )}

              <button
                onClick={() => navigate(`/invoice/${id}/edit`)}
                className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition"
              >
                <Edit2 className="h-4 w-4" />
                Edit Invoice
              </button>

              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>

            {/* Invoice Info */}
            <div className={`mt-6 pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} space-y-2 text-sm`}>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Date:</span>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  {new Date(invoice.invoiceDate || invoice.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Due:</span>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
