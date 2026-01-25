const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

/**
 * USER ROUTES - All routes require authentication
 */

// GET /api/users/profile - Get user profile
router.get('/profile', protect, userController.getProfile);

// PUT /api/users/profile - Update user profile
router.put('/profile', protect, userController.updateProfile);

// GET /api/users/business-profile - Get business profile
router.get('/business-profile', protect, userController.getBusinessProfile);

// PUT /api/users/business-profile - Update business profile
router.put('/business-profile', protect, userController.updateBusinessProfile);

module.exports = router;
