// backend/middleware/authMiddleware.js
// Authentication middleware

const jwt = require('jsonwebtoken');
const User = require('../models/User');
let admin;

// Try to load Firebase admin (may not be initialized yet)
try {
  admin = require('../config/firebase');
} catch (error) {
  console.warn('⚠️ Firebase not available in authMiddleware');
  admin = null;
}

/**
 * Protect Route Middleware
 * Verifies JWT token (backend) OR Firebase ID token
 */
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        // Extract token
        token = req.headers.authorization.split(' ')[1];
        console.log('🔐 Token received, attempting verification...');
        
        let decoded;
        let userId;
        let authMethod = 'unknown';

        // First, try to verify as Firebase token (if Firebase is available)
        if (admin) {
          try {
            console.log('🔄 Trying Firebase token verification...');
            decoded = await admin.auth().verifyIdToken(token);
            console.log('✅ Firebase token verified for user:', decoded.email);
            userId = decoded.uid;
            authMethod = 'Firebase';
          } catch (firebaseError) {
            console.log('ℹ️ Firebase verification failed:', firebaseError.message.split('\n')[0]);
            decoded = null;
          }
        } else {
          console.log('ℹ️ Firebase not available, skipping Firebase token verification');
        }

        // If Firebase fails, try backend JWT
        if (!decoded) {
          try {
            console.log('🔄 Trying backend JWT verification...');
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ Backend JWT verified');
            userId = decoded.id;
            authMethod = 'JWT';
          } catch (jwtError) {
            console.error('❌ JWT verification failed:', jwtError.message);
            return res.status(401).json({
              success: false,
              message: 'Invalid or expired token'
            });
          }
        }
        
        if (!userId) {
          console.error('❌ No user ID extracted from token');
          return res.status(401).json({
            success: false,
            message: 'Invalid token format'
          });
        }

        // Find user in database
        // For Firebase tokens, search by firebaseUid
        let query = authMethod === 'Firebase' ? { firebaseUid: userId } : { _id: userId };
        req.user = await User.findOne(query).select('-password');
        
        if (!req.user) {
          console.log('⚠️ User not found in database:', userId);
          // For Firebase tokens, create user if doesn't exist
          if (authMethod === 'Firebase' && decoded.email) {
            console.log('📝 Creating new user from Firebase token...');
            const newUser = new User({
              email: decoded.email,
              name: decoded.name || 'User',
              firebaseUid: userId
            });
            req.user = await newUser.save();
            console.log('✅ New user created:', req.user.email);
          } else {
            return res.status(401).json({
              success: false,
              message: 'User not found'
            });
          }
        }
        
        console.log(`✅ Auth Success: User ${req.user.email} authenticated via ${authMethod}`);
        return next();
        
      } catch (error) {
        console.error('❌ Authentication error:', error.message);
        return res.status(401).json({
          success: false,
          message: 'Authentication failed: ' + error.message
        });
      }
    }
    
    // No token found
    console.log('❌ Auth Error: No token provided');
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
    
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

module.exports = { protect, generateToken };