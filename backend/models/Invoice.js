const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'completed'],
    default: 'draft'
  },
  company: {
    name: { type: String, required: true },
    address: String,
    email: String,
    phone: String,
    logo: String
  },
  client: {
    name: { type: String, required: true },
    address: String,
    email: String,
    phone: String
  },
  items: [{
    name: { type: String, required: true },
    description: String,
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  }],
  subtotal: {
    type: Number,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  bankDetails: {
    bankName: String,
    accountName: String,
    accountNumber: String
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  locale: {
    type: String,
    default: 'en-NG'
  },
  notes: String,
  terms: String,
  template: {
    type: String,
    default: 'modern-clean'
  },
  sentTo: [{
    type: String
  }],
  lastSentDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Auto-calculate totals before saving
invoiceSchema.pre('save', function(next) {
  console.log('💾 Pre-save hook triggered for invoice');
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);

  // Calculate tax amount
  this.taxAmount = (this.subtotal * (this.taxRate / 100));

  // Calculate total
  this.total = this.subtotal + this.taxAmount - this.discount;
  
  // Ensure total is not negative
  if (this.total < 0) this.total = 0;

  next();
});

// Generate Invoice Number (Static Method)
invoiceSchema.statics.generateInvoiceNumber = async function(userId) {
  console.log('🔄 Generating invoice number for user:', userId);
  const lastInvoice = await this.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .select('invoiceNumber');

  if (!lastInvoice || !lastInvoice.invoiceNumber) {
    return 'INV-001';
  }

  // Extract number part (assuming format INV-XXX)
  const parts = lastInvoice.invoiceNumber.split('-');
  if (parts.length < 2) return 'INV-001';

  const lastNum = parseInt(parts[1], 10);
  if (isNaN(lastNum)) return 'INV-001';

  const nextNum = lastNum + 1;
  return `INV-${String(nextNum).padStart(3, '0')}`;
};

// Get User Stats (Static Method)
invoiceSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$currency',
        totalInvoices: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        paidAmount: { 
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] } 
        },
        pendingAmount: { 
          $sum: { $cond: [{ $ne: ['$status', 'paid'] }, '$total', 0] } 
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalInvoices: 0,
      totalRevenue: 0,
      paidAmount: 0,
      pendingAmount: 0,
      byCurrency: []
    };
  }

  // Aggregate grand totals ignoring currency conversion (for simple counts)
  // Or just return the array and let frontend handle currency display
  const totalInvoices = stats.reduce((sum, s) => sum + s.totalInvoices, 0);
  
  // Default to NGN if present, otherwise just return the first one or 0 for main stats
  const ngnStats = stats.find(s => s._id === 'NGN') || stats[0];

  return {
    totalInvoices,
    totalRevenue: ngnStats.totalRevenue,
    paidAmount: ngnStats.paidAmount,
    pendingAmount: ngnStats.pendingAmount,
    currency: ngnStats._id || 'NGN',
    byCurrency: stats.map(s => ({
      currency: s._id || 'NGN',
      totalInvoices: s.totalInvoices,
      totalRevenue: s.totalRevenue,
      paidAmount: s.paidAmount,
      pendingAmount: s.pendingAmount
    }))
  };
};

module.exports = mongoose.model('Invoice', invoiceSchema);
