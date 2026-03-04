import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FcGoogle } from 'react-icons/fc';
import api from '../services/api';

/**
 * Signup Component - Email/Password Signup with OTP Verification
 * 
 * Flow:
 * 1. User enters: Name, Email, Password
 * 2. Backend creates user with isVerified=false
 * 3. Backend sends OTP to email
 * 4. User redirected to EmailOTPVerification page
 * 5. User enters OTP
 * 6. Backend verifies OTP and sets isVerified=true
 * 7. User is logged in and redirected to dashboard
 */

const Signup = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, loginWithGoogle } = useAuth();
  const { isDarkMode } = useTheme();

  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate inputs
    if (!formData.name.trim()) {
      setError('❌ Full name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('❌ Email is required');
      return;
    }

    if (formData.password.length < 6) {
      setError('❌ Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('❌ Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      console.log('📝 Creating account for:', formData.email);

      // Call backend signup endpoint
      const response = await api.post('/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        console.log('✅ Account created. OTP sent.');
        setSuccess('✅ Account created! Check your email for the OTP code.');

        // Save email to localStorage for OTP verification page
        localStorage.setItem('signupEmail', formData.email);

        // Redirect to OTP verification page
        setTimeout(() => {
          navigate('/verify-otp', { 
            state: { email: formData.email },
            replace: true 
          });
        }, 2000);
      } else {
        setError('❌ ' + (response.data.message || 'Signup failed'));
      }
    } catch (err) {
      console.error('❌ Signup error:', err);

      // Handle specific backend errors
      if (err.response?.data?.message === 'Email already registered') {
        setError('❌ This email is already registered. Redirecting to login...');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      } else if (err.response?.data?.message) {
        setError('❌ ' + err.response.data.message);
      } 
      // Handle network errors (no response from server)
      else if (!err.response) {
        console.error('Network error or server unreachable:', err.message);
        setError('❌ Unable to connect to our servers. Please check your internet connection and try again.');
      }
      // Handle 404 and other HTTP errors
      else if (err.response?.status === 404) {
        console.error('404 Error - API endpoint not found');
        setError('❌ Account creation service unavailable. Please try again shortly.');
      }
      else if (err.response?.status >= 500) {
        console.error('Server error:', err.response?.status);
        setError('❌ Our servers are experiencing issues. Please try again shortly.');
      }
      // Generic fallback
      else {
        setError('❌ Account creation failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      console.log('🔵 Starting Google signup...');
      
      // Call with safety timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Google signup took too long. Please try again.')), 20000)
      );

      const signupPromise = loginWithGoogle();
      const result = await Promise.race([signupPromise, timeoutPromise]);

      console.log('🔵 Google signup result:', result);
      
      if (result && result.success) {
        // Google users are auto-verified, redirect directly to dashboard
        setSuccess('✅ Google account linked successfully!');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      } else {
        setError('❌ ' + (result?.message || 'Google signup failed'));
      }
    } catch (err) {
      console.error('❌ Google signup error:', err);
      if (err.message.includes('popup-closed')) {
        setError('❌ Login popup was closed. Please try again.');
      } else if (err.message.includes('timeout')) {
        setError('❌ ' + err.message);
      } else {
        setError('❌ Google signup failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-gray-950' : 'bg-brand-white'}`}>
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <FileText className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>InvoicePro</h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Create your account</p>
        </div>

        {/* Card */}
        <div className={`rounded-2xl shadow-xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Error Message */}
          {error && (
            <div className={`mb-4 p-4 border-2 rounded-lg flex items-start gap-3 ${isDarkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'}`}>
              <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              <span className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className={`mb-4 p-4 border-2 rounded-lg flex items-start gap-3 ${isDarkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'}`}>
              <CheckCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              <span className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>{success}</span>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Full Name
              </label>
              <div className="relative">
                <User className={`absolute left-3 top-3 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition focus:outline-none
                    ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500'
                    }
                  `}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-3 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition focus:outline-none
                    ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500'
                    }
                  `}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-3 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  minLength="6"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition focus:outline-none
                    ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500'
                    }
                  `}
                  placeholder="Min. 6 characters"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-3 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  minLength="6"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition focus:outline-none
                    ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500'
                    }
                  `}
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-semibold transition
                ${isLoading
                  ? isDarkMode
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-brand-emerald hover:bg-emerald-700 text-white'
                    : 'bg-brand-emerald hover:bg-emerald-700 text-white'
                }
              `}
            >
              {isLoading ? '⏳ Creating account...' : '✓ Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>OR</span>
            <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition
              ${isLoading
                ? isDarkMode
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300'
              }
            `}
          >
            <FcGoogle className="w-5 h-5" />
            Continue with Google
          </button>

          {/* Login Link */}
          <p className={`text-center mt-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
