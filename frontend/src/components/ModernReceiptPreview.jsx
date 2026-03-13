import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Download, Mail, QrCode, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/currencyUtils';
import { toast } from 'react-hot-toast';
import { INVOICE_TEMPLATES } from '../data/invoiceTemplates';
import { downloadReceiptPDF, generateReceiptPDFBlob } from '../services/pdfGenerator';

const ModernReceiptPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  
  const [invoice, setInvoice] = useState(location.state?.invoice || null);
  const [receipt, setReceipt] = useState(location.state?.receipt || null);
  const [invoiceLoading, setInvoiceLoading] = useState(invoice ? false : true);
  const [receiptLoading, setReceiptLoading] = useState(receipt ? false : true);
  const [generating, setGenerating] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [template, setTemplate] = useState('modern-clean');

  const templates = Object.entries(INVOICE_TEMPLATES).map(([id, config]) => ({ id, ...config }));

  const templateConfig = INVOICE_TEMPLATES[template] || INVOICE_TEMPLATES['modern-clean'];
  const colors = templateConfig.colors;


  useEffect(() => {
    // if we were navigated here from dashboard with invoice+receipt available,
    // we can skip the network roundtrip entirely
    if (location.state?.invoice && location.state?.receipt) {
      setInvoice(location.state.invoice);
      setReceipt(location.state.receipt);
      setInvoiceLoading(false);
      setReceiptLoading(false);
      // initialize template from invoice if provided
      if (location.state.invoice.template) setTemplate(location.state.invoice.template);
      return;
    }

    const fetchData = async () => {
      setInvoiceLoading(true);
      setReceiptLoading(true);

      // start both requests concurrently
      const invPromise = api.get(`/invoices/${id}`)
        .then(res => {
          const inv = res.data.invoice || res.data;
          setInvoice(inv);
          if (inv.template) setTemplate(inv.template);
        })
        .catch(err => {
          console.error('Failed to load invoice for receipt preview', err);
          toast.error('Failed to load invoice');
          navigate('/dashboard');
          throw err;
        })
        .finally(() => setInvoiceLoading(false));

      const receiptPromise = api.get(`/receipts`, { params: { invoiceId: id, limit: 1 } })
        .then(res => {
          if (res.data.receipts && res.data.receipts.length > 0) {
            setReceipt(res.data.receipts[0]);
          }
        })
        .catch(err => {
          console.log('No existing receipt found');
        })
        .finally(() => setReceiptLoading(false));

      await Promise.all([invPromise, receiptPromise]);
    };
    if (id) fetchData();
  }, [id, navigate, location.state]);

  // Generate receipt only (no email); after creation user can review and send manually
  const handleGenerateReceipt = async () => {
    try {
      setGenerating(true);
      const res = await api.post(`/receipts/create`, {
        invoiceId: id,
        paymentMethod: 'bank_transfer',
        paymentDate: new Date().toISOString(),
        sendEmail: false
      });

      if (res.data && res.data.success) {
        toast.success('Receipt generated! You may now preview or send it.');
        // fetch receipt to show
        try {
          const receiptRes = await api.get(`/receipts`, { params: { invoiceId: id, limit: 1 } });
          if (receiptRes.data.receipts && receiptRes.data.receipts.length > 0) {
            setReceipt(receiptRes.data.receipts[0]);
          }
        } catch (err) {
          console.log('Could not fetch receipt after creation');
        }
      }
    } catch (err) {
      console.error('Error generating receipt:', err);
      const msg = err.response?.data?.message || 'Error generating receipt';
      if (msg.includes('already exists')) {
        toast.success('Receipt already exists for this invoice');
        try {
          const receiptRes = await api.get(`/receipts`, { params: { invoiceId: id, limit: 1 } });
          if (receiptRes.data.receipts && receiptRes.data.receipts.length > 0) {
            setReceipt(receiptRes.data.receipts[0]);
          }
        } catch (fetchErr) {
          console.error('Failed to fetch existing receipt:', fetchErr);
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      if (!receipt?._id) {
        return toast.error('Generate the receipt first before downloading');
      }
      // generate client-side so colour template is honoured
      await downloadReceiptPDF({
        ...invoice,
        ...receipt
      }, template);

      toast.success('Receipt PDF downloaded!');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error('Failed to download PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      if (!receipt?._id) {
        return toast.error('Generate the receipt first before sending email');
      }

      const email = invoice?.client?.email || invoice?.clientEmail;
      
      const formData = new FormData();
      formData.append('email', email);
      
      // Generate the frontend PDF blob using our lovely template and attach it
      const pdfBlob = await generateReceiptPDFBlob({ ...invoice, ...receipt }, template);
      formData.append('pdf', pdfBlob, `Receipt_${receipt.receiptNumber}.pdf`);

      await api.post(`/receipts/${receipt._id}/send`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Receipt emailed successfully!');
      navigate('/receipt-success');
    } catch (err) {
      console.error('Error sending email:', err);
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
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

  // If invoice isn't marked paid yet
  if (invoice.status !== 'paid') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center max-w-md mx-auto p-8">
          <p className={`text-lg mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Receipt preview is only available after the invoice is marked as paid.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-brand-emerald text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b sticky top-0 z-10`}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 transition ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Payment Confirmation
          </h1>
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

        {/* Modern Receipt Card */}
        <div className={`rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border-0'}`}>
          
          {/* Header Stripe */}
          <div className="h-2" style={{ backgroundColor: colors.primary }}></div>

          {/* Content */}
          <div className="p-8 sm:p-12">

            {/* Status Badge */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-lg" style={{ backgroundColor: colors.accent, opacity: 0.3 }}></div>
                <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${isDarkMode ? '' : ''}`} style={{ backgroundColor: isDarkMode ? `${colors.primary}50` : `${colors.accent}` , borderColor: colors.primary, borderWidth: 2 }}>
                  <CheckCircle className="w-8 h-8" style={{ color: colors.primary }} />
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
                    <p className={`text-3xl font-bold`} style={{ color: colors.primary }}>
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

            {/* QR Code Section — show only after receipt is generated */}
            {receipt?.qrCode && (
              <div className={`rounded-xl p-8 mb-8 flex flex-col items-center border-2 border-dashed ${isDarkMode ? 'border-gray-700 bg-gray-700/10' : 'border-gray-300 bg-gray-50'}`}>
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
              </div>
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

            {/* Action Buttons */}
            {receiptLoading ? (
              <div className="flex justify-center py-12">
                <div className="modern-spinner spinner-lg spinner-glow"></div>
                <p className={`ml-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading receipt...</p>
              </div>
            ) : !receipt ? (
              /* No receipt yet — show Generate Receipt button */
              <button
                onClick={handleGenerateReceipt}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-emerald to-blue-500 hover:from-brand-emerald-dark hover:to-blue-600 text-white py-4 rounded-xl font-semibold transition disabled:opacity-70 text-lg"
              >
                {generating ? (
                  <div className="modern-spinner spinner-sm spinner-white"></div>
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                {generating ? 'Generating...' : 'Generate Receipt'}
              </button>
            ) : (
              /* Receipt exists — show Download + Resend buttons */
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPDF}
                  className="w-full flex items-center justify-center gap-2 bg-brand-emerald hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-70"
                >
                  {downloadingPDF ? (
                    <div className="modern-spinner spinner-sm spinner-white"></div>
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  {downloadingPDF ? 'Downloading...' : 'Download PDF'}
                </button>

                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-70"
                >
                  {sendingEmail ? (
                    <div className="modern-spinner spinner-sm spinner-white"></div>
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                  {sendingEmail ? 'Sending...' : 'Resend Email'}
                </button>
              </div>
            )}

            {/* Footer */}
            <div className={`mt-8 pt-8 border-t text-center text-xs ${isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-600'}`}>
              <p>Thank you for your business. This receipt is valid and can be used for your records.</p>
              <p className="mt-2">
                For questions or support, contact us at {invoice.senderEmail || invoice.company?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className={`mt-8 rounded-xl p-6 border ${isDarkMode ? 'bg-blue-900/10 border-blue-800/30' : 'bg-blue-50 border-blue-200'}`}>
          <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`}>
            {receipt ? 'Receipt Actions' : 'Generate Receipt'}
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-blue-300/80' : 'text-blue-800'}`}>
            {receipt 
              ? 'Download the receipt as PDF or resend it to your client via email. The QR code can be scanned to verify the payment authenticity online.'
              : 'Click the button above to generate a receipt for this paid invoice. A QR code will be created for verification and the receipt will be emailed to your client automatically.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModernReceiptPreview;
