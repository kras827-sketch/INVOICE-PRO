// src/services/pdfGenerator.js
// Ultra-sharp PDF generation using @react-pdf/renderer for professional output

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  PDFDownloadLink
} from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import { getTemplate } from '../data/invoiceTemplates';
import { calculateInvoice } from '../utils/invoiceCalculations';

// Register fonts for better typography
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    paddingBottom: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
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
    backgroundColor: '#2563eb',
    color: '#fff',
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
    backgroundColor: '#2563eb',
    color: '#fff',
    padding: 8,
    marginTop: 10
  }
});

/**
 * Generate PDF Document
 * Creates a professional invoice PDF with proper DPI and embedded fonts
 */
const PDFInvoice = ({ invoiceData, template = 'modern-clean' }) => {
  const templateConfig = getTemplate(template);
  const colors = templateConfig.colors;

  // Use centralized calculation engine
  const calculations = calculateInvoice({
    items: invoiceData.items || [],
    discount: invoiceData.discount || 0,
    discountType: 'fixed',
    taxRate: invoiceData.taxRate || 0,
    taxBasis: 'subtotal'
  });

  const formatCurrency = (amount) => {
    return '₦' + (parseFloat(amount) || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page} dpi={300}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.col}>
            {invoiceData.businessLogo && (
              <Image
                src={invoiceData.businessLogo}
                style={styles.logo}
              />
            )}
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
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
            <Text style={styles.title}>INVOICE</Text>
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
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableCell, flex: 2 }}>Description</Text>
            <Text style={styles.tableCell}>Qty</Text>
            <Text style={styles.tableCell}>Rate</Text>
            <Text style={styles.tableCell}>Amount</Text>
          </View>

          {invoiceData.items.map((item, idx) => (
            <View 
              key={idx}
              style={{
                ...styles.tableRow,
                backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb'
              }}
            >
              <Text style={{ ...styles.tableCell, flex: 2 }}>{item.name}</Text>
              <Text style={styles.tableCell}>{item.quantity}</Text>
              <Text style={styles.tableCell}>{formatCurrency(item.price)}</Text>
              <Text style={styles.tableCell}>
                {formatCurrency(item.quantity * item.price)}
              </Text>
            </View>
          ))}
        </View>

        {/* TOTALS */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(calculations.subtotal)}</Text>
          </View>

          {calculations.tax > 0 && (
            <View style={styles.totalRow}>
              <Text>Tax ({calculations.tax}%):</Text>
              <Text>{formatCurrency(calculations.taxAmount)}</Text>
            </View>
          )}

          {calculations.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount:</Text>
              <Text style={{ color: '#ef4444' }}>-{formatCurrency(calculations.discountAmount)}</Text>
            </View>
          )}

          <View style={styles.totalAmount}>
            <Text>TOTAL: {formatCurrency(calculations.total)}</Text>
          </View>
        </View>

        {/* NOTES & TERMS */}
        {(invoiceData.notes || invoiceData.terms) && (
          <View style={{ marginTop: 30 }}>
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
 * Generate and download PDF
 * @param {object} invoiceData - Invoice data
 * @param {string} template - Template ID
 */
export const downloadInvoicePDF = async (invoiceData, template = 'modern-clean') => {
  try {
    const fileName = `Invoice-${invoiceData.invoiceNumber || 'draft'}.pdf`;
    
    // Try to get from backend first
    const token = localStorage.getItem('token');
    if (token && invoiceData._id) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/invoices/pdf/${invoiceData._id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          return;
        }
      } catch (err) {
        console.error('Backend PDF failed, using fallback:', err);
      }
    }

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
 * Format invoice as plain text
 */
const formatInvoiceAsText = (invoiceData) => {
  const divider = '='.repeat(60);
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
  `${item.description || item.name || 'Item'}\nQuantity: ${item.quantity}, Rate: ₦${item.rate}, Total: ₦${item.quantity * item.rate}`
).join('\n\n') || 'No items'}

${divider}
TOTALS:
${divider}

Subtotal: ₦${invoiceData.subtotal || 0}
Tax (${invoiceData.taxRate || 0}%): ₦${invoiceData.tax || 0}
Discount: ₦${invoiceData.discount || 0}

TOTAL: ₦${invoiceData.total || 0}

${divider}
${invoiceData.notes ? `NOTES:\n${invoiceData.notes}\n\n` : ''}
Thank you for your business!
${divider}
  `.trim();
};

export default PDFInvoice;
