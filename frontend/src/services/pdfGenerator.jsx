// src/services/pdfGenerator.js
// Ultra-sharp PDF generation using @react-pdf/renderer for professional output

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  PDFDownloadLink,
  Svg,
  Path
} from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import { getTemplate } from '../data/invoiceTemplates';
import { calculateInvoice } from '../utils/invoiceCalculations';
import { formatCurrency, getCurrency } from '../utils/currencyUtils';

// Register fonts for better typography and currency support
import { Font } from '@react-pdf/renderer';

// Use Roboto from a reliable CDN (these are actual .ttf static font files)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Roboto'
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    paddingBottom: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    padding: 10
  },
  logo: {
    width: 100,
    height: 40,
    marginBottom: 10
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 15
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 10
  },
  col: {
    flex: 1
  },
  table: {
    display: 'flex',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 20
  },
  tableHeader: {
    display: 'flex',
    flexDirection: 'row',
    fontWeight: 'bold'
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 10
  },
  totalsSection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: 250,
    textAlign: 'right'
  },
  totalRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontSize: 10
  },
  totalAmount: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#fff',
    padding: 8,
    marginTop: 10
  }
});

/**
 * Generate PDF Document
 * Creates a professional invoice PDF with proper DPI and embedded fonts
 */
export const PDFInvoice = ({ invoiceData: rawData, template = 'modern-clean' }) => {
  const templateConfig = getTemplate(template);
  const colors = templateConfig.colors;

  // Normalize backend shape (client.name, company.name) to flat fields
  const invoiceData = {
    ...rawData,
    businessName: rawData.businessName || rawData.company?.name || 'Your Business',
    businessAddress: rawData.businessAddress || rawData.company?.address || '',
    businessEmail: rawData.businessEmail || rawData.company?.email || '',
    businessPhone: rawData.businessPhone || rawData.company?.phone || '',
    businessLogo: rawData.businessLogo || rawData.company?.logo || '',
    clientName: rawData.clientName || rawData.toName || rawData.client?.name || '',
    clientAddress: rawData.clientAddress || rawData.toAddress || rawData.client?.address || '',
    clientEmail: rawData.clientEmail || rawData.toEmail || rawData.client?.email || '',
  };

  // Use centralized calculation engine
  const calculations = calculateInvoice({
    items: invoiceData.items || [],
    discount: invoiceData.discount || 0,
    discountType: 'fixed',
    taxRate: invoiceData.taxRate || 0,
    taxBasis: 'subtotal'
  });

  const currencyCode = invoiceData.currency || 'NGN';
  // Roboto supports $, €, £, R but not ₦, ₹, ₵ — use code prefix for unsupported symbols
  const ROBOTO_SAFE_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', ZAR: 'R', CAD: 'CA$', AUD: 'A$' };
  const formatCurrencyLocal = (amount) => {
    const value = (parseFloat(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const symbol = ROBOTO_SAFE_SYMBOLS[currencyCode];
    return symbol ? `${symbol}${value}` : `${currencyCode} ${value}`;
  };

  const formatDate = (date) => {
    const locale = invoiceData.locale || getCurrency(currencyCode).locale || 'en-NG';
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Document>
      <Page size="A4" style={{ ...styles.page, backgroundColor: '#ffffff', color: '#000000' }} dpi={300}>
        {/* ACCENT STRIPE */}
        <View style={{ width: '100%', height: 6, backgroundColor: colors.primary || '#0F172A' }} />

        {/* HEADER - light to match preview */}
        <View style={{ ...styles.header, backgroundColor: '#ffffff', borderBottomWidth: 0, paddingTop: 8 }}>
          <View style={styles.col}>
            {invoiceData.businessLogo && (
              <Image
                src={invoiceData.businessLogo}
                style={styles.logo}
              />
            )}
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: colors.primary || '#0F172A' }}>
              {invoiceData.businessName || 'Your Business'}
            </Text>
            <Text style={{ fontSize: 9, color: '#666' }}>
              {invoiceData.businessAddress}
            </Text>
            <Text style={{ fontSize: 9, color: '#666' }}>
              {invoiceData.businessEmail}
            </Text>
          </View>

          <View>
            <Text style={{...styles.title, color: colors.primary || '#0F172A'}}>INVOICE</Text>
            <View style={styles.row}>
              <Text style={{ fontWeight: 'bold', width: 80 }}>Invoice #:</Text>
              <Text>{invoiceData.invoiceNumber}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontWeight: 'bold', width: 80 }}>Date:</Text>
              <Text>{formatDate(invoiceData.invoiceDate)}</Text>
            </View>
            {invoiceData.dueDate && (
              <View style={styles.row}>
                <Text style={{ fontWeight: 'bold', width: 80 }}>Due Date:</Text>
                <Text>{formatDate(invoiceData.dueDate)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* FROM & TO */}
        <View style={{ display: 'flex', flexDirection: 'row', marginBottom: 30 }}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>FROM</Text>
            <Text style={{ fontWeight: 'bold' }}>{invoiceData.businessName}</Text>
            <Text style={{ fontSize: 9, color: '#666' }}>
              {invoiceData.businessAddress}
            </Text>
          </View>

          <View style={styles.col}>
            <Text style={styles.sectionTitle}>BILL TO</Text>
            <Text style={{ fontWeight: 'bold' }}>{invoiceData.clientName}</Text>
            <Text style={{ fontSize: 9, color: '#666' }}>
              {invoiceData.clientAddress}
            </Text>
            {invoiceData.clientEmail && (
              <Text style={{ fontSize: 9, color: '#666' }}>
                {invoiceData.clientEmail}
              </Text>
            )}
          </View>
        </View>

        {/* ITEMS TABLE */}
        <View style={styles.table}>
          <View style={{ ...styles.tableHeader, backgroundColor: colors.primary, color: colors.tableHeader || '#ffffff' }}>
            <Text style={{ ...styles.tableCell, flex: 2 }}>Item</Text>
            <Text style={{ ...styles.tableCell, flex: 3 }}>Description</Text>
            <Text style={{ ...styles.tableCell, textAlign: 'right' }}>Qty</Text>
            <Text style={{ ...styles.tableCell, textAlign: 'right' }}>Rate</Text>
            <Text style={{ ...styles.tableCell, textAlign: 'right' }}>Amount</Text>
          </View>

          {invoiceData.items.map((item, idx) => (
            <View 
              key={idx}
              style={{
                ...styles.tableRow,
                backgroundColor: idx % 2 === 0 ? 'transparent' : colors.accent
              }}
            >
              <Text style={{ ...styles.tableCell, flex: 2, fontWeight: 'bold' }}>{item.name}</Text>
              <Text style={{ ...styles.tableCell, flex: 3, wrap: true }}>{item.description || '-'}</Text>
              <Text style={{ ...styles.tableCell, textAlign: 'right' }}>{item.quantity}</Text>
              <Text style={{ ...styles.tableCell, textAlign: 'right' }}>{formatCurrencyLocal(item.price)}</Text>
              <Text style={{ ...styles.tableCell, textAlign: 'right' }}>
                {formatCurrencyLocal(item.quantity * item.price)}
              </Text>
            </View>
          ))}
        </View>

        {/* TOTALS */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrencyLocal(calculations.subtotal)}</Text>
          </View>

          {calculations.tax > 0 && (
            <View style={styles.totalRow}>
              <Text>Tax ({calculations.tax}%):</Text>
              <Text>{formatCurrencyLocal(calculations.taxAmount)}</Text>
            </View>
          )}

          {calculations.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount:</Text>
              <Text style={{ color: '#ef4444' }}>-{formatCurrencyLocal(calculations.discountAmount)}</Text>
            </View>
          )}

          <View style={{ ...styles.totalAmount, backgroundColor: colors.primary, color: colors.tableHeader || '#ffffff' }}>
            <Text>TOTAL: {formatCurrencyLocal(calculations.total)}</Text>
          </View>
        </View>

        {/* BANK / PAYMENT DETAILS — immediately after totals */}
        {invoiceData.bankDetails && invoiceData.bankDetails.bankName && (
          <View style={{
            marginTop: 20,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border || '#e2e8f0',
            borderRadius: 4,
            backgroundColor: colors.accent || '#f8fafc',
          }}>
            <Text style={{
              fontSize: 11,
              fontWeight: 'bold',
              color: colors.primary || '#000',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              Payment Information
            </Text>

            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', width: 110, color: '#333' }}>Bank Name:</Text>
              <Text style={{ fontSize: 10, color: '#111' }}>{invoiceData.bankDetails.bankName}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', width: 110, color: '#333' }}>Account Name:</Text>
              <Text style={{ fontSize: 10, color: '#111' }}>{invoiceData.bankDetails.accountName}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', width: 110, color: '#333' }}>Account Number:</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#111' }}>{invoiceData.bankDetails.accountNumber}</Text>
            </View>
          </View>
        )}

        {/* NOTES & TERMS */}
        {(invoiceData.notes || invoiceData.terms) && (
          <View style={{ marginTop: 20 }}>
            {invoiceData.notes && (
              <View style={{ marginBottom: 15 }}>
                <Text style={styles.sectionTitle}>NOTES</Text>
                <Text style={{ fontSize: 9, color: '#666', whiteSpace: 'pre-wrap' }}>
                  {invoiceData.notes}
                </Text>
              </View>
            )}

            {invoiceData.terms && (
              <View>
                <Text style={styles.sectionTitle}>PAYMENT TERMS</Text>
                <Text style={{ fontSize: 9, color: '#666', whiteSpace: 'pre-wrap' }}>
                  {invoiceData.terms}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* FOOTER */}
        <View
          style={{
            position: 'absolute',
            bottom: 30,
            left: 40,
            right: 40,
            borderTopWidth: 1,
            borderTopColor: '#e2e8f0',
            paddingTop: 10,
            textAlign: 'center',
            fontSize: 9,
            color: '#666'
          }}
        >
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
};

/**
 * Generate PDF Document specifically for Receipts
 */
export const PDFReceipt = ({ invoiceData: rawData, template = 'modern-clean' }) => {
  const templateConfig = getTemplate(template);
  const colors = templateConfig.colors;

  // Normalize backend shape (client.name, company.name) to flat fields
  const invoiceData = {
    ...rawData,
    businessName: rawData.businessName || rawData.company?.name || 'Your Business',
    businessAddress: rawData.businessAddress || rawData.company?.address || '',
    businessEmail: rawData.businessEmail || rawData.company?.email || '',
    businessPhone: rawData.businessPhone || rawData.company?.phone || '',
    businessLogo: rawData.businessLogo || rawData.company?.logo || '',
    clientName: rawData.clientName || rawData.toName || rawData.client?.name || '',
    clientAddress: rawData.clientAddress || rawData.toAddress || rawData.client?.address || '',
    clientEmail: rawData.clientEmail || rawData.toEmail || rawData.client?.email || '',
  };

  // Use centralized calculation engine
  const calculations = calculateInvoice({
    items: invoiceData.items || [],
    discount: invoiceData.discount || 0,
    discountType: 'fixed',
    taxRate: invoiceData.taxRate || 0,
    taxBasis: 'subtotal'
  });

  const currencyCode = invoiceData.currency || 'NGN';
  const ROBOTO_SAFE_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', ZAR: 'R', CAD: 'CA$', AUD: 'A$' };
  const formatCurrencyLocal = (amount) => {
    const value = (parseFloat(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const symbol = ROBOTO_SAFE_SYMBOLS[currencyCode];
    return symbol ? `${symbol}${value}` : `${currencyCode} ${value}`;
  };

  const formatDate = (date) => {
    const locale = invoiceData.locale || getCurrency(currencyCode).locale || 'en-NG';
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Document>
      <Page size="A4" style={{ ...styles.page, backgroundColor: templateConfig.darkBackground ? '#1a1a1a' : '#ffffff', color: templateConfig.darkBackground ? '#ffffff' : '#000000', padding: 0 }} dpi={300}>
        {/* TOP STRIPE */}
        <View style={{ width: '100%', height: 8, backgroundColor: colors.primary || '#059669' }} />

        <View style={{ padding: 40 }}>
          {/* HEADER (Logo & Checkmark) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View>
              {invoiceData.businessLogo ? (
                <Image
                  src={invoiceData.businessLogo}
                  style={{ width: 80, height: 80, objectFit: 'contain' }}
                />
              ) : (
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>
                  {invoiceData.businessName || 'Business'}
                </Text>
              )}
            </View>
            <View style={{ alignItems: 'center' }}>
               <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#f0fdfa', borderWidth: 2, borderColor: colors.primary || '#0d9488', justifyContent: 'center', alignItems: 'center' }}>
                  <Svg viewBox="0 0 24 24" width="24" height="24">
                    <Path
                      d="M20 6L9 17L4 12"
                      stroke={colors.primary || '#0d9488'}
                      strokeWidth={3}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
               </View>
            </View>
          </View>

          {/* MAIN TITLE */}
          <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0f172a', letterSpacing: -0.5 }}>
              PAYMENT CONFIRMED
            </Text>
            <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Transaction completed successfully
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: '#e2e8f0', marginBottom: 30, width: '100%' }} />

          {/* RECEIPT DETAILS & AMOUNT GRIDS */}
          <View style={{ flexDirection: 'row', marginBottom: 30 }}>
            
            {/* Left Col - Details */}
            <View style={{ flex: 1, paddingRight: 20 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Invoice Details
              </Text>
              
              <Text style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Invoice Number
              </Text>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 }}>
                #{invoiceData.invoiceNumber}
              </Text>

              <Text style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Date Paid
              </Text>
              <Text style={{ fontSize: 12, color: '#334155' }}>
                {formatDate(invoiceData.paymentDate || new Date())}
              </Text>
              
              <Text style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 4 }}>
                Receipt Number
              </Text>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.primary || '#059669' }}>
                {invoiceData.receiptNumber || `REC-${invoiceData.invoiceNumber}`}
              </Text>

            </View>

            {/* Right Col - Amount */}
            <View style={{ flex: 1, paddingLeft: 20 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Amount Paid
              </Text>
              
              <Text style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Total
              </Text>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.primary || '#059669', marginBottom: 12 }}>
                {formatCurrencyLocal(calculations.total)}
              </Text>

              <Text style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Status
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary || '#059669', marginRight: 6 }} />
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.primary || '#059669' }}>Paid</Text>
              </View>
            </View>
          </View>

          {/* CUSTOMER DETAILS BOX */}
          <View style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 8, marginBottom: 30, flexDirection: 'row' }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                From
              </Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>
                {invoiceData.businessName}
              </Text>
              <Text style={{ fontSize: 10, color: '#64748b' }}>
                {invoiceData.businessEmail}
              </Text>
              {invoiceData.businessAddress && (
                <Text style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                  {invoiceData.businessAddress}
                </Text>
              )}
            </View>
            <View style={{ flex: 1, paddingLeft: 10 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                To
              </Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>
                {invoiceData.clientName}
              </Text>
              <Text style={{ fontSize: 10, color: '#64748b' }}>
                {invoiceData.clientEmail}
              </Text>
              {invoiceData.clientAddress && (
                <Text style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                  {invoiceData.clientAddress}
                </Text>
              )}
            </View>
          </View>

          {/* ITEMS BREAKDOWN */}
          <View style={{ marginBottom: 30 }}>
             <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Order Summary
             </Text>
             
             {/* Table Header */}
             <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 8, marginBottom: 8 }}>
                <Text style={{ flex: 3, fontSize: 10, fontWeight: 'bold', color: '#475569' }}>Item</Text>
                <Text style={{ flex: 1, fontSize: 10, fontWeight: 'bold', color: '#475569', textAlign: 'center' }}>Qty</Text>
                <Text style={{ flex: 1.5, fontSize: 10, fontWeight: 'bold', color: '#475569', textAlign: 'right' }}>Amount</Text>
             </View>

             {/* Table Rows */}
             {invoiceData.items.map((item, idx) => (
               <View key={idx} style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                 <View style={{ flex: 3 }}>
                   <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0f172a' }}>{item.name}</Text>
                   {item.description && (
                     <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{item.description}</Text>
                   )}
                 </View>
                 <Text style={{ flex: 1, fontSize: 11, color: '#475569', textAlign: 'center' }}>{item.quantity}</Text>
                 <Text style={{ flex: 1.5, fontSize: 11, fontWeight: 'bold', color: '#0f172a', textAlign: 'right' }}>
                    {formatCurrencyLocal(item.quantity * item.price)}
                 </Text>
               </View>
             ))}

             {/* Grand Totals */}
             {(calculations.tax > 0 || calculations.discountAmount > 0) && (
               <View style={{ marginTop: 12, alignItems: 'flex-end' }}>
                 <View style={{ flexDirection: 'row', marginBottom: 4, width: 200, justifyContent: 'space-between' }}>
                   <Text style={{ fontSize: 10, color: '#64748b' }}>Subtotal</Text>
                   <Text style={{ fontSize: 10, color: '#334155' }}>{formatCurrencyLocal(calculations.subtotal)}</Text>
                 </View>

                 {calculations.tax > 0 && (
                   <View style={{ flexDirection: 'row', marginBottom: 4, width: 200, justifyContent: 'space-between' }}>
                     <Text style={{ fontSize: 10, color: '#64748b' }}>Tax ({calculations.tax}%)</Text>
                     <Text style={{ fontSize: 10, color: '#334155' }}>{formatCurrencyLocal(calculations.taxAmount)}</Text>
                   </View>
                 )}

                 {calculations.discountAmount > 0 && (
                   <View style={{ flexDirection: 'row', marginBottom: 4, width: 200, justifyContent: 'space-between' }}>
                     <Text style={{ fontSize: 10, color: '#64748b' }}>Discount</Text>
                     <Text style={{ fontSize: 10, color: '#ef4444' }}>-{formatCurrencyLocal(calculations.discountAmount)}</Text>
                   </View>
                 )}
               </View>
             )}
          </View>

          {/* QR CODE SECTION */}
          {invoiceData.qrCode && (
            <View style={{ alignItems: 'center', marginTop: 10, padding: 20, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' }}>
              <Image
                src={invoiceData.qrCode}
                style={{ width: 90, height: 90, marginBottom: 8 }}
              />
              <Text style={{ fontSize: 9, color: '#64748b', textAlign: 'center' }}>
                Scan to verify this payment online
              </Text>
            </View>
          )}

        </View>

        {/* FOOTER */}
        <View
          style={{
            position: 'absolute',
            bottom: 30,
            left: 40,
            right: 40,
            borderTopWidth: 1,
            borderTopColor: '#e2e8f0',
            paddingTop: 16,
            textAlign: 'center'
          }}
        >
          <Text style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>
             Thank you for your business. This receipt is valid and can be used for your records.
          </Text>
          <Text style={{ fontSize: 9, color: '#94a3b8' }}>
             For questions or support, contact us at {invoiceData.businessEmail}
          </Text>
        </View>

      </Page>
    </Document>
  );
};

/**
 * Generate and download PDF
 * @param {object} invoiceData - Invoice data
 * @param {string} template - Template ID
 */
export const downloadInvoicePDF = async (invoiceData, template = 'modern-clean') => {
  try {
    const fileName = `Invoice-${invoiceData.invoiceNumber || 'draft'}.pdf`;
    
    // Force client-side generation to ensure template matches preview
    // accessing backend PDF often results in generic/wrong template

    // Fallback: generate PDF client-side using react-pdf
    const doc = <PDFInvoice invoiceData={invoiceData} template={template} />;
    const asPdf = pdf();
    asPdf.updateContainer(doc);
    const blob = await asPdf.toBlob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF Download Error:', error);
    throw new Error('Failed to download invoice: ' + error.message);
  }
};

/**
 * Export PDF as blob for email attachment
 * @param {object} invoiceData - Invoice data
 * @param {string} template - Template ID
 * @returns {Promise<Blob>} - PDF blob
 */
export const generatePDFBlob = async (invoiceData, template = 'modern-clean') => {
  try {
    console.log('📄 [BLOB] Generating PDF blob...');
    const doc = <PDFInvoice invoiceData={invoiceData} template={template} />;
    const asPdf = pdf();
    asPdf.updateContainer(doc);
    const blob = await asPdf.toBlob();
    
    if (!blob || blob.size === 0) {
      throw new Error('Generated PDF blob is empty');
    }
    
    console.log('✅ [BLOB] PDF blob generated successfully:', blob.size, 'bytes');
    return blob;
  } catch (error) {
    console.error('❌ [BLOB] PDF Generation Error:', error);
    throw new Error('Failed to generate PDF: ' + (error.message || 'Unknown error'));
  }
};

/**
 * Export PDF as blob specifically for Receipts
 */
export const generateReceiptPDFBlob = async (invoiceData, template = 'modern-clean') => {
  try {
    const doc = <PDFReceipt invoiceData={invoiceData} template={template} />;
    const asPdf = pdf();
    asPdf.updateContainer(doc);
    const blob = await asPdf.toBlob();
    return blob;
  } catch (error) {
    console.error('❌ [BLOB] Receipt PDF Generation Error:', error);
    throw new Error('Failed to generate Receipt PDF: ' + (error.message || 'Unknown error'));
  }
};

// helper that mirrors downloadInvoicePDF but for receipts
export const downloadReceiptPDF = async (invoiceData, template = 'modern-clean') => {
  try {
    const fileName = `Receipt-${invoiceData.invoiceNumber || 'receipt'}.pdf`;
    const doc = <PDFReceipt invoiceData={invoiceData} template={template} />;
    const asPdf = pdf();
    asPdf.updateContainer(doc);
    const blob = await asPdf.toBlob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Receipt PDF Download Error:', error);
    throw new Error('Failed to download receipt: ' + error.message);
  }
};

/**
 * Format invoice as plain text
 */
const formatInvoiceAsText = (invoiceData) => {
  const divider = '='.repeat(60);
  const cur = invoiceData.currency || 'NGN';
  return `
${divider}
INVOICE #${invoiceData.invoiceNumber || 'DRAFT'}
${divider}

FROM:
${invoiceData.senderName || 'Business Name'}
${invoiceData.senderEmail || ''}

BILL TO:
${invoiceData.clientName || 'Client Name'}
${invoiceData.clientEmail || ''}

DATE: ${new Date(invoiceData.date || Date.now()).toLocaleDateString()}
DUE DATE: ${new Date(invoiceData.dueDate || Date.now()).toLocaleDateString()}

${divider}
ITEMS:
${divider}

${invoiceData.items?.map(item => 
  `${item.description || item.name || 'Item'}\nQuantity: ${item.quantity}, Rate: ${cur} ${item.rate}, Total: ${cur} ${item.quantity * item.rate}`
).join('\n\n') || 'No items'}

${divider}
TOTALS:
${divider}

Subtotal: ${cur} ${invoiceData.subtotal || 0}
Tax (${invoiceData.taxRate || 0}%): ${cur} ${invoiceData.tax || 0}
Discount: ${cur} ${invoiceData.discount || 0}

TOTAL: ${cur} ${invoiceData.total || 0}

${divider}
${invoiceData.notes ? `NOTES:\n${invoiceData.notes}\n\n` : ''}
Thank you for your business!
${divider}
  `.trim();
};
