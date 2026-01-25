// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';

import {
  auth,
  googleProvider,
} from '../config/firebase'; // ✅ Correct import path

import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);        // backend user
  const [firebaseUser, setFirebaseUser] = useState(null); // firebase user
  const [loading, setLoading] = useState(true);
  const hasSynced = useRef(false); // Track if we've synced to avoid double-syncing

  // 🔁 Listen to Firebase auth state + Initialize from localStorage
  useEffect(() => {
    let hasStoredUser = false;
    
    // STEP 1: Check localStorage
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      console.log('📦 Restoring user from localStorage');
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        hasStoredUser = true;
        setLoading(false); // ✅ Set loading false immediately - user can see dashboard
        console.log('✅ User restored:', parsedUser.email);
      } catch (err) {
        console.error('❌ Failed to parse stored user:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    // Listen for storage changes (when Settings updates localStorage)
    const handleStorageChange = (e) => {
      if (e.key === 'user' && e.newValue) {
        try {
          const updatedUser = JSON.parse(e.newValue);
          console.log('🔄 User data updated via storage event:', updatedUser.name);
          setUser(updatedUser);
        } catch (err) {
          console.error('❌ Failed to parse updated user:', err);
        }
      } else if (e.key === 'token' && !e.newValue) {
        // Token was cleared (logout)
        console.log('🚪 Token cleared via storage event');
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // STEP 2: Set up auth listener (Firebase sync happens in background)
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log('🔔 Auth state changed:', fbUser?.email, 'hasSynced:', hasSynced.current, 'hasStoredUser:', hasStoredUser);
      
      if (fbUser) {
        setFirebaseUser(fbUser);
        // Only sync if we haven't already synced this session
        if (!hasSynced.current) {
          console.log('🔄 Auth listener syncing with backend');
          hasSynced.current = true;
          const syncSuccess = await syncWithBackend(fbUser);
          if (!syncSuccess) {
            console.error('❌ Sync failed, but keeping user logged in');
            hasSynced.current = false; // Reset to retry
          }
          setLoading(false); // ✅ Set loading false after sync completes
        } else {
          console.log('✅ Already synced this session, skipping listener sync');
        }
      } else if (!hasStoredUser) {
        // Only clear user if Firebase logout AND we don't have a stored user
        console.log('🚪 User logged out from Firebase and no stored user');
        setFirebaseUser(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        hasSynced.current = false; // Reset on logout
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 🔗 Sync Firebase → Backend
  const syncWithBackend = async (fbUser, isFirstLogin = false) => {
    try {
      console.log('🔄 Syncing with backend...');
      const idToken = await fbUser.getIdToken();
      
      console.log('📤 Sending to /auth/firebase-login:', {
        email: fbUser.email,
        name: fbUser.displayName || '',
        uid: fbUser.uid,
        isFirstLogin
      });
      
      const { data } = await api.post('/auth/firebase-login', { 
        firebaseToken: idToken,
        email: fbUser.email,
        name: fbUser.displayName || '',
        uid: fbUser.uid,
        isFirstLogin: isFirstLogin,
        photoURL: fbUser.photoURL || ''
      });

      console.log('📥 Backend response:', data);
      
      if (!data.success || !data.user || !data.token) {
        console.error('❌ Invalid response from backend:', data);
        // Still save minimal data to allow graceful fallback
        const minimalUser = {
          id: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || '',
          photoURL: fbUser.photoURL || '',
          isVerified: true  // ✅ Google users are always verified
        };
        const token = data.token || 'firebase-' + fbUser.uid;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(minimalUser));
        setUser(minimalUser);
        console.log('⚠️ Using fallback user object');
        return true;
      }

      console.log('✅ Backend sync successful, user:', data.user);
      // Ensure isVerified is included (default to true if missing)
      const userToSave = {
        ...data.user,
        isVerified: data.user.isVerified !== undefined ? data.user.isVerified : true
      };
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userToSave));
      console.log('📦 Saved to localStorage - token:', !!localStorage.getItem('token'), 'user:', !!localStorage.getItem('user'));
      setUser(userToSave);
      console.log('📝 Called setUser with:', userToSave);
      return true;
    } catch (err) {
      console.error('❌ Backend sync failed:', err.response?.data || err.message);
      console.error('📍 Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      // Don't logout here, let the auth state handle it
      return false;
    }
  };

  // 📧 Email / Password Signup
  const signup = async (email, password) => {
    try {
      // Clear any existing sessions first to allow reusing emails
      await clearExistingSessions();
      
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(res.user);

      return {
        success: true,
        message: 'Account created. Check your email to verify.',
      };
    } catch (error) {
      return { success: false, message: getErrorMessage(error.code) };
    }
  };

  // 📧 Email / Password Login
  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting email/password login with backend...');
      
      // Try direct backend login first (for email/password users)
      try {
        const backendRes = await api.post('/auth/login', { email, password });
        console.log('✅ Backend login successful:', backendRes.data.user);
        
        if (backendRes.data.success && backendRes.data.token && backendRes.data.user) {
          localStorage.setItem('token', backendRes.data.token);
          localStorage.setItem('user', JSON.stringify(backendRes.data.user));
          setUser(backendRes.data.user);
          
          // Also sign into Firebase if available
          try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log('✅ Firebase sync successful');
            setFirebaseUser(auth.currentUser);
          } catch (fbErr) {
            console.warn('⚠️ Firebase sync failed (non-critical):', fbErr.message);
          }
          
          return { success: true };
        }
      } catch (backendErr) {
        console.log('ℹ️ Backend login failed, trying Firebase only:', backendErr.response?.data?.message);
      }
      
      // Fallback: Firebase email login
      const res = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase login successful, user:', res.user.email);

      if (!res.user.emailVerified) {
        console.log('❌ Email not verified');
        await logout();
        return {
          success: false,
          message: 'Please verify your email before logging in.',
        };
      }

      console.log('✅ Email verified, syncing with backend...');
      // Sync with backend after successful Firebase login
      const syncSuccess = await syncWithBackend(res.user);
      console.log('✅ Backend sync complete:', syncSuccess);
      
      if (syncSuccess) {
        return { success: true };
      } else {
        return { success: false, message: 'Failed to sync with backend' };
      }
    } catch (error) {
      console.error('❌ Login error:', error.code, error.message);
      return { success: false, message: getErrorMessage(error.code) };
    }
  };

  // 🔵 Google Login
  const loginWithGoogle = async () => {
    try {
      console.log('🔵 Attempting Google login...');
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ Google login successful');
      
      // Check if this is first-time login
      const isFirstLogin = result.additionalUserInfo?.isNewUser;
      console.log('First time user:', isFirstLogin);
      
      // Sync with backend after successful Google login
      await syncWithBackend(result.user, isFirstLogin);
      console.log('✅ Backend sync complete');
      
      return { 
        success: true,
        isFirstLogin,
        user: result.user
      };
    } catch (error) {
      console.error('❌ Google login error:', error.code, error.message);
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, message: 'Login popup closed' };
      }
      return { success: false, message: getErrorMessage(error.code) };
    }
  };

  // 📱 Phone OTP removed - no longer supported
  
  // 🧹 Clear Existing Sessions
  const clearExistingSessions = async () => {
    try {
      console.log('🔄 Clearing all sessions...');
      
      // 1. Sign out from Firebase - this clears Firebase's cached user
      try {
        await signOut(auth);
        console.log('✅ Firebase signed out');
      } catch (err) {
        console.error('❌ Firebase signout error (non-critical):', err.message);
      }
      
      // 2. Clear all local storage keys
      localStorage.clear();
      console.log('✅ LocalStorage cleared');
      
      // 3. Clear session storage
      sessionStorage.clear();
      console.log('✅ SessionStorage cleared');
      
      // 4. Clear IndexedDB if it exists (Firebase uses this for persistence)
      if (window.indexedDB) {
        try {
          const dbs = await indexedDB.databases();
          for (const db of dbs) {
            indexedDB.deleteDatabase(db.name);
          }
          console.log('✅ IndexedDB cleared');
        } catch (err) {
          console.error('⚠️ IndexedDB clear error (non-critical):', err.message);
        }
      }
      
      // 5. Reset application state
      setUser(null);
      setFirebaseUser(null);
      
      console.log('✅ All sessions cleared successfully');
      return true;
    } catch (error) {
      console.error('❌ Error clearing sessions:', error);
      // Still clear state even if there were errors
      setUser(null);
      setFirebaseUser(null);
      return false;
    }
  };

  // 📧 Resend Email Verification
  const resendEmailVerification = async () => {
    try {
      if (!firebaseUser) {
        return { success: false, message: 'No user found' };
      }
      await sendEmailVerification(firebaseUser);
      return {
        success: true,
        message: 'Verification email sent. Check your inbox.',
      };
    } catch (error) {
      return { success: false, message: getErrorMessage(error.code) };
    }
  };

  // 🔐 Forgot Password - Send Reset Email
  const sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Password reset email sent. Check your inbox.',
      };
    } catch (error) {
      return { success: false, message: getErrorMessage(error.code) };
    }
  };

  // 🚪 Logout
  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('token');
    setUser(null);
    setFirebaseUser(null);
  };

  // 🧠 Error helper
  const getErrorMessage = (code) => {
    const map = {
      'auth/email-already-in-use': 'Email already in use',
      'auth/invalid-email': 'Invalid email',
      'auth/weak-password': 'Password too weak',
      'auth/user-not-found': 'User not found',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many attempts',
    };
    return map[code] || 'Something went wrong';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        signup,
        login,
        loginWithGoogle,
        logout,
        resendEmailVerification,
        sendPasswordReset,
        clearExistingSessions,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
