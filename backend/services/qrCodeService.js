/**
 * QR Code Generation Service
 * Generates QR codes for receipt verification URLs
 * Uses qrcode library to generate PNG images
 */

const QRCode = require('qrcode');

/**
 * Generate QR code for receipt verification
 * @param {string} verificationUrl - Full URL to verification page
 * @returns {Promise<string>} - Base64 encoded QR code image
 */
exports.generateQRCode = async (verificationUrl) => {
  try {
    if (!verificationUrl) {
      throw new Error('Verification URL is required');
    }

    console.log('🔲 Generating QR code for URL:', verificationUrl);

    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Convert to base64 for embedding in PDF
    const base64QR = qrBuffer.toString('base64');
    console.log('✅ QR code generated successfully');

    return `data:image/png;base64,${base64QR}`;
  } catch (error) {
    console.error('❌ QR code generation error:', error.message);
    throw error;
  }
};

/**
 * Generate QR code and return as buffer (for PDF embedding)
 * @param {string} verificationUrl - Full URL to verification page
 * @returns {Promise<Buffer>} - PNG buffer
 */
exports.generateQRCodeBuffer = async (verificationUrl) => {
  try {
    if (!verificationUrl) {
      throw new Error('Verification URL is required');
    }

    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrBuffer;
  } catch (error) {
    console.error('❌ QR code buffer generation error:', error.message);
    throw error;
  }
};

/**
 * Generate QR code as SVG string (for web display)
 * @param {string} verificationUrl - Full URL to verification page
 * @returns {Promise<string>} - SVG string
 */
exports.generateQRCodeSVG = async (verificationUrl) => {
  try {
    if (!verificationUrl) {
      throw new Error('Verification URL is required');
    }

    const svgString = await QRCode.toString(verificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'svg',
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return svgString;
  } catch (error) {
    console.error('❌ QR code SVG generation error:', error.message);
    throw error;
  }
};
