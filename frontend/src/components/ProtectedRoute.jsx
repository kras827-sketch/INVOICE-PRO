import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // If still loading (Firebase initializing), show spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="modern-spinner spinner-lg spinner-glow"></div>
      </div>
    );
  }

  // ✅ Priority 1: Check context user (after loading completes)
  if (user) {
    console.log('✅ User from context:', user.email, 'isVerified:', user.isVerified);
    
    // Check if user needs email verification
    if (user.isVerified === false) {
      console.log('⚠️ User not verified, redirecting to OTP');
      return <Navigate to="/verify-otp" state={{ email: user.email }} replace />;
    }
    
    // User is verified or verification not required
    return children;
  }

  // ✅ Priority 2: Check localStorage (fallback for page refreshes) - BROWSER ONLY
  if (typeof window === 'undefined') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="modern-spinner spinner-lg spinner-glow"></div>
      </div>
    );
  }

  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');
  
  if (storedUser && storedToken) {
    try {
      const userData = JSON.parse(storedUser);
      console.log('✅ Using user from localStorage:', userData.email, 'isVerified:', userData.isVerified);
      
      // Check if user explicitly requires verification
      if (userData.isVerified === false) {
        console.log('⚠️ Stored user not verified, redirecting to OTP');
        return <Navigate to="/verify-otp" state={{ email: userData.email }} replace />;
      }
      
      // User is verified or no verification status (Google/verified users)
      return children;
    } catch (err) {
      console.error('❌ Failed to parse stored user:', err);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }
  
  // ❌ No user found at all - redirect to login
  console.log('❌ No user found in context or localStorage, redirecting to login');
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;