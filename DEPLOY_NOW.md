# 🚀 Deploy ReddyFit to Azure - Quick Steps

## ✅ Build Successful!

Your app built successfully! You're ready to deploy.

---

## 🎯 **FASTEST Way: Azure Portal (10 minutes)**

### Step 1: Push to GitHub (if not already)

```bash
# Check if you have a git repo
git status

# If not initialized:
git init
git add .
git commit -m "Ready for Azure deployment"

# Create new repo on GitHub (https://github.com/new)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/reddyfit.git
git branch -M main
git push -u origin main
```

### Step 2: Create Azure Static Web App

1. **Go to:** https://portal.azure.com
2. **Click:** "+ Create a resource"
3. **Search:** "Static Web App"
4. **Click:** "Create"

### Step 3: Fill In Details

**Basics:**
- Subscription: (Your subscription)
- Resource Group: Create new → `ReddyFit-RG`
- Name: `reddyfit-app` (or any unique name)
- Plan type: **Free** ⭐
- Region: `East US 2` (or nearest)

**Deployment:**
- Source: **GitHub**
- Sign in to GitHub
- Organization: (Your GitHub username)
- Repository: Select your repo
- Branch: `main`

**Build:**
- Build Presets: **Vite**
- App location: `/`
- Api location: (leave empty)
- Output location: `dist`

### Step 4: Create & Wait

- Click **"Review + create"**
- Click **"Create"**
- Wait 2-3 minutes ☕

### Step 5: Add Environment Variables

After deployment completes:

1. Go to your Static Web App resource
2. Click **"Configuration"** (left menu)
3. Click **"+ Add"** for each variable:

```
Name: VITE_GEMINI_API_KEY
Value: AIzaSyAp25CMazDf7NbTCl9-1sf4FZ8nl4Lk_7Y

Name: VITE_AZURE_COSMOS_ENDPOINT  
Value: (your Cosmos DB endpoint)

Name: VITE_AZURE_COSMOS_KEY
Value: (your Cosmos DB key)

Name: VITE_ADMIN_EMAIL
Value: admin@reddyfit.com

Name: VITE_ADMIN_PASSWORD
Value: ReddyFit@Admin2025!
```

4. Click **"Save"**

### Step 6: Trigger Rebuild

```bash
# Push an empty commit to trigger rebuild with env vars
git commit --allow-empty -m "Add environment variables"
git push
```

### Step 7: Done! 🎉

Your app will be live at:
```
https://reddyfit-app.azurestaticapps.net
```

(Check Azure Portal for exact URL)

---

## 🎯 **Alternative: Azure CLI (For Developers)**

### Prerequisites

```bash
# Install Azure CLI (if not installed)
# Download: https://aka.ms/installazurecliwindows
```

### Deploy Steps

```bash
# 1. Login to Azure
az login

# 2. Create resource group
az group create --name ReddyFit-RG --location eastus2

# 3. Create Static Web App with GitHub
az staticwebapp create \
  --name reddyfit-app \
  --resource-group ReddyFit-RG \
  --source https://github.com/YOUR_USERNAME/reddyfit \
  --location eastus2 \
  --branch main \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github

# 4. Set environment variables
az staticwebapp appsettings set \
  --name reddyfit-app \
  --resource-group ReddyFit-RG \
  --setting-names \
    VITE_GEMINI_API_KEY="your-key" \
    VITE_AZURE_COSMOS_ENDPOINT="your-endpoint" \
    VITE_AZURE_COSMOS_KEY="your-key"
```

---

## 🎯 **VS Code Extension (Easiest)**

### Steps

1. **Install Extension:**
   - Open VS Code
   - Search: "Azure Static Web Apps"
   - Install

2. **Sign In:**
   - Click Azure icon in sidebar
   - Sign in to Azure account

3. **Deploy:**
   - Right-click project folder
   - Select "Deploy to Static Web App"
   - Choose "Create new Static Web App"
   - Follow prompts:
     - Name: `reddyfit-app`
     - Region: `East US 2`
     - Build preset: **Vite**
     - App location: `/`
     - Build location: `dist`

4. **Add Environment Variables:**
   - Right-click your app in Azure sidebar
   - Select "Application Settings"
   - Add variables

5. **Done!** URL shown in output

---

## 📋 **Pre-Deployment Checklist**

Before deploying, make sure:

- [x] ✅ App builds successfully (`npm run build` - DONE!)
- [ ] 📦 Code pushed to GitHub
- [ ] ☁️ Azure account ready
- [ ] 🔑 Gemini API key ready
- [ ] 💾 Azure Cosmos DB created (optional for testing)
- [ ] 🔐 Admin credentials configured

---

## 🔧 **After Deployment**

### Test Your App

1. Visit your Azure Static Web App URL
2. Login with admin credentials
3. Test video upload feature
4. Test nutrition tracking
5. Check browser console for errors

### Monitor Deployment

- **GitHub Actions:** Check `.github/workflows/` for build status
- **Azure Portal:** Monitor deployment logs
- **Application Insights:** Set up for analytics (optional)

---

## 💰 **Cost Summary**

Your deployment will cost:

**Azure Static Web Apps (Free Tier):**
- 100 GB bandwidth/month
- 2 custom domains
- Unlimited deployments
- **Cost:** $0/month

**Azure Cosmos DB (Serverless):**
- First 1M requests free
- ~$0.25 per GB storage
- **Est:** $0-3/month

**Gemini AI:**
- Generous free tier
- **Est:** $0-5/month

**Total: $0-8/month** for complete fitness app!

---

## 🎉 **Your App Features**

Once deployed, users get:

✅ **Video Exercise Extraction**
- Upload workout videos
- AI identifies all exercises
- Sets, reps, muscle groups
- Form analysis
- Calorie estimation

✅ **Complete Nutrition Tracking**
- Upload food photos
- Complete macro breakdown
- ALL vitamins (A, C, D, E, K, B1-B12, Folate)
- ALL minerals (Ca, Fe, Mg, Zn, etc.)
- Nutrition score
- Daily progress tracking

---

## 🔍 **Troubleshooting**

### Build Failed?
```bash
# Clear and rebuild
npm cache clean --force
rm -rf node_modules dist
npm install
npm run build
```

### Can't Push to GitHub?
```bash
# Check remote
git remote -v

# If no remote, add it
git remote add origin https://github.com/YOUR_USERNAME/reddyfit.git
```

### Environment Variables Not Working?
- Make sure they start with `VITE_`
- Save in Azure Portal Configuration
- Trigger new deployment (empty commit + push)
- Wait 2-3 minutes for rebuild

### 404 on Page Refresh?
- Azure Static Web Apps handles this automatically
- Check `staticwebapp.config.json` exists
- Verify `navigationFallback` is set

---

## 📞 **Need Help?**

### Resources
- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [GitHub Actions Guide](https://docs.github.com/actions)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy)

### Common Issues
1. **Build fails:** Check Node version (18+)
2. **Blank page:** Verify output location is `dist`
3. **API errors:** Check environment variables
4. **GitHub connection:** Re-authorize in Azure Portal

---

## ✅ **Quick Command Reference**

```bash
# Build app
npm run build

# Test build locally
npm run preview

# Push to GitHub
git add .
git commit -m "Deploy to Azure"
git push

# Check deployment status
# Visit: https://github.com/YOUR_USERNAME/reddyfit/actions
```

---

## 🎊 **You're Ready!**

**Current Status:**
- ✅ App builds successfully
- ✅ Simplified to 2 core features
- ✅ Azure configuration ready
- ✅ Environment variables documented
- ✅ Deployment guide complete

**Next Steps:**
1. Push code to GitHub (if not done)
2. Create Azure Static Web App (10 minutes)
3. Add environment variables
4. Your app is LIVE! 🚀

**Your URL will be:**
```
https://YOUR-APP-NAME.azurestaticapps.net
```

---

**🎉 Deploy now and get your fitness app online!**

**Estimated time:** 10-15 minutes  
**Cost:** $0-8/month  
**Difficulty:** Easy with Azure Portal
