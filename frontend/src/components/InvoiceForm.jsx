import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Download, Send, FileText, Camera, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import InvoicePreview from './InvoicePreview';
import { downloadInvoicePDF, generatePDFBlob } from '../services/pdfGenerator';
import { generateInvoiceEmailHTML } from '../services/emailTemplates';
import { INVOICE_TEMPLATES } from '../data/invoiceTemplates';
import { calculateInvoice } from '../utils/invoiceCalculations';
import api from '../services/api'; // Use centralized API service
import toast from 'react-hot-toast';

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  // ... rest of state definitions ...
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

  // Update invoice data when user loads (e.g., from Firebase)
  useEffect(() => {
    if (user) {
      setInvoiceData(prev => ({
        ...prev,
        businessName: user?.businessProfile?.businessName || user?.displayName || user?.name || prev.businessName,
        businessEmail: user?.businessProfile?.businessEmail || user?.email || prev.businessEmail,
        businessPhone: user?.businessProfile?.businessPhone || prev.businessPhone,
        businessAddress: user?.businessProfile?.businessAddress || prev.businessAddress,
      }));
    }
  }, [user]);

  // Edit Mode: Fetch existing invoice
  const { id } = useParams();
  const isEditMode = !!id;

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.get(`/invoices/${id}`);
        const inv = res.data.invoice || res.data;
        
        // Populate form with existing data
        setInvoiceData(prev => ({
          ...prev,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate ? inv.invoiceDate.split('T')[0] : prev.invoiceDate,
          dueDate: inv.dueDate ? inv.dueDate.split('T')[0] : prev.dueDate,
          businessName: inv.company?.name || inv.senderName || prev.businessName,
          businessEmail: inv.company?.email || inv.senderEmail || prev.businessEmail,
          businessPhone: inv.company?.phone || inv.senderPhone || prev.businessPhone,
          businessAddress: inv.company?.address || inv.senderAddress || prev.businessAddress,
          businessLogo: inv.company?.logo || prev.businessLogo,
          toName: inv.client?.name || inv.clientName || '',
          toEmail: inv.client?.email || inv.clientEmail || '',
          toPhone: inv.client?.phone || inv.clientPhone || '',
          toAddress: inv.client?.address || inv.clientAddress || '',
          items: inv.items?.map(item => ({
            id: item._id || Math.random(),
            description: item.name || item.description,
            quantity: item.quantity,
            rate: item.price !== undefined ? item.price : item.rate
          })) || [],
          taxRate: inv.taxRate || 0,
          discount: inv.discount || 0,
          notes: inv.notes || '',
          terms: inv.terms || '',
          status: inv.status
        }));
      } catch (err) {
        console.error('Error fetching invoice for edit:', err);
        toast.error('Failed to load invoice');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, navigate]);
  
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
  const [errors, setErrors] = useState({}); // Field-specific validation errors

  // Calculate totals using centralized calculation engine
  const calculateTotals = () => {
    const calculations = calculateInvoice({
      items: invoiceData.items || [],
      discount: invoiceData.discount || 0,
      discountType: 'fixed',
      taxRate: invoiceData.taxRate || 0,
      taxBasis: 'subtotal'
    });
    return {
      subtotal: calculations.subtotal,
      tax: calculations.taxAmount,
      total: calculations.total
    };
  };

  const { subtotal, tax, total } = calculateTotals();

  // Normalize invoice data to the structure used by Preview & PDF
  const normalizeInvoiceData = (data) => {
    // Use centralized calculation engine for calculations only
    const calculations = calculateInvoice({
      items: data.items || [],
      discount: data.discount || 0,
      discountType: 'fixed',
      taxRate: data.taxRate || 0,
      taxBasis: 'subtotal'
    });

    // Map items to backend format
    const formattedItems = data.items.map(item => ({
      name: item.description || item.name || 'Item',
      quantity: parseInt(item.quantity) || 1,
      price: parseFloat(item.rate || item.price || 0)
    }));

    return {
      ...data,
      subtotal: calculations.subtotal,
      tax: calculations.taxAmount,
      total: calculations.total,
      items: formattedItems
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
    console.log('💾 [DB] saveInvoiceToDB called');
    try {
      // Format data according to backend Invoice model
      const invoicePayload = {
        items: normalized.items,
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

      console.log('💾 [DB] Payload prepared, making API request...');
      
      // Use centralized api service - simple and robust
      const response = await api.post('/invoices/create', invoicePayload);

      console.log('💾 [DB] Response received, status:', response.status);
      console.log('💾 [DB] Response data:', response.data);

      const savedData = response.data.invoice || response.data;
      if (!savedData) {
        console.error('❌ [DB] Response has no invoice data:', response.data);
        throw new Error('Server returned empty response');
      }

      console.log('✅ [DB] Invoice saved successfully, ID:', savedData._id);
      return savedData;
      
    } catch (error) {
      console.error('❌ [DB] CRITICAL ERROR in saveInvoiceToDB:', error);
      
      // Provide user-friendly error message
      let userMessage = 'Failed to save invoice to database';
      if (error.response?.status === 401) {
        userMessage = '🔐 Authentication failed. Please log in again.';
      } else if (error.response?.status === 400) {
        userMessage = `❌ Validation error: ${error.response.data?.message || 'Invalid data'}`;
      } else {
        userMessage = error.response?.data?.message || error.message || userMessage;
      }
      
      throw new Error(userMessage);
    }
  };

  // Validate all required fields and return errors object
  const validateForm = () => {
    const newErrors = {};
    
    // Business name
    if (!invoiceData.businessName?.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    
    // Client name
    if (!invoiceData.toName?.trim()) {
      newErrors.toName = 'Client name is required';
    }

    // Client email
    if (!invoiceData.toEmail?.trim()) {
      newErrors.toEmail = 'Client email is required';
    } else if (!/\S+@\S+\.\S+/.test(invoiceData.toEmail)) {
      newErrors.toEmail = 'Please enter a valid email address';
    }

    // Items validation
    if (!Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
      newErrors.items = 'Add at least one invoice item';
    } else {
      const itemErrors = [];
      invoiceData.items.forEach((item, i) => {
        const itemErr = {};
        if (!item.description?.trim()) {
          itemErr.description = 'Description required';
        }
        if (!item.quantity || item.quantity <= 0) {
          itemErr.quantity = 'Qty > 0';
        }
        if (item.rate === null || item.rate === undefined || item.rate < 0) {
          itemErr.rate = 'Rate >= 0';
        }
        if (Object.keys(itemErr).length > 0) {
          itemErrors[i] = itemErr;
        }
      });
      if (itemErrors.length > 0) {
        newErrors.itemErrors = itemErrors;
      }
    }
    
    return newErrors;
  };

  // Finish Create Invoice - Complete workflow
  const handleFinish = async () => {
    console.log('🖱️ [FINISH] Button handler called');
    
    // ========== STEP 1: VALIDATION ==========
    console.log('🔍 [STEP 1] Validating all required fields...');
    const validationErrors = validateForm();
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      console.log('❌ [STEP 1] Validation failed:', validationErrors);
      // Build a summary message for toast
      const errorFields = [];
      if (validationErrors.businessName) errorFields.push('Business Name');
      if (validationErrors.toName) errorFields.push('Client Name');
      if (validationErrors.toEmail) errorFields.push('Client Email');
      if (validationErrors.items) errorFields.push('Items');
      if (validationErrors.itemErrors) errorFields.push('Item details');
      
      toast.error(`Please fix: ${errorFields.join(', ')}`);
      return; // Stop here, do not proceed
    }
    
    console.log('✅ [STEP 1] All validations passed');
    
    try {
      // ========== STEP 2: NORMALIZE DATA ==========
      console.log('📋 [STEP 2] Normalizing invoice data...');
      const normalized = normalizeInvoiceData({ 
        ...invoiceData, 
        businessLogo: logo,
        status: 'completed'
      });

      // ========== STEP 3: PREPARE FOR ASYNC ==========
      setLoading(true);
      console.log('⏳ [STEP 3] Setting loading state...');

      let savedInvoice;

      if (isEditMode) {
        // UPDATE existing invoice
        const res = await api.put(`/invoices/${id}`, normalized);
        savedInvoice = res.data.invoice;
        console.log('✅ [STEP 4] Invoice updated:', savedInvoice._id);
        toast.success('Invoice updated successfully!');
      } else {
        // CREATE new invoice
        console.log('💾 [STEP 4] Saving invoice to database...');
        savedInvoice = await saveInvoiceToDB(normalized);
      }

      const invoiceId = savedInvoice?._id || savedInvoice?.id;
      if (!invoiceId) {
        console.error('❌ [STEP 4] Server returned invoice without ID:', savedInvoice);
        throw new Error('Invoice saved but no ID was returned');
      }

      console.log('✅ [STEP 4] Invoice saved to database', { 
        id: invoiceId, 
        number: savedInvoice.invoiceNumber 
      });

      // ========== STEP 5: GENERATE PDF ==========
      console.log('📄 [STEP 5] Generating PDF...');
      let pdfBlob;
      try {
        pdfBlob = await generatePDFBlob(normalized, selectedTemplate);
      } catch (pdfError) {
        console.error('❌ [STEP 5] PDF generation failed:', pdfError);
        throw new Error(`PDF generation failed: ${pdfError.message}`);
      }

      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('PDF blob is empty');
      }

      console.log('✅ [STEP 5] PDF generated successfully', { 
        size: `${(pdfBlob.size / 1024).toFixed(2)} KB` 
      });

      // ========== STEP 6: SUCCESS ==========
      toast.success(`✅ Invoice ${normalized.invoiceNumber} created successfully!`);
      
      console.log('🚀 [STEP 6] Navigating to /invoice/decision...');
      
      navigate('/invoice/decision', {
        state: {
          invoiceData: normalized,
          pdfBlob: pdfBlob,
          savedInvoice: savedInvoice
        }
      });

      console.log('✅ [STEP 6] Navigation initiated');
      
    } catch (error) {
      console.error('❌ [FATAL ERROR] Invoice creation failed:', error);
      const userMessage = error.message || 'Failed to create invoice. Please try again.';
      toast.error(userMessage);
      
    } finally {
      setLoading(false);
    }
  };

  // Send email - Optimized for immediate delivery (like OTP)
  const handleSendEmail = async () => {
    // Pre-send validation (must complete before async operations)
    if (!invoiceData.toEmail || invoiceData.toEmail.trim() === '') {
      toast.error('Please enter recipient email address');
      return;
    }
    // ... rest of email validation ...

    try {
      setLoading(true);
      console.log('📧 [EMAIL] Validation passed, starting email delivery...');
      
      const normalized = normalizeInvoiceData({ ...invoiceData, businessLogo: logo });

      // Generate PDF quickly in parallel
      console.log('📧 [EMAIL] Generating PDF...');
      const pdfBlob = await generatePDFBlob(normalized, selectedTemplate);
      
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('Failed to generate PDF for email');
      }
      
      // Build email payload
      const formData = new FormData();
      formData.append('email', invoiceData.toEmail.trim());
      formData.append('subject', `Invoice ${invoiceData.invoiceNumber}`);
      formData.append('html', generateInvoiceEmailHTML(normalized));
      formData.append('pdf', pdfBlob, `${invoiceData.invoiceNumber}.pdf`);

      // Send email logic using centralized API
      console.log('📧 [EMAIL] Sending email to:', invoiceData.toEmail);
      
      const emailResponse = api.post('/email/send-invoice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' } // Important for file upload
      });

      // SAVE TO DATABASE IN BACKGROUND (don't wait)
      console.log('📧 [EMAIL] Saving invoice to database (background)...');
      const saveToDB = saveInvoiceToDB(normalized).catch(err => {
        console.warn('⚠️ [EMAIL] Background save failed:', err.message);
      });

      // Wait for email to complete
      const emailResult = await emailResponse;
      
      console.log('📧 [EMAIL] Response:', emailResult.status, emailResult.data);

      if (emailResult.data.success || emailResult.status === 200) {
        toast.success('✅ Invoice emailed successfully');
        setTimeout(() => {
          navigate('/thank-you');
        }, 1000);
      } else {
        throw new Error(emailResult.data.message || 'Server returned error');
      }
      
    } catch (error) {
      console.error('❌ [EMAIL] Error:', error);
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
                  <div>
                    <input
                      type="text"
                      name="businessName"
                      placeholder="Business Name *"
                      value={invoiceData.businessName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 rounded border ${
                        errors.businessName ? 'border-red-500' : (isDarkMode ? 'border-gray-600' : 'border-gray-300')
                      } ${
                        isDarkMode 
                          ? 'bg-gray-700 text-white placeholder-gray-400' 
                          : 'bg-white text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>}
                  </div>
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
                  <div>
                    <input
                      type="text"
                      name="toName"
                      placeholder="Client Name *"
                      value={invoiceData.toName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 rounded border ${
                        errors.toName ? 'border-red-500' : (isDarkMode ? 'border-gray-600' : 'border-gray-300')
                      } ${
                        isDarkMode 
                          ? 'bg-gray-700 text-white placeholder-gray-400' 
                          : 'bg-white text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    {errors.toName && <p className="text-red-500 text-xs mt-1">{errors.toName}</p>}
                  </div>
                  <div>
                    <input
                      type="email"
                      name="toEmail"
                      placeholder="Client Email *"
                      value={invoiceData.toEmail}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 rounded border ${
                        errors.toEmail ? 'border-red-500' : (isDarkMode ? 'border-gray-600' : 'border-gray-300')
                      } ${
                        isDarkMode 
                          ? 'bg-gray-700 text-white placeholder-gray-400' 
                          : 'bg-white text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    {errors.toEmail && <p className="text-red-500 text-xs mt-1">{errors.toEmail}</p>}
                  </div>
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

                {errors.items && <p className="text-red-500 text-sm mb-2">{errors.items}</p>}
                <div className="space-y-3">
                  {invoiceData.items.map((item, index) => {
                    const itemErr = errors.itemErrors?.[index] || {};
                    return (
                      <div key={item.id}>
                        <div className="grid grid-cols-12 gap-2">
                          <input
                            type="text"
                            placeholder="Description *"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            className={`col-span-5 px-3 py-2 rounded border ${
                              itemErr.description ? 'border-red-500' : (isDarkMode ? 'border-gray-600' : 'border-gray-300')
                            } ${
                              isDarkMode 
                                ? 'bg-gray-700 text-white placeholder-gray-400' 
                                : 'bg-white text-gray-900 placeholder-gray-500'
                            }`}
                          />
                          <input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                            className={`col-span-2 px-3 py-2 rounded border ${
                              itemErr.quantity ? 'border-red-500' : (isDarkMode ? 'border-gray-600' : 'border-gray-300')
                            } ${
                              isDarkMode 
                                ? 'bg-gray-700 text-white placeholder-gray-400' 
                                : 'bg-white text-gray-900 placeholder-gray-500'
                            }`}
                          />
                          <input
                            type="number"
                            placeholder="Rate"
                            value={item.rate}
                            onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value))}
                            className={`col-span-3 px-3 py-2 rounded border ${
                              itemErr.rate ? 'border-red-500' : (isDarkMode ? 'border-gray-600' : 'border-gray-300')
                            } ${
                              isDarkMode 
                                ? 'bg-gray-700 text-white placeholder-gray-400' 
                                : 'bg-white text-gray-900 placeholder-gray-500'
                            }`}
                          />
                          <button
                            onClick={() => removeItem(item.id)}
                            className="col-span-2 p-2 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {Object.keys(itemErr).length > 0 && (
                          <p className="text-red-500 text-xs mt-1">
                            {Object.values(itemErr).join(', ')}
                          </p>
                        )}
                      </div>
                    );
                  })}
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
                  onClick={() => {
                    console.log('🖱️ [BUTTON] Finish Create Invoice clicked');
                    handleFinish();
                  }}
                  disabled={loading}
                  type="button"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition shadow-lg"
                >
                  <FileText className="w-4 h-4" /> {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Invoice' : 'Finish Create Invoice')}
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
