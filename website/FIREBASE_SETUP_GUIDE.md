# 🔥 Firebase Setup for ReddyFit Waitlist (5 minutes)

## Why You Need This
The waitlist uses Firebase for:
- **Google Sign-In** - One-click authentication
- **Firestore Database** - Store user signups
- **Security** - Prevent duplicate signups and unauthorized access

---

## Step-by-Step Setup

### Step 1: Create Firebase Project (2 min)

1. **Go to Firebase Console**
   - Open: https://console.firebase.google.com
   - Click "Add project" or "Create a project"

2. **Configure Project**
   - **Project name**: `reddyfit-waitlist` (or any name you prefer)
   - **Google Analytics**: Toggle OFF (not needed for waitlist)
   - Click "Create project"
   - Wait 30-60 seconds for project creation
   - Click "Continue" when ready

---

### Step 2: Enable Google Authentication (1 min)

1. **Navigate to Authentication**
   - In left sidebar, click **"Authentication"**
   - Click "Get started" (if first time)

2. **Enable Google Sign-In**
   - Go to **"Sign-in method"** tab
   - Find "Google" in the list
   - Click the **pencil icon** or "Google" row
   - Toggle **"Enable"** to ON
   - **Support email**: Enter your email (e.g., akhilreddyd3@gmail.com)
   - Click **"Save"**

3. **Add Authorized Domains** (Important!)
   - Still in Sign-in method tab, scroll to **"Authorized domains"**
   - By default, `localhost` is already added (for local testing)
   - After deploying to Vercel, you'll add your production domain here
   - Example: `reddyfit-website.vercel.app`

---

### Step 3: Create Firestore Database (2 min)

1. **Navigate to Firestore**
   - In left sidebar, click **"Firestore Database"**
   - Click "Create database"

2. **Database Configuration**
   - **Location**: Choose closest to your users
     - `us-central` (US users)
     - `europe-west` (EU users)
     - `asia-northeast` (Asia users)
   - Click "Next"

3. **Security Rules**
   - Select **"Start in production mode"**
   - Click "Create"
   - Wait for database creation (~30 seconds)

4. **Set Custom Security Rules**
   - Once database is created, go to **"Rules"** tab
   - Replace the default rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Waitlist collection - users can only write their own document
    match /waitlist/{userId} {
      // Anyone authenticated can read (for admin dashboard)
      allow read: if request.auth != null;

      // Users can only create/update their own document
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

   - Click **"Publish"**
   - **Important**: These rules prevent spam and ensure users can only sign up once

---

### Step 4: Get Firebase Configuration (1 min)

1. **Add Web App**
   - Go to **Project Settings** (gear icon in left sidebar)
   - Scroll to "Your apps" section
   - Click the **web icon** `</>`
   - **App nickname**: `ReddyFit Waitlist Web`
   - **Firebase Hosting**: Leave unchecked
   - Click "Register app"

2. **Copy Configuration Values**
   - You'll see a `firebaseConfig` object
   - **IMPORTANT**: Copy these values - you'll need them in a moment

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBxxx...",              // Copy this
  authDomain: "reddyfit-waitlist.firebaseapp.com",  // Copy this
  projectId: "reddyfit-waitlist",      // Copy this
  storageBucket: "reddyfit-waitlist.appspot.com",   // Copy this
  messagingSenderId: "123456789",      // Copy this
  appId: "1:123456789:web:abc123"      // Copy this
};
```

3. **Keep This Window Open** - You'll use these values in the next step

---

## ✅ Firebase Setup Complete!

You now have:
- ✅ Firebase project created
- ✅ Google Authentication enabled
- ✅ Firestore database with security rules
- ✅ Web app configuration values

---

## 🔑 What You Got

Save these values somewhere safe:

| Variable | Example Value | Where to Use |
|----------|---------------|--------------|
| `apiKey` | `AIzaSyBxxx...` | .env.local |
| `authDomain` | `reddyfit-waitlist.firebaseapp.com` | .env.local |
| `projectId` | `reddyfit-waitlist` | .env.local |
| `storageBucket` | `reddyfit-waitlist.appspot.com` | .env.local |
| `messagingSenderId` | `123456789` | .env.local |
| `appId` | `1:123456789:web:abc123` | .env.local |

---

## 📝 Next Step

Continue to **RESEND_SETUP_GUIDE.md** to set up email notifications!

---

## 🐛 Troubleshooting

### "Google sign-in is not enabled"
- Solution: Go back to Authentication → Sign-in method → Enable Google

### "Permission denied" when signing up
- Solution: Check Firestore Rules are set correctly (Step 3.4)

### "Invalid API key"
- Solution: Double-check you copied the apiKey correctly from Firebase config

### After deployment: "This domain is not authorized"
- Solution: Add your Vercel domain to Firebase Console → Authentication → Settings → Authorized domains

---

## 🎉 Success Indicators

You've set up Firebase correctly if:
- ✅ You can see "Authentication" and "Firestore Database" in Firebase Console
- ✅ Google is enabled as a sign-in provider
- ✅ Firestore database shows "Rules" tab with custom rules
- ✅ You have all 6 configuration values copied

**Estimated time to complete**: 5 minutes

Next: Set up Resend for email notifications →
