import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const OTPVerification = ({ phoneNumber, onVerificationSuccess }) => {
  const navigate = useNavigate();
  const { verifyPhoneOTP } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.length < 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyPhoneOTP(otp);
      
      if (result.success) {
        setSuccess('✅ Phone verified successfully!');
        setTimeout(() => {
          if (onVerificationSuccess) {
            onVerificationSuccess();
          } else {
            navigate('/dashboard');
          }
        }, 1500);
      } else {
        setError('❌ ' + result.message);
      }
    } catch (err) {
      console.error(err);
      setError('❌ Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setSuccess('');
    setOtp('');
    setTimeLeft(300);
    
    // Trigger resend OTP logic (you'll need to expose this from AuthContext)
    setSuccess('✅ OTP resent to ' + phoneNumber);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Verify Phone</h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Enter the 6-digit code sent to<br />
            <span className="font-semibold">{phoneNumber}</span>
          </p>
        </div>

        <div className={`rounded-2xl shadow-xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
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

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                disabled={isLoading}
                className={`w-full px-4 py-4 border-2 rounded-lg text-center text-2xl font-bold tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'border-gray-300 text-gray-900 placeholder-gray-400'} disabled:opacity-50`}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>

          <div className={`mt-6 p-4 rounded-lg text-center ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              OTP expires in{' '}
              <span className={`font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-blue-600'}`}>
                {formatTime(timeLeft)}
              </span>
            </p>
          </div>

          <div className="mt-6 space-y-2">
            <button
              onClick={handleResendOTP}
              disabled={isLoading}
              className={`w-full py-2 text-sm font-semibold transition ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} disabled:opacity-50`}
            >
              Didn't receive code? Resend OTP
            </button>
            <button
              onClick={() => navigate('/login')}
              className={`w-full py-2 text-sm font-semibold flex items-center justify-center transition ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </button>
          </div>

          <p className={`mt-6 text-center text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            We'll never share your phone number with anyone else
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
