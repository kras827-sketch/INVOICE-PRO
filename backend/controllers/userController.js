const User = require('../models/User');

/**
 * Update user profile (firstName, lastName, phone, etc)
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware - use _id for MongoDB
    const { name, email } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email && email !== user.email) {
      // Check if email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== userId.toString()) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }
      user.email = email.toLowerCase();
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
};

/**
 * Update business profile
 */
exports.updateBusinessProfile = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware - use _id for MongoDB
    const {
      businessName,
      businessEmail,
      businessPhone,
      businessAddress,
      logoUrl,
      taxId,
      bankDetails
    } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update business profile
    if (!user.businessProfile) {
      user.businessProfile = {};
    }

    if (businessName) user.businessProfile.businessName = businessName;
    if (businessEmail) user.businessProfile.businessEmail = businessEmail;
    if (businessPhone) user.businessProfile.businessPhone = businessPhone;
    if (businessAddress) user.businessProfile.businessAddress = businessAddress;
    if (logoUrl) user.businessProfile.logoUrl = logoUrl;
    if (taxId) user.businessProfile.taxId = taxId;
    if (bankDetails) {
      user.businessProfile.bankDetails = {
        accountName: bankDetails.accountName || '',
        accountNumber: bankDetails.accountNumber || '',
        bankName: bankDetails.bankName || ''
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Business profile updated successfully',
      businessProfile: user.businessProfile
    });
  } catch (error) {
    console.error('Error updating business profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update business profile'
    });
  }
};

/**
 * Get user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware - use _id for MongoDB

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile'
    });
  }
};

/**
 * Get business profile
 */
exports.getBusinessProfile = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware - use _id for MongoDB

    const user = await User.findById(userId).select('businessProfile');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      businessProfile: user.businessProfile || {}
    });
  } catch (error) {
    console.error('Error fetching business profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch business profile'
    });
  }
};
