import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThankYouPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  
  const { 
    title = "Thank You!",
    subTitle = "Your invoice has been successfully processed.",
    message = "You can now view all your invoices and analytics on the dashboard."
  } = location.state || {};

  const handleDone = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-blue-50 to-indigo-100'} flex items-center justify-center px-4 py-8`}>
      <div className={`text-center max-w-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-12`}>
        
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className={`p-6 ${isDarkMode ? 'bg-green-900 bg-opacity-30' : 'bg-green-100'} rounded-full`}>
            <CheckCircle className="w-24 h-24 text-green-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* Main Message */}
        <h1 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h1>

        {/* Subheading */}
        <p className={`text-lg mb-8 font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          {subTitle}
        </p>

        {/* Description */}
        <p className={`text-sm mb-12 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {message}
        </p>

        {/* Features List */}
        <div className="mb-12 space-y-3 text-left">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              PDF saved successfully
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              Email sent to recipient
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              Invoice ready for tracking
            </span>
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={handleDone}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg hover:shadow-xl"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Footer Text */}
        <p className={`text-xs mt-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          All invoices are automatically tracked and saved to your account
        </p>
      </div>
    </div>
  );
}
