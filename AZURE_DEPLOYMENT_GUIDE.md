# 🚀 Deploy ReddyFit to Azure - Complete Guide

## 📋 Prerequisites

- ✅ Azure account (free tier available)
- ✅ Azure CLI installed (optional but recommended)
- ✅ Git repository (GitHub recommended)

---

## 🎯 **Option 1: Azure Static Web Apps (Recommended)**

### Why Static Web Apps?
- ✅ **FREE tier** with generous limits
- ✅ Automatic CI/CD with GitHub
- ✅ Built-in SSL certificate
- ✅ Global CDN
- ✅ Custom domains
- ✅ API integration ready

### Step-by-Step Deployment

#### 1. **Switch to Simplified App**
```bash
# Use simplified version
mv App.tsx App.FULL.tsx
mv App.SIMPLE.tsx App.tsx
```

#### 2. **Build Your App Locally (Test)**
```bash
npm run build
```

Make sure build succeeds without errors!

#### 3. **Push to GitHub**
```bash
# Initialize git if not already
git init
git add .
git commit -m "Ready for Azure deployment"

# Create new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/reddyfit.git
git branch -M main
git push -u origin main
```

#### 4. **Create Azure Static Web App**

**Via Azure Portal:**

1. Go to https://portal.azure.com
2. Click "+ Create a resource"
3. Search for "Static Web App"
4. Click "Create"
5. Fill in details:
   - **Subscription:** Your subscription
   - **Resource Group:** Create new "ReddyFit-RG"
   - **Name:** `reddyfit-app` (must be unique)
   - **Plan type:** **Free** ⭐
   - **Region:** Choose nearest (e.g., East US 2)
   - **Deployment source:** GitHub
   - **GitHub account:** Sign in and authorize
   - **Organization:** Your GitHub username
   - **Repository:** Select your repo
   - **Branch:** main

6. Build Details:
   - **Build Presets:** Vite
   - **App location:** `/` (root)
   - **Api location:** (leave empty)
   - **Output location:** `dist`

7. Click "Review + Create" → "Create"
8. Wait 2-3 minutes for deployment

#### 5. **Add Environment Variables in Azure**

After deployment:

1. Go to your Static Web App in Azure Portal
2. Click "Configuration" in left menu
3. Click "+ Add" for each variable:

```
VITE_GEMINI_API_KEY=AIzaSyAp25CMazDf7NbTCl9-1sf4FZ8nl4Lk_7Y
VITE_AZURE_COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
VITE_AZURE_COSMOS_KEY=your-primary-key-here
VITE_ADMIN_EMAIL=admin@reddyfit.com
VITE_ADMIN_PASSWORD=ReddyFit@Admin2025!
```

4. Click "Save"

#### 6. **Trigger Redeployment**

Push any change to GitHub to trigger rebuild:
```bash
git commit --allow-empty -m "Trigger deployment with env vars"
git push
```

#### 7. **Access Your App**

Your app will be available at:
```
https://reddyfit-app.azurestaticapps.net
```

Or your custom URL shown in Azure Portal!

---

## 🎯 **Option 2: Azure App Service (Alternative)**

### Step-by-Step

#### 1. **Install Azure CLI** (if not installed)
```bash
# Download from: https://aka.ms/installazurecliwindows
```

#### 2. **Login to Azure**
```bash
az login
```

#### 3. **Create App Service**
```bash
# Create resource group
az group create --name ReddyFit-RG --location eastus2

# Create App Service plan (Free tier)
az appservice plan create --name ReddyFit-Plan --resource-group ReddyFit-RG --sku FREE

# Create Web App
az webapp create --name reddyfit-app-unique --resource-group ReddyFit-RG --plan ReddyFit-Plan
```

#### 4. **Configure Deployment**
```bash
# Set Node version
az webapp config appsettings set --resource-group ReddyFit-RG --name reddyfit-app-unique --settings WEBSITE_NODE_DEFAULT_VERSION=18-lts

# Add environment variables
az webapp config appsettings set --resource-group ReddyFit-RG --name reddyfit-app-unique --settings \
  VITE_GEMINI_API_KEY="your-gemini-key" \
  VITE_AZURE_COSMOS_ENDPOINT="your-cosmos-endpoint" \
  VITE_AZURE_COSMOS_KEY="your-cosmos-key"
```

#### 5. **Deploy**
```bash
# Build locally
npm run build

# Deploy (requires Azure Static Web Apps CLI)
npm install -g @azure/static-web-apps-cli
swa deploy ./dist --deployment-token YOUR_TOKEN
```

---

## 🎯 **Option 3: Quick Deploy with VS Code Extension**

### Steps:

1. **Install Extension**
   - Install "Azure Static Web Apps" extension in VS Code

2. **Sign in to Azure**
   - Click Azure icon in sidebar
   - Sign in to your account

3. **Deploy**
   - Right-click on project folder
   - Select "Deploy to Static Web App"
   - Follow prompts
   - Choose: Free plan, Vite preset, dist folder

4. **Done!** URL will be shown in output

---

## 🔧 **Post-Deployment Configuration**

### 1. **Set Up Azure Cosmos DB** (if not done)

See `AZURE_DATABASE_SETUP.md` for complete guide

Quick steps:
```bash
# Create Cosmos DB account
az cosmosdb create --name reddyfit-cosmosdb --resource-group ReddyFit-RG --kind GlobalDocumentDB --default-consistency-level Eventual --locations regionName=EastUS2

# Get connection strings
az cosmosdb keys list --name reddyfit-cosmosdb --resource-group ReddyFit-RG
```

### 2. **Update Environment Variables**

Add the Cosmos DB credentials to your Static Web App configuration

### 3. **Enable Custom Domain** (Optional)

1. Go to Static Web App → Custom domains
2. Click "+ Add"
3. Enter your domain
4. Follow DNS configuration steps

---

## 📊 **Deployment Checklist**

Before deploying:

- [ ] App builds successfully (`npm run build`)
- [ ] All environment variables ready
- [ ] Azure Cosmos DB created and configured
- [ ] Gemini API key active
- [ ] Admin credentials set
- [ ] GitHub repo up to date
- [ ] `.gitignore` excludes `.env` file
- [ ] No hardcoded secrets in code

After deploying:

- [ ] App loads successfully
- [ ] Admin login works
- [ ] Video upload works
- [ ] Nutrition analysis works
- [ ] Database connection works
- [ ] Environment variables loaded
- [ ] SSL certificate active (https://)
- [ ] No console errors

---

## 💰 **Cost Estimate**

### Free Tier Limits (Generous!)

**Azure Static Web Apps (Free):**
- 100 GB bandwidth/month
- 0.5 GB storage
- Custom domains
- SSL certificate
- **Cost:** FREE

**Azure Cosmos DB (Serverless):**
- First 1M requests free
- ~$0.25 per GB storage
- **Est. cost:** $0-3/month

**Gemini AI:**
- Generous free tier
- **Est. cost:** $0-5/month

**Total: $0-8/month for complete app!**

---

## 🔍 **Troubleshooting**

### Build Fails
```bash
# Clear cache and rebuild
npm cache clean --force
rm -rf node_modules
npm install
npm run build
```

### Environment Variables Not Working
- Check they start with `VITE_` prefix
- Restart Static Web App after adding variables
- Trigger new deployment push

### 404 on Refresh
- Ensure `staticwebapp.config.json` exists
- Check `navigationFallback` is set to `/index.html`

### Database Connection Fails
- Verify Cosmos DB endpoint URL
- Check PRIMARY KEY is correct
- Ensure firewall allows Azure services
- Check environment variables in Azure

### Deployment Stuck
- Check GitHub Actions tab for errors
- Verify build preset is "Vite"
- Check output location is "dist"

---

## 🚀 **Continuous Deployment**

Once set up, every push to GitHub automatically:

1. ✅ Runs build
2. ✅ Runs tests (if configured)
3. ✅ Deploys to Azure
4. ✅ Updates your live site

**No manual deployment needed!**

---

## 📝 **GitHub Actions Workflow**

Your `.github/workflows/azure-static-web-apps-*.yml` file handles:

- Building Vite app
- Installing dependencies
- Running build
- Deploying to Azure
- Environment variables injection

**It's all automatic!** ✨

---

## 🎉 **Your App Will Be Live At:**

```
https://YOUR-APP-NAME.azurestaticapps.net
```

**Features:**
- ✅ Global CDN (fast worldwide)
- ✅ Automatic SSL/HTTPS
- ✅ Custom domains supported
- ✅ Auto-updates on Git push
- ✅ Admin-only access
- ✅ Video exercise extraction
- ✅ Complete nutrition tracking
- ✅ Azure Cosmos DB backend

---

## 📞 **Need Help?**

### Resources:
- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Azure Cosmos DB Docs](https://docs.microsoft.com/azure/cosmos-db/)

### Common Issues:
1. Build fails → Check Node version (use 18+)
2. Blank page → Check output directory is `dist`
3. API errors → Verify environment variables
4. 404 errors → Check `staticwebapp.config.json`

---

## ✅ **Quick Deploy Summary**

```bash
# 1. Switch to simplified app
mv App.tsx App.FULL.tsx
mv App.SIMPLE.tsx App.tsx

# 2. Build locally
npm run build

# 3. Push to GitHub
git add .
git commit -m "Deploy to Azure"
git push

# 4. Create Static Web App in Azure Portal
# - Connect to GitHub repo
# - Set build preset to Vite
# - Set output to "dist"

# 5. Add environment variables in Azure Portal

# 6. Done! Your app is live!
```

---

**🎊 Your ReddyFit app is production-ready for Azure!**

**Cost: ~$0-8/month • Setup time: 10-15 minutes**
