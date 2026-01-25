import { useState } from 'react';
import { User, AlertCircle } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';

const GoogleSetupModal = ({ isOpen, firebaseUser, onComplete }) => {
  const { isDarkMode } = useTheme();
  const [displayName, setDisplayName] = useState(firebaseUser?.displayName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!displayName.trim() || displayName.trim().length < 2) {
        setError('Please enter a valid name (at least 2 characters)');
        setIsLoading(false);
        return;
      }

      // Update Firebase user profile with display name
      await updateProfile(firebaseUser, {
        displayName: displayName.trim(),
      });

      // Get updated token with new displayName
      const idToken = await firebaseUser.getIdToken(true);
      
      // Call onComplete callback with token for backend sync
      onComplete(displayName.trim(), idToken);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-md w-full shadow-2xl`}>
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Complete Your Profile</h2>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            What should we call you on the dashboard?
          </p>
        </div>

        {error && (
          <div className={`mb-4 p-4 border-2 rounded-lg flex items-start ${isDarkMode ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Full Name
            </label>
            <div className="relative">
              <User className={`absolute left-3 top-3 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoFocus
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'border-gray-300 text-gray-900 placeholder-gray-400'} disabled:opacity-50`}
                placeholder="e.g., John Doe"
              />
            </div>
            <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              This will be displayed in your dashboard greetings and invoice headers
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Setting up...' : 'Complete Profile'}
          </button>
        </form>

        <p className={`mt-4 text-center text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          You can edit this anytime in settings
        </p>
      </div>
    </div>
  );
};

export default GoogleSetupModal;
