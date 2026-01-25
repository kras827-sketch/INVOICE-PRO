const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * PAYMENT ROUTES
 * All routes require authentication
 */

// POST /api/payments/process - Process payment with Paystack
// Body: { reference: "paystack_reference", plan: "basic" | "business", email: "user@email.com" }
router.post('/process', authMiddleware, paymentController.processPayment);

// POST /api/payments/verify - Verify Paystack payment
// Body: { reference: "paystack_reference" }
router.post('/verify', authMiddleware, paymentController.verifyPayment);

// GET /api/payments/subscription - Get current subscription
// Returns: { plan, status, monthlyInvoiceLimit, invoiceCount, invoiceCountResetDate, renewalDate }
router.get('/subscription', authMiddleware, paymentController.getSubscription);

// GET /api/payments/plans - Get all available plans
// Returns array of plans with pricing and features
router.get('/plans', paymentController.getPlans);

// POST /api/payments/cancel-subscription - Cancel active subscription
router.post('/cancel-subscription', authMiddleware, paymentController.cancelSubscription);

// POST /api/payments/upgrade - Upgrade to different plan
// Body: { newPlan: "basic" | "business" }
router.post('/upgrade', authMiddleware, paymentController.upgradePlan);

module.exports = router;
