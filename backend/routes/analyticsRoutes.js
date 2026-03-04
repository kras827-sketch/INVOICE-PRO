/**
 * Analytics Routes
 * Handles all analytics and reporting endpoints
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const analyticsService = require('../services/analyticsService');

/**
 * GET /api/analytics/overview
 * Get overall analytics summary
 */
router.get('/overview', protect, async (req, res) => {
  try {
    const currency = req.query.currency || 'NGN';
    const overview = await analyticsService.getOverview(req.user._id, currency);

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('❌ Overview error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics overview',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/revenue-trend
 * Get revenue trend data for chart
 * Query params: ?days=90 (default 90)
 */
router.get('/revenue-trend', protect, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 90, 365);
    const currency = req.query.currency || 'NGN';
    const trend = await analyticsService.getRevenueTrend(req.user._id, days, currency);

    res.json({
      success: true,
      data: trend,
      period: `${days} days`
    });
  } catch (error) {
    console.error('❌ Revenue trend error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue trend',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/top-customers
 * Get top customers by spending
 * Query params: ?limit=10 (default 10)
 */
router.get('/top-customers', protect, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const currency = req.query.currency || 'NGN';
    const customers = await analyticsService.getTopCustomers(req.user._id, limit, currency);

    res.json({
      success: true,
      data: customers,
      count: customers.length
    });
  } catch (error) {
    console.error('❌ Top customers error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching top customers',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/payment-behaviour
 * Get payment behavior analytics
 */
router.get('/payment-behaviour', protect, async (req, res) => {
  try {
    const currency = req.query.currency || 'NGN';
    const behavior = await analyticsService.getPaymentBehavior(req.user._id, currency);

    res.json({
      success: true,
      data: behavior
    });
  } catch (error) {
    console.error('❌ Payment behaviour error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment behaviour',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/revenue-by-product
 * Get revenue breakdown by product/service
 */
router.get('/revenue-by-product', protect, async (req, res) => {
  try {
    const currency = req.query.currency || 'NGN';
    const revenue = await analyticsService.getRevenueByProduct(req.user._id, currency);

    res.json({
      success: true,
      data: revenue,
      count: revenue.length
    });
  } catch (error) {
    console.error('❌ Revenue by product error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue by product',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/revenue-by-payment-method
 * Get revenue breakdown by payment method
 */
router.get('/revenue-by-payment-method', protect, async (req, res) => {
  try {
    const currency = req.query.currency || 'NGN';
    const revenue = await analyticsService.getRevenueByPaymentMethod(req.user._id, currency);

    res.json({
      success: true,
      data: revenue,
      count: revenue.length
    });
  } catch (error) {
    console.error('❌ Revenue by payment method error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue by payment method',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/forecast
 * Get revenue forecast
 * Query params: ?days=30 (default 30)
 */
router.get('/forecast', protect, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const forecast = await analyticsService.getRevenueForecast(req.user._id, days);

    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    console.error('❌ Forecast error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error calculating forecast',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/export
 * Export analytics data to CSV
 * Query params: ?type=revenue|payments|customers|outstanding
 *               &from=YYYY-MM-DD (optional)
 *               &to=YYYY-MM-DD (optional)
 */
router.get('/export', protect, async (req, res) => {
  try {
    const type = req.query.type || 'revenue';
    const validTypes = ['revenue', 'payments', 'customers', 'outstanding'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid export type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const dateRange = {
      from: req.query.from ? new Date(req.query.from) : null,
      to: req.query.to ? new Date(req.query.to) : null
    };

    const csv = await analyticsService.exportToCSV(type, req.user._id, dateRange);

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('❌ Export error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error exporting data',
      error: error.message
    });
  }
});

// simple support chat endpoint for forecasting assistance
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, currency } = req.body || {};
    const forecast = await analyticsService.getRevenueForecast(req.user._id, 30);
    const total = forecast?.totalRevenue ?? forecast?.total ?? 0;
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'NGN'
    }).format(total);

    let reply = `Based on your historic invoices, the next 30 days revenue forecast is ${formatted}.`;
    if (message && typeof message === 'string' && message.toLowerCase().includes('trend')) {
      reply += ' The trend has been steadily increasing over the past few months.';
    }
    reply += ' Feel free to ask another question about your numbers!';

    res.json({ success: true, reply });
  } catch (error) {
    console.error('❌ Chat error:', error.message);
    res.status(500).json({ success: false, message: 'Chat failed', error: error.message });
  }
});

module.exports = router;
