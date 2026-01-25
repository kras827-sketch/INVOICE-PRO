const axios = require('axios');
const User = require('../models/User');
const Invoice = require('../models/Invoice');

// Paystack Base URL
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// Subscription Plans
const PLANS = {
  free: {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    currency: 'NGN',
    monthlyInvoiceLimit: 3,
    features: ['Up to 3 invoices/month', 'Basic templates']
  },
  basic: {
    id: 'basic',
    name: 'Basic Plan',
    price: 3000,
    currency: 'NGN',
    monthlyInvoiceLimit: Infinity,
    features: ['Unlimited invoices', 'All templates', 'Email support', 'Business logo']
  },
  business: {
    id: 'business',
    name: 'Business Plan',
    price: 10000,
    currency: 'NGN',
    monthlyInvoiceLimit: Infinity,
    features: ['Unlimited invoices', 'All templates', 'Priority support', 'White-label', 'API access']
  }
};

/**
 * Process Payment with Paystack
 * Handles one-time payments and subscription setup
 */
exports.processPayment = async (req, res) => {
  try {
    const { reference, plan, email } = req.body;
    const userId = req.user.uid;

    if (!reference || !plan || !PLANS[plan]) {
      return res.status(400).json({ message: 'Invalid payment reference or plan' });
    }

    // Verify payment with Paystack
    const verifyResponse = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
      }
    );

    if (verifyResponse.data.status !== true) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const transaction = verifyResponse.data.data;

    // Check payment status
    if (transaction.status !== 'success') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    // Check if payment amount matches plan
    const planAmount = PLANS[plan].price * 100; // Paystack uses kobo
    if (transaction.amount !== planAmount) {
      return res.status(400).json({ message: 'Payment amount does not match plan' });
    }

    // Update user subscription in database
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        subscription: {
          plan: plan,
          status: 'active',
          monthlyInvoiceLimit: PLANS[plan].monthlyInvoiceLimit,
          invoiceCount: 0,
          invoiceCountResetDate: new Date(),
          paystackReference: reference,
          renewalDate: renewalDate
        }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${plan} plan`,
      subscription: updatedUser.subscription,
      transaction: {
        reference: transaction.reference,
        amount: transaction.amount / 100,
        currency: transaction.currency,
        paidAt: transaction.paid_at,
        status: transaction.status
      }
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      message: 'Payment processing failed',
      error: error.message
    });
  }
};

/**
 * Verify Payment
 * Simple verification endpoint
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ message: 'Payment reference required' });
    }

    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
      }
    );

    res.status(200).json({
      success: response.data.status,
      data: response.data.data,
      message: response.data.message
    });
  } catch (error) {
    res.status(500).json({
      message: 'Verification failed',
      error: error.message
    });
  }
};

/**
 * Get Current Subscription
 */
exports.getSubscription = async (req, res) => {
  try {
    const userId = req.user.uid;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If subscription expired, downgrade to free
    if (user.subscription.plan !== 'free' && user.subscription.renewalDate < new Date()) {
      user.subscription = {
        plan: 'free',
        status: 'expired',
        monthlyInvoiceLimit: 3,
        invoiceCount: 0,
        invoiceCountResetDate: new Date(),
        paystackReference: null,
        renewalDate: null
      };
      await user.save();
    }

    res.status(200).json({
      subscription: user.subscription
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch subscription', error: error.message });
  }
};

/**
 * Get All Plans
 */
exports.getPlans = (req, res) => {
  try {
    res.status(200).json({
      plans: Object.values(PLANS)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch plans', error: error.message });
  }
};

/**
 * Cancel Subscription
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.uid;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        subscription: {
          plan: 'free',
          status: 'cancelled',
          monthlyInvoiceLimit: 3,
          invoiceCount: 0,
          invoiceCountResetDate: new Date(),
          paystackReference: null,
          renewalDate: null
        }
      },
      { new: true }
    );

    res.status(200).json({
      message: 'Subscription cancelled successfully',
      subscription: updatedUser.subscription
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel subscription', error: error.message });
  }
};

/**
 * Upgrade Plan
 */
exports.upgradePlan = async (req, res) => {
  try {
    const { newPlan } = req.body;
    const userId = req.user.uid;

    if (!PLANS[newPlan]) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    const user = await User.findById(userId);

    // If upgrading to paid plan, require payment verification
    if (newPlan !== 'free' && !req.body.paystackReference) {
      return res.status(400).json({
        message: 'Payment reference required for paid plans'
      });
    }

    // If upgrading to free plan, direct downgrade
    if (newPlan === 'free') {
      user.subscription = {
        plan: 'free',
        status: 'active',
        monthlyInvoiceLimit: 3,
        invoiceCount: 0,
        invoiceCountResetDate: new Date(),
        paystackReference: null,
        renewalDate: null
      };
    } else {
      // For paid plans, process payment first (in controller)
      user.subscription.plan = newPlan;
      user.subscription.monthlyInvoiceLimit = PLANS[newPlan].monthlyInvoiceLimit;
    }

    await user.save();

    res.status(200).json({
      message: `Successfully upgraded to ${newPlan} plan`,
      subscription: user.subscription
    });
  } catch (error) {
    res.status(500).json({ message: 'Upgrade failed', error: error.message });
  }
};

/**
 * Check Invoice Limit
 * Helper function for invoice creation
 */
exports.checkInvoiceLimit = async (userId) => {
  try {
    const user = await User.findById(userId);
    const plan = PLANS[user.subscription.plan];

    // Reset counter if month has passed
    const today = new Date();
    const resetDate = new Date(user.subscription.invoiceCountResetDate);
    if (today.getMonth() !== resetDate.getMonth() || today.getFullYear() !== resetDate.getFullYear()) {
      user.subscription.invoiceCount = 0;
      user.subscription.invoiceCountResetDate = today;
      await user.save();
    }

    if (user.subscription.invoiceCount >= plan.monthlyInvoiceLimit) {
      throw new Error(`Invoice limit (${plan.monthlyInvoiceLimit}/month) reached for ${user.subscription.plan} plan`);
    }

    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Increment Invoice Count
 * Call this after creating an invoice
 */
exports.incrementInvoiceCount = async (userId) => {
  try {
    const user = await User.findById(userId);
    user.subscription.invoiceCount += 1;
    await user.save();
  } catch (error) {
    console.error('Error incrementing invoice count:', error);
  }
};

module.exports = exports;
