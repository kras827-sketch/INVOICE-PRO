import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

/**
 * ForgotPassword Component - Request password reset OTP
 */
const ForgotPassword = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('email'); // 'email' or 'reset'
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('❌ Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      console.log('📧 Requesting password reset for:', email);
      const response = await api.post('/auth/forgot-password', { email });

      // Check for explicit success response
      if (response?.data?.success === true) {
        console.log('✅ Password reset request successful, transitioning to OTP entry');
        setSuccess('✅ Check your email for the password reset code');
        // Explicitly transition to reset step to allow OTP entry
        setStep('reset');
        setOtp(''); // Clear any previous OTP
        setError(''); // Clear any previous errors
      } else {
        // If response doesn't explicitly confirm success, show error
        const errorMsg = response?.data?.message || 'Request failed';
        console.warn('⚠️ Request returned non-success response:', errorMsg);
        setError('❌ ' + errorMsg);
      }
    } catch (err) {
      console.error('❌ Forgot password error:', err);
      
      // Professional error messages that don't expose technical details
      if (err.response?.data?.message) {
        setError('❌ ' + err.response.data.message);
      } else if (!err.response) {
        console.error('Network error details:', err.message);
        setError('❌ Unable to connect. Please check your internet connection and try again.');
      } else if (err.response?.status === 404) {
        console.error('404 Error - endpoint not found');
        setError('❌ Password reset service unavailable. Please try again shortly.');
      } else if (err.response?.status >= 500) {
        console.error('Server error:', err.response?.status);
        setError('❌ Our servers are experiencing issues. Please try again shortly.');
      } else {
        // For any other error, be generic to protect against information disclosure
        setError('❌ We couldn\'t process your request. Please verify your email address and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.length !== 6) {
      setError('❌ Please enter a valid 6-digit code');
      return;
    }

    if (newPassword.length < 6) {
      setError('❌ Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('❌ Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Resetting password for:', email);
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword
      });

      if (response.data.success) {
        setSuccess('✅ Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      } else {
        setError('❌ ' + (response.data.message || 'Reset failed'));
      }
    } catch (err) {
      console.error('❌ Reset password error:', err);
      const errorMessage = err.response?.data?.message;
      
      if (errorMessage === 'OTP expired') {
        setError('⏱️ Code expired. Please request a new one.');
        setStep('email');
      } 
      else if (errorMessage === 'Invalid OTP') {
        setError('❌ Invalid code. Please check and try again.');
      } 
      else if (errorMessage) {
        setError('❌ ' + errorMessage);
      }
      else if (!err.response) {
        console.error('Network error:', err.message);
        setError('❌ Unable to connect. Please check your internet and try again.');
      }
      else if (err.response?.status === 404) {
        console.error('404 Error - Password reset service unavailable');
        setError('❌ Password reset service unavailable. Please try again shortly.');
      }
      else if (err.response?.status >= 500) {
        console.error('Server error:', err.response?.status);
        setError('❌ Our servers are experiencing issues. Please try again shortly.');
      }
      else {
        setError('❌ Password reset failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-md p-8 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Lock className={`w-6 h-6 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Reset Password
          </h1>
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

        {/* Step 1: Request Reset */}
        {step === 'email' && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-3 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition
                    ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                    }
                  `}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-medium transition
                ${isLoading
                  ? isDarkMode
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
              `}
            >
              {isLoading ? '⏳ Sending...' : '📧 Send Reset Code'}
            </button>
          </form>
        )}

        {/* Step 2: Reset Password */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* OTP Code */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Reset Code (6 digits)
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
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  }
                `}
              />
            </div>

            {/* New Password */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                minLength="6"
                className={`w-full px-4 py-3 border-2 rounded-lg transition
                  ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  }
                `}
                placeholder="Min. 6 characters"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                minLength="6"
                className={`w-full px-4 py-3 border-2 rounded-lg transition
                  ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  }
                `}
                placeholder="Confirm password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !otp || otp.length !== 6 || !newPassword || !confirmPassword}
              className={`w-full py-3 rounded-lg font-medium transition
                ${isLoading || !otp || otp.length !== 6 || !newPassword || !confirmPassword
                  ? isDarkMode
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
              `}
            >
              {isLoading ? '⏳ Resetting...' : '✓ Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('email');
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
                setSuccess('');
              }}
              className={`w-full py-2 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2
                ${isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }
              `}
            >
              <ArrowLeft className="w-4 h-4" />
              Try Different Email
            </button>
          </form>
        )}

        {/* Back to Login */}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className={`w-full mt-4 py-2 text-sm font-medium rounded-lg transition
            ${isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }
          `}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
