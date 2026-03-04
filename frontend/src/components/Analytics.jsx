import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  BarChart3, TrendingUp, Users, CreditCard, Download, 
  Calendar, RefreshCw, AlertCircle, CheckCircle, ArrowUp, ArrowDown, Clock, Activity, ShieldAlert
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import api from '../services/api';
import ChatWidget from './ChatWidget';
import { formatCurrency, CURRENCIES } from '../utils/currencyUtils';

/**
 * Analytics Dashboard with 3D Charts
 * Professional analytics and reporting with animated visualizations
 */
const Analytics = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('invoicepro_currency') || 'NGN';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({
    overview: null,
    revenue_trend: [],
    top_customers: [],
    payment_behaviour: null,
    revenue_by_product: [],
    revenue_by_method: [],
    forecast: null
  });
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [exportLoading, setExportLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Brand colors for charts
  const chartColors = {
    primary: '#10b981', // brand-emerald
    secondary: '#1e3a8a', // brand-navy
    accent: '#f59e0b', // amber
    success: '#06b6d4', // cyan
    warning: '#ef4444', // red
    purple: '#8b5cf6'
  };

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [currency]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setMessage('');

      console.log('🔄 Loading analytics data...');
      const requests = [
        api.get(`/analytics/overview?currency=${currency}`).catch(e => {
          console.error('❌ Overview error:', e.message);
          return { data: { data: null } };
        }),
        api.get(`/analytics/revenue-trend?days=90&currency=${currency}`).catch(e => {
          console.error('❌ Trend error:', e.message);
          return { data: { data: [] } };
        }),
        api.get(`/analytics/top-customers?limit=10&currency=${currency}`).catch(e => {
          console.error('❌ Customers error:', e.message);
          return { data: { data: [] } };
        }),
        api.get(`/analytics/payment-behaviour?currency=${currency}`).catch(e => {
          console.error('❌ Payments error:', e.message);
          return { data: { data: null } };
        }),
        api.get(`/analytics/revenue-by-product?currency=${currency}`).catch(e => {
          console.error('❌ Products error:', e.message);
          return { data: { data: [] } };
        }),
        api.get(`/analytics/revenue-by-payment-method?currency=${currency}`).catch(e => {
          console.error('❌ Methods error:', e.message);
          return { data: { data: [] } };
        }),
        api.get('/analytics/forecast?days=30').catch(e => {
          console.error('❌ Forecast error:', e.message);
          return { data: { data: null } };
        })
      ];

      const [overview, trend, customers, payment, products, methods, forecast] = await Promise.all(requests);

      console.log('✅ Analytics data loaded:', {
        overview: overview.data.data,
        trend: trend.data.data?.length,
        customers: customers.data.data?.length,
        payment: payment.data.data,
        products: products.data.data?.length,
        methods: methods.data.data?.length,
        forecast: forecast.data.data
      });

      setData({
        overview: overview.data.data || {},
        revenue_trend: trend.data.data || [],
        top_customers: customers.data.data || [],
        payment_behaviour: payment.data.data || {},
        revenue_by_product: products.data.data || [],
        revenue_by_method: methods.data.data || [],
        forecast: forecast.data.data || {}
      });
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
      setMessage('❌ Failed to load analytics data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Export to CSV
  const handleExport = async (type) => {
    try {
      setExportLoading(true);

      const params = new URLSearchParams({ type });
      if (dateRange.from) params.append('from', dateRange.from);
      if (dateRange.to) params.append('to', dateRange.to);

      const response = await api.get(`/analytics/export?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage('✅ Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      setMessage('❌ Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  // KPI Card with gradient and animation
  const KPICard = ({ label, value, icon: Icon, trend, color = 'blue' }) => {
    const colorConfigs = {
      blue: {
        bg: isDarkMode ? 'bg-gradient-to-br from-blue-900 to-blue-800' : 'bg-gradient-to-br from-blue-50 to-blue-100',
        text: isDarkMode ? 'text-blue-300' : 'text-blue-600',
        icon: isDarkMode ? 'bg-blue-800 text-blue-300' : 'bg-blue-200 text-blue-700'
      },
      green: {
        bg: isDarkMode ? 'bg-gradient-to-br from-green-900 to-green-800' : 'bg-gradient-to-br from-green-50 to-green-100',
        text: isDarkMode ? 'text-green-300' : 'text-green-600',
        icon: isDarkMode ? 'bg-green-800 text-green-300' : 'bg-green-200 text-green-700'
      },
      orange: {
        bg: isDarkMode ? 'bg-gradient-to-br from-orange-900 to-orange-800' : 'bg-gradient-to-br from-orange-50 to-orange-100',
        text: isDarkMode ? 'text-orange-300' : 'text-orange-600',
        icon: isDarkMode ? 'bg-orange-800 text-orange-300' : 'bg-orange-200 text-orange-700'
      },
      purple: {
        bg: isDarkMode ? 'bg-gradient-to-br from-purple-900 to-purple-800' : 'bg-gradient-to-br from-purple-50 to-purple-100',
        text: isDarkMode ? 'text-purple-300' : 'text-purple-600',
        icon: isDarkMode ? 'bg-purple-800 text-purple-300' : 'bg-purple-200 text-purple-700'
      }
    };

    const config = colorConfigs[color];

    return (
      <div className={`${config.bg} rounded-xl p-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {label}
            </p>
            <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {typeof value === 'number' && label.includes('Revenue') || label.includes('Amount') 
                ? formatCurrency(value, currency)
                : typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend !== undefined && (
              <p className={`text-sm mt-2 flex items-center gap-1 ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                {Math.abs(trend)}% from last month
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${config.icon}`}>
            <Icon className="w-8 h-8" />
          </div>
        </div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
            {formatCurrency(payload[0].value, currency)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header with gradient background */}
      <div className={`${isDarkMode ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-b from-white to-gray-50 border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-green-600 to-emerald-700' : 'bg-gradient-to-br from-green-400 to-emerald-500'}`}>
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Analytics & Reports
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Professional revenue & business insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
            <select
              value={currency}
              onChange={(e) => {
                const newCurrency = e.target.value;
                setCurrency(newCurrency);
                localStorage.setItem('invoicepro_currency', newCurrency);
                // Dispatch global event so Dashboard can sync instantly
                window.dispatchEvent(new Event('currencyChange'));
              }}
              className={`pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-brand-emerald outline-none transition-shadow ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white focus:border-brand-emerald' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-brand-emerald'
              }`}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
            <button
              onClick={() => navigate(-1)}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              ← Dashboard
            </button>
            <button
              onClick={loadAnalyticsData}
              disabled={isLoading}
              className={`p-3 rounded-xl transition-all ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400 disabled:text-gray-600'
                  : 'hover:bg-gray-100 text-gray-600 disabled:text-gray-400'
              }`}
            >
              <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border transition-all ${
            message.includes('✅')
              ? isDarkMode ? 'bg-green-900/50 border-green-700 text-green-400' : 'bg-green-50 border-green-200 text-green-700'
              : isDarkMode ? 'bg-red-900/50 border-red-700 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Tabs with modern styling */}
        <div className={`mb-8 border-b flex gap-1 overflow-x-auto pb-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {['overview', 'revenue', 'customers', 'payments', 'forecast'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium border-b-2 transition capitalize whitespace-nowrap ${
                activeTab === tab
                  ? `border-brand-emerald ${isDarkMode ? 'text-green-400' : 'text-green-600'}`
                  : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoading && activeTab === 'overview' ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 mb-4">
              <RefreshCw className="w-6 h-6 text-white animate-spin" />
            </div>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* ============ OVERVIEW TAB ============ */}
            {activeTab === 'overview' && data.overview && (
              <div className="space-y-6">
                {/* Main KPIs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KPICard
                    label="Total Revenue"
                    value={data.overview.totalRevenue}
                    icon={TrendingUp}
                    color="green"
                  />
                  <KPICard
                    label="Paid Invoices"
                    value={data.overview.paidCount}
                    icon={CheckCircle}
                    color="blue"
                  />
                  <KPICard
                    label="Outstanding"
                    value={data.overview.pendingAmount}
                    icon={AlertCircle}
                    color="orange"
                  />
                  <KPICard
                    label="Overdue"
                    value={data.overview.overdueCount}
                    icon={AlertCircle}
                    color="purple"
                  />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Invoices
                    </p>
                    <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {data.overview.totalInvoices}
                    </p>
                  </div>
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Pending Invoices
                    </p>
                    <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {data.overview.sentCount}
                    </p>
                  </div>
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Paid Amount
                    </p>
                    <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(data.overview.paidAmount, currency)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ============ REVENUE TAB ============ */}
            {activeTab === 'revenue' && (
              <div className="space-y-6">
                {/* Revenue Trend Chart */}
                {data.revenue_trend.length > 0 && (
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                    <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Revenue Trend (Last 90 Days)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={data.revenue_trend}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="date" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                        <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="revenue" stroke={chartColors.primary} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Products & Methods Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue by Product */}
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                    <h3 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Top Products/Services
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={data.revenue_by_product.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="productName" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                        <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="totalRevenue" fill={chartColors.primary} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Revenue by Payment Method - Pie Chart */}
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                    <h3 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Revenue by Payment Method
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={data.revenue_by_method}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="totalRevenue"
                        >
                          {data.revenue_by_method.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={[chartColors.primary, chartColors.secondary, chartColors.accent, chartColors.success][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ============ CUSTOMERS TAB ============ */}
            {activeTab === 'customers' && (
              <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                <h3 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Top Customers by Spending
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <th className={`text-left py-4 font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Customer
                        </th>
                        <th className={`text-right py-4 font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Total Spent
                        </th>
                        <th className={`text-center py-4 font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Invoices
                        </th>
                        <th className={`text-right py-4 font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Paid
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_customers.map((customer, idx) => (
                        <tr key={idx} className={`border-b transition hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                          <td className={`py-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {customer.customerName}
                          </td>
                          <td className={`text-right py-4 font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                            {formatCurrency(customer.totalSpent, currency)}
                          </td>
                          <td className="text-center py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {customer.invoiceCount}
                            </span>
                          </td>
                          <td className={`text-right py-4 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatCurrency(customer.paidAmount, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============ PAYMENTS TAB ============ */}
            {activeTab === 'payments' && data.payment_behaviour && (
              <div className="space-y-6">
                {/* Payment KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <KPICard
                    label="Avg Payment Delay"
                    value={`${data.payment_behaviour.averagePaymentDelay} days`}
                    icon={Clock}
                    color="blue"
                  />
                  <KPICard
                    label="Late Payment Rate"
                    value={`${data.payment_behaviour.latePaymentRate}%`}
                    icon={AlertCircle}
                    color="orange"
                  />
                  <KPICard
                    label="Outstanding Amount"
                    value={formatCurrency(data.payment_behaviour.outstandingAmount, currency)}
                    icon={CreditCard}
                    color="purple"
                  />
                </div>

                {/* Outstanding Invoices */}
                {data.payment_behaviour.outstandingInvoices.length > 0 && (
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                    <h3 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Outstanding Invoices ({data.payment_behaviour.outstandingInvoices.length})
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {data.payment_behaviour.outstandingInvoices.slice(0, 15).map((inv, idx) => (
                        <div key={idx} className={`p-4 rounded-lg flex items-center justify-between ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} hover:shadow-md transition`}>
                          <div>
                            <p className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                              Due {new Date(inv.dueDate).toLocaleDateString()}
                            </p>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              Status: <span className="font-semibold">{inv.status.toUpperCase()}</span>
                            </p>
                          </div>
                          <p className={`font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                            {formatCurrency(inv.amount, currency)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============ FORECAST TAB ============ */}
            {activeTab === 'forecast' && data.forecast && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  <KPICard
                    label="Projected Total"
                    value={data.forecast.projectedRevenue}
                    icon={TrendingUp}
                    color="green"
                  />
                  <KPICard
                    label="Monthly Growth Rate"
                    value={`${data.forecast.growthRate > 0 ? '+' : ''}${data.forecast.growthRate}%`}
                    icon={data.forecast.growthRate >= 0 ? ArrowUp : ArrowDown}
                    color={data.forecast.growthRate >= 0 ? 'blue' : 'orange'}
                  />
                  <KPICard
                    label="Confidence Level"
                    value={data.forecast.confidence.toUpperCase()}
                    icon={CheckCircle}
                    color={data.forecast.confidence === 'high' ? 'green' : data.forecast.confidence === 'medium' ? 'blue' : 'orange'}
                  />
                  <KPICard
                    label="Cash Flow Health"
                    value={data.forecast.cashFlowHealth?.toUpperCase() || 'UNKNOWN'}
                    icon={Activity}
                    color={data.forecast.cashFlowHealth === 'excellent' ? 'green' : data.forecast.cashFlowHealth === 'good' ? 'blue' : 'orange'}
                  />
                  <KPICard
                    label="Churn Probability"
                    value={`${data.forecast.churnProbability || 0}%`}
                    icon={ShieldAlert}
                    color={data.forecast.churnProbability < 20 ? 'green' : data.forecast.churnProbability < 50 ? 'orange' : 'purple'}
                  />
                </div>

                <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                  <h3 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Revenue Projection (Next {data.forecast.forecastDays} Days)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.forecast.forecast}>
                      <defs>
                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="date" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                      <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                      <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                      <Area type="monotone" dataKey="projectedRevenue" stroke={chartColors.primary} fillOpacity={1} fill="url(#colorProjected)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* AI chat assistant below chart */}
                <ChatWidget currency={currency} isDarkMode={isDarkMode} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Expected Range
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Best Case Scenario</span>
                          <span className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{formatCurrency(data.forecast.bestCase, currency)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 max-w-full overflow-hidden">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Expected Revenue</span>
                          <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{formatCurrency(data.forecast.projectedRevenue, currency)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 max-w-full overflow-hidden">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Worst Case Scenario</span>
                          <span className={`font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>{formatCurrency(data.forecast.worstCase, currency)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 max-w-full overflow-hidden">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                     <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      AI Insights
                    </h3>
                    <div className={`p-4 rounded-lg flex gap-3 ${isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                      <AlertCircle className={`w-6 h-6 flex-shrink-0 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      <div className="w-full">
                        <p className={`font-medium mb-1 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                          {data.forecast.growthRate > 0 ? 'Positive Growth Trend Identified' : 'Growth Stabilization Required'}
                        </p>
                        <p className={`text-sm leading-relaxed mb-3 ${isDarkMode ? 'text-indigo-200/70' : 'text-indigo-600/80'}`}>
                          Based on the {data.forecast.confidence} confidence analysis of the last {data.forecast.forecastDays * 2} days, your revenue is trending at a {data.forecast.growthRate}% monthly rate. 
                          {data.forecast.confidence === 'high' 
                            ? ' Consistent payment patterns allow for highly accurate predictions.'
                            : data.forecast.confidence === 'medium'
                            ? ' Moderate revenue fluctuations mean actual results may vary within the expected range.'
                            : ' High volatility in recent invoicing makes predictions less certain; focus on securing consistent payments.'}
                        </p>
                        
                        <div className="space-y-2 mt-4 pt-4 border-t border-indigo-200/30 dark:border-indigo-800/50">
                          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-indigo-300/80' : 'text-indigo-800/80'}`}>Smart Observations</p>
                          {Array.isArray(data.forecast.seasonalityInsights) ? (
                            data.forecast.seasonalityInsights.map((insight, idx) => (
                              <div key={idx} className="flex gap-2 items-start">
                                <span className={`mt-0.5 text-xs ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>•</span>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-indigo-100' : 'text-indigo-900'}`}>{insight}</span>
                              </div>
                            ))
                          ) : (
                            <span className="block font-semibold opacity-90">{data.forecast.seasonalityInsights}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quarterly Projections */}
                {data.forecast.quarterlyProjections && data.forecast.quarterlyProjections.length > 0 && (
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      📅 Quarterly Revenue Projections
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {data.forecast.quarterlyProjections.map((q, idx) => (
                        <div key={idx} className={`rounded-xl p-4 text-center border ${
                          isDarkMode ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {q.quarter}
                          </p>
                          <p className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(q.projectedRevenue, currency)}
                          </p>
                          <p className={`text-xs font-semibold ${q.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {q.growth >= 0 ? '▲' : '▼'} {Math.abs(q.growth)}% growth
                          </p>
                        </div>
                      ))}
                    </div>
                    {data.forecast.annualRunRate > 0 && (
                      <div className={`mt-4 p-4 rounded-lg text-center ${isDarkMode ? 'bg-emerald-900/20 border border-emerald-800/40' : 'bg-emerald-50 border border-emerald-200'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          Annual Run Rate
                        </p>
                        <p className={`text-2xl font-bold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                          {formatCurrency(data.forecast.annualRunRate, currency)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Business Recommendations */}
                {data.forecast.businessRecommendations && data.forecast.businessRecommendations.length > 0 && (
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      💡 AI Business Recommendations
                    </h3>
                    <div className="space-y-3">
                      {data.forecast.businessRecommendations.map((rec, idx) => (
                        <div key={idx} className={`flex items-start gap-3 p-4 rounded-lg border ${
                          isDarkMode ? 'bg-gray-750 border-gray-700' : 'bg-amber-50/50 border-amber-200/50'
                        }`}>
                          <span className="text-lg mt-0.5">{idx === 0 ? '🎯' : idx === 1 ? '📈' : '🔧'}</span>
                          <p className={`text-sm leading-relaxed font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {rec}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Narrative AI Report */}
                {data.forecast.narrativeReport && (
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      📊 Executive AI Report
                    </h3>
                    <div className={`p-5 rounded-lg leading-relaxed whitespace-pre-line text-sm font-medium ${
                      isDarkMode ? 'bg-gray-750 text-gray-200 border border-gray-700' : 'bg-slate-50 text-gray-800 border border-slate-200'
                    }`}>
                      {data.forecast.narrativeReport.split('**').map((part, i) =>
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Export Section */}
        <div className={`mt-10 rounded-xl p-8 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
          <div className="flex items-center gap-3 mb-8">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Export Reports
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Download your data in CSV format for external analysis</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mb-8 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border dark:border-gray-700 items-center">
            <div className="flex-1 w-full flex items-center gap-3">
              <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date From</label>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border font-medium transition cursor-text ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-brand-emerald'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-brand-emerald'
                    } focus:outline-none`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date To</label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border font-medium transition cursor-text ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-brand-emerald'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-brand-emerald'
                    } focus:outline-none`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { type: 'revenue', title: 'Revenue Report', desc: 'Performance by product', icon: TrendingUp },
              { type: 'payments', title: 'Payment Report', desc: 'Transactions by method', icon: CreditCard },
              { type: 'customers', title: 'Customer Report', desc: 'Top spenders details', icon: Users },
              { type: 'outstanding', title: 'Outstanding Report', desc: 'Unpaid & overdue invoices', icon: AlertCircle }
            ].map(({ type, title, desc, icon: Icon }) => (
              <div key={type} className={`border rounded-xl p-5 flex flex-col transition-all ${
                isDarkMode ? 'bg-gray-750 border-gray-700' : 'bg-white border-gray-200 hover:shadow-md'
              }`}>
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h4>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleExport(type)}
                  disabled={exportLoading}
                  className={`mt-auto w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                    isDarkMode
                      ? 'bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800/50 disabled:opacity-50'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-50'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
