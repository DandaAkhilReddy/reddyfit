# 🔐 Create .env.local File (2 minutes)

## What is .env.local?
A local environment file that stores your secret credentials safely on your computer.

**NEVER commit this file to Git** - it contains sensitive API keys!

---

## Quick Setup

### Option 1: Interactive Script (Recommended - 1 minute)

Run this PowerShell command in the `website` directory:

```powershell
cd website

# Create .env.local with prompts
@'
Write-Host "=== ReddyFit Waitlist Environment Setup ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "You'll need values from:" -ForegroundColor Yellow
Write-Host "  1. Firebase Console (FIREBASE_SETUP_GUIDE.md)"
Write-Host "  2. Resend Dashboard (RESEND_SETUP_GUIDE.md)"
Write-Host ""

$firebase_api_key = Read-Host "Firebase API Key (AIzaSy...)"
$firebase_auth_domain = Read-Host "Firebase Auth Domain (xxx.firebaseapp.com)"
$firebase_project_id = Read-Host "Firebase Project ID"
$firebase_storage_bucket = Read-Host "Firebase Storage Bucket (xxx.appspot.com)"
$firebase_messaging_sender_id = Read-Host "Firebase Messaging Sender ID (numbers)"
$firebase_app_id = Read-Host "Firebase App ID (1:xxx:web:xxx)"
$resend_api_key = Read-Host "Resend API Key (re_...)"

$env_content = @"
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=$firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=$firebase_app_id

# Resend Email API Key
RESEND_API_KEY=$resend_api_key

# Production URL (change after deploying to Vercel)
NEXT_PUBLIC_SITE_URL=http://localhost:3001
"@

$env_content | Out-File -FilePath ".env.local" -Encoding utf8

Write-Host ""
Write-Host "✅ .env.local created successfully!" -ForegroundColor Green
Write-Host "📁 Location: website/.env.local" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: npm run dev"
Write-Host "  2. Visit: http://localhost:3001/waitlist"
Write-Host "  3. Test Google Sign-In"
'@ | powershell -Command -
```

---

### Option 2: Manual Copy-Paste (2 minutes)

1. **Create the file**
   ```bash
   cd website
   touch .env.local
   # Or create manually in your editor
   ```

2. **Copy this template** and paste into `.env.local`:

```env
# Firebase Configuration (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Resend Email API Key (from Resend Dashboard)
RESEND_API_KEY=re_your_api_key_here

# Production URL (update after deploying to Vercel)
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

3. **Replace placeholder values** with your actual credentials from:
   - Firebase Console (see FIREBASE_SETUP_GUIDE.md)
   - Resend Dashboard (see RESEND_SETUP_GUIDE.md)

---

## ✅ Verification Checklist

Make sure your .env.local has:

| Variable | Format | Example |
|----------|--------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Starts with `AIza` | `AIzaSyBxxx...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Ends with `.firebaseapp.com` | `reddyfit.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your project name | `reddyfit-waitlist` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Ends with `.appspot.com` | `reddyfit.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Only numbers | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Starts with `1:` | `1:123:web:abc` |
| `RESEND_API_KEY` | Starts with `re_` | `re_abc123...` |
| `NEXT_PUBLIC_SITE_URL` | Valid URL | `http://localhost:3001` |

---

## 🛡️ Security Best Practices

### ✅ DO:
- Keep .env.local in `.gitignore` (already configured)
- Store backup of credentials in a password manager
- Use different API keys for development vs production
- Regenerate keys if accidentally exposed

### ❌ DON'T:
- Commit .env.local to Git
- Share your .env.local file
- Post API keys in Discord/Slack/screenshots
- Use production keys in development

---

## 🧪 Test Your Configuration

After creating .env.local:

```bash
cd website

# Start development server
npm run dev
```

**Visit**: http://localhost:3001/waitlist

**Test checklist**:
- [ ] Page loads without errors
- [ ] "Join Waitlist with Google" button appears
- [ ] Can click the button (won't work yet if Firebase not fully configured)
- [ ] No "Firebase not configured" errors in console

---

## 🔄 Update After Vercel Deployment

Once you deploy to Vercel and get your production URL:

1. **Edit .env.local**
   ```env
   NEXT_PUBLIC_SITE_URL=https://reddyfit-website.vercel.app
   ```

2. **Add to Firebase Authorized Domains**
   - Go to Firebase Console
   - Authentication → Settings → Authorized domains
   - Click "Add domain"
   - Enter: `reddyfit-website.vercel.app`
   - Save

3. **Rebuild locally** (if needed):
   ```bash
   npm run build
   ```

---

## 📝 Next Step

Now you're ready to test! Continue to **LOCAL_TESTING_GUIDE.md**

---

## 🐛 Troubleshooting

### "Cannot find module" error
- **Cause**: Next.js can't read .env.local
- **Solution**: Restart dev server (`Ctrl+C`, then `npm run dev`)

### "Invalid API key" error
- **Cause**: Firebase API key is wrong
- **Solution**: Double-check value from Firebase Console
- Remove any quotes or extra spaces

### "Resend not configured" in console
- **Cause**: RESEND_API_KEY missing or incorrect
- **Solution**: Verify API key starts with `re_`
- Restart dev server after editing .env.local

### Env variables not loading
- **Cause**: File encoding or location issue
- **Solution**: Ensure file is named exactly `.env.local` (not `.env.local.txt`)
- Must be in `website/` directory (same level as `package.json`)

---

## 🎉 Success Indicators

You've set up .env.local correctly if:
- ✅ File exists at `website/.env.local`
- ✅ Contains all 8 environment variables
- ✅ All values replaced (no `your_xxx_here` placeholders)
- ✅ Dev server starts without errors
- ✅ Waitlist page loads at http://localhost:3001/waitlist

**Estimated time to complete**: 2 minutes

**Total time so far**: 10 minutes

Next: Test your waitlist locally →
