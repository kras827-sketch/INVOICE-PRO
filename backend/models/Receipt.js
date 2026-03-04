const mongoose = require('mongoose');
const crypto = require('crypto');

const receiptSchema = new mongoose.Schema({
  // Link to invoice
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
    unique: true // Only one receipt per invoice
  },

  // Link to user (owner)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Public receipt ID (non-guessable UUID)
  publicReceiptId: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(16).toString('hex')
  },

  // Receipt data (pulled from invoice)
  receiptNumber: {
    type: String,
    required: true,
    unique: true
  },

  invoiceNumber: {
    type: String,
    required: true
  },

  // Business info
  business: {
    name: String,
    logo: String,
    address: String,
    email: String,
    phone: String
  },

  // Customer info
  customer: {
    name: String,
    email: String,
    phone: String,
    address: String
  },

  // Items (copy from invoice)
  items: [{
    name: String,
    description: String,
    quantity: Number,
    price: Number
  }],

  // Financial data
  subtotal: Number,
  taxRate: Number,
  taxAmount: Number,
  discount: Number,
  totalPaid: {
    type: Number,
    required: true
  },

  // Currency
  currency: {
    type: String,
    default: 'NGN'
  },

  locale: {
    type: String,
    default: 'en-NG'
  },

  // Payment info
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'card', 'cash', 'check', 'other'],
    default: 'bank_transfer'
  },

  paymentDate: {
    type: Date,
    default: Date.now
  },

  // Status
  status: {
    type: String,
    enum: ['verified', 'pending', 'cancelled'],
    default: 'verified'
  },

  // QR code
  qrCode: {
    type: String // Base64 encoded QR code image
  },

  // Verification URL
  verificationUrl: {
    type: String
  },

  // Email tracking
  emailsSent: [{
    sentTo: String,
    sentAt: {
      type: Date,
      default: Date.now
    },
    messageId: String
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for fast lookups
receiptSchema.index({ user: 1, createdAt: -1 });
receiptSchema.index({ publicReceiptId: 1 });
receiptSchema.index({ invoice: 1 });

// Auto-generate verification URL before saving
receiptSchema.pre('save', function(next) {
  if (!this.verificationUrl) {
    this.verificationUrl = `/verify/${this.publicReceiptId}`;
  }
  next();
});

module.exports = mongoose.model('Receipt', receiptSchema);
