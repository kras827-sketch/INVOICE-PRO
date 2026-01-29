// backend/src/models/Invoice.js
// Invoice model - Defines structure of invoices in MongoDB

const mongoose = require('mongoose');

/**
 * Item Schema - Individual line item in invoice
 */
const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  // Calculated automatically
  total: {
    type: Number,
  },
}, { _id: false }); // Don't create separate IDs for items

// Calculate item total before saving
itemSchema.pre('save', function() {
  this.total = this.quantity * this.price;
});

/**
 * Invoice Schema
 * Stores complete invoice data
 */
const invoiceSchema = new mongoose.Schema({
  // Reference to user who created this invoice
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Faster queries by user
  },
  
  // Auto-generated invoice number (e.g., INV-2024-0001)
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  
  // Invoice dates
  invoiceDate: {
    type: Date,
    default: Date.now,
    required: true,
  },
  
  dueDate: {
    type: Date,
  },
  
  // Company information (who is sending the invoice)
  company: {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      default: '',
    },
    email: String,
    phone: String,
    logo: String, // URL to uploaded logo
    stamp: String, // URL to uploaded stamp
  },
  
  // Client information (who receives the invoice)
  client: {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      default: '',
    },
    email: String,
    phone: String,
  },
  
  // Invoice items (array of products/services)
  items: {
    type: [itemSchema],
    required: true,
    validate: [array => array.length > 0, 'At least one item is required'],
  },
  
  // Financial calculations (auto-calculated by pre-save middleware)
  subtotal: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100, // Percentage
  },
  
  taxAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  total: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  // Additional information
  notes: String,
  terms: String,
  
  // 🎨 Invoice Template
  template: {
    type: String,
    enum: ['modern-clean', 'corporate-blue', 'minimal-white', 'bold-dark', 'elegant-gold', 'creative-gradient', 'architect-grid', 'modern-minimal', 'classic-legal', 'startup-pitch', 'sunrise-gradient', 'monochrome-elegant'],
    default: 'modern-clean'
  },
  
  // Invoice status
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'completed'],
    default: 'draft',
  },
  
  // Payment tracking (for future features)
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid',
  },
  
  paidAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  paidDate: Date,
  
  // Email tracking
  sentTo: [String], // Array of email addresses invoice was sent to
  lastSentDate: Date,
  
  // 💾 Discount
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  
}, {
  timestamps: true, // Automatically add createdAt and updatedAt
});

// ============================================
// MIDDLEWARE - Auto-calculate totals
// ============================================

/**
 * Calculate subtotal, tax, and total before saving
 * Implements industry-standard invoice calculations including discount
 */
invoiceSchema.pre('save', function(next) {
  // Step 1: Calculate subtotal from all items
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);
  
  // Step 2: Round subtotal to 2 decimals
  this.subtotal = Math.round(this.subtotal * 100) / 100;
  
  // Step 3: Calculate tax amount (on subtotal before discount)
  this.taxAmount = Math.round((this.subtotal * this.taxRate) / 100 * 100) / 100;
  
  // Step 4: Apply discount (default 0 if not specified)
  const discountAmount = Math.round((this.discount || 0) * 100) / 100;
  
  // Step 5: Calculate final total (subtotal + tax - discount)
  // Math.max ensures total never goes negative
  this.total = Math.max(0, Math.round((this.subtotal + this.taxAmount - discountAmount) * 100) / 100);
  
  next();
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Generate unique invoice number
 * Format: INV-YYYY-XXXX
 * 
 * @param {string} userId - User's ID
 * @returns {string} - Generated invoice number
 */
invoiceSchema.statics.generateInvoiceNumber = async function(userId) {
  const year = new Date().getFullYear();
  
  // Count invoices created this year by this user
  const count = await this.countDocuments({
    user: userId,
    createdAt: {
      $gte: new Date(year, 0, 1), // Start of year
      $lt: new Date(year + 1, 0, 1), // Start of next year
    },
  });
  
  // Format: INV-2024-0001
  const number = String(count + 1).padStart(4, '0');
  return `INV-${year}-${number}`;
};

/**
 * Get user's invoice statistics
 * Provides comprehensive analytics for dashboard
 * 
 * Returns:
 * - totalInvoices: Count of all invoices
 * - totalRevenue: Sum of all invoice totals (after discounts)
 * - paidAmount: Sum of all payments received
 * - pendingAmount: Sum of unpaid invoices (outstanding balance)
 * - draftCount: Count of draft invoices
 * - sentCount: Count of sent invoices
 * 
 * @param {string} userId - User's ID
 * @returns {object} - Statistics object
 */
invoiceSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalRevenue: { $sum: '$total' }, // Already includes discount deduction
        paidAmount: { 
          $sum: {
            $cond: [
              { $eq: ['$paymentStatus', 'paid'] },
              '$total',
              0
            ]
          }
        },
        pendingAmount: { 
          $sum: {
            $cond: [
              { $ne: ['$paymentStatus', 'paid'] },
              '$total',
              0
            ]
          }
        },
        draftCount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'draft'] }, 1, 0]
          }
        },
        sentCount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'sent'] }, 1, 0]
          }
        }
      },
    },
  ]);
  
  return stats[0] || {
    totalInvoices: 0,
    totalRevenue: 0,
    paidAmount: 0,
    pendingAmount: 0,
    draftCount: 0,
    sentCount: 0,
  };
};

// ============================================
// INDEXES for faster queries
// ============================================
invoiceSchema.index({ user: 1, invoiceNumber: 1 });
invoiceSchema.index({ user: 1, status: 1 });
invoiceSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);