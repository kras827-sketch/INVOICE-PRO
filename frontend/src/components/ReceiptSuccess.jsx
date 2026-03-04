import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { CheckCircle, Home } from 'lucide-react';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function ReceiptSuccess() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Trigger confetti on load
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full rounded-2xl shadow-xl p-8 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        
        <h1 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Receipt Sent!
        </h1>
        
        <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          The payment receipt has been successfully generated and sent to the client.
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-medium transition"
        >
          <Home className="w-5 h-5" />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
