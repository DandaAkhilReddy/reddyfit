import sharp from 'sharp';
import fs from 'fs';

const svgBuffer = fs.readFileSync('public/islanders-icon.svg');

// Generate 192x192
await sharp(svgBuffer)
  .resize(192, 192)
  .png()
  .toFile('public/pwa-192x192.png');
console.log('✓ Generated pwa-192x192.png');

// Generate 512x512
await sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile('public/pwa-512x512.png');
console.log('✓ Generated pwa-512x512.png');
