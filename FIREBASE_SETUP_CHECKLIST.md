# 🔥 Firebase Console Setup - Step by Step

## ✅ Azure Environment Variables Updated!

Your Azure Static Web App now has all the new Firebase credentials configured.

---

## 📋 NEXT: Configure Firebase Console (5 minutes)

### **Open Firebase Console:**
```
https://console.firebase.google.com
```

Select project: **islanderscricketclub**

---

## **Step 1: Enable Authentication** ⚡

1. Click **"Authentication"** in left sidebar
2. Click **"Get started"**
3. Click **"Email/Password"** provider
4. Toggle **Enable** switch ON
5. Click **"Save"**

✅ Authentication is now enabled!

---

## **Step 2: Add Authorized Domain** 🌐

Still in Authentication:

1. Click **"Settings"** tab (at top)
2. Scroll to **"Authorized domains"** section
3. Click **"Add domain"** button
4. Enter: `jolly-dune-0ebf93610.3.azurestaticapps.net`
5. Click **"Add"**

✅ Your Azure domain is now authorized!

---

## **Step 3: Enable Firestore Database** 💾

1. Click **"Firestore Database"** in left sidebar
2. Click **"Create database"**
3. Select: **"Start in production mode"**
4. Click **"Next"**
5. Choose location: **nam5 (us-central)** (or closest)
6. Click **"Enable"**
7. Wait ~30 seconds for database creation

✅ Firestore is now enabled!

---

## **Step 4: Configure Firestore Rules** 🔒

After database is created:

1. You'll see the Firestore console
2. Click **"Rules"** tab at top
3. Replace ALL existing rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Meal logs - users can only read/write their own meals
    match /mealLogs/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Nutrition profiles - users can only read/write their own profile
    match /nutritionProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Weekly deficit tracking - users can only read/write their own data
    match /weeklyDeficits/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. Click **"Publish"**
5. Confirm by clicking **"Publish"** again

✅ Firestore security rules configured!

---

## **Step 5: Enable Storage (Optional)** 📸

For meal photo uploads:

1. Click **"Storage"** in left sidebar
2. Click **"Get started"**
3. Click **"Next"** (keep default rules for now)
4. Choose same location as Firestore
5. Click **"Done"**

✅ Storage enabled!

---

## **✅ SETUP COMPLETE!**

All Firebase services are now configured!

---

## **🧪 TEST YOUR APP**

### **Open Your Live App:**
```
https://jolly-dune-0ebf93610.3.azurestaticapps.net
```

### **Test These Features:**

1. **Sign Up:**
   - Click "Sign Up"
   - Enter email and password
   - Should create account successfully

2. **Sign In:**
   - Use credentials you just created
   - Should log in without errors

3. **Upload Meal Photo:**
   - Click "Take Photo" or "Choose Photo"
   - Select a food image
   - Should analyze with Gemini AI

4. **View Dashboard:**
   - Check nutrition data displays
   - Verify meal logs save
   - See recommendations

5. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Should see no Firebase errors

---

## **🎯 SUCCESS CRITERIA**

✅ Can sign up with email/password
✅ Can sign in without errors
✅ Can upload meal photos
✅ AI analyzes meals correctly
✅ Data saves to Firestore
✅ Dashboard shows all features
✅ No console errors

---

## **🆘 TROUBLESHOOTING**

### **Can't Sign Up:**
- Verify Authentication is enabled in Firebase
- Check Email/Password provider is ON
- Clear browser cache and try again

### **Auth Domain Error:**
- Verify `jolly-dune-0ebf93610.3.azurestaticapps.net` is in Authorized domains
- Check spelling exactly matches

### **Database Permission Denied:**
- Verify Firestore rules are published
- Make sure you're signed in
- Check user ID matches in rules

### **Photos Not Uploading:**
- Enable Storage in Firebase Console
- Check CORS settings if needed
- Verify Gemini API key is set in Azure

---

## **📊 Firebase Console Quick Links**

- **Authentication:** https://console.firebase.google.com/project/islanderscricketclub/authentication
- **Firestore:** https://console.firebase.google.com/project/islanderscricketclub/firestore
- **Storage:** https://console.firebase.google.com/project/islanderscricketclub/storage
- **Settings:** https://console.firebase.google.com/project/islanderscricketclub/settings/general

---

## **🎉 YOU'RE DONE!**

Your Smart Nutrition Coach is now:
- ✅ Connected to new Firebase project
- ✅ Environment variables configured
- ✅ Authentication enabled
- ✅ Firestore database ready
- ✅ Security rules set
- ✅ Ready for users!

**Go test your app now!** 🚀📱

---

**App URL:** https://jolly-dune-0ebf93610.3.azurestaticapps.net
