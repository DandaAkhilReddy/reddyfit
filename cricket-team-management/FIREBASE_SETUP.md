# Firebase Setup for Islanders Cricket Club

## Step 1: Enable Google Sign-In

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: `islanderscricketclub`
3. Go to **Authentication** → **Sign-in method**
4. Click **Google** → **Enable** → Save

## Step 2: Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **Start in production mode**
3. Select location: `us-central` (or nearest)
4. Click **Enable**

## Step 3: Deploy Security Rules

See `firestore.rules` in this repository.

Deploy via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

## Step 4: Create Admin User

After first Google Sign-In:
1. Go to Firestore Database
2. Navigate to `users` collection
3. Find your user document
4. Edit field: `role` → change to `"admin"`
5. Save

Now you have admin access!

## Environment Variables

Already configured in `.env`:
- ✓ Firebase credentials
- ✓ Claude API key
- ✓ CodeRabbit API key

## Test Authentication

1. Run: `npm run dev`
2. Go to: http://localhost:6001/login
3. Click "Continue with Google"
4. Sign in → Redirected to /profile

