import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FileText, Mail, Lock, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FcGoogle } from 'react-icons/fc';
import api from '../services/api';
import GoogleSetupModal from './GoogleSetupModal';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, login, resendEmailVerification, loginWithGoogle, sendPasswordReset } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  useEffect(() => {
    console.log('📊 Auth state:', { user: !!user, loading, hasToken: !!localStorage.getItem('token'), hasUserStorage: !!localStorage.getItem('user') });
    
    // If user state is set, redirect
    if (!loading && user) {
      console.log('✅ User found in state, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // If loading is done and we have credentials, redirect anyway
    if (!loading && localStorage.getItem('token') && localStorage.getItem('user')) {
      console.log('✅ User found in localStorage (loading complete), redirecting to dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [user, loading, navigate]);

  // Periodic check for localStorage updates (faster redirect)
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr && !user) {
        console.log('🚀 Detected token in localStorage, forcing redirect now');
        clearInterval(interval);
        navigate('/dashboard', { replace: true });
      }
    }, 300);
    
    return () => clearInterval(interval);
  }, [user, navigate]);

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
    }
  }, [location]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      console.log('🔐 Logging in with email...');
      
      // Call backend login endpoint
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        console.log('✅ Login successful');
        setSuccess('✅ Login successful! Redirecting to dashboard...');

        // Save token and user to localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      } else {
        // Handle specific errors
        if (response.data.requiresOTP) {
          setError('❌ Please verify your account first. Check your email for the OTP.');
        } else {
          setError('❌ ' + (response.data.message || 'Login failed'));
        }
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      
      // Handle 403 - Account not verified
      if (err.response?.status === 403) {
        console.log('⚠️ Account not verified, redirecting to OTP verification');
        setError('❌ Account not verified. Redirecting to OTP verification...');
        setTimeout(() => {
          navigate('/verify-otp', { 
            state: { email: formData.email },
            replace: true 
          });
        }, 1500);
        return;
      }
      
      // Handle specific backend error messages
      if (err.response?.data?.message === 'Please verify your account first') {
        setError('❌ Account not verified. Check your email for the OTP code.');
        setTimeout(() => {
          navigate('/verify-otp', { 
            state: { email: formData.email },
            replace: true 
          });
        }, 1500);
      } 
      else if (err.response?.data?.message === 'Invalid credentials' || err.response?.status === 400) {
        setError('❌ Email or password is incorrect');
      } 
      else if (err.response?.data?.message) {
        setError('❌ ' + err.response.data.message);
      }
      // Handle network errors
      else if (!err.response) {
        console.error('Network error or server unreachable:', err.message);
        setError('❌ Unable to connect to our servers. Please check your internet connection and try again.');
      }
      // Handle 404 errors
      else if (err.response?.status === 404) {
        console.error('404 Error - API endpoint not found');
        setError('❌ Login service unavailable. Please try again shortly.');
      }
      // Handle server errors
      else if (err.response?.status >= 500) {
        console.error('Server error:', err.response?.status);
        setError('❌ Our servers are experiencing issues. Please try again shortly.');
      }
      // Generic fallback
      else {
        setError('❌ Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      console.log('🔵 Starting Google login...');
      const result = await loginWithGoogle();
      console.log('🔵 Google login result:', result);
      
      if (result.success) {
        // Check if this is first-time login
        if (result.isFirstLogin) {
          console.log('👤 First-time user, showing setup modal');
          // Show setup modal
          setGoogleUser(result.user);
          setShowGoogleSetup(true);
        } else {
          console.log('✅ Existing user, redirecting to dashboard');
          // Existing user, redirect directly
          setSuccess('✅ Logged in successfully! Redirecting...');
          // Wait longer to ensure state is fully synced
          setTimeout(() => {
            console.log('📍 Navigating to dashboard');
            navigate('/dashboard', { replace: true });
          }, 2500);
        }
      } else {
        console.error('❌ Google login failed:', result.message);
        setError('❌ ' + result.message);
      }
    } catch (err) {
      console.error('❌ Google login error:', err);
      setError('❌ Google login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSetupComplete = (displayName, idToken) => {
    setShowGoogleSetup(false);
    setSuccess('✅ Profile complete! Redirecting to dashboard...');
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    const result = await resendEmailVerification();
    if (result.success) {
      setSuccess('✅ ' + result.message);
      setShowResendEmail(false);
    } else {
      setError('❌ ' + result.message);
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!forgotEmail) {
      setError('❌ Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      const result = await sendPasswordReset(forgotEmail);
      if (result.success) {
        setSuccess('✅ ' + result.message);
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotEmail('');
        }, 2000);
      } else {
        setError('❌ ' + result.message);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send reset email';
      setError('❌ ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const ForgotPasswordModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-md w-full shadow-2xl`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Reset Password</h2>
          <button onClick={() => { setShowForgotPassword(false); setError(''); setSuccess(''); }} className={isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}>
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className={`mb-4 p-4 border-2 rounded-lg flex items-start ${isDarkMode ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className={`mb-4 p-4 border-2 rounded-lg flex items-start ${isDarkMode ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700'}`}>
            <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
            <div className="relative">
              <Mail className={`absolute left-3 top-3 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className={`mt-4 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Remember your password?{' '}
          <button onClick={() => setShowForgotPassword(false)} className="text-blue-600 font-semibold hover:text-blue-700">
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
      <GoogleSetupModal 
        isOpen={showGoogleSetup} 
        firebaseUser={googleUser}
        onComplete={handleGoogleSetupComplete}
      />
      
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <FileText className="h-10 w-10 text-blue-600 mx-auto mb-2" />
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>InvoicePro</h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Sign in to your account</p>
        </div>

        <div className={`rounded-2xl shadow-xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {showForgotPassword && <ForgotPasswordModal />}

          {error && (
            <div className={`mb-4 p-4 border-2 rounded-lg flex items-start ${isDarkMode ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className={`mb-4 p-4 border-2 rounded-lg flex items-start ${isDarkMode ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700'}`}>
              <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}
          {showResendEmail && (
            <div className={`mb-4 p-4 border-2 rounded-lg ${isDarkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
              <p className={`text-sm mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>Haven't received the verification email?</p>
              <button
                onClick={handleResendEmail}
                disabled={isLoading}
                className={`text-sm font-semibold underline ${isDarkMode ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-700 hover:text-yellow-900'}`}
              >
                Resend Verification Email
              </button>
            </div>
          )}

          <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-3 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-3 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleEmailLogin}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className={`w-full py-2 text-sm font-semibold transition ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className={`w-full mt-3 border py-3 rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
              >
                <FcGoogle className="mr-2 text-2xl" />
                Continue with Google
              </button>
            </div>

          <p className={`mt-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 font-semibold hover:text-blue-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
