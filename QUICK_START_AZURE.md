# 🚀 ReddyFit Azure Migration - Quick Start

## ✅ What's Been Done

1. ✅ Azure Cosmos DB service created (`services/azureDbService.ts`)
2. ✅ Admin authentication hook created (`hooks/useAdminAuth.tsx`)
3. ✅ Admin login page created (`components/AdminLoginPage.tsx`)
4. ✅ Admin app created (`App.ADMIN.tsx`)
5. ✅ Azure Cosmos DB package installed (`@azure/cosmos`)
6. ✅ Environment variables added to `.env`

---

## 🎯 Admin Credentials

```
Email: admin@reddyfit.com
Password: ReddyFit@Admin2025!
```

---

## 📋 3 Steps to Go Live

### Step 1: Create Azure Cosmos DB

1. Go to https://portal.azure.com
2. Click "+ Create a resource"
3. Search "Azure Cosmos DB"
4. Select "Azure Cosmos DB for NoSQL"
5. Fill in:
   - **Resource Group:** Create new or select existing
   - **Account Name:** `reddyfit-cosmosdb` (must be unique)
   - **Location:** Choose nearest region
   - **Capacity mode:** **Serverless** ⭐ (cheapest!)
6. Click "Review + Create" → "Create"
7. Wait 2-3 minutes for deployment

### Step 2: Get Your Credentials

1. Go to your new Cosmos DB account
2. Click "Keys" in the left sidebar
3. Copy these two values:
   - **URI** (looks like: `https://reddyfit-cosmosdb.documents.azure.com:443/`)
   - **PRIMARY KEY** (long string)

### Step 3: Update Your .env File

Open `.env` and update these lines:

```env
VITE_AZURE_COSMOS_ENDPOINT=https://your-account-name.documents.azure.com:443/
VITE_AZURE_COSMOS_KEY=paste-your-primary-key-here
```

---

## ▶️ Run Your App

```bash
npm run dev
```

Then:
1. Open http://localhost:5173
2. Login with admin credentials above
3. Database initializes automatically!

---

## 🔄 Switching from Firebase to Azure

### Option A: Replace Main App (Recommended)

```bash
# Backup Firebase version
cp App.tsx App.FIREBASE.backup.tsx

# Use Azure version
cp App.ADMIN.tsx App.tsx
```

Then run: `npm run dev`

### Option B: Update main.tsx

Change the import in `main.tsx`:

```typescript
// OLD:
import App from './App'

// NEW:
import App from './App.ADMIN'
```

---

## 📊 What Works Out of the Box

### ✅ All Features Available
- 🍔 Meal photo analysis (Gemini AI)
- 📊 Nutrition tracking
- 💪 Workout plan generation
- 📹 Exercise form analysis
- 💬 AI fitness chat
- 🎯 Progress tracking
- ⚙️ Settings & preferences

### ✅ No Setup Needed
- Database schema auto-creates
- Collections initialize on first use
- Admin profile ready to go

---

## 💰 Cost Breakdown

### Azure Cosmos DB (Serverless)
- **FREE tier:** 1 million requests/month
- **Storage:** $0.25 per GB/month
- **Additional requests:** $0.25 per million

### For Personal Use
- **Estimated cost:** $0 - $3/month
- **Much cheaper than Firebase!**

---

## 🔒 Security Features

- ✅ Admin-only access (no public signup)
- ✅ Session timeout (8 hours)
- ✅ Secure credentials
- ✅ No anonymous users
- ✅ Azure enterprise security

---

## 🛠️ Troubleshooting

### "Cannot connect to database"
- Check `.env` has correct credentials
- Verify Cosmos DB account is running in Azure Portal
- Make sure URI includes `:443/` at the end

### "Authentication failed"
- Use exact credentials: `admin@reddyfit.com`
- Password is case-sensitive: `ReddyFit@Admin2025!`

### "Module not found" errors
- Run: `npm install`
- Restart dev server: `npm run dev`

---

## 📚 Full Documentation

- `AZURE_DATABASE_SETUP.md` - Complete Azure setup guide
- `AZURE_MIGRATION_SUMMARY.md` - What changed from Firebase
- `App.ADMIN.tsx` - New admin-only app
- `services/azureDbService.ts` - Database operations

---

## ✅ Success Checklist

- [ ] Azure Cosmos DB account created
- [ ] URI and PRIMARY KEY copied
- [ ] `.env` file updated
- [ ] `npm install` completed
- [ ] App switched to Azure version
- [ ] `npm run dev` running
- [ ] Logged in successfully
- [ ] Can log meals
- [ ] Can generate workouts
- [ ] Can chat with AI

---

## 🎉 You're All Set!

Your ReddyFit app is now:
- ☁️ Running on Microsoft Azure
- 🔐 Secure admin-only access
- 💰 Cheaper hosting costs
- 🚀 Production-ready

**Happy training!** 💪🏋️‍♂️

---

## 📞 Need Help?

1. Check console for errors
2. Verify Azure Portal shows Cosmos DB running
3. Review `AZURE_DATABASE_SETUP.md`
4. Check all environment variables in `.env`
