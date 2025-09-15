#!/bin/bash
# ReddyTalk.ai Azure Deployment Commands
# Run these in your Azure Cloud Shell (shell.azure.com)

set -e

echo "🚀 Starting ReddyTalk.ai deployment to Azure..."

# Step 1: Create Resource Group
echo "📦 Step 1: Creating resource group..."
az group create --name reddytalk-rg --location eastus

# Step 2: Create Azure Container Registry
echo "🏗️ Step 2: Creating Azure Container Registry..."
az acr create \
  --name reddytalkacr \
  --resource-group reddytalk-rg \
  --sku Basic \
  --admin-enabled true

# Step 3: Build and push image directly in Azure
echo "🐳 Step 3: Building Docker image in Azure..."
az acr build \
  --registry reddytalkacr \
  --image reddytalk-api:latest \
  .

# Step 4: Create Container Apps Environment
echo "☁️ Step 4: Creating Container Apps environment..."
az containerapp env create \
  --name reddytalk-env \
  --resource-group reddytalk-rg \
  --location eastus

# Step 5: Deploy the Container App
echo "🚀 Step 5: Deploying Container App..."
az containerapp create \
  --name reddytalk-api \
  --resource-group reddytalk-rg \
  --environment reddytalk-env \
  --image reddytalkacr.azurecr.io/reddytalk-api:latest \
  --target-port 8080 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 5 \
  --cpu 1.0 \
  --memory 2Gi \
  --env-vars \
    NODE_ENV=production \
    PORT=8080

# Step 6: Deploy Static Web App for frontend
echo "🌐 Step 6: Creating Static Web App..."
az staticwebapp create \
  --name reddytalk-web \
  --resource-group reddytalk-rg \
  --location eastus \
  --source https://github.com/DandaAkhilReddy/ReddyTalk \
  --branch master \
  --app-location "/website" \
  --output-location "out"

# Get the endpoints
echo "🎉 Deployment completed!"
echo ""
echo "Getting your endpoints..."
API_URL=$(az containerapp show --name reddytalk-api --resource-group reddytalk-rg --query "properties.configuration.ingress.fqdn" --output tsv)
WEB_URL=$(az staticwebapp show --name reddytalk-web --resource-group reddytalk-rg --query "defaultHostname" --output tsv)

echo "📱 Your ReddyTalk.ai is deployed:"
echo "🔗 API Backend: https://$API_URL"
echo "🌐 Website: https://$WEB_URL"
echo ""
echo "🧪 Test your API:"
echo "curl https://$API_URL/health/ready"
echo "curl https://$API_URL/api/test/simple/knowledge"
echo ""
echo "✅ Deployment successful!"