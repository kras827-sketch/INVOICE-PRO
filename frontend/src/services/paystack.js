// src/services/paystack.js
// Paystack Payment Integration for Nigeria (₦ Naira only)

/**
 * Paystack Subscription Plans
 * All prices in Nigerian Naira (₦)
 */
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'NGN',
    monthlyInvoiceLimit: 3,
    features: [
      'Up to 3 invoices/month',
      'Basic templates',
      'Download PDF',
      'No business logo'
    ],
    recommended: false
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 3000,
    currency: 'NGN',
    monthlyInvoiceLimit: 0, // Unlimited
    paystackPlanCode: 'PLN_basic_naira', // Set this in Paystack dashboard
    features: [
      'Unlimited invoices',
      'All templates included',
      'Business logo upload',
      'Email invoice sending',
      'Advanced reports',
      'Priority support'
    ],
    recommended: true
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 10000,
    currency: 'NGN',
    monthlyInvoiceLimit: 0, // Unlimited
    paystackPlanCode: 'PLN_business_naira', // Set this in Paystack dashboard
    features: [
      'Unlimited invoices',
      'All templates + custom branding',
      'Business logo & watermark',
      'Email invoice sending',
      'Payment reminders',
      'Advanced analytics',
      'API access',
      '24/7 Premium support',
      'White-label invoices'
    ],
    recommended: false
  }
};

/**
 * Initialize Paystack payment
 * Loads Paystack script from CDN
 */
export const initPaystack = () => {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack'));
    document.body.appendChild(script);
  });
};

/**
 * Process one-time payment
 * @param {object} options - Payment options
 */
export const processPayment = async (options) => {
  try {
    await initPaystack();

    return new Promise((resolve, reject) => {
      const handler = window.PaystackPop.setup({
        key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
        email: options.email,
        amount: options.amount * 100, // Paystack uses kobo (amount in naira * 100)
        currency: 'NGN',
        metadata: {
          custom_fields: [
            {
              display_name: 'User ID',
              variable_name: 'user_id',
              value: options.userId
            },
            {
              display_name: 'Plan',
              variable_name: 'plan',
              value: options.planId
            }
          ]
        },
        onClose: () => {
          reject(new Error('Payment window closed'));
        },
        callback: (response) => {
          resolve({
            success: true,
            reference: response.reference,
            status: response.status,
            message: 'Payment successful! Your subscription has been activated.'
          });
        }
      });

      handler.openIframe();
    });
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Payment processing failed'
    };
  }
};

/**
 * Process subscription payment (recurring)
 * @param {object} options - Subscription options
 */
export const processSubscription = async (options) => {
  try {
    await initPaystack();

    const plan = SUBSCRIPTION_PLANS[options.planId];
    if (!plan) throw new Error('Invalid plan selected');

    return new Promise((resolve, reject) => {
      const handler = window.PaystackPop.setup({
        key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
        email: options.email,
        amount: plan.price * 100, // Convert to kobo
        currency: 'NGN',
        plan: plan.paystackPlanCode,
        quantity: 1,
        metadata: {
          custom_fields: [
            {
              display_name: 'User ID',
              variable_name: 'user_id',
              value: options.userId
            },
            {
              display_name: 'Plan Type',
              variable_name: 'plan_type',
              value: options.planId
            }
          ]
        },
        onClose: () => {
          reject(new Error('Subscription setup cancelled'));
        },
        callback: (response) => {
          resolve({
            success: true,
            reference: response.reference,
            status: response.status,
            message: `Upgrade to ${plan.name} successful! Your subscription is now active.`
          });
        }
      });

      handler.openIframe();
    });
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Subscription failed'
    };
  }
};

/**
 * Verify payment with backend
 * @param {string} reference - Paystack payment reference
 */
export const verifyPayment = async (reference) => {
  try {
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ reference })
    });

    if (!response.ok) throw new Error('Verification failed');

    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Get plan by ID
 * @param {string} planId - Plan ID
 */
export const getPlan = (planId = 'free') => {
  return SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;
};

/**
 * Get all plans for display
 */
export const getAllPlans = () => {
  return Object.values(SUBSCRIPTION_PLANS);
};

/**
 * Format currency for display
 * @param {number} amount - Amount in Naira
 */
export const formatPrice = (amount) => {
  return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0 });
};

/**
 * Check if user can create invoice based on plan
 * @param {object} user - User object with subscription info
 */
export const canCreateInvoice = (user) => {
  if (!user || !user.subscription) return false;

  const plan = user.subscription.plan;
  
  // Free plan limit
  if (plan === 'free') {
    // Check if month has reset
    const now = new Date();
    const lastReset = new Date(user.subscription.invoiceCountResetDate);
    
    // If more than 30 days have passed, reset counter
    if ((now - lastReset) / (1000 * 60 * 60 * 24) > 30) {
      return true; // Counter would be reset
    }

    return user.subscription.invoiceCount < user.subscription.monthlyInvoiceLimit;
  }

  // Unlimited plans
  return plan === 'basic' || plan === 'business';
};

export default {
  SUBSCRIPTION_PLANS,
  initPaystack,
  processPayment,
  processSubscription,
  verifyPayment,
  getPlan,
  getAllPlans,
  formatPrice,
  canCreateInvoice
};
