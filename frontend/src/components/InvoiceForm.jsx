import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Download, Send, FileText, Camera, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import InvoicePreview from './InvoicePreview';
import { downloadInvoicePDF, generatePDFBlob } from '../services/pdfGenerator';
import { generateInvoiceEmailHTML } from '../services/emailTemplates';
import { INVOICE_TEMPLATES } from '../data/invoiceTemplates';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { user, firebaseUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('form'); // form or preview
  const [selectedTemplate, setSelectedTemplate] = useState('modern-clean');
  const [logo, setLogo] = useState(null);
  const [useDefaultLogo, setUseDefaultLogo] = useState(false);
  const logoInputRef = useRef(null);

  // Load default business logo from user profile if available
  useEffect(() => {
    try {
      const defaultLogo = user?.businessProfile?.logoUrl;
      if (defaultLogo) {
        setLogo(defaultLogo);
        setUseDefaultLogo(true);
        setInvoiceData(prev => ({ ...prev, businessLogo: defaultLogo }));
      }
    } catch (err) {
      console.error('Failed to load default logo:', err);
    }
  }, [user]);
  
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: 'INV-' + Date.now(),
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    
    // Business Details
    businessName: user?.displayName || user?.name || '',
    businessEmail: user?.email || '',
    businessPhone: '',
    businessAddress: '',
    businessLogo: null,
    
    // From section (kept for backward compatibility)
    fromName: user?.displayName || user?.name || '',
    fromEmail: user?.email || '',
    fromPhone: '',
    fromAddress: '',
    
    // To section
    toName: '',
    toEmail: '',
    toPhone: '',
    toAddress: '',
    
    // Items
    items: [
      { id: 1, description: '', quantity: 1, rate: 0 }
    ],
    
    // Financials
    taxRate: 7.5,
    discount: 0,
    notes: '',
    terms: 'Payment due within 30 days',
    
    // Status
    status: 'draft'
  });

  const [loading, setLoading] = useState(false);
  const [itemIdCounter, setItemIdCounter] = useState(2);

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = invoiceData.items.reduce((sum, item) => 
      sum + (item.quantity * item.rate), 0
    );
    const tax = (subtotal * invoiceData.taxRate) / 100;
    const total = subtotal + tax - invoiceData.discount;
    
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();

  // Normalize invoice data to the structure used by Preview & PDF
  const normalizeInvoiceData = (data) => {
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * (item.rate || item.price || 0)), 0);
    const taxAmount = (subtotal * (data.taxRate || 0)) / 100;
    const total = subtotal + taxAmount - (data.discount || 0);

    return {
      ...data,
      subtotal,
      tax: taxAmount,
      total,
      businessLogo: useDefaultLogo
        ? (user?.businessProfile?.logoUrl || logo || '')
        : (data.businessLogo || logo || user?.businessProfile?.logoUrl || ''),
      businessName: data.businessName || user?.businessProfile?.businessName || user?.name || '',
      businessEmail: data.businessEmail || user?.businessProfile?.businessEmail || user?.email || '',
      businessAddress: data.businessAddress || user?.businessProfile?.businessAddress || '',
      items: data.items.map(item => ({
        name: item.description || item.name || 'Item',
        quantity: item.quantity,
        price: item.rate || item.price || 0
      })),
      bankDetails: user?.businessProfile?.bankDetails || {}
    };
  };
  // Handle logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      setLogo(reader.result);
      // If user uploads a logo, switch to one-off logo mode
      setUseDefaultLogo(false);
      setInvoiceData(prev => ({ ...prev, businessLogo: reader.result }));
      toast.success('Logo uploaded');
    };
    reader.readAsDataURL(file);
  };

  // Add item
  const addItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, { 
        id: itemIdCounter, 
        description: '', 
        quantity: 1, 
        rate: 0 
      }]
    });
    setItemIdCounter(itemIdCounter + 1);
  };

  // Remove item
  const removeItem = (id) => {
    if (invoiceData.items.length > 1) {
      setInvoiceData({
        ...invoiceData,
        items: invoiceData.items.filter(item => item.id !== id)
      });
    } else {
      toast.error('Must have at least one item');
    }
  };

  // Update item
  const updateItem = (id, field, value) => {
    setInvoiceData({
      ...invoiceData,
      items: invoiceData.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };

  // Update invoice data
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData({ ...invoiceData, [name]: value });
  };

  // Save invoice to database
  const saveInvoiceToDB = async (normalized) => {
    try {
      let token;
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();
      } else {
        token = localStorage.getItem('token');
      }

      if (!token) {
        throw new Error('Authentication required');
      }

      // Format data according to backend Invoice model
      const invoicePayload = {
        items: normalized.items, // Already formatted as [{name, quantity, price}]
        client: {
          name: normalized.toName,
          email: normalized.toEmail,
          phone: normalized.toPhone,
          address: normalized.toAddress
        },
        company: {
          name: normalized.businessName,
          email: normalized.businessEmail,
          phone: normalized.businessPhone,
          address: normalized.businessAddress,
          logo: normalized.businessLogo
        },
        dueDate: normalized.dueDate,
        taxRate: normalized.taxRate,
        discount: normalized.discount,
        notes: normalized.notes,
        terms: normalized.terms,
        template: normalized.template || 'modern-clean'
      };

      console.log('💾 Invoice payload:', invoicePayload);

      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/invoices/create`;
      
      const response = await axios.post(apiUrl, invoicePayload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('✅ Invoice saved to DB:', response.data.invoice?._id || response.data._id);
      return response.data.invoice || response.data;
    } catch (error) {
      console.error('❌ Error saving invoice to DB:', error.response?.data || error.message);
      // Continue even if DB save fails - user can still download/send
      return null;
    }
  };

  // Save invoice
  const handleSave = async () => {
    try {
      if (!invoiceData.toName || invoiceData.toName.trim() === '') {
        toast.error('Please enter client name');
        return;
      }
      
      if (invoiceData.items.length === 0 || invoiceData.items.some(item => !item.description && !item.name)) {
        toast.error('Please add at least one item with description');
        return;
      }
      
      setLoading(true);
      console.log('💾 [SAVE] Starting invoice save...');
      
      const normalized = normalizeInvoiceData({ ...invoiceData, businessLogo: logo });
      
      // Step 1: Save to database
      console.log('💾 [SAVE] Saving to database...');
      await saveInvoiceToDB(normalized);
      
      // Step 2: Generate PDF
      console.log('💾 [SAVE] Generating PDF...');
      const pdfBlob = await generatePDFBlob(normalized, selectedTemplate);
      
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('PDF generation failed');
      }
      
      // Step 3: Download PDF
      console.log('💾 [SAVE] Downloading PDF...');
      const filename = `Invoice-${invoiceData.invoiceNumber || 'draft'}-${Date.now()}.pdf`;
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      console.log('✅ [SAVE] Invoice saved and downloaded');
      toast.success('✅ Invoice saved and downloaded!');
      
      // Redirect to thank you page
      setTimeout(() => {
        navigate('/thank-you');
      }, 1000);
      
    } catch (error) {
      console.error('❌ [SAVE] Error:', error);
      toast.error(error.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  // Download PDF
  const handleDownload = async () => {
    try {
      if (invoiceData.items.length === 0) {
        toast.error('Add at least one item to generate PDF');
        return;
      }
      
      setLoading(true);
      console.log('📥 [DOWNLOAD] Starting PDF download...');
      
      const normalized = normalizeInvoiceData({ ...invoiceData, businessLogo: logo });
      
      // Save to database
      console.log('📥 [DOWNLOAD] Saving to database...');
      await saveInvoiceToDB(normalized);
      
      // Download PDF
      console.log('📥 [DOWNLOAD] Downloading PDF...');
      await downloadInvoicePDF(normalized, selectedTemplate);
      
      console.log('✅ [DOWNLOAD] PDF downloaded successfully');
      toast.success('📥 Invoice PDF downloaded');
      
      // Redirect to thank you page
      setTimeout(() => {
        navigate('/thank-you');
      }, 1000);
      
    } catch (error) {
      console.error('❌ [DOWNLOAD] Error:', error);
      toast.error(error.message || 'Failed to download PDF');
    } finally {
      setLoading(false);
    }
  };;

  // Send email
  const handleSendEmail = async () => {
    if (!invoiceData.toEmail || invoiceData.toEmail.trim() === '') {
      toast.error('Enter recipient email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoiceData.toEmail)) {
      toast.error('Enter a valid email address');
      return;
    }

    if (invoiceData.items.length === 0) {
      toast.error('Add at least one item before sending');
      return;
    }

    try {
      setLoading(true);
      console.log('📧 [EMAIL] Starting complete email workflow...');
      
      // Get token
      let token;
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();
      } else {
        token = localStorage.getItem('token');
      }

      if (!token) {
        throw new Error('Authentication required - please log in again');
      }

      console.log('📧 [EMAIL] Step 1: Saving invoice to database...');
      const normalized = normalizeInvoiceData({ ...invoiceData, businessLogo: logo });
      await saveInvoiceToDB(normalized);

      console.log('📧 [EMAIL] Step 2: Generating PDF...');
      const pdfBlob = await generatePDFBlob(normalized, selectedTemplate);
      
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('Failed to generate PDF for email');
      }
      
      console.log('📧 [EMAIL] PDF generated:', pdfBlob.size, 'bytes');

      console.log('📧 [EMAIL] Step 3: Sending email with PDF attachment...');
      const formData = new FormData();
      formData.append('email', invoiceData.toEmail.trim());
      formData.append('subject', `Invoice ${invoiceData.invoiceNumber}`);
      formData.append('html', generateInvoiceEmailHTML(normalized));
      formData.append('pdf', pdfBlob, `${invoiceData.invoiceNumber}.pdf`);

      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/email/send-invoice`;
      console.log('📧 [EMAIL] API URL:', apiUrl);
      console.log('📧 [EMAIL] Recipient:', invoiceData.toEmail);

      const response = await axios.post(
        apiUrl,
        formData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`
          } 
        }
      );

      console.log('📧 [EMAIL] Response:', response.status, response.data);

      if (response.data.success || response.status === 200) {
        toast.success('✅ Invoice sent to ' + invoiceData.toEmail);
        console.log('✅ [EMAIL] Complete workflow successful');
        
        // Redirect to thank you page
        setTimeout(() => {
          navigate('/thank-you');
        }, 1000);
      } else {
        throw new Error(response.data.message || 'Server returned error');
      }
      
    } catch (error) {
      console.error('❌ [EMAIL] Error:', error);
      console.error('❌ [EMAIL] Status:', error.response?.status);
      console.error('❌ [EMAIL] Response:', error.response?.data);
      
      let errorMsg = error.response?.data?.message || error.message || 'Failed to send invoice email';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} py-8 px-4`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FileText className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Create Invoice
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'form'
                  ? `${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white`
                  : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Form
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'preview'
                  ? `${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white`
                  : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {activeTab === 'form' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Template Selector */}
              <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Template & Logo
                </h2>
                
                <div className="space-y-4">
                  {/* Template Selection */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Invoice Template
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(INVOICE_TEMPLATES).map(([key, template]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedTemplate(key)}
                          className={`p-3 rounded-lg border-2 transition text-left ${
                            selectedTemplate === key
                              ? `border-blue-500 ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`
                              : `border-gray-300 ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'hover:bg-gray-50'}`
                          }`}
                        >
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </div>
                          <div className="w-full h-2 rounded mt-2" style={{ backgroundColor: template.colors.primary }}></div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Business Logo
                    </label>
                    <div className={`flex items-center gap-4 p-4 rounded-lg border-2 border-dashed ${
                      isDarkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'
                    }`}>
                      {logo ? (
                        <img src={logo} alt="Logo" className="h-12 w-auto" />
                      ) : (
                        <Camera className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                      )}
                      <button
                        onClick={() => logoInputRef.current.click()}
                        className="text-blue-500 hover:text-blue-600 font-medium text-sm"
                      >
                        {logo ? 'Change Logo' : 'Upload Logo'}
                      </button>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                    {/* Toggle: use default business logo */}
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        id="useDefaultLogo"
                        type="checkbox"
                        checked={useDefaultLogo}
                        onChange={(e) => {
                          setUseDefaultLogo(e.target.checked);
                          if (e.target.checked) {
                            const defaultLogo = user?.businessProfile?.logoUrl || null;
                            if (defaultLogo) {
                              setLogo(defaultLogo);
                              setInvoiceData(prev => ({ ...prev, businessLogo: defaultLogo }));
                            }
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <label htmlFor="useDefaultLogo" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>Use default business logo</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Info */}
              <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Invoice Information
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      name="invoiceNumber"
                      value={invoiceData.invoiceNumber}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 rounded border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      name="invoiceDate"
                      value={invoiceData.invoiceDate}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 rounded border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={invoiceData.dueDate}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 rounded border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* From Section */}
              <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  From (Your Details)
                </h2>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    name="businessName"
                    placeholder="Business Name"
                    value={invoiceData.businessName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <input
                    type="email"
                    name="businessEmail"
                    placeholder="Email"
                    value={invoiceData.businessEmail}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <input
                    type="tel"
                    name="businessPhone"
                    placeholder="Phone"
                    value={invoiceData.businessPhone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <textarea
                    name="businessAddress"
                    placeholder="Business Address"
                    value={invoiceData.businessAddress}
                    onChange={handleChange}
                    rows="3"
                    className={`w-full px-3 py-2 rounded border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>

              {/* To Section */}
              <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Bill To (Client Details)
                </h2>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    name="toName"
                    placeholder="Client Name"
                    value={invoiceData.toName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <input
                    type="email"
                    name="toEmail"
                    placeholder="Client Email"
                    value={invoiceData.toEmail}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <input
                    type="tel"
                    name="toPhone"
                    placeholder="Client Phone"
                    value={invoiceData.toPhone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <textarea
                    name="toAddress"
                    placeholder="Client Address"
                    value={invoiceData.toAddress}
                    onChange={handleChange}
                    rows="3"
                    className={`w-full px-3 py-2 rounded border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Line Items
                  </h2>
                  <button
                    onClick={addItem}
                    className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {invoiceData.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className={`col-span-5 px-3 py-2 rounded border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                        className={`col-span-2 px-3 py-2 rounded border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      <input
                        type="number"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value))}
                        className={`col-span-3 px-3 py-2 rounded border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      <button
                        onClick={() => removeItem(item.id)}
                        className="col-span-2 p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financials */}
              <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Financials
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      name="taxRate"
                      value={invoiceData.taxRate}
                      onChange={handleChange}
                      step="0.1"
                      className={`w-full px-3 py-2 rounded border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Discount (₦)
                    </label>
                    <input
                      type="number"
                      name="discount"
                      value={invoiceData.discount}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 rounded border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Notes & Terms
                </h2>
                
                <div className="space-y-4">
                  <textarea
                    name="notes"
                    placeholder="Additional notes"
                    value={invoiceData.notes}
                    onChange={handleChange}
                    rows="2"
                    className={`w-full px-3 py-2 rounded border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <textarea
                    name="terms"
                    placeholder="Terms and conditions"
                    value={invoiceData.terms}
                    onChange={handleChange}
                    rows="2"
                    className={`w-full px-3 py-2 rounded border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Invoice'}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> {loading ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> {loading ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>

            {/* Sidebar - Quick Stats */}
            <div className="space-y-4">
              <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Summary
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal:</span>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      ₦{subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tax ({invoiceData.taxRate}%):</span>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      ₦{tax.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Discount:</span>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      -₦{invoiceData.discount.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total:</span>
                    <span className={`text-lg font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      ₦{total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Preview Tab
          <div className="bg-white rounded-lg overflow-hidden shadow-lg">
            <InvoicePreview
              invoiceData={invoiceData}
              template={selectedTemplate}
              isFullPage={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
