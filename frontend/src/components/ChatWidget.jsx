import { useState, useRef, useEffect } from 'react';
import { Send, X, Minimize2, Maximize2, Zap, BrainCircuit, Plus, Paperclip, FileText, Trash2, MessageSquare } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const BUSINESS_CONTEXT = `You are InvoicePro AI, an elite, hyper-intelligent financial analyst, accountant, and business strategist built directly into the InvoicePro platform.
Your expertise includes:
- Complex financial modeling and revenue projections
- Profit margin optimization, burn rate, and cash flow analysis
- Creating actionable business growth & pricing strategies
- Explaining how to use the InvoicePro app (creating invoices, viewing analytics, sending receipts)
- Answering support-related questions about the InvoicePro platform
- Factoring in contextual knowledge if a user mentions an attached file

STRICT RULES:
1. ONLY answer strictly business-related, financial, strategic questions, or support questions regarding the InvoicePro app.
2. If asked about non-business topics, gently decline and state your purpose as the InvoicePro financial and support assistant.
3. ALWAYS structure complex financial answers with bold headings: **Key Insights**, **Data Breakdown**, **Projections**.
4. Support answers should be clear, step-by-step, and concise.
5. Speak with the confident, analytical, and highly structured tone of a top-tier management consultant combined with world-class customer support.`;

const DEFAULT_WELCOME = { 
  from: 'ai', 
  text: 'Welcome to InvoicePro AI. I am your dedicated financial strategist and platform guide. I can build revenue projections, optimize pricing, or help you navigate the app. What would you like to explore today?',
  isWelcome: true
};

export default function ChatWidget({ currency, isDarkMode = false }) {
  // Session structure: { id, title, messages, updatedAt }
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('invoicepro_chat_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse chat sessions', e);
    }
    return [{
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [DEFAULT_WELCOME],
      updatedAt: Date.now()
    }];
  });

  const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(true); // Default to minimized Zap icon
  const [attachments, setAttachments] = useState([]);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession.messages;

  // Persist sessions
  useEffect(() => {
    localStorage.setItem('invoicepro_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Scroll to bottom when messages change or component un-minimizes
  useEffect(() => {
    if (!minimized) {
      scrollToBottom();
    }
  }, [messages, minimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewSession = () => {
    const newSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [DEFAULT_WELCOME],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    if (!expanded) setExpanded(true); // Expand out to show sidebar naturally
  };

  const switchSession = (id) => {
    setActiveSessionId(id);
  };

  const deleteSession = (e, id) => {
    e.stopPropagation();
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (updated.length === 0) {
        // If deleted all, create a fresh one
        const fresh = {
          id: Date.now().toString(),
          title: 'New Conversation',
          messages: [DEFAULT_WELCOME],
          updatedAt: Date.now()
        };
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) {
        setActiveSessionId(updated[0].id);
      }
      return updated;
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files.map(f => ({ name: f.name, size: f.size }))]);
      toast.success(`Attached ${files.length} file(s)`);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!input.trim() && attachments.length === 0) return;

    let payloadText = input.trim();
    let displayMessageText = input.trim();

    // Contextualize attachments into prompt
    if (attachments.length > 0) {
      const fileNames = attachments.map(a => a.name).join(', ');
      payloadText = `[User attached files: ${fileNames}]\n\n` + payloadText;
      if (!displayMessageText) {
        displayMessageText = `Please review my attached files: ${fileNames}`;
        payloadText = displayMessageText;
      }
    }

    const newUserMsg = { from: 'user', text: displayMessageText, attachedFiles: attachments };
    
    // Optimistic update
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          // Generate an AI-like brief title if this is the first real user message
          title: s.messages.length <= 1 && displayMessageText.length > 0
               ? displayMessageText.slice(0, 25) + (displayMessageText.length > 25 ? '...' : '') 
               : s.title,
          messages: [...s.messages, newUserMsg],
          updatedAt: Date.now()
        };
      }
      return s;
    }).sort((a, b) => b.updatedAt - a.updatedAt)); // Push active to top

    setInput('');
    setAttachments([]);
    setLoading(true);

    try {
      const res = await api.post('/analytics/chat', { 
        message: payloadText, 
        currency,
        context: BUSINESS_CONTEXT
      });

      const replyText = res.data?.reply || 'Analyzed successfully.';
      const isStructured = res.data?.isStructured || false;

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, { from: 'ai', text: replyText, isStructured }],
            updatedAt: Date.now()
          };
        }
        return s;
      }));
    } catch (err) {
      console.error('Chat error', err);
      const errorMsg = err.response?.data?.message || 'Failed to process your request. Please try again.';
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, { from: 'ai', text: errorMsg, isError: true }],
            updatedAt: Date.now()
          };
        }
        return s;
      }));
    } finally {
      setLoading(false);
    }
  };

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className={`fixed bottom-6 right-6 rounded-full p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-xl transition-all z-50 flex items-center gap-3 ${
          isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-brand-emerald hover:bg-emerald-700'
        } text-white hover:scale-105 active:scale-95 duration-200 cursor-pointer`}
        title="Open InvoicePro AI"
      >
        <BrainCircuit className="w-6 h-6 animate-pulse" />
        <span className="font-bold tracking-wide pr-2">Ask AI</span>
      </button>
    );
  }

  // Calculate layout classes based on state
  // Expanded gives the ChatGPT style two-column layout
  const widgetClasses = expanded 
    ? 'fixed inset-4 md:inset-auto md:bottom-6 md:right-6 md:w-[850px] md:h-[650px] max-h-[90vh]'
    : 'fixed bottom-6 right-6 w-[400px] h-[600px] max-h-[85vh]';

  return (
    <div className={`${widgetClasses} rounded-2xl shadow-2xl border overflow-hidden flex z-50 transition-all duration-300 ease-in-out ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      
      {/* Left Sidebar (Only visible when Expanded) */}
      {expanded && (
        <div className={`w-64 flex-shrink-0 border-r flex flex-col ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="p-4 border-b dark:border-gray-700">
            <button 
              onClick={createNewSession}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition ${
                isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600' : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 shadow-sm'
              }`}
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <p className={`text-xs font-bold uppercase tracking-wider px-2 pt-2 pb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Recent Chats</p>
            {sessions.map(s => (
              <div 
                key={s.id}
                onClick={() => switchSession(s.id)}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                  activeSessionId === s.id 
                    ? isDarkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-brand-emerald/10 text-brand-emerald'
                    : isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{s.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteSession(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition"
                  title="Delete Session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Right Main Chat Area */}
      <div className="flex-1 flex flex-col bg-transparent">
        {/* Header */}
        <div className={`p-4 flex items-center justify-between border-b blur-backdrop ${
          isDarkMode ? 'bg-gray-800/90 border-gray-700 text-white' : 'bg-white/90 border-gray-200 text-gray-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-1.5 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-brand-emerald/10 text-brand-emerald'}`}>
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">InvoicePro AI</h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{expanded ? 'Professional Workspace' : 'Assistant'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className={`p-2 rounded-lg transition ${isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
              title={expanded ? "Standard View" : "ChatGPT View"}
            >
              {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMinimized(true)}
              className={`p-2 rounded-lg transition ${isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {/* AI Avatar */}
              {m.from === 'ai' && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                  isDarkMode ? 'bg-indigo-600' : 'bg-brand-emerald'
                }`}>
                  <BrainCircuit className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`flex flex-col ${m.from === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                
                {/* User Content */}
                {m.from === 'user' ? (
                  <>
                    {/* Render Attached Files if any in history */}
                    {m.attachedFiles && m.attachedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2 justify-end">
                        {m.attachedFiles.map((file, fIdx) => (
                          <div key={fIdx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
                            <FileText className="w-3 h-3 text-blue-500" />
                            {file.name}
                          </div>
                        ))}
                      </div>
                    )}
                    {m.text && (
                      <div className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                        isDarkMode ? 'bg-gray-700 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tr-sm'
                      }`}>
                        {m.text}
                      </div>
                    )}
                  </>
                ) : (
                  /* AI Content */
                  <div className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                    isDarkMode ? 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                  } ${m.isError ? 'border border-red-500/50' : ''}`}>
                    {m.isWelcome && (
                      <div className={`text-xs font-bold tracking-wider uppercase mb-2 ${isDarkMode ? 'text-indigo-400' : 'text-brand-emerald'}`}>
                        INVOICEPRO AI
                      </div>
                    )}
                    {/* Parse Markdown-like bold formatting for structured responses */}
                    <div className="space-y-3 whitespace-pre-wrap">
                      {m.text.split('**').map((part, pIdx) => 
                        pIdx % 2 === 1 ? <strong key={pIdx} className={isDarkMode ? 'text-white' : 'text-gray-900'}>{part}</strong> : <span key={pIdx}>{part}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start gap-4">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isDarkMode ? 'bg-indigo-600' : 'bg-brand-emerald'}`}>
                  <BrainCircuit className="w-4 h-4 text-white" />
                </div>
              <div className={`px-4 py-4 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-tl-sm flex items-center gap-3`}>
                <div className="flex gap-1.5">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-indigo-400' : 'bg-emerald-500'}`}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-indigo-400' : 'bg-emerald-500'}`} style={{ animationDelay: '0.15s' }}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-indigo-400' : 'bg-emerald-500'}`} style={{ animationDelay: '0.3s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* Input Area */}
        <div className={`p-4 bg-transparent`}>
          <div className="max-w-4xl mx-auto flex gap-3 items-end">
            
            <div className={`flex-1 flex flex-col rounded-2xl border shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-brand-emerald/50 transition duration-200 ${
              isDarkMode ? 'bg-gray-700 border-gray-600 focus-within:border-gray-500' : 'bg-white border-gray-300 focus-within:border-gray-400'
            }`}>
              
              {/* Attachment Preview rendering */}
              {attachments.length > 0 && (
                <div className={`px-4 pt-3 flex flex-wrap gap-2 ${isDarkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
                  {attachments.map((file, idx) => (
                    <div key={idx} className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg border text-sm font-medium ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-800'} shadow-sm`}>
                      <FileText className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-emerald-500'}`} />
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button 
                        onClick={() => removeAttachment(idx)}
                        className={`p-1 rounded-full opacity-60 hover:opacity-100 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end px-2 py-2">
                {/* Hidden File Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  onChange={handleFileSelect}
                  accept=".pdf,.csv,.xlsx,.docx,.txt"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2.5 rounded-full transition mb-0.5 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                  title="Attach File (PDF, CSV, etc.)"
                  type="button"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <textarea
                  className={`flex-1 px-3 py-2.5 max-h-48 resize-none bg-transparent focus:outline-none leading-relaxed ${
                    isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                  }`}
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter' && !e.shiftKey) { 
                      e.preventDefault(); 
                      sendMessage(); 
                    } 
                  }}
                  placeholder="Analyze revenue, optimize pricing, or attach files..."
                  disabled={loading}
                />
              </div>
            </div>

            <button
              onClick={sendMessage}
              disabled={loading || (!input.trim() && attachments.length === 0)}
              className={`p-4 rounded-xl shadow-md transition flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-brand-emerald hover:bg-emerald-700 text-white'
              }`}
              title="Send Message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center mt-3">
             <p className={`text-[11px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>InvoicePro AI can make mistakes. Consider verifying important financial metrics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
