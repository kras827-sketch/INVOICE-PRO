import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, FileText, Zap, Shield, Download, Mail, Users, CheckCircle, ArrowRight, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-950' : 'bg-white'}`}>
       {/* Navigation */}
      <nav className={`fixed w-full ${isDarkMode ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-md shadow-sm z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-brand-emerald" />
              <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-brand-navy'}`}>
                InvoicePro
              </span>
            </div>
           
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`${isDarkMode ? 'text-gray-300 hover:text-brand-emerald' : 'text-gray-700 hover:text-brand-emerald'} transition`}>Features</a>
              <a href="#how-it-works" className={`${isDarkMode ? 'text-gray-300 hover:text-brand-emerald' : 'text-gray-700 hover:text-brand-emerald'} transition`}>How It Works</a>
              <a href="#pricing" className={`${isDarkMode ? 'text-gray-300 hover:text-brand-emerald' : 'text-gray-700 hover:text-brand-emerald'} transition`}>Pricing</a>
              <button onClick={() => navigate('/login')} className={`${isDarkMode ? 'text-gray-300 hover:text-brand-emerald' : 'text-gray-700 hover:text-brand-emerald'} transition`}>
                Login
              </button>
              <button onClick={toggleTheme} className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button 
                onClick={() => navigate('/signup')} 
                className="bg-brand-emerald text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition shadow-lg hover:shadow-xl"
              >
                Sign Up Free
              </button>
            </div>

            {/* Mobile Menu Button & Theme Toggle */}
            <div className="md:hidden flex items-center space-x-2">
              <button onClick={toggleTheme} className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className={`md:hidden pb-4 border-t ${isDarkMode ? 'border-gray-800 bg-gray-900/90' : 'border-gray-200 bg-white/90'}`}>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className={`block py-2 px-4 ${isDarkMode ? 'text-gray-300 hover:text-brand-emerald' : 'text-gray-700 hover:text-brand-emerald'} transition`}>Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className={`block py-2 px-4 ${isDarkMode ? 'text-gray-300 hover:text-brand-emerald' : 'text-gray-700 hover:text-brand-emerald'} transition`}>How It Works</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className={`block py-2 px-4 ${isDarkMode ? 'text-gray-300 hover:text-brand-emerald' : 'text-gray-700 hover:text-brand-emerald'} transition`}>Pricing</a>
              <button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} className={`block w-full text-left py-2 px-4 ${isDarkMode ? 'text-gray-300 hover:text-brand-emerald' : 'text-gray-700 hover:text-brand-emerald'} transition`}>
                Login
              </button>
              <button onClick={() => { navigate('/signup'); setMobileMenuOpen(false); }} className="block w-full text-left bg-brand-emerald text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition mt-2 mx-4">
                Sign Up Free
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`pt-32 pb-20 px-4 relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-white via-blue-50 to-emerald-50'}`}>
        {/* Animated gradient orbs background */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {/* Dark mode animated orbs */}
          {isDarkMode && (
            <>
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
              <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-slate-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
            </>
          )}
          {/* Light mode subtle gradient meshes */}
          {!isDarkMode && (
            <>
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
              <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-indigo-200/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
            </>
          )}
          
          {/* Subtle grid pattern overlay */}
          <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDarkMode ? '#374151' : '#e0e7ff'} strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div>
              <h1 className={`text-5xl md:text-6xl font-bold mb-6 leading-tight ${isDarkMode ? 'text-white' : 'text-brand-navy'}`}>
                Create Professional Invoices
                <span className="block text-brand-emerald">
                  in Minutes
                </span>
              </h1>
              <p className={`text-xl mb-8 ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                Generate beautiful, professional invoices and get paid faster.
                Perfect for freelancers, agencies, and small businesses.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="bg-brand-emerald text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-700 transition shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <button
                  onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                  className={`px-8 py-4 rounded-lg text-lg font-semibold transition shadow-lg border-2 border-brand-emerald ${isDarkMode ? 'bg-gray-800 text-brand-emerald hover:bg-gray-700' : 'bg-white text-brand-emerald hover:bg-gray-50'}`}
                >
                  See How It Works
                </button>
              </div>

              {/* Trust Badges */}
              <div className={`mt-12 flex items-center space-x-6 text-sm ${isDarkMode ? 'text-gray-400' : 'text-brand-slate'}`}>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-brand-emerald mr-2" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-brand-emerald mr-2" />
                  <span>Free forever plan</span>
                </div>
              </div>
            </div>

            {/* Right Column - Professional 3D Invoice Mockup */}
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, rotateX: 45, y: 50 }}
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                transition={{ duration: 1, delay: 0.2, type: 'spring', stiffness: 80 }}
                className="relative w-full max-w-lg"
                style={{ perspective: 1200 }}
              >
                {/* Animated glow background */}
                <motion.div 
                  className={`absolute inset-0 rounded-3xl blur-3xl ${isDarkMode ? 'bg-emerald-600/15' : 'bg-emerald-400/15'}`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />

                {/* Depth layers for 3D effect */}
                <div className={`absolute -inset-1 rounded-3xl ${isDarkMode ? 'bg-brand-emerald opacity-15' : 'bg-brand-emerald opacity-20'}`} style={{ transform: 'translateZ(-20px)' }} />

                {/* Main Invoice Card */}
                <motion.div 
                  whileHover={{ rotateX: -5, rotateY: 10, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className={`relative bg-white border-0 rounded-3xl overflow-hidden ${isDarkMode ? 'shadow-2xl shadow-emerald-500/20' : 'shadow-2xl shadow-blue-500/30'}`}
                >
                  {/* Premium header */}
                  <div className="bg-brand-navy px-8 py-8 text-white relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-start">
                      <div>
                        <motion.p 
                          className="text-sm font-semibold opacity-90 mb-1"
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          PROFESSIONAL INVOICE
                        </motion.p>
                        <p className="text-3xl font-bold tracking-tight">INV-2026-001</p>
                      </div>
                      <motion.div 
                        className="px-4 py-2 bg-brand-emerald/90 text-white rounded-xl text-xs font-bold"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      >
                        PAID ✓
                      </motion.div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className={`p-8 space-y-6 ${isDarkMode ? 'text-black' : 'text-gray-700'}`}>
                    {/* Bill To Section */}
                    <div>
                      <p className={`text-xs uppercase tracking-widest font-bold mb-2 text-brand-emerald`}>Bill To</p>
                      <p className={`font-semibold text-lg ${isDarkMode ? 'text-gray-100' : 'text-brand-navy'}`}>Acme Corporation</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-brand-slate'}`}>hello@acme.com</p>
                    </div>

                    {/* Line Items with hover effect */}
                    <div className={`border-t border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} py-4 space-y-3`}>
                      <motion.div whileHover={{ x: 5 }} className="flex justify-between text-sm">
                        <span className="font-medium">Professional Services</span>
                        <span className={`font-semibold text-brand-emerald`}>₦5,000</span>
                      </motion.div>
                      <motion.div whileHover={{ x: 5 }} className="flex justify-between text-sm">
                        <span className="font-medium">Consultation (5 hrs)</span>
                        <span className={`font-semibold text-brand-emerald`}>₦2,500</span>
                      </motion.div>
                    </div>

                    {/* Total Section */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={`text-xs uppercase tracking-wider font-bold ${isDarkMode ? 'text-gray-500' : 'text-brand-slate'}`}>Total Due</p>
                      </div>
                      <div>
                        <p className={`text-4xl font-black text-brand-emerald`}>₦7,500</p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className={`text-center text-xs ${isDarkMode ? 'text-gray-500 border-gray-700' : 'text-brand-slate border-gray-200'} border-t pt-4`}>
                      <p>✓ Due: Feb 22, 2026</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-20 relative ${isDarkMode ? 'bg-gradient-to-b from-gray-900 to-gray-950' : 'bg-gradient-to-b from-white to-blue-50'}`}>
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {/* Background orbs for features section */}
          {isDarkMode && (
            <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
          )}
          {!isDarkMode && (
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
          )}
        </div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-brand-navy'}`}>
              Everything You Need to Get Paid
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-brand-slate'}`}>
              Powerful features designed for modern businesses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className={`p-8 rounded-2xl ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-emerald-50'} hover:shadow-xl transition group`}
            >
              <div className="w-14 h-14 rounded-xl bg-brand-emerald flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-brand-navy'}`}>Lightning Fast</h3>
              <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                Create and send invoices in under 60 seconds. No complex setup required.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className={`p-8 rounded-2xl ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-slate-50'} hover:shadow-xl transition group`}
            >
              <div className="w-14 h-14 rounded-xl bg-brand-navy flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Download className="h-7 w-7 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-brand-navy'}`}>PDF Generation</h3>
              <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                Professional, customizable PDF invoices with your logo and branding.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className={`p-8 rounded-2xl ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-emerald-50'} hover:shadow-xl transition group`}
            >
              <div className="w-14 h-14 rounded-xl bg-brand-emerald flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Mail className="h-7 w-7 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-brand-navy'}`}>Auto Email</h3>
              <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                Send invoices directly to clients with automatic email delivery.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className={`p-8 rounded-2xl ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-orange-50'} hover:shadow-xl transition group`}
            >
              <div className="w-14 h-14 rounded-xl bg-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-brand-navy'}`}>Secure & Safe</h3>
              <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                Bank-level encryption with secure authentication and data protection.
              </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className={`p-8 rounded-2xl ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-slate-50'} hover:shadow-xl transition group`}
            >
              <div className="w-14 h-14 rounded-xl bg-brand-slate flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-brand-navy'}`}>Client Management</h3>
              <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                Store client details and auto-fill invoice information instantly.
              </p>
            </motion.div>

            {/* Feature 6 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className={`p-8 rounded-2xl ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-emerald-50'} hover:shadow-xl transition group`}
            >
              <div className="w-14 h-14 rounded-xl bg-brand-emerald flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-brand-navy'}`}>Unlimited Invoices</h3>
              <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                Create as many invoices as you need. No hidden limits or fees.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className={`py-20 relative ${isDarkMode ? 'bg-gradient-to-b from-gray-900 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-emerald-50'}`}>
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {/* Background orbs */}
          {isDarkMode && (
            <>
              <div className="absolute top-0 right-1/3 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />
              <div className="absolute bottom-1/2 left-1/4 w-32 h-32 bg-emerald-500/8 rounded-full blur-2xl" />
            </>
          )}
          {!isDarkMode && (
            <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-300/15 rounded-full blur-3xl" />
          )}
        </div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-brand-navy'}`}>
              How It Works
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-brand-slate'}`}>
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((num, idx) => (
              <motion.div key={num} whileHover={{ scale: 1.05 }} className="text-center">
                <motion.div 
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg ${
                    num === 1 ? 'bg-brand-emerald' :
                    num === 2 ? 'bg-brand-navy' :
                    'bg-brand-slate'
                  }`}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                >
                  {num}
                </motion.div>
                <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-brand-navy'}`}>
                  {num === 1 ? 'Sign Up Free' : num === 2 ? 'Create Invoice' : 'Send & Get Paid'}
                </h3>
                <p className={`leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-brand-slate'}`}>
                  {num === 1 ? 'Create your account in seconds with email or Google. No credit card required.' :
                   num === 2 ? 'Fill in your details, add items, and customize your invoice template in minutes.' :
                   'Download PDF or email directly to clients. Track payment status easily.'}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={`py-20 relative ${isDarkMode ? 'bg-gradient-to-b from-gray-950 to-gray-900' : 'bg-gradient-to-b from-white to-blue-50'}`}>
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {/* Background orbs */}
          {isDarkMode && (
            <>
              <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-slate-500/8 rounded-full blur-2xl" />
              <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
            </>
          )}
          {!isDarkMode && (
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-300/15 rounded-full blur-3xl" />
          )}
        </div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-brand-navy'}`}>
              Simple, Transparent Pricing
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-brand-slate'}`}>
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <motion.div whileHover={{ y: -10 }} className={`border-2 rounded-2xl p-8 ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-brand-emerald' : 'bg-white border-gray-200 hover:border-brand-emerald'} transition`}>
              <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-brand-navy'}`}>Free</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-brand-emerald">$0</span>
                <span className={isDarkMode ? 'text-gray-400' : 'text-brand-slate'}>/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                  <CheckCircle className="h-5 w-5 text-brand-emerald mr-3" />
                  10 invoices/month
                </li>
                <li className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                  <CheckCircle className="h-5 w-5 text-brand-emerald mr-3" />
                  Basic templates
                </li>
                <li className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                  <CheckCircle className="h-5 w-5 text-brand-emerald mr-3" />
                  Email support
                </li>
              </ul>
              <button 
                onClick={() => navigate('/signup')}
                className={`w-full py-3 rounded-lg font-semibold transition ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-brand-navy hover:bg-gray-200'}`}
              >
                Get Started
              </button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div whileHover={{ y: -10 }} className={`border-2 border-brand-emerald rounded-2xl p-8 relative ${isDarkMode ? 'bg-gray-800' : 'bg-brand-white'} transform scale-105`}>
              <div className="absolute top-0 right-0 bg-brand-emerald text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-semibold">
                Popular
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-brand-navy'}`}>Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-brand-emerald">$19</span>
                <span className={isDarkMode ? 'text-gray-400' : 'text-brand-slate'}>/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                  <CheckCircle className="h-5 w-5 text-brand-emerald mr-3" />
                  Unlimited invoices
                </li>
                <li className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                  <CheckCircle className="h-5 w-5 text-brand-emerald mr-3" />
                  All templates
                </li>
                <li className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                  <CheckCircle className="h-5 w-5 text-brand-emerald mr-3" />
                  Priority support
                </li>
                <li className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                  <CheckCircle className="h-5 w-5 text-brand-emerald mr-3" />
                  Custom branding
                </li>
              </ul>
              <button 
                onClick={() => navigate('/signup')}
                className="w-full bg-brand-emerald text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition shadow-lg"
              >
                Start Free Trial
              </button>
            </motion.div>

            {/* Business Plan */}
            <motion.div whileHover={{ y: -10 }} className={`border-2 rounded-2xl p-8 ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-brand-emerald' : 'bg-white border-gray-200 hover:border-brand-emerald'} transition`}>
              <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-brand-navy'}`}>Business</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-brand-emerald">$49</span>
                <span className={isDarkMode ? 'text-gray-400' : 'text-brand-slate'}>/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                  <CheckCircle className="h-5 w-5 text-brand-emerald mr-3" />
                  Everything in Pro
                </li>
                <li className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                  <CheckCircle className="h-5 w-5 text-brand-emerald mr-3" />
                  Team collaboration
                </li>
                <li className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                  <CheckCircle className="h-5 w-5 text-brand-emerald mr-3" />
                  Advanced analytics
                </li>
                <li className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-brand-slate'}`}>
                  <CheckCircle className="h-5 w-5 text-brand-emerald mr-3" />
                  API access
                </li>
              </ul>
              <button 
                onClick={() => navigate('/signup')}
                className={`w-full py-3 rounded-lg font-semibold transition ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-brand-navy hover:bg-gray-200'}`}
              >
                Contact Sales
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-navy">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Simplify Your Invoicing?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of professionals who trust InvoicePro
          </p>
          <button 
            onClick={() => navigate('/signup')}
            className="bg-brand-emerald text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-700 transition shadow-lg inline-flex items-center"
          >
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative ${isDarkMode ? 'bg-gradient-to-b from-gray-900 to-gray-950 text-gray-400' : 'bg-gradient-to-r from-brand-navy via-blue-900 to-brand-slate text-gray-300'} py-12 overflow-hidden`}>
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {isDarkMode && (
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/8 rounded-full blur-3xl" />
          )}
        </div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-6 w-6 text-brand-emerald" />
                <span className="text-xl font-bold text-white">InvoicePro</span>
              </div>
              <p className="text-sm">
                Professional invoice generation made simple.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Templates</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className={`border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-700'} mt-8 pt-8 text-center text-sm`}>
            <p>&copy; 2026 KRAS TECHNOLOGY. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
