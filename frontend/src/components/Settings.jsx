import { useState, useRef, useEffect } from 'react';
import { Save, Upload, Crown, LogOut, Mail, MapPin, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, firebaseUser, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const logoInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile'); // profile, business, subscription
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    photoURL: ''
  });

  // Initialize profile data from user OR localStorage on mount
  useEffect(() => {
    console.log('🔄 Settings mounting, loading profile data...');
    const storedUser = localStorage.getItem('user');
    let userToUse = user;
    
    if (!userToUse && storedUser) {
      try {
        userToUse = JSON.parse(storedUser);
        console.log('📦 Loaded user from localStorage:', userToUse);
      } catch (err) {
        console.error('Failed to parse stored user:', err);
      }
    }
    
    if (userToUse) {
      const fullName = userToUse.name || '';
      const nameParts = fullName.split(' ');
      const email = userToUse.email || '';
      
      setProfileData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: email,
        photoURL: userToUse.photoUrl || userToUse.photoURL || ''
      });
      
      console.log('✅ Profile data initialized:', { firstName: nameParts[0], email });
    } else if (firebaseUser) {
      const fullName = firebaseUser.displayName || '';
      const nameParts = fullName.split(' ');
      
      setProfileData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || ''
      });
      
      console.log('✅ Profile data from Firebase:', { firstName: nameParts[0], email: firebaseUser.email });
    }
  }, []);

  const [businessData, setBusinessData] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    taxId: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    logoUrl: ''
  });

  // Initialize business data from user profile on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    let userToUse = user;
    
    if (!userToUse && storedUser) {
      try {
        userToUse = JSON.parse(storedUser);
      } catch (err) {
        console.error('Failed to parse stored user:', err);
      }
    }
    
    if (userToUse?.businessProfile) {
      const bp = userToUse.businessProfile;
      setBusinessData({
        businessName: bp.businessName || '',
        businessEmail: bp.businessEmail || '',
        businessPhone: bp.businessPhone || '',
        businessAddress: bp.businessAddress || '',
        taxId: bp.taxId || '',
        bankName: bp.bankDetails?.bankName || '',
        accountNumber: bp.bankDetails?.accountNumber || '',
        accountName: bp.bankDetails?.accountName || '',
        logoUrl: bp.logoUrl || ''
      });
      if (bp.logoUrl) setLogoPreview(bp.logoUrl);
    }
  }, [user]);

  const [subscription, setSubscription] = useState({
    plan: 'free',
    status: 'active',
    monthlyInvoiceLimit: 3,
    invoiceCount: 0,
    renewalDate: null
  });

  // Handle profile input change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  // Handle business input change
  const handleBusinessChange = (e) => {
    const { name, value } = e.target;
    setBusinessData({ ...businessData, [name]: value });
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
    reader.onloadend = () => {
      setLogoPreview(reader.result);
      setBusinessData({ ...businessData, logoUrl: reader.result });
      toast.success('Logo preview updated');
    };
    reader.readAsDataURL(file);
  };

  // Save profile
  const handleSaveProfile = async () => {
    try {
      if (!profileData.firstName.trim()) {
        toast.error('First name is required');
        return;
      }
      setLoading(true);
      const name = `${profileData.firstName} ${profileData.lastName}`.trim();
      
      // Get token - try firebaseUser first, then localStorage
      let token;
      if (firebaseUser) {
        console.log('🔑 Getting token from Firebase user:', firebaseUser.email);
        token = await firebaseUser.getIdToken();
      } else {
        token = localStorage.getItem('token');
        console.log('🔑 Got token from localStorage:', !!token);
      }

      if (!token) {
        toast.error('Authentication required - please log in again');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_API_URL}/api/users/profile`;
      console.log('📤 Saving profile to:', apiUrl);
      console.log('📋 Payload:', { name, email: profileData.email });

      const response = await axios.put(
        apiUrl,
        { name, email: profileData.email },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('📥 Response:', response.data);

      if (response.data.success) {
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('✅ Profile saved to localStorage');
        toast.success('Profile updated successfully');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        toast.error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      console.error('Status:', error.response?.status);
      console.error('Response:', error.response?.data);
      toast.error(error.response?.data?.message || error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Save business details
  const handleSaveBusinessDetails = async () => {
    try {
      if (!businessData.businessName.trim()) {
        toast.error('Business name is required');
        return;
      }
      setLoading(true);
      
      // Get token - try firebaseUser first, then localStorage
      let token;
      if (firebaseUser) {
        console.log('🔑 Getting token from Firebase user:', firebaseUser.email);
        token = await firebaseUser.getIdToken();
      } else {
        token = localStorage.getItem('token');
        console.log('🔑 Got token from localStorage:', !!token);
      }

      if (!token) {
        toast.error('Authentication required - please log in again');
        return;
      }

      const payload = {
        businessName: businessData.businessName,
        businessEmail: businessData.businessEmail,
        businessPhone: businessData.businessPhone,
        businessAddress: businessData.businessAddress,
        taxId: businessData.taxId,
        logoUrl: businessData.logoUrl,
        bankDetails: {
          bankName: businessData.bankName,
          accountNumber: businessData.accountNumber,
          accountName: businessData.accountName
        }
      };

      const apiUrl = `${import.meta.env.VITE_API_URL}/api/users/business-profile`;
      console.log('📤 Saving business profile to:', apiUrl);
      console.log('📋 Payload:', payload);

      const response = await axios.put(
        apiUrl,
        payload,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('📥 Response:', response.data);

      if (response.data.success) {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        stored.businessProfile = response.data.businessProfile;
        localStorage.setItem('user', JSON.stringify(stored));
        console.log('✅ Business profile saved to localStorage');
        toast.success('Business details updated successfully');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        toast.error(response.data.message || 'Failed to update business details');
      }
    } catch (error) {
      console.error('❌ Business profile update error:', error);
      console.error('Status:', error.response?.status);
      console.error('Response:', error.response?.data);
      toast.error(error.response?.data?.message || error.message || 'Failed to update business details');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} py-8 px-4`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Settings
          </h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Manage your account, business details, and subscription
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
          {['profile', 'business', 'subscription'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === tab
                  ? `border-blue-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`
                  : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className={`rounded-lg p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Personal Information
            </h2>

            <div className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Mail className="w-4 h-4 inline mr-2" /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  disabled
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-400'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                  }`}
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Cannot be changed
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="w-full md:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Business Tab */}
        {activeTab === 'business' && (
          <div className={`rounded-lg p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Business Information
            </h2>

            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Building2 className="w-4 h-4 inline mr-2" /> Business Logo
                </label>
                <div className={`flex items-center gap-4 p-4 rounded-lg border-2 border-dashed ${
                  isDarkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'
                }`}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-16 w-auto" />
                  ) : (
                    <Upload className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  )}
                  <button
                    onClick={() => logoInputRef.current.click()}
                    className="text-blue-500 hover:text-blue-600 font-medium"
                  >
                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Business Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Business Name
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={businessData.businessName}
                    onChange={handleBusinessChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Business Email
                  </label>
                  <input
                    type="email"
                    name="businessEmail"
                    value={businessData.businessEmail}
                    onChange={handleBusinessChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Business Phone
                  </label>
                  <input
                    type="tel"
                    name="businessPhone"
                    value={businessData.businessPhone}
                    onChange={handleBusinessChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tax ID / VAT Number
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    value={businessData.taxId}
                    onChange={handleBusinessChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <MapPin className="w-4 h-4 inline mr-2" /> Business Address
                </label>
                <textarea
                  name="businessAddress"
                  value={businessData.businessAddress}
                  onChange={handleBusinessChange}
                  rows="3"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Bank Details */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Bank Details (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="bankName"
                    placeholder="Bank Name"
                    value={businessData.bankName}
                    onChange={handleBusinessChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <input
                    type="text"
                    name="accountNumber"
                    placeholder="Account Number"
                    value={businessData.accountNumber}
                    onChange={handleBusinessChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <input
                    type="text"
                    name="accountName"
                    placeholder="Account Name"
                    value={businessData.accountName}
                    onChange={handleBusinessChange}
                    className={`col-span-2 px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveBusinessDetails}
                disabled={loading}
                className="w-full md:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Business Details
              </button>
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className={`rounded-lg p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Crown className="w-6 h-6 inline mr-3 text-yellow-500" /> Subscription
            </h2>

            {/* Current Plan */}
            <div className={`p-6 rounded-lg mb-6 border-2 ${
              isDarkMode ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Current Plan: <span className="text-blue-500">{subscription.plan.toUpperCase()}</span>
              </h3>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                Monthly Invoice Limit: <strong>{subscription.monthlyInvoiceLimit === Infinity ? 'Unlimited' : subscription.monthlyInvoiceLimit}</strong>
              </p>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                Invoices Created This Month: <strong>{subscription.invoiceCount}/{subscription.monthlyInvoiceLimit === Infinity ? '∞' : subscription.monthlyInvoiceLimit}</strong>
              </p>
              {subscription.renewalDate && (
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Renewal Date: <strong>{new Date(subscription.renewalDate).toLocaleDateString()}</strong>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/pricing')}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
              >
                View Plans & Upgrade
              </button>
              {subscription.plan !== 'free' && (
                <button
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        )}

        {/* Logout Section */}
        <div className={`mt-8 rounded-lg p-6 border-t-2 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Account
          </h3>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
