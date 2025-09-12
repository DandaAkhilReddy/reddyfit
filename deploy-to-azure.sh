#!/bin/bash

# ReddyTalk.ai Azure Deployment Script
# Run this script in Azure Cloud Shell

set -e

echo "🚀 Deploying ReddyTalk.ai to Azure..."

# Configuration
RESOURCE_GROUP="reddytalk-rg"
LOCATION="eastus"
ACR_NAME="reddytalkacr"
CONTAINER_APP_ENV="reddytalk-env"
API_APP_NAME="reddytalk-api"
STATIC_WEB_APP_NAME="reddytalk-web"

echo "📦 Step 1: Creating Azure Container Registry..."
az acr create \
  --name $ACR_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku Basic \
  --admin-enabled true

echo "🔐 Getting ACR credentials..."
ACR_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "loginServer" --output tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "username" --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "passwords[0].value" --output tsv)

echo "🐳 Step 2: Building and pushing Docker image..."
# Build the image locally (run this on your local machine)
echo "Run these commands on your local machine:"
echo "docker build -t reddytalk-api ."
echo "docker tag reddytalk-api $ACR_SERVER/reddytalk-api:latest"
echo "docker login $ACR_SERVER --username $ACR_USERNAME --password $ACR_PASSWORD"
echo "docker push $ACR_SERVER/reddytalk-api:latest"

echo "☁️ Step 3: Creating Container Apps Environment..."
az containerapp env create \
  --name $CONTAINER_APP_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

echo "🎯 Step 4: Getting Azure service keys..."
SPEECH_KEY=$(az cognitiveservices account keys list --name reddytalk-speech --resource-group $RESOURCE_GROUP --query "key1" --output tsv)
OPENAI_KEY=$(az cognitiveservices account keys list --name reddytalk-openai --resource-group $RESOURCE_GROUP --query "key1" --output tsv)
OPENAI_ENDPOINT=$(az cognitiveservices account show --name reddytalk-openai --resource-group $RESOURCE_GROUP --query "properties.endpoint" --output tsv)
COMM_CONNECTION=$(az communication list-key --name reddytalk-comm --resource-group $RESOURCE_GROUP --query "primaryConnectionString" --output tsv)

echo "🚀 Step 5: Deploying Container App..."
az containerapp create \
  --name $API_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_APP_ENV \
  --image $ACR_SERVER/reddytalk-api:latest \
  --registry-server $ACR_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 8080 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 10 \
  --cpu 1.0 \
  --memory 2Gi \
  --secrets \
    azure-speech-key=$SPEECH_KEY \
    azure-openai-key=$OPENAI_KEY \
    azure-openai-endpoint=$OPENAI_ENDPOINT \
    azure-communication-connection-string="$COMM_CONNECTION" \
  --env-vars \
    NODE_ENV=production \
    PORT=8080 \
    AZURE_SPEECH_KEY=secretref:azure-speech-key \
    AZURE_SPEECH_REGION=eastus \
    AZURE_SPEECH_VOICE=en-US-JennyNeural \
    AZURE_OPENAI_API_KEY=secretref:azure-openai-key \
    AZURE_OPENAI_ENDPOINT=secretref:azure-openai-endpoint \
    AZURE_OPENAI_DEPLOYMENT=gpt-4-turbo \
    AZURE_OPENAI_API_VERSION=2024-02-01 \
    AZURE_COMMUNICATION_CONNECTION_STRING=secretref:azure-communication-connection-string

echo "🌐 Step 6: Deploying Static Web App..."
# This will be done via GitHub Actions
az staticwebapp create \
  --name $STATIC_WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --source https://github.com/DandaAkhilReddy/ReddyTalk \
  --branch master \
  --app-location "/website" \
  --api-location "" \
  --output-location "out"

echo "🎉 Deployment Complete!"

# Get the endpoints
API_URL=$(az containerapp show --name $API_APP_NAME --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" --output tsv)
WEB_URL=$(az staticwebapp show --name $STATIC_WEB_APP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostname" --output tsv)

echo "📱 Your ReddyTalk.ai deployment:"
echo "API Endpoint: https://$API_URL"
echo "Website: https://$WEB_URL"
echo ""
echo "🔧 Next steps:"
echo "1. Configure your website to use the API endpoint"
echo "2. Set up custom domain if needed"
echo "3. Configure SSL certificates"
echo "4. Test the voice processing pipeline"