import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { CheckCircle, ArrowRight, Check } from 'lucide-react';
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

  const handleDone = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0B1120] bg-[url(https://www.transparenttextures.com/patterns/stardust.png)]' : 'bg-[#f4f4f5] bg-[url(https://www.transparenttextures.com/patterns/stardust.png)]'} flex items-center justify-center px-4 py-8 relative overflow-hidden`}>
      {/* Background Ambient Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 pointer-events-none ${isDarkMode ? 'bg-teal-500' : 'bg-emerald-400'}`}></div>

      <div className={`text-center w-full max-w-lg ${isDarkMode ? 'bg-[#1e293b]/70 border-white/10' : 'bg-white/80 border-white/50'} backdrop-blur-3xl border rounded-[2rem] shadow-2xl p-10 sm:p-14 relative z-10 transition-all duration-500`}>
        
        {/* Animated Success Icon container */}
        <div className="flex justify-center mb-10 relative">
          <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 animate-pulse ${isDarkMode ? 'bg-teal-500' : 'bg-emerald-500'}`}></div>
          <div className={`relative flex items-center justify-center w-28 h-28 rounded-full shadow-inner ${isDarkMode ? 'bg-gradient-to-br from-teal-400/20 to-emerald-600/20 border-teal-500/30' : 'bg-gradient-to-br from-emerald-100 to-teal-50 border-emerald-200'} border-2`}>
            <CheckCircle className={`w-14 h-14 ${isDarkMode ? 'text-teal-400' : 'text-emerald-500'}`} strokeWidth={2} />
          </div>
        </div>

        {/* Text Area */}
        <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Receipt Sent!
        </h1>
        <p className={`text-lg font-medium tracking-wide mb-4 ${isDarkMode ? 'text-teal-400' : 'text-emerald-600'}`}>
          Your client has been successfully notified.
        </p>
        <p className={`text-sm sm:text-base leading-relaxed mb-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          The payment receipt has been generated, mailed to the client, and saved securely to your records.
        </p>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left">
          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'} transition flex gap-3 items-center group`}>
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-slate-700/50 text-teal-400 group-hover:bg-slate-700' : 'bg-white text-emerald-500 shadow-sm'}`}>
              <Check className="w-5 h-5" />
            </div>
            <span className={`text-sm font-semibold tracking-wide ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Saved Securely
            </span>
          </div>
          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'} transition flex gap-3 items-center group`}>
             <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-slate-700/50 text-teal-400 group-hover:bg-slate-700' : 'bg-white text-emerald-500 shadow-sm'}`}>
              <Check className="w-5 h-5" />
            </div>
            <span className={`text-sm font-semibold tracking-wide ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Client Notified
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleDone}
          className={`w-full font-bold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 group shadow-xl hover:shadow-2xl hover:-translate-y-1 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-400 hover:to-emerald-500 shadow-teal-900/50' 
              : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-slate-900/20'
          }`}
        >
          Return to Dashboard
          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
}
