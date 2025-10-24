# 🔒 Firebase Storage Rules

## Storage Rules for Smart Nutrition Coach

Use these rules in Firebase Storage to allow users to upload meal photos:

### **Copy-Paste These Rules:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Meal photos - users can only upload to their own folder
    match /mealPhotos/{userId}/{allPaths=**} {
      // Allow read if authenticated and it's their photo
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Allow write (create/update/delete) if authenticated and it's their folder
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024  // Max 10MB
                   && request.resource.contentType.matches('image/.*');  // Only images
    }
    
    // User profile photos (optional)
    match /profilePhotos/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024  // Max 5MB
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## 🔑 What These Rules Do

### **Security Features:**
- ✅ Users can only upload to their own folder (`/mealPhotos/{userId}/`)
- ✅ Users can only read their own photos
- ✅ Maximum file size: 10MB per photo
- ✅ Only image files allowed (jpg, png, etc.)
- ✅ Authentication required for all operations

### **File Organization:**
```
storage/
├── mealPhotos/
│   ├── user123/
│   │   ├── meal_2025-01-01_001.jpg
│   │   ├── meal_2025-01-01_002.jpg
│   │   └── ...
│   ├── user456/
│   │   └── ...
└── profilePhotos/
    ├── user123.jpg
    └── user456.jpg
```

---

## 📋 How to Apply These Rules

1. **Go to Firebase Console:**
   - Open: https://console.firebase.google.com
   - Select: `islanderscricketclub`

2. **Navigate to Storage:**
   - Click **"Storage"** in left sidebar
   - Click **"Rules"** tab at top

3. **Replace Rules:**
   - Delete all existing rules
   - Paste the rules above
   - Click **"Publish"**

4. **Confirm:**
   - You'll see "Rules published successfully"
   - ✅ Done!

---

## ✅ You're All Set!

Your Firebase is now fully configured:
- ✅ Authentication enabled
- ✅ Azure domain authorized
- ✅ Firestore database enabled
- ✅ Firestore rules set
- ✅ Storage enabled
- ✅ Storage rules set

**Everything is ready!** 🎉
