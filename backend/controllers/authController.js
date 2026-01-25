const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateOTP, getOTPExpiry, sendOTPEmail, verifyOTP } = require('../services/otpService');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ========================================
// 1️⃣ EMAIL SIGNUP - CREATE ACCOUNT + SEND OTP
// ========================================
/**
 * POST /auth/signup
 * Body: { email, password, name }
 * Response: { success, message, userId }
 * Action: Creates unverified user, sends OTP
 */
exports.signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, password, and name are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    // Create user with isVerified = false
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      emailOTP: {
        code: otp,
        expiresAt: otpExpiry,
        attempts: 0
      }
    });

    console.log(`✅ User created: ${user._id}`);

    // Send OTP email
    console.log(`📧 Attempting to send OTP to ${email}...`);
    const signupLogo = user.businessProfile?.logoUrl || '';
    const emailResult = await sendOTPEmail(email, otp, 'signup', signupLogo);
    
    if (!emailResult.success) {
      console.log(`⚠️ Email sending failed: ${emailResult.error}`);
      console.log(`📌 DEVELOPMENT MODE: OTP code for ${email} is: ${otp}`);
      // In development, still allow signup but log OTP
      // In production, you might want to fail or use SMS as backup
    } else {
      console.log(`✅ OTP email sent successfully`);
    }

    res.status(201).json({
      success: true,
      message: 'Account created. OTP sent to your email.',
      userId: user._id,
      // In development, include OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp: otp })
    });

  } catch (err) {
    console.error('❌ Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error during signup: ' + err.message });
  }
};


// ========================================
// 2️⃣ VERIFY OTP - ACTIVATE ACCOUNT
// ========================================
/**
 * POST /auth/verify-otp
 * Body: { email, otp }
 * Response: { success, token, user }
 * Action: Marks user as verified, returns JWT token
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account already verified' 
      });
    }

    // Verify OTP
    const otpResult = verifyOTP(
      user.emailOTP.code,
      user.emailOTP.expiresAt,
      otp
    );

    if (!otpResult.valid) {
      if (otpResult.reason === 'expired') {
        return res.status(400).json({ 
          success: false, 
          message: 'OTP expired' 
        });
      }
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.emailVerified = true;
    user.emailOTP = {}; // Clear OTP
    await user.save();

    console.log(`✅ User verified: ${user._id}`);

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Account verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (err) {
    console.error('❌ OTP verification error:', err);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};

// ========================================
// 3️⃣ LOGIN - AUTHENTICATE VERIFIED USER ONLY
// ========================================
/**
 * POST /auth/login
 * Body: { email, password }
 * Response: { success, token, user }
 * Action: Authenticates verified users only
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // ✅ CRITICAL: Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your account first. Check your email for the OTP.',
        requiresOTP: true
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    console.log(`✅ User logged in: ${user._id}`);

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// ========================================
// 4️⃣ RESEND OTP - IF USER DIDN'T RECEIVE IT
// ========================================
/**
 * POST /auth/resend-otp
 * Body: { email }
 * Response: { success, message }
 */
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account already verified' 
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    user.emailOTP = {
      code: otp,
      expiresAt: otpExpiry,
      attempts: 0
    };
    await user.save();

    // Send OTP email
    const resendLogo = user.businessProfile?.logoUrl || '';
    const emailResult = await sendOTPEmail(email, otp, 'signup', resendLogo);
    if (!emailResult.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send OTP email' 
      });
    }

    res.json({
      success: true,
      message: 'New OTP sent to your email'
    });

  } catch (err) {
    console.error('❌ Resend OTP error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================================
// 5️⃣ FORGOT PASSWORD - REQUEST RESET OTP
// ========================================
/**
 * POST /auth/forgot-password
 * Body: { email }
 * Response: { success, message }
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists (security)
      return res.json({
        success: true,
        message: 'If that email exists, you will receive a password reset OTP'
      });
    }

    // Generate password reset OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    user.passwordResetOTP = {
      code: otp,
      expiresAt: otpExpiry
    };
    await user.save();

    // Send OTP email
    const resetLogo = user.businessProfile?.logoUrl || '';
    const emailResult = await sendOTPEmail(email, otp, 'reset', resetLogo);
    if (!emailResult.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send reset email' 
      });
    }

    console.log(`✅ Password reset OTP sent to ${email}`);

    res.json({
      success: true,
      message: 'Password reset OTP sent to your email'
    });

  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================================
// 6️⃣ VERIFY RESET OTP + SET NEW PASSWORD
// ========================================
/**
 * POST /auth/reset-password
 * Body: { email, otp, newPassword }
 * Response: { success, message }
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, OTP, and new password required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify OTP
    const otpResult = verifyOTP(
      user.passwordResetOTP.code,
      user.passwordResetOTP.expiresAt,
      otp
    );

    if (!otpResult.valid) {
      if (otpResult.reason === 'expired') {
        return res.status(400).json({ 
          success: false, 
          message: 'OTP expired' 
        });
      }
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    user.password = hashedPassword;
    user.passwordResetOTP = {};
    await user.save();

    console.log(`✅ Password reset for user: ${user._id}`);

    res.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.'
    });

  } catch (err) {
    console.error('❌ Reset password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================================
// 7️⃣ FIREBASE LOGIN - CREATE/UPDATE USER + MARK AS VERIFIED
// ========================================
/**
 * POST /auth/firebase-login
 * Body: { uid, email, name, photoURL }
 * Response: { success, token, user }
 * Action: Creates or updates Firebase user, marks as verified automatically
 */
exports.firebaseLogin = async (req, res) => {
  try {
    console.log('🔵 Firebase login request:', req.body);
    
    const { uid, email, name, photoURL } = req.body;

    if (!uid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Firebase UID is required' 
      });
    }

    // Find user by Firebase UID or email
    let user = await User.findOne({ $or: [{ firebaseUid: uid }, { email }] });

    if (!user) {
      // New Google user - create account marked as verified
      console.log('👤 Creating new Google user...');
      user = await User.create({
        firebaseUid: uid,
        email: email || '',
        name: name || '',
        photoUrl: photoURL || '',
        isVerified: true,        // ✅ Google users are auto-verified
        emailVerified: true      // ✅ Google users have email verified
      });
      console.log(`✅ New Google user created: ${user._id}`);
    } else {
      // Existing user - update Firebase UID if missing
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
      }
      // Mark as verified if using Google
      if (!user.isVerified) {
        user.isVerified = true;
      }
      await user.save();
      console.log(`✅ Existing user updated: ${user._id}`);
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        photoUrl: user.photoUrl
      }
    });

  } catch (error) {
    console.error('❌ Firebase login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Firebase authentication'
    });
  }
};


