const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: function () {
      // Name required only if not using Firebase login
      return !this.firebaseUid;
    },
    default: ''
  },
  email: {
    type: String,
    required: function () {
      // Email required only if not using Firebase login
      return !this.firebaseUid;
    },
    unique: true,
    lowercase: true,
    sparse: true, // Allows null/undefined values
    default: ''
  },
  password: {
    type: String,
    required: function () {
      // Required only for normal email/password login
      return !this.firebaseUid;
    },
    default: ''
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true // Allows null values
  },
  // ✅ Account Verification Status - CRITICAL for auth flow
  isVerified: {
    type: Boolean,
    default: false
  },
  // 📧 Email OTP for signup verification
  emailOTP: {
    code: {
      type: String,
      default: ''
    },
    expiresAt: {
      type: Date,
      default: null
    },
    attempts: {
      type: Number,
      default: 0
    }
  },
  // 🔐 Password Reset OTP
  passwordResetOTP: {
    code: {
      type: String,
      default: ''
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  //  Subscription Plan
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'business'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired'],
      default: 'active'
    },
    monthlyInvoiceLimit: {
      type: Number,
      default: 3 // Free tier limit
    },
    invoiceCount: {
      type: Number,
      default: 0
    },
    invoiceCountResetDate: {
      type: Date,
      default: Date.now
    },
    paystackReference: {
      type: String,
      default: ''
    },
    renewalDate: {
      type: Date,
      default: null
    }
  },
  // 👤 Business Profile
  businessProfile: {
    businessName: {
      type: String,
      default: ''
    },
    businessAddress: {
      type: String,
      default: ''
    },
    businessEmail: {
      type: String,
      default: ''
    },
    businessPhone: {
      type: String,
      default: ''
    },
    logoUrl: {
      type: String,
      default: ''
    },
    taxId: {
      type: String,
      default: ''
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
