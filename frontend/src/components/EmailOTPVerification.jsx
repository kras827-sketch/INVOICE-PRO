import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

/**
 * EmailOTPVerification Component
 * Used after signup to verify email address before dashboard access
 */
const EmailOTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  // Get email from location state or localStorage
  useEffect(() => {
    const signupEmail = location.state?.email || localStorage.getItem('signupEmail');
    
    if (signupEmail) {
      setEmail(signupEmail);
    } else {
      // Redirect to signup if no email
      navigate('/signup');
    }
  }, [navigate, location]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP input - only digits, max 6
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  // Verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.length !== 6) {
      setError('Please enter all 6 digits of your OTP');
      return;
    }

    if (!email) {
      setError('Email not found. Please sign up again.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Verifying email OTP for:', email);
      const response = await api.post('/auth/verify-otp', {
        email,
        otp
      });

      if (response.data.success) {
        console.log('✅ Email verified successfully');
        setSuccess('✅ Account verified! Redirecting to dashboard...');

        // Save token and user to localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.removeItem('signupEmail');

        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      } else {
        setError('❌ ' + (response.data.message || 'Verification failed'));
      }
    } catch (err) {
      console.error('❌ Email OTP verification error:', err);
      const errorMessage = err.response?.data?.message;
      
      if (errorMessage === 'OTP expired') {
        setError('⏱️ OTP expired. Please click "Resend OTP" to get a new code.');
      } 
      else if (errorMessage === 'Invalid OTP') {
        setError('❌ Invalid OTP. Please check and try again.');
      } 
      else if (errorMessage) {
        setError('❌ ' + errorMessage);
      }
      else if (!err.response) {
        console.error('Network error:', err.message);
        setError('❌ Unable to connect. Please check your internet and try again.');
      }
      else if (err.response?.status === 404) {
        console.error('404 Error - Verification service unavailable');
        setError('❌ Verification service unavailable. Please try again shortly.');
      }
      else if (err.response?.status >= 500) {
        console.error('Server error:', err.response?.status);
        setError('❌ Our servers are experiencing issues. Please try again shortly.');
      }
      else {
        setError('❌ Verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      console.log('📧 Resending OTP to:', email);
      const response = await api.post('/auth/resend-otp', { email });

      if (response.data.success) {
        setSuccess('✅ New OTP sent to your email');
        setOtp(''); // Clear input
        setTimeLeft(300); // Reset timer
        setCanResend(false);
      } else {
        setError('❌ Failed to resend OTP: ' + response.data.message);
      }
    } catch (err) {
      console.error('❌ Resend OTP error:', err);
      
      if (err.response?.data?.message) {
        setError('❌ ' + err.response.data.message);
      }
      else if (!err.response) {
        console.error('Network error:', err.message);
        setError('❌ Unable to send OTP. Please check your internet and try again.');
      }
      else if (err.response?.status === 404) {
        console.error('404 Error - Resend OTP service unavailable');
        setError('❌ OTP service unavailable. Please try again shortly.');
      }
      else if (err.response?.status >= 500) {
        console.error('Server error:', err.response?.status);
        setError('❌ Our servers are experiencing issues. Please try again shortly.');
      }
      else {
        setError('❌ Failed to resend OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-md p-8 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-4">
            <Lock className={`w-6 h-6 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`} />
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Verify Your Email
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            We sent a 6-digit code to <span className="font-medium">{email}</span>
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 dark:text-green-300 text-sm">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          {/* OTP Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Enter OTP Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              placeholder="000000"
              value={otp}
              onChange={handleOtpChange}
              disabled={isLoading}
              className={`w-full px-4 py-3 border-2 rounded-lg text-center text-lg font-mono tracking-widest transition
                ${isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none'
                }
                ${!isLoading && otp.length === 6 ? 'border-green-500' : ''}
              `}
              autoFocus
            />
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Enter the 6-digit code from your email
            </p>
          </div>

          {/* Timer */}
          <div className="text-center">
            <p className={`text-sm ${
              timeLeft < 60 ? 'text-red-600 dark:text-red-400' : isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Code expires in: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </p>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={isLoading || !otp || otp.length !== 6}
            className={`w-full py-3 rounded-lg font-medium transition
              ${isLoading || !otp || otp.length !== 6
                ? isDarkMode 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }
            `}
          >
            {isLoading ? '⏳ Verifying...' : '✓ Verify OTP'}
          </button>
        </form>

        {/* Resend Section */}
        <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700">
          <p className={`text-center text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Didn't receive the code?
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || isLoading}
            className={`w-full py-2 rounded-lg font-medium transition flex items-center justify-center gap-2
              ${!canResend || isLoading
                ? isDarkMode 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-emerald-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-emerald-600'
              }
            `}
          >
            <Mail className="w-4 h-4" />
            {canResend ? 'Resend OTP' : `Resend in ${formatTime(timeLeft)}`}
          </button>
        </div>

        {/* Back to Signup */}
        <button
          type="button"
          onClick={() => navigate('/signup')}
          className={`w-full mt-4 py-2 text-sm font-medium rounded-lg transition
            ${isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }
          `}
        >
          Back to Sign Up
        </button>

        {/* Privacy Notice */}
        <p className={`text-center text-xs mt-6 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          We respect your privacy. Your code is secure and will only be used for verification.
        </p>
      </div>
    </div>
  );
};

export default EmailOTPVerification;
