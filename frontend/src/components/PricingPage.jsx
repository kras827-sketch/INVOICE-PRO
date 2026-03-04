// src/components/PricingPage.jsx
// Pricing page with Paystack integration

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Check, X, Zap } from 'lucide-react';
import { getAllPlans, processSubscription, formatPrice } from '../services/paystack';

const PricingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const plans = getAllPlans();

  const handleUpgrade = async (plan) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (plan.id === 'free' || user?.subscription?.plan === plan.id) {
      setMessage('You already have this plan!');
      return;
    }

    setLoading(true);
    setSelectedPlan(plan.id);

    try {
      const result = await processSubscription({
        email: user.email,
        planId: plan.id,
        userId: user.id
      });

      if (result.success) {
        setMessage(`✅ ${result.message}`);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setMessage(`❌ Upgrade failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-12 px-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Simple, Transparent Pricing
          </h1>
          <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose the perfect plan for your invoicing needs
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`max-w-2xl mx-auto mb-6 p-4 rounded-lg ${
            message.includes('✅')
              ? isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-50 text-green-700'
              : isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg overflow-hidden transition transform hover:scale-105 ${
                plan.recommended
                  ? isDarkMode
                    ? 'bg-brand-navy ring-2 ring-brand-navy shadow-lg'
                    : 'bg-white ring-2 ring-blue-600 shadow-lg'
                  : isDarkMode
                  ? 'bg-gray-800'
                  : 'bg-white shadow-md'
              }`}
            >
              {/* Recommended Badge */}
              {plan.recommended && (
                <div className="bg-brand-emerald text-white py-2 text-center font-bold text-sm">
                  ⭐ MOST POPULAR
                </div>
              )}

              {/* Plan Content */}
              <div className="p-8">
                {/* Plan Name */}
                <h2 className={`text-2xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {plan.name}
                </h2>

                {/* Price */}
                <div className="mb-6">
                  {plan.price === 0 ? (
                    <div className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Free
                    </div>
                  ) : (
                    <div className="flex items-baseline">
                      <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatPrice(plan.price)}
                      </span>
                      <span className={`ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        /month
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={loading && selectedPlan === plan.id}
                  className={`w-full py-3 rounded-lg font-bold mb-8 transition ${
                    user?.subscription?.plan === plan.id
                      ? isDarkMode
                        ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-brand-emerald text-white hover:bg-emerald-700 active:bg-emerald-800'
                  } ${loading && selectedPlan === plan.id ? 'opacity-50' : ''}`}
                >
                  {user?.subscription?.plan === plan.id
                    ? '✓ Current Plan'
                    : loading && selectedPlan === plan.id
                    ? 'Processing...'
                    : plan.id === 'free'
                    ? 'Get Started'
                    : 'Upgrade Now'}
                </button>

                {/* Features */}
                <div className="space-y-4">
                  <div className={`font-bold text-sm uppercase ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Features:
                  </div>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {feature}
                      </span>
                    </div>
                  ))}

                  {/* Free Plan Limitations */}
                  {plan.id === 'free' && (
                    <>
                      <div className="border-t pt-4 mt-4">
                        <div className={`font-bold text-sm uppercase mb-4 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Not Included:
                        </div>
                        {[
                          'Email invoice sending',
                          'Advanced reports',
                          'Priority support',
                          'White-label invoices'
                        ].map((notIncluded, idx) => (
                          <div key={idx} className="flex items-start space-x-3 mb-2">
                            <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                              {notIncluded}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className={`text-3xl font-bold mb-8 text-center ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'Can I change my plan later?',
                a: 'Yes! You can upgrade or downgrade your plan anytime. Changes take effect immediately.'
              },
              {
                q: 'Is there a contract?',
                a: 'No contracts. Cancel or change your plan anytime. Your subscription will end at the end of the billing cycle.'
              },
              {
                q: 'How do invoices count?',
                a: 'Free plan invoices reset every 30 days. Basic and Business plans have unlimited invoices.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all Paystack payment methods including debit cards, bank transfers, USSD, and mobile money.'
              },
              {
                q: 'Is my data secure?',
                a: 'Yes! We use industry-standard encryption and security practices. Your data is stored securely on Firebase.'
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {faq.q}
                </h3>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Ready to get started?
          </p>
          <button
            onClick={() => navigate(user ? '/invoice/create' : '/signup')}
            className="bg-brand-emerald text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-emerald-700 transition inline-flex items-center space-x-2"
          >
            <Zap className="h-5 w-5" />
            <span>Create Your First Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
