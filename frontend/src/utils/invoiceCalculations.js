/**
 * Invoice Calculations Utility
 * 
 * Centralized, production-grade invoice calculation engine
 * Used across: Preview, PDF, Email, Analytics
 * 
 * Implements industry-standard invoice math with:
 * - Line item calculations
 * - Percentage & fixed discounts
 * - Tax (VAT/Sales tax)
 * - Shipping/Service fees
 * - Currency-safe rounding
 * - Outstanding balance tracking
 */

/**
 * Calculate single line item total
 * @param {number} quantity - Item quantity
 * @param {number} price - Price per unit
 * @returns {number} - Line item total (quantity × price)
 */
export const calculateLineItemTotal = (quantity, price) => {
  const qty = parseFloat(quantity) || 0;
  const unitPrice = parseFloat(price) || 0;
  return roundCurrency(qty * unitPrice);
};

/**
 * Calculate subtotal from all items
 * @param {Array} items - Array of items [{quantity, price/rate}]
 * @returns {number} - Subtotal (sum of all line items)
 */
export const calculateSubtotal = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return 0;
  
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price || item.rate) || 0;
    return sum + (qty * price);
  }, 0);
  
  return roundCurrency(subtotal);
};

/**
 * Calculate discount amount
 * Supports both percentage and fixed discounts
 * @param {number} subtotal - Subtotal amount
 * @param {number} discountValue - Discount value (percentage or fixed)
 * @param {string} discountType - 'percentage' or 'fixed' (default: 'fixed')
 * @returns {number} - Discount amount
 */
export const calculateDiscount = (subtotal, discountValue = 0, discountType = 'fixed') => {
  const sub = parseFloat(subtotal) || 0;
  const discount = parseFloat(discountValue) || 0;
  
  if (discount === 0) return 0;
  
  if (discountType === 'percentage') {
    return roundCurrency((sub * discount) / 100);
  }
  
  // Fixed discount - ensure it doesn't exceed subtotal
  return roundCurrency(Math.min(discount, sub));
};

/**
 * Calculate tax amount
 * @param {number} subtotal - Subtotal (before tax)
 * @param {number} discountAmount - Discount already applied
 * @param {number} taxRate - Tax rate percentage (e.g., 7.5 for 7.5%)
 * @param {string} taxBasis - 'subtotal' (before discount) or 'after-discount'
 * @returns {number} - Tax amount
 */
export const calculateTax = (subtotal, discountAmount = 0, taxRate = 0, taxBasis = 'subtotal') => {
  const rate = parseFloat(taxRate) || 0;
  
  if (rate === 0) return 0;
  
  const sub = parseFloat(subtotal) || 0;
  const discount = parseFloat(discountAmount) || 0;
  
  // Calculate tax on subtotal or after discount
  const taxableAmount = taxBasis === 'after-discount' 
    ? Math.max(0, sub - discount)
    : sub;
  
  return roundCurrency((taxableAmount * rate) / 100);
};

/**
 * Calculate shipping/service fees
 * @param {number} shippingFee - Fixed shipping fee
 * @returns {number} - Shipping amount (already rounded)
 */
export const calculateShipping = (shippingFee = 0) => {
  return roundCurrency(parseFloat(shippingFee) || 0);
};

/**
 * Calculate invoice total
 * @param {number} subtotal - Subtotal
 * @param {number} discountAmount - Discount amount (already calculated)
 * @param {number} taxAmount - Tax amount (already calculated)
 * @param {number} shippingFee - Shipping fee
 * @returns {number} - Final total
 */
export const calculateTotal = (subtotal = 0, discountAmount = 0, taxAmount = 0, shippingFee = 0) => {
  const sub = parseFloat(subtotal) || 0;
  const discount = parseFloat(discountAmount) || 0;
  const tax = parseFloat(taxAmount) || 0;
  const shipping = parseFloat(shippingFee) || 0;
  
  return roundCurrency(sub - discount + tax + shipping);
};

/**
 * Calculate outstanding balance
 * @param {number} total - Invoice total
 * @param {number} paidAmount - Amount already paid
 * @returns {number} - Outstanding balance (never negative)
 */
export const calculateOutstandingBalance = (total = 0, paidAmount = 0) => {
  const t = parseFloat(total) || 0;
  const paid = parseFloat(paidAmount) || 0;
  return Math.max(0, roundCurrency(t - paid));
};

/**
 * Comprehensive invoice calculations
 * Single function to calculate all invoice metrics
 * 
 * @param {Object} invoiceData - Invoice data object
 * @param {Array} invoiceData.items - Line items [{quantity, price/rate}]
 * @param {number} invoiceData.discount - Discount value (default: 0)
 * @param {string} invoiceData.discountType - 'fixed' or 'percentage' (default: 'fixed')
 * @param {number} invoiceData.taxRate - Tax percentage (default: 0)
 * @param {string} invoiceData.taxBasis - 'subtotal' or 'after-discount' (default: 'subtotal')
 * @param {number} invoiceData.shippingFee - Shipping fee (default: 0)
 * @param {number} invoiceData.paidAmount - Amount paid (default: 0)
 * 
 * @returns {Object} Complete calculation result
 * {
 *   subtotal: number,
 *   discount: number,
 *   discountAmount: number,
 *   tax: number,
 *   taxAmount: number,
 *   shipping: number,
 *   total: number,
 *   outstanding: number,
 *   breakdown: {items: [...]}
 * }
 */
export const calculateInvoice = (invoiceData = {}) => {
  // Extract parameters with defaults
  const items = invoiceData.items || [];
  const discount = parseFloat(invoiceData.discount) || 0;
  const discountType = invoiceData.discountType || 'fixed';
  const taxRate = parseFloat(invoiceData.taxRate) || 0;
  const taxBasis = invoiceData.taxBasis || 'subtotal';
  const shippingFee = parseFloat(invoiceData.shippingFee) || 0;
  const paidAmount = parseFloat(invoiceData.paidAmount) || 0;
  
  // Step 1: Calculate subtotal
  const subtotal = calculateSubtotal(items);
  
  // Step 2: Calculate discount
  const discountAmount = calculateDiscount(subtotal, discount, discountType);
  
  // Step 3: Calculate tax
  const taxAmount = calculateTax(subtotal, discountAmount, taxRate, taxBasis);
  
  // Step 4: Calculate shipping
  const shipping = calculateShipping(shippingFee);
  
  // Step 5: Calculate total
  const total = calculateTotal(subtotal, discountAmount, taxAmount, shipping);
  
  // Step 6: Calculate outstanding balance
  const outstanding = calculateOutstandingBalance(total, paidAmount);
  
  // Return comprehensive result
  return {
    subtotal,
    discount,
    discountType,
    discountAmount,
    tax: taxRate,
    taxAmount,
    shipping,
    total,
    outstanding,
    paidAmount,
    // Additional metadata
    breakdown: {
      items: items.map((item, idx) => ({
        ...item,
        lineTotal: calculateLineItemTotal(item.quantity, item.price || item.rate)
      })),
      subtotal,
      discountAmount,
      taxAmount,
      shipping,
      total,
      outstanding
    }
  };
};

/**
 * Currency-safe rounding (NGN to 2 decimals)
 * Prevents floating-point arithmetic errors
 * @param {number} value - Value to round
 * @returns {number} - Rounded value
 */
export const roundCurrency = (value) => {
  return Math.round((parseFloat(value) || 0) * 100) / 100;
};

/**
 * Format currency for display (Nigerian Naira)
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

/**
 * Format currency simple (₦ prefix)
 * @param {number} amount - Amount to format
 * @returns {string} - Simple formatted string
 */
export const formatCurrencySimple = (amount) => {
  const num = parseFloat(amount) || 0;
  return '₦' + num.toLocaleString('en-NG', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default {
  calculateLineItemTotal,
  calculateSubtotal,
  calculateDiscount,
  calculateTax,
  calculateShipping,
  calculateTotal,
  calculateOutstandingBalance,
  calculateInvoice,
  roundCurrency,
  formatCurrency,
  formatCurrencySimple
};
