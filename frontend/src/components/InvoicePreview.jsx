// src/components/InvoicePreview.jsx
// Beautiful invoice preview that matches the PDF output

import { getTemplate } from '../data/invoiceTemplates';
import { calculateInvoice, formatCurrency } from '../utils/invoiceCalculations';

const InvoicePreview = ({ 
  invoiceData, 
  template = 'modern-clean',
  isFullPage = false 
}) => {
  const templateConfig = getTemplate(template);
  const colors = templateConfig.colors;
  
  // Use centralized calculation engine for consistency
  const calculations = calculateInvoice({
    items: invoiceData.items || [],
    discount: invoiceData.discount || 0,
    discountType: 'fixed',
    taxRate: invoiceData.taxRate || 0,
    taxBasis: 'subtotal'
  });

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Base styles for different templates
  const getHeaderStyle = () => {
    if (template === 'bold-dark') {
      return {
        backgroundColor: colors.accent,
        color: colors.primary,
        padding: templateConfig.spacing.headerPadding
      };
    }
    return {
      backgroundColor: colors.accent,
      color: colors.text,
      padding: templateConfig.spacing.headerPadding,
      borderBottom: `4px solid ${colors.primary}`
    };
  };

  const containerClass = isFullPage 
    ? 'w-full h-screen bg-gray-100 p-8 overflow-y-auto'
    : 'w-full max-w-4xl mx-auto';

  return (
    <div className={containerClass}>
      <div 
        className="bg-white rounded-lg shadow-lg overflow-hidden"
        style={{
          fontFamily: templateConfig.fonts.body,
          color: colors.text,
          backgroundColor: template === 'bold-dark' ? colors.accent : '#ffffff'
        }}
      >
        {/* HEADER */}
        <div 
          style={getHeaderStyle()}
          className="flex justify-between items-start"
        >
          <div className="flex-1">
            {/* Logo */}
            {invoiceData.businessLogo && (
              <img 
                src={invoiceData.businessLogo}
                alt="Business Logo"
                style={{
                  maxWidth: templateConfig.logo.maxWidth,
                  maxHeight: templateConfig.logo.maxHeight,
                  marginBottom: '20px'
                }}
                className="max-w-xs"
              />
            )}
            
            {/* Business Info */}
            <h1 
              style={{
                fontFamily: templateConfig.fonts.heading,
                fontSize: '32px',
                fontWeight: 'bold',
                marginBottom: '10px'
              }}
            >
              {invoiceData.businessName || 'Your Business Name'}
            </h1>
            
            <p style={{ fontSize: '14px', color: colors.lightText }}>
              {invoiceData.businessAddress}
            </p>
            <p style={{ fontSize: '14px', color: colors.lightText }}>
              {invoiceData.businessEmail}
            </p>
            {invoiceData.businessPhone && (
              <p style={{ fontSize: '14px', color: colors.lightText }}>
                {invoiceData.businessPhone}
              </p>
            )}
          </div>

          {/* Invoice Title & Details */}
          <div style={{ textAlign: 'right' }}>
            <h2 
              style={{
                fontFamily: templateConfig.fonts.heading,
                fontSize: '48px',
                fontWeight: 'bold',
                color: colors.primary,
                marginBottom: '20px'
              }}
            >
              INVOICE
            </h2>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>Invoice #:</strong> {invoiceData.invoiceNumber}
            </p>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>Date:</strong> {formatDate(invoiceData.invoiceDate)}
            </p>
            {invoiceData.dueDate && (
              <p style={{ fontSize: '14px' }}>
                <strong>Due Date:</strong> {formatDate(invoiceData.dueDate)}
              </p>
            )}
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: templateConfig.spacing.sectionMargin }}>
          {/* FROM & TO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
            {/* FROM */}
            <div>
              <h3 
                style={{
                  fontFamily: templateConfig.fonts.heading,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: colors.primary,
                  marginBottom: '10px'
                }}
              >
                FROM
              </h3>
              <p style={{ fontSize: '13px', marginBottom: '5px' }}>
                <strong>{invoiceData.businessName}</strong>
              </p>
              <p style={{ fontSize: '13px', color: colors.lightText }}>
                {invoiceData.businessAddress}
              </p>
            </div>

            {/* TO */}
            <div>
              <h3 
                style={{
                  fontFamily: templateConfig.fonts.heading,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: colors.primary,
                  marginBottom: '10px'
                }}
              >
                BILL TO
              </h3>
              <p style={{ fontSize: '13px', marginBottom: '5px' }}>
                <strong>{invoiceData.clientName}</strong>
              </p>
              <p style={{ fontSize: '13px', color: colors.lightText }}>
                {invoiceData.clientAddress}
              </p>
              {invoiceData.clientEmail && (
                <p style={{ fontSize: '13px', color: colors.lightText }}>
                  {invoiceData.clientEmail}
                </p>
              )}
            </div>
          </div>

          {/* ITEMS TABLE */}
          <table style={{ width: '100%', marginBottom: '30px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ 
                backgroundColor: colors.primary, 
                color: template === 'bold-dark' ? colors.accent : '#ffffff'
              }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Qty</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Rate</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, idx) => (
                <tr 
                  key={idx}
                  style={{
                    borderBottom: `1px solid ${colors.border}`,
                    backgroundColor: idx % 2 === 0 ? 'transparent' : colors.accent
                  }}
                >
                  <td style={{ padding: '12px', textAlign: 'left' }}>
                    {item.name}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {formatCurrency(item.price)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {formatCurrency(item.quantity * item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALS */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
            <div style={{ width: '400px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '50px', marginBottom: '10px' }}>
                <div style={{ fontSize: '14px', textAlign: 'right' }}>Subtotal:</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {formatCurrency(calculations.subtotal)}
                </div>
              </div>

              {calculations.tax > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '50px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '14px', textAlign: 'right' }}>Tax ({calculations.tax}%):</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {formatCurrency(calculations.taxAmount)}
                  </div>
                </div>
              )}

              {calculations.discountAmount > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '50px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '14px', textAlign: 'right' }}>Discount:</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ef4444' }}>
                    -{formatCurrency(calculations.discountAmount)}
                  </div>
                </div>
              )}

              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '50px',
                  padding: '15px',
                  backgroundColor: colors.primary,
                  color: template === 'bold-dark' ? colors.accent : '#ffffff',
                  borderRadius: '4px'
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>TOTAL:</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {formatCurrency(calculations.total)}
                </div>
              </div>
            </div>
          </div>

          {/* NOTES & TERMS */}
          {(invoiceData.notes || invoiceData.terms) && (
            <div>
              {invoiceData.notes && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 
                    style={{
                      fontFamily: templateConfig.fonts.heading,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: colors.primary,
                      marginBottom: '8px'
                    }}
                  >
                    NOTES
                  </h4>
                  <p style={{ fontSize: '13px', color: colors.lightText, whiteSpace: 'pre-wrap' }}>
                    {invoiceData.notes}
                  </p>
                </div>
              )}

              {invoiceData.terms && (
                <div>
                  <h4 
                    style={{
                      fontFamily: templateConfig.fonts.heading,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: colors.primary,
                      marginBottom: '8px'
                    }}
                  >
                    PAYMENT TERMS
                  </h4>
                  <p style={{ fontSize: '13px', color: colors.lightText, whiteSpace: 'pre-wrap' }}>
                    {invoiceData.terms}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div 
          style={{
            backgroundColor: colors.primary,
            color: template === 'bold-dark' ? colors.accent : '#ffffff',
            padding: '20px',
            textAlign: 'center',
            fontSize: '12px'
          }}
        >
          <p>Thank you for your business!</p>
          {invoiceData.bankDetails && (
            <p style={{ marginTop: '8px' }}>
              Bank: {invoiceData.bankDetails.bankName} | 
              Account: {invoiceData.bankDetails.accountNumber}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
