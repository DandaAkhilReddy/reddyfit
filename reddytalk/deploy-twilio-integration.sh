#!/bin/bash

# ReddyTalk.ai - Deploy Twilio Integration
# This script deploys the complete system with Twilio voice calling capabilities

echo "🚀 =================================="
echo "🎯 ReddyTalk.ai Twilio Deployment"
echo "🚀 =================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the reddytalk root directory"
    exit 1
fi

# Check if Twilio package is installed
if ! npm list twilio > /dev/null 2>&1; then
    echo "📦 Installing Twilio SDK..."
    npm install twilio
fi

echo "✅ Prerequisites met"

# Build and deploy
echo "🔨 Building application..."

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "🐳 Building Docker image..."
    docker build -t reddytalk-ai:latest .
    
    if [ $? -eq 0 ]; then
        echo "✅ Docker image built successfully"
    else
        echo "❌ Docker build failed"
        exit 1
    fi
else
    echo "⚠️ Docker not found - skipping container build"
fi

# Deploy to Azure Container Apps
echo "☁️ Deploying to Azure..."

# Check if Azure CLI is logged in
if ! az account show > /dev/null 2>&1; then
    echo "🔑 Please login to Azure CLI:"
    az login
fi

# Update Container App with new image
echo "🚀 Updating Azure Container App..."

az containerapp update \
    --name reddytalk-api \
    --resource-group reddytalk-rg \
    --image reddytalk-ai:latest \
    --set-env-vars \
        NODE_ENV=production \
        TWILIO_WEBHOOK_URL=https://reddytalk-api.politemushroom-457701ff.eastus.azurecontainerapps.io

if [ $? -eq 0 ]; then
    echo "✅ Container app updated successfully"
else
    echo "❌ Container app update failed"
    exit 1
fi

# Update Static Web App with new test interface
echo "🌐 Updating Static Web App..."

# Deploy static files
if command -v swa &> /dev/null; then
    swa deploy public --deployment-token $SWA_DEPLOYMENT_TOKEN
    
    if [ $? -eq 0 ]; then
        echo "✅ Static Web App updated successfully"
    else
        echo "❌ Static Web App update failed"
    fi
else
    echo "⚠️ SWA CLI not found - please deploy static files manually"
fi

echo ""
echo "🎉 =================================="
echo "✅ Deployment Complete!"
echo "🎉 =================================="
echo ""
echo "🌐 Your updated ReddyTalk.ai system is now live:"
echo "   • Main Site: https://calm-field-070972c0f.2.azurestaticapps.net"
echo "   • API Server: https://reddytalk-api.politemushroom-457701ff.eastus.azurecontainerapps.io"
echo "   • Dashboard: https://calm-field-070972c0f.2.azurestaticapps.net/dashboard"
echo "   • Test Interface: https://calm-field-070972c0f.2.azurestaticapps.net/test-interface"
echo ""
echo "📞 Twilio Integration Features:"
echo "   • Real phone call capability"
echo "   • Voice-to-AI conversation pipeline"
echo "   • Call recording and transcription"
echo "   • Webhook-based call handling"
echo "   • Phone number management"
echo ""
echo "⚙️ Next Steps:"
echo "   1. Sign up for Twilio account at https://twilio.com"
echo "   2. Purchase a phone number"
echo "   3. Update environment variables with Twilio credentials"
echo "   4. Configure webhook URLs in Twilio Console"
echo "   5. Test the system using the test interface"
echo ""
echo "📖 See ACCOUNTS_SETUP.md for detailed setup instructions"
echo "🎯 Total estimated setup time: 2-4 hours"
echo ""