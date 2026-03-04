/**
 * Analytics Service
 * MongoDB aggregation queries for invoice analytics and reporting
 */

const Invoice = require('../models/Invoice');
const Receipt = require('../models/Receipt');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Get analytics overview
 * Total revenue, paid vs unpaid, outstanding payments
 */
exports.getOverview = async (userId, currency = 'NGN') => {
  try {
    console.log(`📊 Fetching analytics overview for user: ${userId} (Currency: ${currency})`);

    const overview = await Invoice.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: { $in: ['paid', 'sent', 'overdue', 'completed'] }, // Exclude drafts
          currency: currency
        }
      },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          sentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
          },
          overdueCount: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
          },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] }
          },
          pendingAmount: {
            $sum: {
              $cond: [
                { $in: ['$status', ['sent', 'overdue']] },
                '$total',
                0
              ]
            }
          }
        }
      }
    ]);

    const data = overview[0] || {
      totalInvoices: 0,
      totalRevenue: 0,
      paidCount: 0,
      sentCount: 0,
      overdueCount: 0,
      paidAmount: 0,
      pendingAmount: 0
    };

    console.log('✅ Overview data fetched');
    return data;
  } catch (error) {
    console.error('❌ Error fetching overview:', error.message);
    throw error;
  }
};

/**
 * Get revenue trend over time (last 90 days)
 * Aggregated by day
 */
exports.getRevenueTrend = async (userId, days = 90, currency = 'NGN') => {
  try {
    console.log(`📈 Fetching ${days}-day revenue trend (Currency: ${currency})`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trend = await Invoice.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          invoiceDate: { $gte: startDate },
          status: { $in: ['paid', 'sent', 'overdue', 'completed'] },
          currency: currency
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$invoiceDate' }
          },
          revenue: { $sum: '$total' },
          invoiceCount: { $sum: 1 },
          paidRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          revenue: 1,
          invoiceCount: 1,
          paidRevenue: 1,
          _id: 0
        }
      }
    ]);

    console.log(`✅ Revenue trend fetched (${trend.length} days)`);
    return trend;
  } catch (error) {
    console.error('❌ Error fetching revenue trend:', error.message);
    throw error;
  }
};

/**
 * Get top customers by spending
 */
exports.getTopCustomers = async (userId, limit = 10, currency = 'NGN') => {
  try {
    console.log(`👥 Fetching top customers (Currency: ${currency})`);

    const topCustomers = await Invoice.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: { $in: ['paid', 'sent', 'overdue', 'completed'] },
          currency: currency
        }
      },
      {
        $group: {
          _id: '$client.name',
          totalSpent: { $sum: '$total' },
          invoiceCount: { $sum: 1 },
          email: { $first: '$client.email' },
          phone: { $first: '$client.phone' },
          lastInvoice: { $max: '$invoiceDate' },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] }
          }
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          customerName: '$_id',
          totalSpent: 1,
          invoiceCount: 1,
          email: 1,
          phone: 1,
          lastInvoice: 1,
          paidAmount: 1,
          _id: 0
        }
      }
    ]);

    console.log(`✅ Top customers fetched (${topCustomers.length})`);
    return topCustomers;
  } catch (error) {
    console.error('❌ Error fetching top customers:', error.message);
    throw error;
  }
};

/**
 * Get payment behavior analytics
 * Average payment delay, late payment rate, outstanding invoices
 */
exports.getPaymentBehavior = async (userId, currency = 'NGN') => {
  try {
    console.log(`💳 Fetching payment behavior analytics (Currency: ${currency})`);

    // Get invoices with due dates
    const invoices = await Invoice.find({
      user: userId,
      dueDate: { $exists: true, $ne: null },
      currency: currency
    }).select('dueDate invoiceDate status total').lean();

    const analysis = {
      totalInvoices: invoices.length,
      paidOnTime: 0,
      paidLate: 0,
      unpaid: 0,
      averagePaymentDelay: 0,
      latePaymentRate: 0,
      outstandingAmount: 0,
      outstandingInvoices: []
    };

    let totalDelay = 0;
    let paidLateCount = 0;

    invoices.forEach(inv => {
      if (inv.status === 'paid') {
        const daysLate = Math.max(0, Math.floor((inv.invoiceDate - inv.dueDate) / (1000 * 60 * 60 * 24)));
        if (daysLate > 0) {
          paidLateCount++;
          totalDelay += daysLate;
        } else {
          analysis.paidOnTime++;
        }
        analysis.paidLate = paidLateCount;
      } else if (inv.status === 'sent' || inv.status === 'overdue') {
        analysis.unpaid++;
        analysis.outstandingAmount += inv.total;
        analysis.outstandingInvoices.push({
          invoiceId: inv._id,
          dueDate: inv.dueDate,
          amount: inv.total,
          status: inv.status
        });
      }
    });

    if (paidLateCount > 0) {
      analysis.averagePaymentDelay = Math.round(totalDelay / paidLateCount);
    }

    if (invoices.length > 0) {
      analysis.latePaymentRate = Math.round((paidLateCount / invoices.length) * 100);
    }

    console.log('✅ Payment behavior fetched');
    return analysis;
  } catch (error) {
    console.error('❌ Error fetching payment behavior:', error.message);
    throw error;
  }
};

/**
 * Get revenue by product/service
 */
exports.getRevenueByProduct = async (userId, currency = 'NGN') => {
  try {
    console.log(`📦 Fetching revenue by product (Currency: ${currency})`);

    const byProduct = await Invoice.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: { $in: ['paid', 'sent', 'overdue', 'completed'] },
          currency: currency
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.name',
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          unitsSold: { $sum: '$items.quantity' },
          invoiceCount: { $sum: 1 },
          averagePrice: { $avg: '$items.price' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $project: {
          productName: '$_id',
          totalRevenue: 1,
          unitsSold: 1,
          invoiceCount: 1,
          averagePrice: 1,
          _id: 0
        }
      }
    ]);

    console.log(`✅ Revenue by product fetched (${byProduct.length})`);
    return byProduct;
  } catch (error) {
    console.error('❌ Error fetching revenue by product:', error.message);
    throw error;
  }
};

/**
 * Get revenue by payment method
 */
exports.getRevenueByPaymentMethod = async (userId, currency = 'NGN') => {
  try {
    console.log(`💰 Fetching revenue by payment method (Currency: ${currency})`);

    // Get from receipts
    const byMethod = await Receipt.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: 'verified'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          totalRevenue: { $sum: '$totalPaid' },
          receiptCount: { $sum: 1 },
          averageTransaction: { $avg: '$totalPaid' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $project: {
          paymentMethod: '$_id',
          totalRevenue: 1,
          receiptCount: 1,
          averageTransaction: 1,
          _id: 0
        }
      }
    ]);

    console.log(`✅ Revenue by payment method fetched (${byMethod.length})`);
    return byMethod;
  } catch (error) {
    console.error('❌ Error fetching revenue by payment method:', error.message);
    throw error;
  }
};

/**
 * Get revenue forecast (enhanced AI-powered projection with business intelligence)
 * Based on historical invoice data to predict future performance
 * Generates smart business recommendations, quarterly projections, and narrative analysis
 */
exports.getRevenueForecast = async (userId, daysAhead = 30) => {
  try {
    console.log(`🔮 Calculating enhanced revenue forecast for ${daysAhead} days`);

    // Fetch double the forecast period to establish a trend
    const historicalDays = daysAhead * 2;
    const history = await exports.getRevenueTrend(userId, historicalDays);

    // Also fetch product data for business recommendations
    let topProducts = [];
    try {
      topProducts = await exports.getRevenueByProduct(userId);
    } catch (e) { /* optional */ }

    if (history.length < 5) {
      return {
        historicalAverage: 0,
        projectedRevenue: 0,
        forecastDays: daysAhead,
        confidence: 'low',
        growthRate: 0,
        bestCase: 0,
        worstCase: 0,
        forecast: [],
        cashFlowHealth: 'poor',
        churnProbability: 50,
        seasonalityInsights: ['Insufficient historical data to generate forecast. Create more invoices to unlock AI-powered insights.'],
        quarterlyProjections: [],
        businessRecommendations: ['Start invoicing regularly to build a revenue baseline for intelligent forecasting.'],
        narrativeReport: 'Not enough data to generate a forecast report. Continue using InvoicePro to build your revenue history.',
        monthlyBreakdown: []
      };
    }

    // Split history into two halves to determine the trend
    const halfIndex = Math.floor(history.length / 2);
    const firstHalf = history.slice(0, halfIndex);
    const secondHalf = history.slice(halfIndex);

    const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.revenue, 0) / firstHalf.length || 0;
    const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.revenue, 0) / secondHalf.length || 0;
    const totalHistoricalRevenue = history.reduce((sum, day) => sum + day.revenue, 0);

    // Calculate growth rate (with boundaries to prevent extreme predictions)
    let dailyGrowthRate = 0;
    if (firstHalfAvg > 0) {
      const periodGrowth = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;
      dailyGrowthRate = periodGrowth / halfIndex;
      dailyGrowthRate = Math.max(Math.min(dailyGrowthRate, 0.02), -0.02);
    }

    const recentDailyAvg = secondHalfAvg;

    // Generate daily forecast
    const forecast = [];
    const today = new Date();
    let currentProjection = recentDailyAvg;
    let totalProjected = 0;

    for (let i = 1; i <= daysAhead; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);
      currentProjection = currentProjection * (1 + dailyGrowthRate);
      const projectedValue = Math.max(0, Math.round(currentProjection));
      totalProjected += projectedValue;

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        projectedRevenue: projectedValue
      });
    }

    // Confidence analysis
    const variance = secondHalf.reduce((sum, day) => sum + Math.pow(day.revenue - secondHalfAvg, 2), 0) / secondHalf.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = secondHalfAvg > 0 ? stdDev / secondHalfAvg : 1;

    let confidence = 'medium';
    if (coefficientOfVariation < 0.2) confidence = 'high';
    if (coefficientOfVariation > 0.8) confidence = 'low';

    const marginOfError = confidence === 'high' ? 0.1 : (confidence === 'medium' ? 0.2 : 0.4);
    const bestCase = Math.round(totalProjected * (1 + marginOfError));
    const worstCase = Math.round(totalProjected * (1 - marginOfError));

    // Cash flow health
    let cashFlowHealth = 'good';
    if (confidence === 'high' && dailyGrowthRate > 0) cashFlowHealth = 'excellent';
    if (confidence === 'low' || dailyGrowthRate < 0) cashFlowHealth = 'poor';

    // Churn probability
    let churnProbability = 15;
    if (dailyGrowthRate < 0) churnProbability = Math.min(85, 15 + Math.abs(dailyGrowthRate * 100 * 30 * 1.5));
    if (confidence === 'low') churnProbability += 10;
    churnProbability = Math.round(churnProbability);

    // ============================================
    // ENHANCED: Seasonality Insights (upgraded)
    // ============================================
    const seasonalityInsights = [];

    if (variance > (firstHalfAvg * firstHalfAvg * 0.8)) {
      seasonalityInsights.push("High volatility detected. Your revenue cycles show significant peaks and valleys — consider offering incentives for early payments to stabilize cash flow.");
    } else if (variance < (firstHalfAvg * firstHalfAvg * 0.2)) {
      seasonalityInsights.push("Excellent consistency. Your billing patterns are highly stable, making this forecast remarkably reliable.");
    } else {
      seasonalityInsights.push("Moderate consistency in your cash flow. Your payment cycles are generally predictable but maintain a buffer for off-weeks.");
    }

    if (dailyGrowthRate > 0.01) {
      seasonalityInsights.push("🚀 Strong Growth Alert! You are on a steep upward trajectory. If this pace continues, you will outgrow your current targets well ahead of schedule.");
    } else if (dailyGrowthRate > 0.003) {
      seasonalityInsights.push("Steady, healthy growth observed. Your recent billing activity is consistently outperforming the earlier half of the period.");
    } else if (dailyGrowthRate < -0.01) {
      seasonalityInsights.push("⚠️ Revenue Lull: There's a notable dip in recent billing compared to your average. Monitor client retention closely and consider re-engagement campaigns.");
    }

    if (cashFlowHealth === 'excellent') {
      seasonalityInsights.push("Cash flow is rated 'Excellent' due to high confidence and positive growth margins.");
    }
    if (churnProbability > 40) {
      seasonalityInsights.push(`Elevated churn risk (${churnProbability}%). The recent drop in active invoice volume suggests a need for client outreach.`);
    }

    // Weekday vs weekend pattern
    const weekdayRevenue = history.filter(d => {
      const day = new Date(d.date).getDay();
      return day > 0 && day < 6;
    });
    const weekendRevenue = history.filter(d => {
      const day = new Date(d.date).getDay();
      return day === 0 || day === 6;
    });
    const avgWeekday = weekdayRevenue.length > 0 ? weekdayRevenue.reduce((s, d) => s + d.revenue, 0) / weekdayRevenue.length : 0;
    const avgWeekend = weekendRevenue.length > 0 ? weekendRevenue.reduce((s, d) => s + d.revenue, 0) / weekendRevenue.length : 0;

    if (avgWeekday > avgWeekend * 2 && weekendRevenue.length > 0) {
      seasonalityInsights.push("Weekday-heavy billing cycle detected. Your revenue peaks during business days — this is typical for B2B services.");
    } else if (avgWeekend > avgWeekday * 1.5 && avgWeekend > 0) {
      seasonalityInsights.push("Unusually strong weekend activity. Consider optimizing your operations for 7-day coverage.");
    }

    if (seasonalityInsights.length === 0) {
      seasonalityInsights.push("Consistent revenue stream with stable payment cycles.");
    }

    // ============================================
    // NEW: Quarterly Projections
    // ============================================
    const quarterlyProjections = [];
    const monthlyGrowthRate = dailyGrowthRate * 30;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let q = 0; q < 4; q++) {
      const quarterStart = new Date(today);
      quarterStart.setMonth(quarterStart.getMonth() + q * 3);
      const quarterLabel = `Q${Math.ceil((quarterStart.getMonth() + 1) / 3)} ${quarterStart.getFullYear()}`;
      
      let quarterRevenue = 0;
      for (let m = 0; m < 3; m++) {
        const monthsAhead = q * 3 + m;
        const monthProjection = recentDailyAvg * 30 * Math.pow(1 + monthlyGrowthRate, monthsAhead);
        quarterRevenue += Math.max(0, Math.round(monthProjection));
      }
      
      quarterlyProjections.push({
        quarter: quarterLabel,
        projectedRevenue: quarterRevenue,
        growth: Number(((Math.pow(1 + monthlyGrowthRate, 3) - 1) * 100).toFixed(1))
      });
    }

    // ============================================
    // NEW: Monthly Breakdown
    // ============================================
    const monthlyBreakdown = [];
    for (let m = 0; m < Math.min(12, Math.ceil(daysAhead / 30) + 2); m++) {
      const monthDate = new Date(today);
      monthDate.setMonth(monthDate.getMonth() + m);
      const monthProjection = recentDailyAvg * 30 * Math.pow(1 + monthlyGrowthRate, m);
      monthlyBreakdown.push({
        month: `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear()}`,
        projected: Math.max(0, Math.round(monthProjection)),
        best: Math.max(0, Math.round(monthProjection * (1 + marginOfError))),
        worst: Math.max(0, Math.round(monthProjection * (1 - marginOfError)))
      });
    }

    // ============================================
    // NEW: Business Recommendations
    // ============================================
    const businessRecommendations = [];

    if (topProducts.length > 0) {
      const topProduct = topProducts[0];
      businessRecommendations.push(
        `Your top revenue driver is "${topProduct.productName}" generating ${topProduct.totalRevenue.toLocaleString()} across ${topProduct.invoiceCount} invoices. Consider creating premium tiers or upsell packages around this service.`
      );
    }

    if (dailyGrowthRate > 0.005) {
      businessRecommendations.push(
        "Your growth trajectory supports scaling. Consider hiring or expanding capacity in the next 60–90 days to maintain service quality during the anticipated revenue increase."
      );
    } else if (dailyGrowthRate < -0.005) {
      businessRecommendations.push(
        "Revenue is trending downward. Priority actions: (1) reach out to lapsed clients with a re-engagement offer, (2) review pricing competitiveness, (3) launch a referral program to drive new business."
      );
    } else {
      businessRecommendations.push(
        "Revenue is stable. To accelerate growth, consider diversifying your service offerings, entering new client segments, or launching recurring subscription-based invoicing."
      );
    }

    if (coefficientOfVariation > 0.5) {
      businessRecommendations.push(
        "Your revenue is highly variable. Establish a retainer or subscription model with key clients to create a predictable revenue baseline."
      );
    }

    if (totalHistoricalRevenue > 0 && topProducts.length > 1) {
      const topProductShare = (topProducts[0].totalRevenue / totalHistoricalRevenue * 100).toFixed(0);
      if (topProductShare > 60) {
        businessRecommendations.push(
          `${topProductShare}% of your revenue comes from a single product/service. Diversification is recommended to reduce concentration risk.`
        );
      }
    }

    // ============================================
    // NEW: Narrative AI Report
    // ============================================
    const monthlyGrowthPct = Number((dailyGrowthRate * 100 * 30).toFixed(1));
    const annualProjection = Math.round(recentDailyAvg * 365 * Math.pow(1 + monthlyGrowthRate, 12));
    const trendWord = monthlyGrowthPct > 0.5 ? 'growing' : monthlyGrowthPct < -0.5 ? 'declining' : 'stable';
    const confidenceWord = confidence === 'high' ? 'highly confident' : confidence === 'medium' ? 'moderately confident' : 'preliminary';

    const narrativeReport = [
      `📊 **Executive Summary** — Based on ${history.length} days of invoice data, your business is currently ${trendWord} at a rate of ${Math.abs(monthlyGrowthPct)}% per month.`,
      ``,
      `Your recent daily average revenue is approximately ${Math.round(recentDailyAvg).toLocaleString()}, projecting to ${totalProjected.toLocaleString()} over the next ${daysAhead} days. The annualized run rate is ${annualProjection.toLocaleString()}.`,
      ``,
      `This forecast has **${confidenceWord}** reliability (coefficient of variation: ${(coefficientOfVariation * 100).toFixed(0)}%). ${confidence === 'high' ? 'Your revenue patterns are consistent enough for reliable predictions.' : 'Consider this a directional guide rather than a precise prediction.'}`,
      ``,
      `**Scenario Analysis:**`,
      `• Best case (${confidence === 'high' ? '±10%' : confidence === 'medium' ? '±20%' : '±40%'}): ${bestCase.toLocaleString()}`,
      `• Expected: ${totalProjected.toLocaleString()}`,
      `• Worst case: ${worstCase.toLocaleString()}`,
      ``,
      `**Cash Flow Health:** ${cashFlowHealth.charAt(0).toUpperCase() + cashFlowHealth.slice(1)} | **Client Retention Risk:** ${churnProbability}%`,
      ``,
      monthlyGrowthPct > 0.5 ?
        `🟢 Your business is on an upward trajectory. Maintain momentum by focusing on client satisfaction and operational efficiency.` :
        monthlyGrowthPct < -0.5 ?
        `🔴 Revenue is trending down. Immediate focus areas: client retention, competitive pricing review, and new client acquisition.` :
        `🟡 Revenue is flat. This is a good time to invest in growth initiatives — marketing, product development, or strategic partnerships.`
    ].join('\n');

    console.log('✅ Enhanced revenue forecast calculated');
    return {
      historicalAverage: Math.round(recentDailyAvg),
      projectedRevenue: Math.round(totalProjected),
      forecastDays: daysAhead,
      confidence,
      growthRate: monthlyGrowthPct,
      bestCase,
      worstCase,
      forecast,
      cashFlowHealth,
      churnProbability,
      seasonalityInsights,
      quarterlyProjections,
      monthlyBreakdown,
      businessRecommendations,
      narrativeReport,
      annualRunRate: annualProjection
    };
  } catch (error) {
    console.error('❌ Error calculating forecast:', error.message);
    throw error;
  }
};

/**
 * Export data to CSV format
 * @param {string} type - 'revenue' | 'payments' | 'customers' | 'outstanding'
 * @param {string} userId - User ID
 * @param {Object} dateRange - { from, to } dates
 * @returns {string} - CSV data
 */
exports.exportToCSV = async (type, userId, dateRange = {}) => {
  try {
    console.log(`📤 Exporting ${type} data as CSV`);

    let data = [];
    let headers = [];

    switch (type) {
      case 'revenue':
        data = await exports.getRevenueByProduct(userId);
        headers = ['Product/Service', 'Total Revenue', 'Units Sold', 'Invoices', 'Avg Price'];
        break;

      case 'payments':
        data = await exports.getRevenueByPaymentMethod(userId);
        headers = ['Payment Method', 'Total Revenue', 'Transaction Count', 'Avg Transaction'];
        break;

      case 'customers':
        data = await exports.getTopCustomers(userId, 1000);
        headers = ['Customer Name', 'Total Spent', 'Invoices', 'Paid Amount', 'Email', 'Last Invoice'];
        break;

      case 'outstanding':
        const behavior = await exports.getPaymentBehavior(userId);
        data = behavior.outstandingInvoices;
        headers = ['Invoice ID', 'Due Date', 'Amount', 'Status'];
        break;

      default:
        throw new Error('Invalid export type');
    }

    // Generate CSV
    let csv = '\uFEFF' + headers.join(',') + '\n'; // BOM for Excel UTF-8

    // Explicit row mappers per export type
    const rowMappers = {
      revenue: (row) => [
        row.productName, row.totalRevenue, row.unitsSold, row.invoiceCount, row.averagePrice?.toFixed(2)
      ],
      payments: (row) => [
        row.paymentMethod, row.totalRevenue, row.receiptCount, row.averageTransaction?.toFixed(2)
      ],
      customers: (row) => [
        row.customerName, row.totalSpent, row.invoiceCount, row.paidAmount, row.email || '',
        row.lastInvoice ? new Date(row.lastInvoice).toISOString().split('T')[0] : ''
      ],
      outstanding: (row) => [
        row.invoiceId, row.dueDate ? new Date(row.dueDate).toISOString().split('T')[0] : '', row.amount, row.status
      ]
    };

    const mapper = rowMappers[type];
    data.forEach(row => {
      const values = mapper(row).map(v => {
        if (v == null) return '';
        const str = String(v);
        return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
      });
      csv += values.join(',') + '\n';
    });

    console.log('✅ CSV export generated');
    return csv;
  } catch (error) {
    console.error('❌ Error exporting CSV:', error.message);
    throw error;
  }
};
