const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * Authentication Routes
 * 
 * Signup Flow:    POST /auth/signup → OTP sent → POST /auth/verify-otp → logged in
 * Login Flow:     POST /auth/login → logged in (OTP only for signup)
 * Forgot Flow:    POST /auth/forgot-password → OTP → POST /auth/reset-password
 * Google Flow:    POST /auth/firebase-login → logged in (auto-verified)
 */

// 1️⃣ Signup - Create account + send OTP
router.post('/signup', authController.signup);

// 2️⃣ Verify OTP - Activate account
router.post('/verify-otp', authController.verifyOTP);

// 3️⃣ Resend OTP - If user didn't receive it
router.post('/resend-otp', authController.resendOTP);

// 4️⃣ Login - For verified users only
router.post('/login', authController.login);

// 5️⃣ Forgot Password - Request reset OTP
router.post('/forgot-password', authController.forgotPassword);

// 6️⃣ Reset Password - Verify OTP + set new password
router.post('/reset-password', authController.resetPassword);

// 7️⃣ Firebase Login - Google/Social sign-in (auto-verified)
router.post('/firebase-login', authController.firebaseLogin);

module.exports = router;
