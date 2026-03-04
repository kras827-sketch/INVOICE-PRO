import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InvoicePreview from './InvoicePreview';
import api from '../services/api';
import { generatePDFBlob } from '../services/pdfGenerator';
import { generateInvoiceEmailHTML } from '../services/emailTemplates';
import { INVOICE_TEMPLATES } from '../data/invoiceTemplates';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

export default function SendEmail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('modern-clean');

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/invoices/${id}`);
        const inv = res.data.invoice || res.data;
        setInvoice(inv);
        setRecipient(inv.client?.email || '');
        setSubject(`Invoice ${inv.invoiceNumber}`);
        setSelectedTemplate(inv.template || 'modern-clean');
      } catch (err) {
        console.error('Failed to load invoice for sending', err);
        toast.error('Failed to load invoice');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInvoice();
  }, [id, navigate]);

  const handleSend = async () => {
    if (!recipient) return toast.error('Please provide recipient email');
    try {
      setSending(true);
      const normalized = invoice;
      console.log('📧 [SendEmail] Starting PDF generation...');
      const pdfBlob = await generatePDFBlob(normalized, selectedTemplate);
      console.log('📧 [SendEmail] PDF generated, size:', pdfBlob?.size || 'unknown');
      
      const normalizedForEmail = {
        ...normalized,
        clientName: normalized.client?.name || normalized.clientName,
        businessName: normalized.company?.name || normalized.businessName,
        businessAddress: normalized.company?.address || normalized.businessAddress,
        businessEmail: normalized.company?.email || normalized.businessEmail,
        clientAddress: normalized.client?.address || normalized.clientAddress,
        clientEmail: normalized.client?.email || normalized.clientEmail
      };
      const htmlContent = generateInvoiceEmailHTML(normalizedForEmail);
      
      console.log('📧 [SendEmail] Generated HTML content length:', htmlContent.length);
      console.log('📧 [SendEmail] PDF blob size:', pdfBlob.size);
      
      const formData = new FormData();
      formData.append('email', recipient);
      formData.append('subject', subject || `Invoice ${invoice.invoiceNumber}`);
      formData.append('html', htmlContent);
      formData.append('invoiceData', JSON.stringify({ ...normalized, template: selectedTemplate }));
      formData.append('pdf', pdfBlob, `Invoice-${invoice.invoiceNumber}.pdf`);

      const res = await api.post('/email/send-invoice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.success) {
        toast.success('Email sent successfully');
        navigate('/thank-you', {
          state: {
            title: 'Invoice Sent!',
            subTitle: `Invoice ${invoice.invoiceNumber} has been emailed to ${recipient}.`,
            message: 'A copy of the invoice has been saved to your dashboard.'
          }
        });
      } else {
        throw new Error(res.data?.message || 'Failed to send');
      }
    } catch (err) {
      console.error('Send email failed', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="text-center">
        <div className="modern-spinner spinner-lg spinner-glow mx-auto mb-4"></div>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading invoice...</p>
      </div>
    </div>
  );
  if (!invoice) return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="text-center">
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Invoice not found</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Send Invoice</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Review the email and send the selected invoice template to your client.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Recipient</label>
              <input type="email" value={recipient} onChange={(e) => setRecipient(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Template</label>
              <div className="flex gap-2">
                <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}
                  className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  {Object.entries(INVOICE_TEMPLATES).map(([key, tmpl]) => (
                    <option key={key} value={key}>{tmpl.name}</option>
                  ))}
                </select>
                <button onClick={() => setSelectedTemplate(invoice.template || 'modern-clean')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Restore saved
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Invoice Preview</label>
              <div className={`border rounded-lg p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                {invoice ? (
                  <InvoicePreview 
                    invoiceData={{
                      ...invoice,
                      businessName: invoice.company?.name || invoice.businessName,
                      businessEmail: invoice.company?.email || invoice.businessEmail,
                      businessPhone: invoice.company?.phone || invoice.businessPhone,
                      businessAddress: invoice.company?.address || invoice.businessAddress,
                      businessLogo: invoice.company?.logo || invoice.businessLogo,
                      clientName: invoice.client?.name || invoice.clientName,
                      clientEmail: invoice.client?.email || invoice.clientEmail,
                      clientAddress: invoice.client?.address || invoice.clientAddress,
                    }} 
                    template={selectedTemplate} 
                  />
                ) : (
                  <div className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Loading invoice preview...</div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={handleSend} disabled={sending}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <div className="modern-spinner spinner-sm spinner-white"></div>
                    Sending...
                  </span>
                ) : 'Send Email'}
              </button>
              <button onClick={() => navigate(`/invoice/${id}`)}
                className={`px-6 py-2.5 rounded-lg font-medium transition ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
            </div>
          </div>

          <div>
            <div className={`rounded-lg p-4 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recipient</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{invoice.client?.name || invoice.clientName}</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{invoice.client?.email || invoice.clientEmail}</p>

              <div className="mt-4">
                <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Invoice Summary</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>#{invoice.invoiceNumber}</p>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Total: {invoice.currency || 'NGN'} {invoice.total}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
