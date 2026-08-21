const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

// Test function to read QR code data
async function testQRCode(filePath) {
  try {
    const fileData = fs.readFileSync(filePath);
    const base64 = fileData.toString('base64');
    
    // For verification, just check file exists and size
    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      size: stats.size,
      exists: true
    };
  } catch (err) {
    return { path: filePath, exists: false, error: err.message };
  }
}

// Test a few QR codes
(async () => {
  const testFiles = [
    'public/generated-qr/fire-alarm/zona-1.png',
    'public/generated-qr/hydrant/hydrant-1.png',
    'public/generated-qr/apar/area-kantin.png',
    'public/generated-qr/toilet/toilet-a.png',
    'public/generated-qr/panel/PANEL%20A.png'
  ];
  
  console.log('\n QR Code File Verification');
  console.log('=' * 50);
  
  for (const file of testFiles) {
    const result = await testQRCode(file);
    if (result.exists) {
      console.log(\ \ (\ bytes)\);
    } else {
      console.log(\ \ - Not found\);
    }
  }
})();
