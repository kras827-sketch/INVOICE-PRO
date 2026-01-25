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
      required: true,
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
      required: true,
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
  
  // Financial calculations
  subtotal: {
    type: Number,
    required: true,
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
    required: true,
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
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
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
 */
invoiceSchema.pre('save', function(next) {
  // Calculate subtotal from all items
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);
  
  // Calculate tax amount
  this.taxAmount = (this.subtotal * this.taxRate) / 100;
  
  // Calculate final total
  this.total = this.subtotal + this.taxAmount;
  
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
 * 
 * @param {string} userId - User's ID
 * @returns {object} - Statistics
 */
invoiceSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        paidAmount: { $sum: '$paidAmount' },
        pendingAmount: { 
          $sum: { 
            $cond: [{ $eq: ['$paymentStatus', 'unpaid'] }, '$total', 0] 
          } 
        },
      },
    },
  ]);
  
  return stats[0] || {
    totalInvoices: 0,
    totalRevenue: 0,
    paidAmount: 0,
    pendingAmount: 0,
  };
};

// ============================================
// INDEXES for faster queries
// ============================================
invoiceSchema.index({ user: 1, invoiceNumber: 1 });
invoiceSchema.index({ user: 1, status: 1 });
invoiceSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);