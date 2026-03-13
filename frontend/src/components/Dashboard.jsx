// src/components/Dashboard.jsx
// Main dashboard with invoice statistics and list

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FileText, Plus, Download, Mail, Trash2, Eye, MoreVertical, DollarSign, Clock, CheckCircle, LogOut,
  Settings, Moon, Sun, ChevronDown, Crown, BarChart3, Edit2, Send, X
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, CURRENCIES } from '../utils/currencyUtils';
import { generatePDFBlob } from '../services/pdfGenerator';
import { generateInvoiceEmailHTML } from '../services/emailTemplates';
import { RefreshCw } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [subscription, setSubscription] = useState({ plan: 'free' });
  const [activeActionPanel, setActiveActionPanel] = useState(null);
  const [panelPosition, setPanelPosition] = useState(null);
  // id/type to show spinner when an action is initiating
  const [loadingAction, setLoadingAction] = useState({ invoiceId: null, type: null });
  const panelRef = useRef(null); // for click‑outside detection

  // determine if we're on a small screen for mobile layout
  const [isMobileView, setIsMobileView] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  // action panel renderer (shared mobile/desktop)
  const renderActionPanel = (invoice) => (
    <div ref={panelRef} className={`w-56 rounded-xl shadow-2xl border overflow-hidden z-1000 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
      <div className={`px-4 py-2.5 border-b ${isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-100 bg-gray-50'}`}>
        <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Invoice Actions
        </p>
      </div>

      <div className="p-2 space-y-1">
        <button
          onClick={(e) => { e.stopPropagation(); setActiveActionPanel(null); navigate(`/invoice/${invoice._id}`); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
            ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
        >
          <Eye className="h-4 w-4" />
          View Invoice
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setActiveActionPanel(null); navigate(`/invoice/${invoice._id}/edit`); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
            ${isDarkMode ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
        >
          <Edit2 className="h-4 w-4" />
          Edit Invoice
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setActiveActionPanel(null); handleSendEmail(invoice._id); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
            ${isDarkMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
        >
          <Send className="h-4 w-4" />
          Send Invoice
        </button>

        <div className={`border-t my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>

        {invoice.status !== 'paid' ? (
          <button
            onClick={(e) => { e.stopPropagation(); handleMarkPaid(invoice._id); }}
            disabled={markingPaid === invoice._id}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              markingPaid === invoice._id ? 'opacity-60 cursor-not-allowed' : ''
            } ${isDarkMode ? 'hover:bg-emerald-900/30 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-700'}`}
          >
            {markingPaid === invoice._id ? (
              <div className="modern-spinner spinner-sm"></div>
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {markingPaid === invoice._id ? 'Marking...' : 'Mark as Paid'}
          </button>
        ) : (
          /* paid invoices: only show send receipt button */
          <button
            onClick={(e) => { e.stopPropagation(); handleSendReceipt(invoice); }}
            disabled={loadingAction.invoiceId === invoice._id && loadingAction.type === 'receipt'}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
              bg-gradient-to-r from-brand-emerald to-blue-500 hover:from-brand-emerald-dark hover:to-blue-600 text-white
              shadow-lg ${
                loadingAction.invoiceId === invoice._id && loadingAction.type === 'receipt' ? 'opacity-60 cursor-not-allowed' : ''
              }`}
          >
            <FileText className="h-4 w-4" />
            <span>{loadingAction.invoiceId === invoice._id && loadingAction.type === 'receipt' ? 'Loading receipt...' : 'Send Receipt'}</span>
            {loadingAction.invoiceId === invoice._id && loadingAction.type === 'receipt' && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
          </button>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); handleDownloadPDF(invoice); }}
          disabled={loadingAction.invoiceId === invoice._id && loadingAction.type === 'pdf'}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
            isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
          } ${
            loadingAction.invoiceId === invoice._id && loadingAction.type === 'pdf' ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          <Download className="h-4 w-4 text-green-500" />
          {loadingAction.invoiceId === invoice._id && loadingAction.type === 'pdf' ? (
              <>
                <span>Loading PDF...</span>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              </>
            ) : (
              <span>Download PDF</span>
            )}
        </button>

        <div className={`border-t my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>

        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(invoice._id); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
            isDarkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'
          }`}
        >
          <Trash2 className="h-4 w-4" />
          Delete Invoice
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    const onResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [markingPaid, setMarkingPaid] = useState(null);
  const [activeCurrencyStats, setActiveCurrencyStats] = useState(() => {
    return {
      currency: localStorage.getItem('invoicepro_currency') || 'NGN',
      totalInvoices: 0,
      totalRevenue: 0,
      paidAmount: 0,
      pendingAmount: 0
    };
  });
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.id || user?._id) {
      loadInvoices();
      loadStats();
    }
  }, [user?.id, user?._id]);

  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadInvoices(false); 
        loadStats(false);
      }
    };

    const handleCurrencyChange = () => {
      if (user) {
        loadStats(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('currencyChange', handleCurrencyChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('currencyChange', handleCurrencyChange);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeActionPanel) {
        const actionButton = e.target.closest('[data-action-button]');
        if (panelRef.current && panelRef.current.contains(e.target)) return;
        if (!actionButton) {
          setActiveActionPanel(null);
        }
      }
    };
    
    if (activeActionPanel) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeActionPanel]);


  const loadInvoices = async (showLoading = true) => {
    try {
      if (showLoading) setInvoicesLoading(true);
      const res = await api.get('/invoices');
      setInvoices(res.data.invoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      if (showLoading) setInvoicesLoading(false);
    }
  };

  const loadStats = async (showLoading = true) => {
    try {
      if (showLoading) setStatsLoading(true);
      const res = await api.get('/invoices/stats');
      const statsData = res.data.stats;
      
      if (statsData) {
        const allCurrenciesStats = CURRENCIES.map(curr => {
          const existing = statsData.byCurrency?.find(s => s.currency === curr.code);
          return existing || {
            currency: curr.code,
            totalInvoices: 0,
            totalRevenue: 0,
            paidAmount: 0,
            pendingAmount: 0
          };
        });
        
        statsData.byCurrency = allCurrenciesStats;
        setStats(statsData);
        
        setActiveCurrencyStats(prev => {
          const savedCurrency = localStorage.getItem('invoicepro_currency') || 'NGN';
          // Use the newly fetched data from allCurrenciesStats based on the currently selected currency in state, or fallback to saved, or NGN
          let targetCurrency = prev?.currency || savedCurrency;
          const matchedStats = allCurrenciesStats.find(c => c.currency === targetCurrency) || allCurrenciesStats.find(c => c.currency === 'NGN') || allCurrenciesStats[0];
          return matchedStats;
        });
      } else {
        setStats(statsData);
      }
      if (user?.subscription) setSubscription(user.subscription);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      if (showLoading) setStatsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (typeof window === 'undefined') return;
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      setActiveActionPanel(null);
      loadInvoices(false);
      loadStats(false);
      toast.success('Invoice deleted');
    } catch (error) {
      toast.error('Error deleting invoice');
    }
  };

  const handleMarkPaid = async (id) => {
    // close menu while action runs
    setActiveActionPanel(null);
    try {
      setMarkingPaid(id);
      await api.put(`/invoices/${id}/mark-paid-only`);
      setInvoices(prev => prev.map(inv => 
        inv._id === id ? { ...inv, status: 'paid' } : inv
      ));
      loadStats(false);
      toast.success('Invoice marked as paid!');
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error('Failed to mark as paid');
    } finally {
      setMarkingPaid(null);
    }
  };

  // redirect to invoice preview/send page instead of emailing directly
  const handleSendEmail = (invoiceId) => {
    // user should see the invoice before confirming send
    navigate(`/invoice/${invoiceId}/send`);
  };

  // navigate to pdf preview page
  const handleDownloadPDF = async (invoice) => {
    // close panel and start spinner
    setActiveActionPanel(null);
    setLoadingAction({ invoiceId: invoice._id, type: 'pdf' });
    // small pause to render spinner before route change
    await new Promise(res => setTimeout(res, 100));
    navigate(`/invoice/${invoice._id}/pdf`);
  };

  // navigate straight to the send‑receipt page; the page itself will
  // handle creating/fetching the receipt. doing this keeps the UI snappy
  // and avoids briefly landing on the generic invoice viewer.
  const handleSendReceipt = (invoice) => {
    setActiveActionPanel(null);
    // show button spinner while route change is in progress
    setLoadingAction({ invoiceId: invoice._id, type: 'receipt' });

    // small pause to allow spinner to render before unmounting
    setTimeout(() => {
      navigate(`/invoice/${invoice._id}/send-receipt`, { state: { invoice } });
      // final clearing happens on the new page or when dashboard unmounts
    }, 150);
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
      business: isDarkMode ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
    };
    return colors[plan] || colors.free;
  };

  const StatsSkeleton = () => (
    <div className={`rounded-xl shadow-md p-6 border-l-4 border-gray-300 animate-pulse ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between">
        <div className="space-y-3 w-full">
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-8 bg-gray-300 rounded w-3/4"></div>
        </div>
        <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Navbar */}
      <nav className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-sm sticky top-0 z-10 border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-brand-navy" />
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                InvoicePro
              </h1>
              {user?.name && (
                <p className="text-sm font-medium text-brand-emerald">
                  Hi, {user.name.split(' ')[0]}! 👋
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${getPlanBadgeColor(subscription.plan)}`}>
              {subscription.plan !== 'free' && <Crown className="h-4 w-4" />}
              <span className="text-sm font-semibold uppercase">
                {subscription.plan || 'free'} Plan
              </span>
            </div>

            <button
              onClick={() => navigate('/analytics')}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition font-medium bg-brand-emerald hover:bg-emerald-600 text-white"
              title="View Analytics"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="hidden md:inline">Analytics</span>
            </button>

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

            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-brand-emerald flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-medium hidden sm:block">
                  {user?.name || 'User'}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>

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
        <div className={`mb-8 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Here's an overview of your invoice activity this month.
          </p>
        </div>

        <div className="relative min-h-[120px]">
          {statsLoading && !stats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 z-10">
              <StatsSkeleton />
              <StatsSkeleton />
              <StatsSkeleton />
              <StatsSkeleton />
            </div>
          ) : (
            <>
              {statsLoading && stats && (
                <div className="absolute inset-0 z-10 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center rounded-xl backdrop-blur-sm mb-8">
                   <div className="modern-spinner spinner-glow"></div>
                </div>
              )}
          
              {stats?.byCurrency && stats?.byCurrency.length > 1 && (
              <div className="mb-6 flex justify-end">
                <div className="relative">
                  <button
                    onClick={() => setCurrencyMenuOpen(!currencyMenuOpen)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border font-semibold transition shadow-sm ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>View: {activeCurrencyStats?.currency || 'NGN'} Revenue</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${currencyMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {currencyMenuOpen && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border overflow-hidden z-20 ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}>
                      <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-500 bg-gray-900/50' : 'text-gray-400 bg-gray-50'}`}>
                        Select Currency View
                      </div>
                      {stats.byCurrency.map(currencyStat => (
                        <button
                          key={currencyStat.currency}
                          onClick={() => {
                            setActiveCurrencyStats(currencyStat);
                            localStorage.setItem('invoicepro_currency', currencyStat.currency);
                            setCurrencyMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between transition ${
                            activeCurrencyStats?.currency === currencyStat.currency
                              ? isDarkMode ? 'bg-gray-700 text-brand-emerald' : 'bg-emerald-50 text-brand-emerald'
                              : isDarkMode ? 'hover:bg-gray-750 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="font-semibold">{currencyStat.currency}</span>
                          {activeCurrencyStats?.currency === currencyStat.currency && (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className={`rounded-xl shadow-md p-6 border-l-4 border-brand-emerald transition ${
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
                  <FileText className="h-10 w-10 text-brand-navy opacity-50" />
                </div>
              </div>

              <div className={`rounded-xl shadow-md p-6 border-l-4 border-brand-emerald transition ${
                isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-lg'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm mb-1 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Revenue <span className="text-xs font-bold text-brand-emerald bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">{activeCurrencyStats?.currency || 'NGN'}</span>
                    </p>
                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(activeCurrencyStats?.totalRevenue || 0, activeCurrencyStats?.currency || 'NGN')}
                    </p>
                  </div>
                  <DollarSign className="h-10 w-10 text-brand-emerald opacity-50" />
                </div>
              </div>

              <div className={`rounded-xl shadow-md p-6 border-l-4 border-brand-emerald transition ${
                isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-lg'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm mb-1 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Paid Amount <span className="text-xs font-bold text-brand-emerald bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">{activeCurrencyStats?.currency || 'NGN'}</span>
                    </p>
                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(activeCurrencyStats?.paidAmount || 0, activeCurrencyStats?.currency || 'NGN')}
                    </p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-brand-emerald opacity-50" />
                </div>
              </div>

              <div className={`rounded-xl shadow-md p-6 border-l-4 border-brand-navy transition ${
                isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-lg'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm mb-1 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Unpaid Amount <span className="text-xs font-bold text-brand-emerald bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">{activeCurrencyStats?.currency || 'NGN'}</span>
                    </p>
                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(activeCurrencyStats?.pendingAmount || 0, activeCurrencyStats?.currency || 'NGN')}
                    </p>
                  </div>
                  <Clock className="h-10 w-10 text-brand-navy opacity-25" />
                </div>
              </div>
            </div>
            </>
          )}
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Invoices
          </h2>
          <button
            onClick={() => navigate('/invoice/create')}
            className="bg-brand-emerald text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-emerald-700 transition shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            <span>Create Invoice</span>
          </button>
        </div>

        <div className={`rounded-xl shadow-md overflow-visible ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {invoicesLoading ? (
             <div className="p-12 text-center">
                <div className="modern-spinner spinner-glow mx-auto mb-4"></div>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading invoices...</p>
             </div>
          ) : invoices.length === 0 ? (
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
                className="bg-brand-emerald text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create First Invoice
              </button>
            </div>
          ) : isMobileView ? (
            <div className="space-y-4">
              {invoices.map(inv => (
                <div key={inv._id} onClick={() => navigate(`/invoice/${inv._id}`)} className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'} cursor-pointer`}> 
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{inv.invoiceNumber}</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{inv.client.name}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(inv.status)}`}>{inv.status}</span>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatCurrency(inv.total, inv.currency)}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const id = inv._id;
                        if (activeActionPanel === id) {
                          setActiveActionPanel(null);
                          setPanelPosition(null);
                        } else {
                          setActiveActionPanel(id);
                          const rect = e.currentTarget.getBoundingClientRect();
                          let leftPos = rect.left + window.scrollX;
                          const panelWidth = 224; // slightly less than w-56
                          if (leftPos + panelWidth > window.innerWidth) {
                            leftPos = window.innerWidth - panelWidth - 16; // 16px margin
                          }
                          setPanelPosition({
                            top: rect.bottom + window.scrollY,
                            left: leftPos
                          });
                        }
                      }}
                      data-action-button
                      className={`p-2 rounded-lg shadow-sm transition transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400
                        ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}
                        ${activeActionPanel === inv._id ? 'ring-2 ring-emerald-400' : ''}`}
                      title="Actions menu"
                    >
                      {activeActionPanel === inv._id ? <X className="h-5 w-5 text-current" /> : <MoreVertical className="h-5 w-5 text-current" />}
                      <span className="sr-only">Open actions</span>
                    </button>
                    {activeActionPanel === inv._id && panelPosition && (
                      createPortal(
                        <div style={{ position: 'fixed', top: panelPosition.top, left: panelPosition.left }}>
                          {renderActionPanel(inv)}
                        </div>,
                        document.body
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y" style={{borderColor: isDarkMode ? '#374151' : '#e5e7eb'}}>
                <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Invoice #</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Client</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Date</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Amount</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Status</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {invoices.map((invoice) => (
                    <tr key={invoice._id} className={`transition cursor-pointer ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => navigate(`/invoice/${invoice._id}`)}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {invoice.invoiceNumber}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {invoice.client.name}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(invoice.total, invoice.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {invoice.status !== 'paid' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkPaid(invoice._id);
                              }}
                              disabled={markingPaid === invoice._id}
                              className={`text-xs px-2 py-1 rounded-full font-semibold transition ${
                                markingPaid === invoice._id ? 'opacity-60 cursor-not-allowed' : ''
                              } ${isDarkMode ? 'bg-emerald-700 hover:bg-emerald-800 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                            >
                              {markingPaid === invoice._id ? 'Marking…' : 'Mark Paid'}
                            </button>
                          )}

                          <div className="relative action-panel-container">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const id = invoice._id;
                                if (activeActionPanel === id) {
                                  setActiveActionPanel(null);
                                  setPanelPosition(null);
                                } else {
                                  setActiveActionPanel(id);
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  let leftPos = rect.left + window.scrollX;
                                  const panelWidth = 224;
                                  if (leftPos + panelWidth > window.innerWidth) {
                                    leftPos = window.innerWidth - panelWidth - 16;
                                  }
                                  setPanelPosition({
                                    top: rect.bottom + window.scrollY,
                                    left: leftPos
                                  });
                                }
                              }} 
                              data-action-button
                              className={`p-2 rounded-lg shadow-sm transition transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400
                                ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}
                                ${activeActionPanel === invoice._id ? 'ring-2 ring-emerald-400' : ''}`}
                              title="Actions menu"
                            >
                              {activeActionPanel === invoice._id ? <X className="h-5 w-5 text-current" /> : <MoreVertical className="h-5 w-5 text-current" />}
                              <span className="sr-only">Open actions</span>
                            </button>

                            {activeActionPanel === invoice._id && panelPosition && (
                              createPortal(
                                <div style={{ position: 'fixed', top: panelPosition.top, left: panelPosition.left, zIndex: 1000 }}>
                                  {renderActionPanel(invoice)}
                                </div>,
                                document.body
                              )
                            )}
                          </div>
                        </div>
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
