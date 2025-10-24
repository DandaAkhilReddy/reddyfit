# 🔥 Firebase Project Migration Guide

## ✅ Configuration Updated

Your app has been updated to use the **Islanders Cricket Club** Firebase project!

---

## 🔄 What Was Changed

### **Local Files Updated:**
- ✅ `firebase.ts` - New Firebase config
- ✅ `.env` - New environment variables
- ✅ Build completed successfully

### **New Firebase Project:**
```
Project ID: islanderscricketclub
Auth Domain: islanderscricketclub.firebaseapp.com
Database: https://islanderscricketclub-default-rtdb.firebaseio.com
```

---

## ⚠️ CRITICAL: Azure Configuration Update Required

You must update Azure environment variables manually!

### **Option 1: Azure CLI (Quick)**

```bash
# Update all Firebase variables
az staticwebapp appsettings set \
  --name reddyfit-nutrition-coach \
  --resource-group reddyfit-rg \
  --setting-names \
    VITE_FIREBASE_API_KEY=AIzaSyD2cTI-esBWCUzJlcGlB9FAtAk4z2Y_Rog \
    VITE_FIREBASE_AUTH_DOMAIN=islanderscricketclub.firebaseapp.com \
    VITE_FIREBASE_DATABASE_URL=https://islanderscricketclub-default-rtdb.firebaseio.com \
    VITE_FIREBASE_PROJECT_ID=islanderscricketclub \
    VITE_FIREBASE_STORAGE_BUCKET=islanderscricketclub.firebasestorage.app \
    VITE_FIREBASE_MESSAGING_SENDER_ID=417469597245 \
    VITE_FIREBASE_APP_ID=1:417469597245:web:90a1b1238d33ef218f4c54 \
    VITE_FIREBASE_MEASUREMENT_ID=G-TVQZCZ1QG2
```

### **Option 2: Azure Portal (Manual)**

1. Go to: https://portal.azure.com
2. Navigate to: **Static Web Apps** → **reddyfit-nutrition-coach**
3. Click: **Configuration** (left sidebar)
4. Update each environment variable:

```
VITE_FIREBASE_API_KEY = AIzaSyD2cTI-esBWCUzJlcGlB9FAtAk4z2Y_Rog
VITE_FIREBASE_AUTH_DOMAIN = islanderscricketclub.firebaseapp.com
VITE_FIREBASE_DATABASE_URL = https://islanderscricketclub-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID = islanderscricketclub
VITE_FIREBASE_STORAGE_BUCKET = islanderscricketclub.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 417469597245
VITE_FIREBASE_APP_ID = 1:417469597245:web:90a1b1238d33ef218f4c54
VITE_FIREBASE_MEASUREMENT_ID = G-TVQZCZ1QG2
```

5. Click **Save**
6. Wait for automatic redeployment (~2 minutes)

---

## 🔧 Firebase Console Setup Required

### **1. Enable Authentication**

1. Go to: https://console.firebase.google.com
2. Select: **islanderscricketclub**
3. Click: **Authentication** → **Get Started**
4. Enable: **Email/Password** sign-in method
5. Click: **Save**

### **2. Add Authorized Domain**

1. In Authentication → **Settings** → **Authorized domains**
2. Click: **Add domain**
3. Add: `jolly-dune-0ebf93610.3.azurestaticapps.net`
4. Click: **Add**

### **3. Enable Firestore Database**

1. Click: **Firestore Database** → **Create database**
2. Select: **Start in production mode**
3. Choose location: **us-central** (or closest to you)
4. Click: **Enable**

### **4. Set Firestore Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data - only authenticated users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Meal logs - only authenticated users can read/write their own meals
    match /mealLogs/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Nutrition profiles - only authenticated users can read/write their own profile
    match /nutritionProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Weekly deficits - only authenticated users can read/write their own data
    match /weeklyDeficits/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### **5. Enable Storage (Optional)**

1. Click: **Storage** → **Get started**
2. Select: **Start in production mode**
3. Click: **Done**

---

## 📊 Testing After Migration

### **Local Testing:**

```bash
# Start local dev server
npm run dev
```

1. Open: http://localhost:3007
2. Try sign up / sign in
3. Test all features
4. Check browser console for errors

### **Production Testing:**

After Azure variables are updated:

1. Open: https://jolly-dune-0ebf93610.3.azurestaticapps.net
2. Sign up with new account
3. Test meal photo upload
4. Verify data saves correctly
5. Check all features work

---

## ⚡ Quick Deploy

Push changes to trigger Azure auto-deploy:

```bash
# Already committed locally, just push:
git push origin smart-nutrition-coach
```

Azure will rebuild and deploy in ~3 minutes!

---

## 🔄 Rollback (If Needed)

If you need to go back to the old Firebase project:

### Old Configuration:
```
Project ID: reddyfit-ai-pro (or reddyfitagent)
Auth Domain: reddyfit-ai-pro.firebaseapp.com
API Key: AIzaSyDBJX3kDBgITHUZp3Vr-i-K1yCCWDgA7o4
```

---

## ✅ Migration Checklist

- ✅ Updated firebase.ts
- ✅ Updated .env
- ✅ Build successful
- ✅ Code committed
- ⏳ Push to GitHub (deploy)
- ⚠️ Update Azure environment variables
- ⚠️ Enable Firebase Authentication
- ⚠️ Add Azure domain to Firebase
- ⚠️ Enable Firestore
- ⚠️ Configure Firestore rules
- ⏳ Test on production

---

## 🎯 Next Steps

1. **Now:** Update Azure environment variables (see commands above)
2. **Then:** Configure Firebase (authentication, Firestore, domain)
3. **Finally:** Test your app on production

---

## 🆘 Troubleshooting

### **Auth Errors:**
- Verify Authentication is enabled in Firebase
- Check authorized domains include Azure URL

### **Database Errors:**
- Verify Firestore is enabled
- Check Firestore rules allow authenticated access

### **App Not Working:**
- Verify Azure environment variables are updated
- Check Firebase project settings
- View Azure build logs for errors

---

**Your app is ready to use the new Firebase project!** 🔥🚀
