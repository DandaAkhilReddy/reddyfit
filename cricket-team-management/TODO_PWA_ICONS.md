# PWA Icons - Action Required

## 📱 Missing PWA Icons

The PWA manifest references two PNG icons that need to be created:

1. **pwa-192x192.png** - 192x192 pixels
2. **pwa-512x512.png** - 512x512 pixels

## 🎨 Icon Design

A placeholder SVG icon has been created at:
```
/public/islanders-icon.svg
```

This SVG features:
- Gradient background (Island Blue #0066CC → Cricket Green #228B22)
- White cricket ball with red seam
- Golden "I" for Islanders
- Clean, modern design

## 🛠️ How to Generate PNG Icons

### Option 1: Use PWA Builder (Recommended)
1. Visit https://www.pwabuilder.com/imageGenerator
2. Upload the `/public/islanders-icon.svg` file
3. Select "Generate Icons"
4. Download the generated `pwa-192x192.png` and `pwa-512x512.png`
5. Place them in `/public/` directory

### Option 2: Use Figma/Photoshop
1. Open the SVG in Figma or Photoshop
2. Export as PNG:
   - 192x192px (for mobile)
   - 512x512px (for high-res displays)
3. Save as `pwa-192x192.png` and `pwa-512x512.png`
4. Place in `/public/` directory

### Option 3: Use ImageMagick (Command Line)
```bash
# Convert SVG to 192x192 PNG
magick convert -background none -resize 192x192 public/islanders-icon.svg public/pwa-192x192.png

# Convert SVG to 512x512 PNG
magick convert -background none -resize 512x512 public/islanders-icon.svg public/pwa-512x512.png
```

## ✅ Verification

After adding the PNG files:
1. Restart the dev server: `npm run dev`
2. Open Chrome DevTools
3. Go to Application > Manifest
4. Check that both icons load correctly
5. Try installing the PWA

## 🎯 Final Structure

```
/public
  ├── islanders-icon.svg     ✅ Created
  ├── pwa-192x192.png        ❌ TODO
  └── pwa-512x512.png        ❌ TODO
```

Once these icons are added, the PWA will be fully functional and installable on all devices!
