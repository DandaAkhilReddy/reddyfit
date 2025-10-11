# ReddyFit Waitlist Setup Guide

## ✅ What's Been Built

A complete waitlist system with:
- ✅ Google Sign-In authentication
- ✅ Beautiful landing page at `/waitlist`
- ✅ Automatic email notifications
- ✅ Success page with confetti animation
- ✅ Admin dashboard at `/admin/waitlist`
- ✅ CSV export functionality
- ✅ Tier selection (Starter/Pro/Elite/Platinum)
- ✅ Firebase Firestore storage
- ✅ Duplicate prevention
- ✅ Mobile responsive design

---

## 🚀 Quick Setup (15 minutes)

### Step 1: Set Up Firebase (5 min)

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Click "Add project"
   - Name: `reddyfit-waitlist`
   - Disable Google Analytics (optional)
   - Click "Create project"

2. **Enable Google Authentication**
   - In Firebase Console, go to **Authentication** → **Sign-in method**
   - Click **Google**
   - Toggle **Enable**
   - Enter support email
   - Click **Save**

3. **Create Firestore Database**
   - Go to **Firestore Database**
   - Click **Create database**
   - Choose **Start in production mode**
   - Select location (closest to your users)
   - Click **Enable**

4. **Get Firebase Config**
   - Go to **Project Settings** (gear icon)
   - Scroll to "Your apps"
   - Click web icon (</>) to add web app
   - Name: `ReddyFit Waitlist`
   - Copy the config values

5. **Set Firestore Rules**
   - Go to **Firestore Database** → **Rules**
   - Replace with:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /waitlist/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
   - Click **Publish**

### Step 2: Set Up Resend (5 min)

1. **Create Resend Account**
   - Go to https://resend.com
   - Sign up (free tier: 3,000 emails/month)
   - Verify your email

2. **Get API Key**
   - Go to https://resend.com/api-keys
   - Click **Create API Key**
   - Name: `ReddyFit Waitlist`
   - Copy the API key (starts with `re_`)

3. **Verify Domain (Optional but Recommended)**
   - Go to https://resend.com/domains
   - Add your domain
   - Add DNS records
   - Wait for verification
   - Update `from` address in `/app/api/waitlist/route.ts`

### Step 3: Configure Environment Variables (2 min)

1. **Create `.env.local` file**
   ```bash
   cd website
   cp .env.example .env.local
   ```

2. **Fill in values from Step 1 & 2**
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=reddyfit-waitlist.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=reddyfit-waitlist
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=reddyfit-waitlist.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

   # Resend Email API Key
   RESEND_API_KEY=re_your_api_key_here

   # Production URL
   NEXT_PUBLIC_SITE_URL=https://reddyfit.vercel.app
   ```

### Step 4: Install Missing Dependency (1 min)

```bash
cd website
npm install canvas-confetti
npm install @types/canvas-confetti --save-dev
```

### Step 5: Test Locally (2 min)

```bash
npm run dev
```

Visit:
- Waitlist page: http://localhost:3001/waitlist
- Admin dashboard: http://localhost:3001/admin/waitlist

**Test flow:**
1. Go to `/waitlist`
2. Select a tier
3. Click "Join Waitlist with Google"
4. Sign in with Google
5. Check your email for welcome message
6. See success page with confetti
7. Go to `/admin/waitlist` to see your signup

---

## 📧 Email Configuration

### Using Your Own Domain (Production)

Update `/app/api/waitlist/route.ts` line 45:
```typescript
from: 'ReddyFit <waitlist@yourdomain.com>',  // Use your verified domain
```

### Email Template Customization

Edit `/lib/email.ts` to customize:
- Email design and colors
- Welcome message content
- Social media links
- Call-to-action buttons

---

## 🎨 Customization

### Change Tier Options

Edit `/app/waitlist/page.tsx` line 33:
```typescript
const tiers = [
  { id: 'starter', name: 'Starter', price: '$29', description: 'Manual entry' },
  // Add or remove tiers here
]
```

### Modify Success Page

Edit `/app/waitlist/success/page.tsx` to:
- Change confetti settings
- Update benefit list
- Customize social links
- Change redirect behavior

### Admin Dashboard Access

**Add authentication (recommended for production):**

1. Install NextAuth:
```bash
npm install next-auth
```

2. Create `/app/api/auth/[...nextauth]/route.ts`
3. Wrap admin dashboard with session check
4. Only allow specific emails to access

---

## 🚀 Deploy to Production

### Option 1: Vercel (Recommended)

```bash
cd website

# Add environment variables to Vercel
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
vercel env add RESEND_API_KEY

# Deploy
vercel --prod
```

### Option 2: Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Go to **Settings** → **Environment Variables**
4. Add all variables from `.env.local`
5. Click **Deploy**

---

## 📊 Admin Dashboard Features

Access at: `/admin/waitlist`

**Features:**
- ✅ View all signups in real-time
- ✅ See tier distribution
- ✅ Export to CSV for email campaigns
- ✅ Refresh data button
- ✅ User photos and details
- ✅ Signup dates
- ✅ Email notification status

**CSV Export includes:**
- Name
- Email
- Tier preference
- Signup date
- Notification status

---

## 🔒 Security Considerations

### Production Checklist

- [ ] **Enable Firebase App Check** (prevent API abuse)
- [ ] **Add rate limiting** to API route
- [ ] **Authenticate admin dashboard** with NextAuth
- [ ] **Use environment variables** (never commit `.env.local`)
- [ ] **Verify Resend domain** for better deliverability
- [ ] **Add CAPTCHA** to prevent spam signups
- [ ] **Enable Firebase Security Rules** (already configured)

### Firebase Security Rules

Current rules (already set):
```javascript
match /waitlist/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

This ensures:
- Only authenticated users can sign up
- Users can only create their own document
- Prevents duplicate signups

---

## 📈 Analytics & Tracking

### Track Signups with Google Analytics

Add to `/app/waitlist/page.tsx`:
```typescript
// After successful signup
if (window.gtag) {
  window.gtag('event', 'waitlist_signup', {
    tier: selectedTier,
    user_id: user.uid
  })
}
```

### Track Email Opens

Resend provides:
- Email delivery status
- Open rates
- Click tracking
- Bounce monitoring

Access at: https://resend.com/emails

---

## 🎯 Marketing Tips

### Promote Your Waitlist

1. **Add to Homepage**
   - Create a CTA banner
   - Link to `/waitlist`

2. **Social Media**
   - Share waitlist link
   - Offer early bird incentives

3. **Product Hunt**
   - Launch as "Coming Soon"
   - Collect emails via waitlist

4. **Email Signature**
   - Add waitlist link
   - "Join early access"

5. **Reddit/Forums**
   - Share in r/fitness, r/whoop
   - Offer value, not spam

### Incentivize Signups

- ✅ 50% off first month (current)
- Add referral program
- Gamify with countdown
- Limited spots messaging
- Beta tester badges

---

## 🐛 Troubleshooting

### "Failed to sign in with Google"

**Cause:** Firebase Google Auth not enabled

**Solution:**
1. Go to Firebase Console
2. Authentication → Sign-in method
3. Enable Google
4. Add authorized domain

### "Failed to send email"

**Cause:** Invalid Resend API key or unverified domain

**Solution:**
1. Check API key in `.env.local`
2. Verify domain in Resend dashboard
3. Use `onboarding@resend.dev` for testing

### "You're already on the waitlist"

**Cause:** User trying to sign up again

**Solution:** This is intentional! Each Google account can only join once.

### Build errors

**Cause:** Missing dependencies

**Solution:**
```bash
npm install canvas-confetti
npm install @types/canvas-confetti --save-dev
```

---

## 📊 Expected Results

### After 1 Week
- 50-200 signups (with basic promotion)
- 2-5% conversion from website visitors
- High email open rates (60-70% for welcome emails)

### After 1 Month
- 500-1,000 signups (with active marketing)
- Clear tier preference data
- Email list ready for launch campaign

### At Launch
- Send launch email to all waitlist users
- 30-50% conversion from waitlist to paid users
- Strong initial user base

---

## 🎉 You're All Set!

Your waitlist is ready to collect signups!

**Next steps:**
1. Test the complete flow
2. Deploy to Vercel
3. Share the waitlist link
4. Monitor signups in admin dashboard
5. Prepare for launch!

**Waitlist URL:** `https://yoursite.com/waitlist`

Good luck with your launch! 🚀
