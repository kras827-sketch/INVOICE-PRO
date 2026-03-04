/**
 * Currency utility functions for consistent currency formatting
 * across all InvoicePro components (forms, PDFs, emails, dashboard).
 */

export const CURRENCIES = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', locale: 'en-GH' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', locale: 'en-KE' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
];

/**
 * Get a currency object by its code
 * @param {string} code - Currency code (e.g. 'NGN', 'USD')
 * @returns {object} Currency object with code, symbol, name, locale
 */
export const getCurrency = (code) => {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0]; // Default to NGN
};

/**
 * Format an amount using the specified currency
 * @param {number} amount - The numeric amount to format
 * @param {string} currencyCode - Currency code (e.g. 'NGN', 'USD'). Defaults to 'NGN'.
 * @returns {string} Formatted currency string (e.g. '₦1,250.00', '$1,250.00')
 */
export const formatCurrency = (amount, currencyCode = 'NGN') => {
  const currency = getCurrency(currencyCode);
  const value = parseFloat(amount) || 0;
  const formatted = value.toLocaleString(currency.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency.symbol}${formatted}`;
};
