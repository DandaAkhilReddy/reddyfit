const sharp = require('sharp');
const fs = require('fs');

const svgBuffer = fs.readFileSync('public/islanders-icon.svg');

// Generate 192x192
sharp(svgBuffer)
  .resize(192, 192)
  .png()
  .toFile('public/pwa-192x192.png')
  .then(() => console.log('Generated pwa-192x192.png'))
  .catch(err => console.error('Error generating 192:', err));

// Generate 512x512
sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile('public/pwa-512x512.png')
  .then(() => console.log('Generated pwa-512x512.png'))
  .catch(err => console.error('Error generating 512:', err));
