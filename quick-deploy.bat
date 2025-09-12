@echo off
echo 🚀 ReddyTalk.ai Quick Azure Deployment
echo.

echo Step 1: Creating resource group...
az group create --name reddytalk-rg --location eastus

echo Step 2: Creating Azure Container Registry...
az acr create --name reddytalkacr --resource-group reddytalk-rg --sku Basic --admin-enabled true

echo Step 3: Building and pushing Docker image...
az acr build --registry reddytalkacr --image reddytalk-api:latest .

echo Step 4: Creating Container Apps environment...
az containerapp env create --name reddytalk-env --resource-group reddytalk-rg --location eastus

echo Step 5: Deploying Container App...
az containerapp create ^
  --name reddytalk-api ^
  --resource-group reddytalk-rg ^
  --environment reddytalk-env ^
  --image reddytalkacr.azurecr.io/reddytalk-api:latest ^
  --target-port 8080 ^
  --ingress external ^
  --min-replicas 1 ^
  --max-replicas 5 ^
  --cpu 1.0 ^
  --memory 2Gi ^
  --env-vars NODE_ENV=production PORT=8080

echo Step 6: Getting API endpoint...
for /f %%i in ('az containerapp show --name reddytalk-api --resource-group reddytalk-rg --query "properties.configuration.ingress.fqdn" --output tsv') do set API_URL=%%i

echo.
echo ✅ Deployment Complete!
echo 🌐 Your ReddyTalk.ai API is available at: https://%API_URL%
echo 📊 Health check: https://%API_URL%/health/ready
echo 🧪 Test endpoint: https://%API_URL%/api/test/simple/knowledge
echo.

pause