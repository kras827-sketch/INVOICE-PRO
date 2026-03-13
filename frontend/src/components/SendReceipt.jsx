import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Mail, QrCode } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/currencyUtils';
import { INVOICE_TEMPLATES } from '../data/invoiceTemplates';
import { generateReceiptPDFBlob } from '../services/pdfGenerator';

/**
 * Simple card component that renders the receipt preview used in several places.
 * Note: verbatim copy of markup from ModernReceiptPreview but without the action
 * buttons at the bottom. This allows SendReceipt to show the card inline while
 * rendering its own email form above.
 */
const ReceiptCard = ({ invoice, receipt, isDarkMode, loading, template }) => {
  if (loading) {
    return (
      <div className={`py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <div className="modern-spinner spinner-glow mx-auto mb-4"></div>
        Loading receipt...
      </div>
    );
  }

  if (!invoice) return null;

  const config = INVOICE_TEMPLATES[template] || INVOICE_TEMPLATES['modern-clean'];
  const colors = config.colors;

  return (
    <div className={`rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border-0'}`}>
      {/* Header Stripe */}
      <div className="h-2" style={{ backgroundColor: colors.primary }}></div>

      {/* Content */}
      <div className="p-8 sm:p-12">
        {/* Status Badge */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-lg" style={{ backgroundColor: colors.accent, opacity: 0.3 }}></div>
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: isDarkMode ? `${colors.primary}50` : colors.accent, border: `2px solid ${colors.primary}` }}>
              <Mail className="w-8 h-8" style={{ color: colors.primary }} />
            </div>
          </div>
        </div>

        {/* Main Title */}
        <h2 className={`text-center text-3xl sm:text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          PAYMENT CONFIRMED
        </h2>
        <p className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Transaction completed successfully
        </p>

        <div className={`my-8 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>

        {/* Receipt Details Grid */}
        <div className="grid sm:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Invoice Details */}
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Invoice Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Invoice Number
                </p>
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  #{invoice.invoiceNumber}
                </p>
              </div>
              <div>
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Date
                </p>
                <p className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {new Date(invoice.invoiceDate || invoice.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              {receipt && (
                <div>
                  <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Receipt Number
                  </p>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    {receipt.receiptNumber}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Amount */}
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Amount Paid
            </h3>
            <div className="space-y-3">
              <div>
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Total
                </p>
                <p className="text-3xl font-bold" style={{ color: colors.primary }}>
                  {formatCurrency(invoice.total, invoice.currency)}
                </p>
              </div>
              <div>
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary }}></div>
                  <span className={`text-base font-medium`} style={{ color: colors.primary }}>Paid</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className={`rounded-xl p-6 mb-8 ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                From
              </p>
              <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {invoice.senderName || invoice.company?.name}
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {invoice.senderEmail || invoice.company?.email}
              </p>
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                To
              </p>
              <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {invoice.clientName || invoice.client?.name}
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {invoice.clientEmail || invoice.client?.email}
              </p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        {receipt?.qrCode && (
          <div className={`rounded-xl p-8 mb-8 flex flex-col items-center border-2 border-dashed ${
            isDarkMode ? 'border-gray-700 bg-gray-700/10' : 'border-gray-300 bg-gray-50'
          }`}> 
            <QrCode className={`w-6 h-6 mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <img 
              src={receipt.qrCode} 
              alt="Receipt QR Code" 
              className="w-32 h-32 rounded-lg mb-3 border border-gray-300 dark:border-gray-700"
            />
            <p className={`text-sm text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Scan to verify this payment online
            </p>
            {receipt.verificationUrl && (
              <p className={`text-xs mt-2 text-center break-all ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {receipt.verificationUrl}
              </p>
            )}
          </div>
        )}

        {/* Items Breakdown */}
        <div className={`rounded-xl p-6 mb-8 ${isDarkMode ? 'bg-gray-700/20' : 'bg-gray-50'}`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Items
          </h3>
          <div className="space-y-3">
            {invoice.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.name}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.quantity} × {formatCurrency(item.rate || item.price || 0, invoice.currency)}
                  </p>
                </div>
                <p className={`font-medium text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(item.quantity * (item.rate || item.price || 0), invoice.currency)}
                </p>
              </div>
            ))}
            {invoice.subtotal !== invoice.total && (
              <>
                <div className={`my-3 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {formatCurrency(invoice.subtotal || 0, invoice.currency)}
                    </span>
                  </div>
                  {invoice.tax > 0 && (
                    <div className="flex justify-between">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        Tax ({invoice.taxRate || 0}%)
                      </span>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {formatCurrency(invoice.tax || 0, invoice.currency)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`mt-8 pt-8 border-t text-center text-xs ${isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-600'}`}> 
          <p>Thank you for your business. This receipt is valid and can be used for your records.</p>
          <p className="mt-2">
            For questions or support, contact us at {invoice.senderEmail || invoice.company?.email}
          </p>
        </div>
      </div>
    </div>
  );
};

const SendReceipt = () => {
  const { id } = useParams(); // invoice id
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();

  const [invoice, setInvoice] = useState(location.state?.invoice || null);
  const [receipt, setReceipt] = useState(location.state?.receipt || null);
  const [invoiceLoading, setInvoiceLoading] = useState(!invoice);
  const [receiptLoading, setReceiptLoading] = useState(!receipt);
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // If we already received an invoice object in location.state, use it immediately
    if (location.state?.invoice) {
      setInvoice(location.state.invoice);
      setRecipient(location.state.invoice.client?.email || location.state.invoice.clientEmail || '');
      setInvoiceLoading(false);
    }

    // If receipt also came along we can short‑circuit everything
    if (location.state?.invoice && location.state?.receipt) {
      setReceipt(location.state.receipt);
      setReceiptLoading(false);
      return;
    }

    const fetch = async () => {
      // invoice may already be set above
      if (!location.state?.invoice) setInvoiceLoading(true);
      setReceiptLoading(true);

      try {
        if (!location.state?.invoice) {
          const invRes = await api.get(`/invoices/${id}`);
          const inv = invRes.data.invoice || invRes.data;
          setInvoice(inv);
          setRecipient(inv.client?.email || inv.clientEmail || '');
        }
      } catch (err) {
        console.error('Error loading invoice for send receipt', err);
        toast.error('Failed to load invoice');
        navigate('/dashboard');
        return;
      } finally {
        if (!location.state?.invoice) setInvoiceLoading(false);
      }

      try {
        const rres = await api.get('/receipts', { params: { invoiceId: id, limit: 1 } });
        if (rres.data.receipts && rres.data.receipts.length > 0) {
          setReceipt(rres.data.receipts[0]);
        } else {
          // no receipt yet -- create one so we can send it
          const createRes = await api.post('/receipts/create', { invoiceId: id, sendEmail: false });
          setReceipt(createRes.data.receipt);
        }
      } catch (err) {
        console.error('Error fetching/creating receipt', err);
      } finally {
        setReceiptLoading(false);
      }
    };

    if (id) fetch();
  }, [id, location.state, navigate]);

  const [template, setTemplate] = useState('modern-clean');
  const templates = Object.entries(INVOICE_TEMPLATES).map(([id, config]) => ({ id, ...config }));

  useEffect(() => {
    if (invoice && invoice.template) {
      setTemplate(invoice.template);
    }
  }, [invoice]);

  const handleSend = async () => {
    if (!recipient) return toast.error('Please provide recipient email');
    if (!receipt?._id) return toast.error('Receipt not available');

    try {
      setSending(true);

      // generate PDF blob client-side so it matches preview template
      const pdfBlob = await generateReceiptPDFBlob({
        ...invoice,
        ...receipt
      }, template);

      const formData = new FormData();
      formData.append('email', recipient);
      formData.append('template', template);
      formData.append('pdf', pdfBlob, `Receipt-${receipt.receiptNumber || 'receipt'}.pdf`);

      await api.post(`/receipts/${receipt._id}/send`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Receipt emailed successfully');
      navigate('/receipt-success');
    } catch (err) {
      console.error('Error sending receipt email', err);
      toast.error(err.response?.data?.message || 'Failed to send receipt');
    } finally {
      setSending(false);
    }
  };

  if (invoiceLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="modern-spinner spinner-lg spinner-glow mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  if (invoice.status !== 'paid') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center max-w-md mx-auto p-8">
          <p className={`text-lg mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            You can only send a receipt once the invoice has been paid.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-brand-emerald text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* header */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b sticky top-0 z-10`}> 
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 transition ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Send Receipt</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* template selector */}
        <div className="mb-6">
          <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Receipt Style</h3>
          <div className="flex gap-2 flex-wrap">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                style={{
                  borderColor: template === t.id ? t.colors.primary : 'transparent',
                  backgroundColor: template === t.id ? t.colors.accent : 'transparent'
                }}
                className="px-3 py-1 rounded-lg text-sm border-2 transition"
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
        {/* Form */}
        <div className="mb-8">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>To</label>
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div className="mt-4">
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <div className="modern-spinner spinner-sm spinner-white"></div>
                  Sending...
                </span>
              ) : 'Send Receipt'}
            </button>
          </div>
        </div>

        {/* Receipt preview card */}
        <ReceiptCard invoice={invoice} receipt={receipt} isDarkMode={isDarkMode} loading={receiptLoading} template={template} />
      </div>
    </div>
  );
};

export default SendReceipt;