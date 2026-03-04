import { useState, useRef, useEffect } from 'react';
import { Send, X, Minimize2, Maximize2, Zap } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const BUSINESS_CONTEXT = `You are an advanced business forecasting AI assistant. Your expertise includes:
- Financial analysis and revenue projections
- Profit forecasting and margin analysis
- Business growth strategy
- Cost optimization and expense breakdown
- KPI analysis and business metrics
- Investment recommendations (business-related)
- Market positioning strategies

STRICT RULES:
1. ONLY answer business-related questions
2. Use structured responses with: Assumptions, Calculations, Projection, Risk Analysis, Recommendation
3. For incomplete data, ask clarifying questions about: industry, monthly revenue, expenses, growth rate, customer base, etc.
4. Provide detailed calculations and show your work
5. Use professional, analytical tone - never casual or playful
6. If a user asks unrelated questions, respond: "I'm designed specifically for business forecasting and analysis. Please ask a business-related question."
7. Break down complex numbers clearly
8. Provide year-on-year growth projections
9. Include risk assessment in projections`;

export default function ChatWidget({ currency, isDarkMode = false }) {
  const [messages, setMessages] = useState([
    { 
      from: 'ai', 
      text: 'Welcome to BusinessForecast AI. I specialize in revenue projections, financial analysis, and strategic business planning. Ask me about growth forecasts, profitability analysis, expense optimization, or any business metrics. How can I assist you today?',
      isWelcome: true
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { from: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/analytics/chat', { 
        message: userMsg, 
        currency,
        context: BUSINESS_CONTEXT
      });

      if (res.data?.success && res.data?.reply) {
        setMessages(prev => [...prev, { 
          from: 'ai', 
          text: res.data.reply,
          isStructured: res.data.isStructured || false
        }]);
      } else if (res.data?.reply) {
        setMessages(prev => [...prev, { from: 'ai', text: res.data.reply }]);
      } else {
        throw new Error(res.data?.message || 'No response');
      }
    } catch (err) {
      console.error('Chat error', err);
      const errorMsg = err.response?.data?.message || 'Failed to process your request. Please try again.';
      setMessages(prev => [...prev, { 
        from: 'ai', 
        text: errorMsg,
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className={`fixed bottom-6 right-6 rounded-full p-4 shadow-lg hover:shadow-xl transition-all z-40 ${
          isDarkMode ? 'bg-brand-emerald hover:bg-emerald-700' : 'bg-brand-emerald hover:bg-emerald-700'
        } text-white`}
        title="Open conversation"
      >
        <Zap className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 w-96 max-h-[600px] rounded-2xl shadow-2xl border overflow-hidden flex flex-col z-40 transition-all ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    } ${expanded ? 'max-w-2xl max-h-[80vh]' : ''}`}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-emerald to-emerald-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          <h3 className="font-bold text-base">BusinessForecast AI</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-white/20 rounded transition"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMinimized(true)}
            className="p-1 hover:bg-white/20 rounded transition"
            title="Minimize"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-transparent">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-4 py-3 rounded-lg text-sm leading-relaxed ${
                m.from === 'user'
                  ? 'bg-brand-emerald text-white'
                  : isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-900'
              } ${
                m.isError ? (isDarkMode ? 'border border-red-500/30' : 'border border-red-300') : ''
              }`}
            >
              {m.isWelcome && (
                <div className={`text-xs font-semibold tracking-wider uppercase mb-2 opacity-75`}>
                  Welcome
                </div>
              )}
              <div className={`whitespace-pre-wrap ${m.isStructured ? 'space-y-2' : ''}`}>
                {m.text}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className={`px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
              <div className="flex gap-2 items-center">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-xs mt-2 opacity-75">Analyzing...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Help Text */}
      <div className={`px-4 py-2 border-t text-xs ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
        Try: "If my monthly revenue is $5,000 and grows 10% per month, what will I make in 1 year?"
      </div>

      {/* Input Area */}
      <div className={`p-3 border-t flex gap-2 ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
        <input
          className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald transition ${
            isDarkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Ask about forecasts, margins, growth..."
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-brand-emerald text-white rounded-lg disabled:opacity-50 hover:bg-emerald-700 transition flex items-center gap-2 font-medium"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

