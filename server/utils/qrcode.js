const QRCode = require('qrcode');

async function generateQRCode(data, options = {}) {
  const defaultOptions = {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    quality: 0.92,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    width: 300
  };

  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(data), mergedOptions);
    return qrDataUrl;
  } catch (err) {
    console.error('QR Code generation error:', err);
    throw err;
  }
}

async function generateEntryQRCode(buildingId, baseUrl) {
  const entryUrl = `${baseUrl}/visitor/check-in/${buildingId}`;
  return await generateQRCode({ type: 'entry', buildingId, url: entryUrl });
}

async function generatePaymentQRCode(paymentData) {
  return await generateQRCode({
    type: 'payment',
    ...paymentData
  });
}

module.exports = { generateQRCode, generateEntryQRCode, generatePaymentQRCode };
