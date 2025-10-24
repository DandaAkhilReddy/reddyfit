# ⚡ Quick Azure Deployment Guide

## 🎯 Current Status

✅ Azure CLI is installed and ready
✅ Login browser window is open
✅ Application is built and configured
✅ Gemini API key is ready

---

## 📋 Complete These Steps

### Step 1: Complete Azure Login (NOW)

**In the browser window that opened:**

1. ✅ Sign in with your Microsoft account
2. ✅ Select your Azure subscription
3. ✅ Wait for "You have logged in" message

**In the terminal:**

1. Look for subscription selection prompt
2. Type the number of your subscription (usually `1`)
3. Press Enter

---

### Step 2: Run Automated Deployment Script

After login completes, run:

```powershell
.\deploy-azure.ps1
```

This script will automatically:
- ✅ Create Azure resource group
- ✅ Build your application  
- ✅ Create Static Web App
- ✅ Connect to GitHub
- ✅ Configure Gemini API key
- ✅ Deploy your app

**Time: ~5 minutes**

---

### Step 3: Manual Deployment (Alternative)

If you prefer manual steps:

#### Create Resource Group:
```bash
az group create --name reddyfit-rg --location eastus
```

#### Build Application:
```bash
npm run build
```

#### Create Static Web App:
```bash
az staticwebapp create --name reddyfit-nutrition-coach --resource-group reddyfit-rg --source https://github.com/DandaAkhilReddy/ReddyFitV2 --branch smart-nutrition-coach --app-location "/" --output-location "dist" --login-with-github
```

#### Add Environment Variable:
```bash
az staticwebapp appsettings set --name reddyfit-nutrition-coach --resource-group reddyfit-rg --setting-names GEMINI_API_KEY=AIzaSyAeiHgMbYdD0BnyKehqc3mOxktCmoLLz9A
```

---

## 🌐 Your Live URL

After deployment completes:

```
https://reddyfit-nutrition-coach.azurestaticapps.net
```

Or a custom URL like:
```
https://[random-name].azurestaticapps.net
```

---

## 📱 Access on Mobile

1. Open your Azure URL on phone
2. Works anywhere in the world! 🌍
3. Add to home screen for PWA experience

---

## 🔧 Post-Deployment

### Firebase Domain Whitelist:

1. Go to: https://console.firebase.google.com
2. Select: **reddyfit-ai-pro**
3. **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add: `reddyfit-nutrition-coach.azurestaticapps.net`
6. Click **Save**

---

## ⚡ Features

Your deployed app includes:

✅ AI Meal Analysis (Gemini)
✅ 13+ Nutrient Tracking
✅ Deficit Detection
✅ Smart Recommendations
✅ Weekly Analytics
✅ Health Impact Stories
✅ Exercise Library
✅ PWA (Installable)
✅ Global CDN
✅ Free HTTPS
✅ Auto-deploy on Git push

---

## 💰 Cost

**Free Tier Includes:**
- 100GB bandwidth/month
- Unlimited sites
- Custom domains
- SSL certificates

**Total: $0/month** 💚

---

## 🎉 You're Ready!

**Just complete the Azure login and run:**
```powershell
.\deploy-azure.ps1
```

**In 5 minutes, your app will be live worldwide!** 🚀🌍

---

**Questions? Check AZURE_DEPLOY.md for full documentation.**
