# 🚀 Smart Waitlist System - Complete Setup Guide

## What You're Building

A viral waitlist system with:
- ✅ Auto-assigned position numbers (#1, #2, #3...)
- ✅ Referral system (move up 10 spots per referral)
- ✅ Tier-based priority (Platinum = top positions)
- ✅ Email notifications with position
- ✅ Social sharing with position
- ✅ Admin analytics dashboard

---

## Step 1: Firebase Setup (5 min)

### 1.1 Create Firebase Project

1. **Go to**: https://console.firebase.google.com
2. **Click**: "Add project"
3. **Project name**: `reddyfit-waitlist`
4. **Google Analytics**: Enable (recommended)
5. **Click**: "Create project"

### 1.2 Enable Google Authentication

1. **In Firebase Console** → **Authentication** (left sidebar)
2. **Click**: "Get started"
3. **Sign-in method** tab
4. **Click**: "Google" provider
5. **Toggle**: Enable
6. **Project support email**: Your email
7. **Click**: "Save"

### 1.3 Create Firestore Database

1. **Firestore Database** (left sidebar)
2. **Click**: "Create database"
3. **Start in**: **Production mode**
4. **Location**: `us-east1` (or closest)
5. **Click**: "Enable"

### 1.4 Set Firestore Security Rules

**Click**: "Rules" tab, paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Waitlist collection
    match /waitlist/{userId} {
      // Users can read their own document
      allow read: if request.auth != null && request.auth.uid == userId;
      // Users can create their document once
      allow create: if request.auth != null && request.auth.uid == userId;
      // Users cannot update (prevents position manipulation)
      allow update: if false;
    }

    // Admin can read all waitlist
    match /waitlist/{userId} {
      allow read: if request.auth != null;
    }

    // Referrals collection
    match /referrals/{referralCode} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Click**: "Publish"

### 1.5 Get Firebase Configuration

1. **Project Settings** (gear icon)
2. **Scroll down** to "Your apps"
3. **Click**: Web icon (`</>`)
4. **App nickname**: `reddyfit-web`
5. **Click**: "Register app"
6. **Copy** the configuration values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "reddyfit-waitlist.firebaseapp.com",
  projectId: "reddyfit-waitlist",
  storageBucket: "reddyfit-waitlist.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123..."
};
```

**Save these values!**

### 1.6 Add Authorized Domain

1. **Authentication** → **Settings** → **Authorized domains**
2. **Click**: "Add domain"
3. **Add**: `salmon-mud-01e8ee30f.2.azurestaticapps.net`
4. **Click**: "Add"

---

## Step 2: Resend Setup (3 min)

### 2.1 Create Resend Account

1. **Go to**: https://resend.com
2. **Click**: "Get Started"
3. **Sign up** with GitHub or email
4. **Verify** email

### 2.2 Get API Key

1. **API Keys** (left sidebar)
2. **Click**: "Create API Key"
3. **Name**: `ReddyFit Waitlist`
4. **Permission**: Full Access
5. **Click**: "Create"
6. **Copy** the API key (starts with `re_`)

**⚠️ Save this key! You won't see it again**

---

## Step 3: Configure Azure Environment Variables (2 min)

Run these commands to add environment variables to Azure:

```bash
# Firebase Config
az staticwebapp appsettings set \
  --name reddyfit-marketing-website \
  --resource-group rg-reddyfit-prod \
  --setting-names \
    NEXT_PUBLIC_FIREBASE_API_KEY="[Your Firebase apiKey]" \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="[Your authDomain]" \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="[Your projectId]" \
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="[Your storageBucket]" \
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="[Your messagingSenderId]" \
    NEXT_PUBLIC_FIREBASE_APP_ID="[Your appId]" \
    RESEND_API_KEY="[Your Resend API key]"
```

**Or set them in Azure Portal**:
1. Go to: https://portal.azure.com
2. Find: `reddyfit-marketing-website`
3. Settings → Configuration
4. Application settings → New application setting
5. Add each variable

---

## Step 4: Test the Waitlist System

### 4.1 Test Signup Flow

1. **Go to**: https://salmon-mud-01e8ee30f.2.azurestaticapps.net/waitlist
2. **Select** a tier (Starter/Pro/Elite/Platinum)
3. **Click**: "Join Waitlist with Google"
4. **Sign in** with Google
5. **Expected**: Redirected to success page showing your position

### 4.2 Check Your Position

Success page should show:
- ✅ "You're #X on the waitlist!"
- ✅ Your tier
- ✅ Referral link
- ✅ Social share buttons

### 4.3 Check Your Email

Within 1-2 minutes:
- ✅ Welcome email received
- ✅ Contains your waitlist position
- ✅ Contains referral link
- ✅ Lists position-based perks

### 4.4 Test Referral System

1. **Copy** your referral link from success page
2. **Open** in incognito/private window
3. **Sign up** with different Google account
4. **Check admin dashboard**: Your referral count increased

### 4.5 Check Admin Dashboard

1. **Go to**: https://salmon-mud-01e8ee30f.2.azurestaticapps.net/admin/waitlist
2. **See**: All signups with positions
3. **See**: Referral counts
4. **Export**: CSV with positions

---

## How It Works

### Position Assignment Logic

```javascript
// Tier-based position ranges
Platinum (most expensive):
  - Positions: 1-100
  - Sorted by signup time

Elite:
  - Positions: 101-500
  - Sorted by signup time

Pro:
  - Positions: 501-2000
  - Sorted by signup time

Starter (cheapest):
  - Positions: 2001+
  - Sorted by signup time
```

### Referral System

Each user gets unique referral code: `reddyfit-ABC123`

**Referral link**: `https://[site]/waitlist?ref=ABC123`

**Benefits**:
- Refer 1 person → Move up 10 positions
- Refer 5 people → Move up 50 positions
- Refer 10 people → Move up 100 positions
- Top 10 referrers → Bonus perks

### Position-Based Perks

**Positions 1-50 (Founders)**:
- Lifetime 50% discount
- Founder badge
- Beta access Week 1
- Exclusive Discord channel
- Direct line to product team

**Positions 51-100**:
- Lifetime 40% discount
- Early Bird badge
- Beta access Week 2
- Priority support

**Positions 101-500**:
- First 3 months 50% off
- Insider badge
- Beta access Week 3

**Positions 501-1000**:
- First month 50% off
- Early Access badge

**Positions 1001+**:
- Early access to all features
- Community badge

---

## Advanced Features

### Social Sharing

Pre-filled messages with position:

**Twitter**:
```
I just joined the @ReddyFit waitlist and I'm #XXX! 🎉

Get your spot before launch → [referral link]

#FitnessTracking #AI #Whoop
```

**LinkedIn**:
```
Excited to be #XXX on the ReddyFit waitlist!

The future of AI-powered fitness tracking is coming.

Join me: [referral link]
```

### Skip-the-Line Option (Future)

Allow users to pay to jump positions:
- $49 → Jump to position #100
- $99 → Jump to position #50
- $299 → Jump to position #10 (Founder tier)

### Email Sequence

**Day 0**: Welcome + position + referral link
**Day 3**: "You moved up!" (if referrals)
**Day 7**: "Help us build ReddyFit" survey
**Day 14**: Progress update + new perks
**Day 21**: "Almost there!" + launch timeline
**Launch**: Tiered access based on position

---

## Monitoring & Analytics

### Key Metrics to Track

**Growth**:
- Total waitlist size
- Signups per day
- Signups per tier
- Viral coefficient (referrals per user)

**Engagement**:
- Email open rates
- Referral link clicks
- Social shares
- Admin dashboard visits

**Conversion**:
- Waitlist → Beta signup
- Beta → Paid user
- Referral conversion rate

### Admin Dashboard Features

**View**:
- All waitlist members with positions
- Sorted by position (ascending)
- Filter by tier
- Search by email or name
- Referral leaderboard

**Export**:
- CSV with all data
- Include: name, email, tier, position, referrals
- Use for email campaigns

**Analytics**:
- Total signups
- Growth chart
- Tier distribution
- Top 10 referrers
- Average referrals per user

---

## Launch Strategy

### Week -4: Soft Launch
- Share with friends and family
- Goal: First 50 signups
- Test all systems

### Week -3: Public Launch
- Share on social media
- Product Hunt "Coming Soon"
- Goal: 500 signups

### Week -2: Growth Phase
- Email existing networks
- Reddit posts (carefully)
- Goal: 1,000 signups

### Week -1: Final Push
- Announce launch date
- Show progress
- Goal: 2,000+ signups

### Launch Day: Tiered Access
- **Day 1**: Invite #1-50 (Founders)
- **Day 3**: Invite #51-100
- **Day 7**: Invite #101-500
- **Day 14**: Invite #501-1000
- **Day 30**: Open to all

---

## Troubleshooting

### Firebase Errors

**"Firebase app not initialized"**:
- Check environment variables in Azure
- Verify all NEXT_PUBLIC_ prefixed variables set

**"Auth domain not authorized"**:
- Add Azure Static Web App URL to Firebase authorized domains

### Resend Errors

**"Missing API key"**:
- Verify RESEND_API_KEY in Azure environment variables

**"Emails not sending"**:
- Check Resend dashboard for errors
- Verify free tier limit (100 emails/day with test domain)

### Position Not Showing

**If position is 0 or undefined**:
- Check Firestore for position field
- Verify API is calculating positions correctly
- Check browser console for errors

---

## 🎉 Success Criteria

Your waitlist is working if:
- ✅ People can sign up with Google
- ✅ Position number assigned immediately
- ✅ Welcome email received with position
- ✅ Referral links working
- ✅ Admin dashboard shows positions
- ✅ Can export CSV with all data

---

## Next Steps

1. **Share** waitlist link on social media
2. **Monitor** admin dashboard daily
3. **Engage** with signups (thank top referrers)
4. **Build** hype leading to launch
5. **Prepare** beta release for top positions

---

**Your smart waitlist is ready to grow itself! 🚀**
