import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import { PDFViewer } from '@react-pdf/renderer';
import { PDFInvoice, downloadInvoicePDF } from '../services/pdfGenerator';
import { INVOICE_TEMPLATES } from '../data/invoiceTemplates';
import api from '../services/api';

const templates = Object.entries(INVOICE_TEMPLATES).map(([id, config]) => ({ id, ...config }));

const InvoicePDFPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [template, setTemplate] = useState('modern-clean');

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/invoices/${id}`);
        const inv = res.data.invoice || res.data;
        setInvoice(inv);
      } catch (err) {
        console.error('Failed to load invoice for PDF preview', err);
        toast.error('Failed to load invoice');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInvoice();
  }, [id, navigate]);

  const handleDownload = async () => {
    if (!invoice) return;

    try {
      setDownloading(true);
      // rely on frontend logic so chosen template is honored
      await downloadInvoicePDF(invoice, template);

      toast.success('Invoice PDF downloaded successfully!');
      // redirect after download
      navigate('/thank-you', {
        state: {
          invoiceNumber: invoice.invoiceNumber,
          message: 'Your invoice PDF has been downloaded.'
        }
      });
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="modern-spinner spinner-lg spinner-glow mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading Download PDF...</p>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className={`min-h-screen pb-20 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b sticky top-0 z-10`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Invoice PDF Preview
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Invoice #{invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              disabled={downloading}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2 shadow-sm disabled:opacity-70"
            >
              {downloading ? (
                <div className="modern-spinner spinner-sm spinner-white"></div>
              ) : (
                <Download className="w-5 h-5" />
              )}
              {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Preview Area */}
          <div className="lg:col-span-2">
            <div className={`rounded-xl shadow-lg border overflow-hidden h-full min-h-[800px] ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <PDFViewer width="100%" height="100%" className="border-none" showToolbar={false}>
                <PDFInvoice invoiceData={invoice} template={template} />
              </PDFViewer>
            </div>
          </div>
          
          {/* Template Selection Sidebar */}
          <div className="space-y-6">
            <div className={`rounded-xl shadow-sm border p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Select Template</h3>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      template === t.id 
                        ? 'border-brand-emerald bg-emerald-50 dark:bg-emerald-900/20' 
                        : isDarkMode
                          ? 'border-gray-700 hover:border-gray-500 hover:bg-gray-750'
                          : 'border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-sm mb-1 dark:text-gray-200">{t.name}</div>
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.primary }} />
                      <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: t.colors.accent }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className={`rounded-xl shadow-sm border p-6 bg-blue-50/50 border-blue-100 ${isDarkMode ? 'dark:bg-blue-900/10 dark:border-blue-800/30' : ''}`}>
              <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-800'}`}>Next Step</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-blue-700'}`}>
                After downloading, you'll be directed to the Thank You page. Your invoice is now ready to share with your client.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default InvoicePDFPreview;
