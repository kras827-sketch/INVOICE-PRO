// src/components/Dashboard.jsx
// Main dashboard with invoice statistics and list

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FileText, Plus, Download, Mail, Trash2, Eye, DollarSign, Clock, CheckCircle, LogOut,
  Settings, Moon, Sun, ChevronDown, Crown
} from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [subscription, setSubscription] = useState({ plan: 'free' });

  useEffect(() => {
    // Reload data when user changes (including name updates from Settings)
    if (user) {
      console.log('👤 User updated on Dashboard:', user.name);
      loadData();
    }
  }, [user?.name, user?._id]); // Depend on name and _id to detect changes

  const loadData = async () => {
    try {
      const [invoicesRes, statsRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/invoices/stats'),
      ]);
      setInvoices(invoicesRes.data.invoices);
      setStats(statsRes.data.stats);
      // Get subscription from user profile
      if (user?.subscription) {
        setSubscription(user.subscription);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    
    try {
      await api.delete(`/invoices/${id}`);
      loadData();
    } catch (error) {
      alert('Error deleting invoice');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: isDarkMode 
        ? 'bg-gray-700 text-gray-300' 
        : 'bg-gray-100 text-gray-700',
      sent: isDarkMode
        ? 'bg-blue-900 text-blue-300'
        : 'bg-blue-100 text-blue-700',
      paid: isDarkMode
        ? 'bg-green-900 text-green-300'
        : 'bg-green-100 text-green-700',
      overdue: isDarkMode
        ? 'bg-red-900 text-red-300'
        : 'bg-red-100 text-red-700',
    };
    return colors[status] || (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700');
  };

  const getPlanBadgeColor = (plan) => {
    const colors = {
      free: isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700',
      basic: isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700',
      business: isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700',
    };
    return colors[plan] || colors.free;
  };

  const formatCurrency = (amount) => {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Navbar */}
      <nav className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-sm sticky top-0 z-10 border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                InvoicePro
              </h1>
              {user?.name && (
                <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Hi, {user.name.split(' ')[0]}! 👋
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Subscription Badge */}
            <div className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${getPlanBadgeColor(subscription.plan)}`}>
              {subscription.plan !== 'free' && <Crown className="h-4 w-4" />}
              <span className="text-sm font-semibold uppercase">
                {subscription.plan || 'free'} Plan
              </span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition ${
                isDarkMode 
                  ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-medium hidden sm:block">
                  {user?.name || 'User'}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-100'
                } overflow-hidden z-20`}>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setProfileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center space-x-2 transition ${
                      isDarkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                      setProfileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center space-x-2 border-t transition ${
                      isDarkMode
                        ? 'border-gray-700 hover:bg-gray-700 text-red-400'
                        : 'border-gray-100 hover:bg-gray-50 text-red-600'
                    }`}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className={`mb-8 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Here's an overview of your invoice activity this month.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`rounded-xl shadow-md p-6 border-l-4 border-blue-600 transition ${
            isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-lg'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Invoices
                </p>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats?.totalInvoices || 0}
                </p>
              </div>
              <FileText className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className={`rounded-xl shadow-md p-6 border-l-4 border-green-600 transition ${
            isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-lg'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Revenue
                </p>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(stats?.totalRevenue || 0)}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </div>

          <div className={`rounded-xl shadow-md p-6 border-l-4 border-green-500 transition ${
            isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-lg'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Paid Invoices
                </p>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(stats?.paidAmount || 0)}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </div>

          <div className={`rounded-xl shadow-md p-6 border-l-4 border-orange-600 transition ${
            isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-lg'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Unpaid Amount
                </p>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(stats?.pendingAmount || 0)}
                </p>
              </div>
              <Clock className="h-10 w-10 text-orange-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Create Invoice Button */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Invoices
          </h2>
          <button
            onClick={() => navigate('/invoice/create')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            <span>Create Invoice</span>
          </button>
        </div>

        {/* Invoices Table */}
        <div className={`rounded-xl shadow-md overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {invoices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                No invoices yet
              </h3>
              <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Create your first invoice to get started
              </p>
              <button
                onClick={() => navigate('/invoice/create')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create First Invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y" style={{borderColor: isDarkMode ? '#374151' : '#e5e7eb'}}>
                <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Invoice #
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Client
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Date
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Amount
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {invoices.map((invoice) => (
                    <tr 
                      key={invoice._id} 
                      className={`transition ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {invoice.invoiceNumber}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {invoice.client.name}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2`}>
                        <button 
                          onClick={() => navigate(`/invoice/${invoice._id}`)} 
                          className="text-blue-600 hover:text-blue-700 transition"
                          title="View"
                        >
                          <Eye className="h-5 w-5 inline" />
                        </button>
                        <button 
                          onClick={() => window.open(`http://localhost:5000/api/invoices/pdf/${invoice._id}`, '_blank')} 
                          className="text-green-600 hover:text-green-700 transition"
                          title="Download PDF"
                        >
                          <Download className="h-5 w-5 inline" />
                        </button>
                        <button 
                          onClick={() => handleDelete(invoice._id)} 
                          className="text-red-600 hover:text-red-700 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;