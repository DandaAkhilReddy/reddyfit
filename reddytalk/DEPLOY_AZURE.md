# 🚀 Deploy ReddyTalk.ai to Azure

## Quick Deployment Guide

### Prerequisites
- Azure account with active subscription
- Azure CLI access (via shell.azure.com)
- Docker installed locally (optional for manual deployment)

## 🎯 Option 1: One-Click Deployment (Recommended)

### Step 1: Run the Deployment Script
In your **Azure Cloud Shell** (shell.azure.com):

```bash
# Clone your repo (if not already done)
git clone https://github.com/DandaAkhilReddy/ReddyTalk.git
cd ReddyTalk

# Make script executable and run
chmod +x deploy-to-azure.sh
./deploy-to-azure.sh
```

### Step 2: Build and Push Docker Image
On your **local machine**:

```bash
# The script will output these commands - run them locally:
docker build -t reddytalk-api .
docker tag reddytalk-api reddytalkacr.azurecr.io/reddytalk-api:latest
docker login reddytalkacr.azurecr.io --username [username] --password [password]
docker push reddytalkacr.azurecr.io/reddytalk-api:latest
```

## 🎯 Option 2: Manual Deployment Steps

### 1. Create Azure Container Registry
```bash
az acr create \
  --name reddytalkacr \
  --resource-group reddytalk-rg \
  --sku Basic \
  --admin-enabled true
```

### 2. Create Container Apps Environment
```bash
az containerapp env create \
  --name reddytalk-env \
  --resource-group reddytalk-rg \
  --location eastus
```

### 3. Get Service Keys
```bash
# Get Speech Service key
az cognitiveservices account keys list \
  --name reddytalk-speech \
  --resource-group reddytalk-rg \
  --query "key1" -o tsv

# Get OpenAI key and endpoint
az cognitiveservices account keys list \
  --name reddytalk-openai \
  --resource-group reddytalk-rg \
  --query "key1" -o tsv

az cognitiveservices account show \
  --name reddytalk-openai \
  --resource-group reddytalk-rg \
  --query "properties.endpoint" -o tsv
```

### 4. Deploy Container App
```bash
az containerapp create \
  --name reddytalk-api \
  --resource-group reddytalk-rg \
  --environment reddytalk-env \
  --image reddytalkacr.azurecr.io/reddytalk-api:latest \
  --target-port 8080 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 10 \
  --cpu 1.0 \
  --memory 2Gi
```

### 5. Deploy Static Web App
```bash
az staticwebapp create \
  --name reddytalk-web \
  --resource-group reddytalk-rg \
  --location eastus \
  --source https://github.com/DandaAkhilReddy/ReddyTalk \
  --branch master \
  --app-location "/website" \
  --output-location "out"
```

## 🎯 Option 3: GitHub Actions (Automated)

### Setup GitHub Secrets
In your GitHub repository, add these secrets:

1. **AZURE_CREDENTIALS**: Service principal JSON
2. **AZURE_STATIC_WEB_APPS_API_TOKEN**: From Azure Static Web Apps

### Create Service Principal
```bash
az ad sp create-for-rbac \
  --name "reddytalk-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/reddytalk-rg \
  --sdk-auth
```

Copy the JSON output to GitHub Secrets as `AZURE_CREDENTIALS`.

## 📊 Expected Results

After successful deployment, you'll have:

### 🔗 Endpoints
- **API**: `https://reddytalk-api.azurecontainerapps.io`
- **Website**: `https://reddytalk-web.azurestaticapps.net`

### 🏗️ Azure Resources Created
- **Resource Group**: `reddytalk-rg`
- **Container Registry**: `reddytalkacr.azurecr.io`
- **Container App**: `reddytalk-api`
- **Static Web App**: `reddytalk-web`
- **Cognitive Services**: Speech + OpenAI
- **Communication Services**: For phone calls

## 🧪 Testing Your Deployment

### 1. Test API Health
```bash
curl https://reddytalk-api.azurecontainerapps.io/health/ready
```

### 2. Test Voice Pipeline
```bash
curl -X POST https://reddytalk-api.azurecontainerapps.io/api/test/simple/conversation \
  -H "Content-Type: application/json" \
  -d '{"text": "I need to schedule an appointment"}'
```

### 3. Open Website
Visit: `https://reddytalk-web.azurestaticapps.net`

## 💰 Expected Costs

### Development/Testing
- **Container Apps**: ~$15-30/month
- **Static Web Apps**: Free tier
- **Container Registry**: ~$5/month
- **Cognitive Services**: Pay-per-use (~$10-50/month)

### Production (1000+ calls/day)
- **Total**: ~$200-500/month

## 🔧 Post-Deployment Configuration

1. **Update Website Config**: Point frontend to your API endpoint
2. **Custom Domain**: Configure custom domain if needed
3. **SSL Certificates**: Automatically handled by Azure
4. **Monitoring**: Set up Application Insights
5. **Scaling**: Configure auto-scaling based on usage

## 🚨 Troubleshooting

### Common Issues

1. **Docker Build Fails**
   - Ensure all dependencies are in package.json
   - Check Dockerfile syntax

2. **Container App Won't Start**
   - Check environment variables
   - Verify Azure service keys

3. **API Returns 5xx Errors**
   - Check Container App logs: `az containerapp logs show`
   - Verify Azure service quotas

4. **Website Build Fails**
   - Check Node.js version compatibility
   - Ensure all frontend dependencies are installed

### Get Logs
```bash
# Container App logs
az containerapp logs show \
  --name reddytalk-api \
  --resource-group reddytalk-rg

# Static Web App logs
az staticwebapp show \
  --name reddytalk-web \
  --resource-group reddytalk-rg
```

## 🎉 Success!

Once deployed, your ReddyTalk.ai system will be:
- ✅ **Highly Available** (99.9% uptime SLA)
- ✅ **Auto-Scaling** (1-10 instances based on load)
- ✅ **Secure** (HTTPS, managed certificates)
- ✅ **Fast** (<500ms voice processing)
- ✅ **Cost-Effective** (Pay only for usage)

**Ready to deploy? Run the deployment script in Azure Cloud Shell!**