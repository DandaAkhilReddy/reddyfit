# ReddyTalk.ai Azure Deployment Guide

## 🚀 Quick Start

This guide will help you deploy ReddyTalk.ai to Azure using the cost-optimized serverless architecture.

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] Azure account with active subscription
- [ ] Azure CLI installed (`az --version`)
- [ ] GitHub account with repository access
- [ ] PowerShell (Windows) or Bash (Linux/Mac)
- [ ] Node.js 18.x or 20.x installed
- [ ] Git CLI installed

## 🎯 Deployment Overview

The deployment includes:

- **Azure Infrastructure** (Bicep templates)
- **Azure Functions** (Serverless backend)
- **Azure Static Web Apps** (Frontend hosting)
- **Cosmos DB Serverless** (Database)
- **Application Insights** (Monitoring)
- **Cost Management** (Budget alerts)

**Estimated Monthly Cost:** $202-412 USD (under $1000 budget)

---

## 🛠️ Method 1: Automated GitHub Actions (Recommended)

### Step 1: Setup Azure Service Principal

```bash
# Login to Azure
az login

# Create service principal
az ad sp create-for-rbac \
  --name "ReddyTalk-GitHub-Actions" \
  --role Contributor \
  --scopes "/subscriptions/{subscription-id}" \
  --sdk-auth
```

Copy the JSON output for the next step.

### Step 2: Configure GitHub Secrets

In your GitHub repository, go to `Settings > Secrets and variables > Actions` and add:

- `AZURE_CREDENTIALS`: The JSON from Step 1
- `AZURE_STATIC_WEB_APPS_API_TOKEN`: (Will be set automatically during deployment)

### Step 3: Run Deployment

1. **For Infrastructure + Full Deployment:**
   - Go to `Actions > Deploy to Azure > Run workflow`
   - Select environment: `dev`, `staging`, or `prod`
   - Enable "Deploy infrastructure": ✅
   - Enable "Deploy functions": ✅
   - Enable "Deploy frontend": ✅
   - Click "Run workflow"

2. **For Code Updates Only:**
   - Simply push to your branch:
     - `develop` → deploys to `dev`
     - `staging` → deploys to `staging`
     - `master` → deploys to `prod`

### Step 4: Monitor Deployment

- Check the Actions tab for deployment progress
- View deployment summary in the workflow
- Access your app at the URLs provided

---

## 🔧 Method 2: Manual PowerShell Scripts

### Step 1: Setup Azure Resources

```powershell
# Navigate to project directory
cd C:\path\to\reddytalk

# Login to Azure
az login

# Deploy infrastructure
.\scripts\deploy-azure.ps1 -Environment "dev" -ResourceGroupName "rg-reddytalk-dev"

# Wait for completion (10-15 minutes)
```

### Step 2: Deploy Functions

```powershell
# Deploy backend functions
.\scripts\deploy-functions.ps1 -Environment "dev"

# Test functions
curl https://your-function-app.azurewebsites.net/api/health
```

### Step 3: Deploy Frontend

```powershell
# Deploy frontend
.\scripts\deploy-frontend.ps1 -Environment "dev"

# Access your app
# URL will be displayed after deployment
```

### Step 4: Setup Monitoring

```powershell
# Configure cost monitoring and alerts
.\scripts\setup-monitoring.ps1 -Environment "dev" -ResourceGroupName "rg-reddytalk-dev" -MonthlyBudget 1000 -AlertEmail "admin@yourdomain.com"
```

---

## 🏗️ Environment Configuration

### Development Environment
- **Branch:** `develop`
- **Domain:** `dev.reddytalk.ai` (if configured)
- **Budget:** $300/month
- **Features:** Full logging, relaxed CORS

### Staging Environment
- **Branch:** `staging`
- **Domain:** `staging.reddytalk.ai` (if configured)
- **Budget:** $500/month
- **Features:** Production-like, testing data

### Production Environment
- **Branch:** `master`
- **Domain:** `reddytalk.ai` (if configured)
- **Budget:** $1000/month
- **Features:** Production optimized, restricted access

---

## 📊 Monitoring & Cost Management

### Built-in Monitoring

✅ **Budget Alerts** - 50%, 80%, 100% thresholds
✅ **Performance Alerts** - Response time, error rate
✅ **Application Insights** - Full telemetry
✅ **Cost Analysis** - Daily/monthly reporting

### Access Monitoring

1. **Azure Portal:** https://portal.azure.com
2. **Cost Management:** Subscriptions → Cost Management
3. **Application Insights:** Resource Group → Application Insights
4. **Function Logs:** Function App → Functions → Monitor

---

## 🔍 Troubleshooting

### Common Issues

**1. Deployment Fails with "Resource not found"**
```powershell
# Verify resource group exists
az group show --name "rg-reddytalk-dev"

# Create if missing
az group create --name "rg-reddytalk-dev" --location "eastus2"
```

**2. Function App not responding**
```powershell
# Check function app status
az functionapp show --name "your-function-app" --resource-group "your-rg" --query "state"

# Restart function app
az functionapp restart --name "your-function-app" --resource-group "your-rg"
```

**3. Static Web App deployment fails**
```powershell
# Check Static Web App status
az staticwebapp show --name "your-static-app" --resource-group "your-rg"

# Get deployment token
az staticwebapp secrets list --name "your-static-app" --resource-group "your-rg"
```

**4. High costs / Budget alerts**
```powershell
# Check resource consumption
az consumption usage list --start-date "2024-01-01" --end-date "2024-01-31"

# Review cost by service
# Go to Azure Portal → Cost Management → Cost Analysis
```

### Getting Help

1. **Check deployment logs** in GitHub Actions
2. **Review Azure Activity Log** for detailed errors
3. **Use Application Insights** for runtime issues
4. **Check Function Logs** for backend problems

---

## 🔐 Security Configuration

### Required Secrets

After deployment, configure these in Azure Key Vault:

- `JWT_SECRET` - For authentication tokens
- `OPENAI_API_KEY` - For AI services
- `ELEVENLABS_API_KEY` - For voice synthesis
- `COSMOS_CONNECTION_STRING` - Database access
- `SPEECH_SERVICE_KEY` - Azure Speech Services

### Access Configuration

```powershell
# Set Key Vault secret
az keyvault secret set --vault-name "your-key-vault" --name "jwt-secret" --value "your-secret-key"

# Grant Function App access
az keyvault set-policy --name "your-key-vault" --object-id "function-app-principal-id" --secret-permissions get list
```

---

## 📈 Scaling Configuration

### Auto-scaling Settings

- **Function App:** Scales automatically (consumption plan)
- **Static Web App:** Global CDN, unlimited bandwidth
- **Cosmos DB:** Serverless auto-scaling
- **Storage:** LRS with lifecycle management

### Performance Optimization

1. **Function Cold Start:** Consider premium plan for < 1s response
2. **Database Queries:** Optimize partition keys and indexing
3. **Static Assets:** Use CDN for global distribution
4. **API Caching:** Implement response caching where appropriate

---

## 🎉 Post-Deployment Checklist

- [ ] All services deployed successfully
- [ ] Health endpoints responding
- [ ] Frontend accessible at provided URL
- [ ] Monitoring alerts configured
- [ ] Budget alerts set up
- [ ] Key Vault secrets configured
- [ ] Custom domain configured (optional)
- [ ] SSL certificates valid
- [ ] Database migration completed
- [ ] API documentation updated

---

## 📚 Additional Resources

- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Cosmos DB Serverless](https://docs.microsoft.com/azure/cosmos-db/serverless)
- [Application Insights](https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview)
- [Azure Cost Management](https://docs.microsoft.com/azure/cost-management-billing/)

---

## 📞 Support

For deployment issues or questions:

1. Check the [GitHub Issues](https://github.com/DandaAkhilReddy/ReddyTalk/issues)
2. Review [Azure documentation](https://docs.microsoft.com/azure/)
3. Contact the development team

**Happy Deploying! 🚀**