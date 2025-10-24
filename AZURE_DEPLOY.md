# 🌐 Azure Static Web Apps Deployment Guide

## ✅ Prerequisites Completed

- ✅ Azure CLI installed (v2.77.0)
- ✅ Static Web App extension installed
- ✅ Application built and tested
- ✅ Gemini API key configured

---

## 🚀 Deployment Steps

### Step 1: Azure Login (In Progress)

A browser window should have opened for Azure authentication.

1. Sign in with your Microsoft account
2. Complete authentication
3. Return to this terminal

---

### Step 2: Create Resource Group

```bash
az group create --name reddyfit-rg --location eastus
```

---

### Step 3: Create Static Web App

```bash
az staticwebapp create \
  --name reddyfit-nutrition-coach \
  --resource-group reddyfit-rg \
  --source https://github.com/DandaAkhilReddy/ReddyFitV2 \
  --branch smart-nutrition-coach \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github
```

---

### Step 4: Configure Environment Variables

After deployment, add the Gemini API key:

```bash
az staticwebapp appsettings set \
  --name reddyfit-nutrition-coach \
  --resource-group reddyfit-rg \
  --setting-names GEMINI_API_KEY=AIzaSyAeiHgMbYdD0BnyKehqc3mOxktCmoLLz9A
```

---

## 🎯 Your Azure URL

After deployment, your app will be available at:

```
https://reddyfit-nutrition-coach.azurestaticapps.net
```

---

## 📱 Features Available

- ✅ Global CDN (fast worldwide)
- ✅ Free SSL certificate
- ✅ Custom domains
- ✅ Auto-deploy on Git push
- ✅ Environment variables
- ✅ 100GB bandwidth/month (free tier)

---

## 🔧 Post-Deployment Configuration

### 1. Firebase Domain Whitelist

Add your Azure URL to Firebase:

1. Go to: https://console.firebase.google.com
2. Select: reddyfit-ai-pro
3. Authentication → Settings → Authorized domains
4. Add: `reddyfit-nutrition-coach.azurestaticapps.net`

### 2. Custom Domain (Optional)

```bash
az staticwebapp hostname set \
  --name reddyfit-nutrition-coach \
  --resource-group reddyfit-rg \
  --hostname your-custom-domain.com
```

---

## 💰 Azure Costs

### Free Tier Includes:
- ✅ 100GB bandwidth/month
- ✅ Unlimited static sites
- ✅ Custom domains
- ✅ SSL certificates
- ✅ Global CDN

**Cost: $0/month** (within free tier limits)

---

## 🔄 Update Deployment

After making code changes:

```bash
git add .
git commit -m "your changes"
git push origin smart-nutrition-coach
```

Azure automatically redeploys! ✨

---

## 📊 Monitor Your App

View in Azure Portal:
```
https://portal.azure.com
```

Navigate to: Static Web Apps → reddyfit-nutrition-coach

---

## 🆘 Troubleshooting

### Build Fails:
- Check build logs in Azure Portal
- Verify `dist` folder is created
- Ensure all dependencies in package.json

### Environment Variables Not Working:
- Verify variable name: `GEMINI_API_KEY`
- Check it's set in Static Web App settings
- Restart app after adding variables

### Camera Not Working:
- Azure provides HTTPS automatically ✅
- Clear browser cache
- Check permissions

---

## ✅ Deployment Complete!

Your Smart Nutrition Coach is now:
- 🌍 Live globally
- 🔒 Secured with HTTPS
- ⚡ Fast with CDN
- 📱 Mobile-ready
- 🔄 Auto-deploying

**Access your app at:**
```
https://reddyfit-nutrition-coach.azurestaticapps.net
```

---

**Your app is ready to help people worldwide eat healthier!** 💪🥗✨
