# Azure Static Web App Deployment Script
# ReddyFit Smart Nutrition Coach

Write-Host "🚀 Deploying ReddyFit to Azure Static Web Apps..." -ForegroundColor Cyan

# Variables
$resourceGroup = "reddyfit-rg"
$appName = "reddyfit-nutrition-coach"
$location = "eastus"
$githubRepo = "https://github.com/DandaAkhilReddy/ReddyFitV2"
$branch = "smart-nutrition-coach"
$geminiApiKey = "AIzaSyAeiHgMbYdD0BnyKehqc3mOxktCmoLLz9A"

Write-Host "📍 Configuration:" -ForegroundColor Yellow
Write-Host "  Resource Group: $resourceGroup"
Write-Host "  App Name: $appName"
Write-Host "  Location: $location"
Write-Host "  Repository: $githubRepo"
Write-Host "  Branch: $branch"
Write-Host ""

# Step 1: Create Resource Group
Write-Host "📦 Step 1: Creating resource group..." -ForegroundColor Green
try {
    az group create --name $resourceGroup --location $location
    Write-Host "✅ Resource group created successfully!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Resource group may already exist, continuing..." -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Build the application
Write-Host "🔨 Step 2: Building application..." -ForegroundColor Green
npm run build
Write-Host "✅ Build complete!" -ForegroundColor Green

Write-Host ""

# Step 3: Create Static Web App
Write-Host "🌐 Step 3: Creating Azure Static Web App..." -ForegroundColor Green
Write-Host "⚠️  You may be prompted to authenticate with GitHub" -ForegroundColor Yellow
Write-Host ""

$deployment = az staticwebapp create `
    --name $appName `
    --resource-group $resourceGroup `
    --source $githubRepo `
    --branch $branch `
    --app-location "/" `
    --output-location "dist" `
    --login-with-github `
    --output json | ConvertFrom-Json

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Static Web App created successfully!" -ForegroundColor Green
    $appUrl = $deployment.defaultHostname
    Write-Host "🌍 Your app URL: https://$appUrl" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to create Static Web App" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Configure Environment Variables
Write-Host "⚙️  Step 4: Configuring environment variables..." -ForegroundColor Green
az staticwebapp appsettings set `
    --name $appName `
    --resource-group $resourceGroup `
    --setting-names "GEMINI_API_KEY=$geminiApiKey"

Write-Host "✅ Environment variables configured!" -ForegroundColor Green

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Your app is live at:" -ForegroundColor Yellow
Write-Host "   https://$appUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Open the URL in your browser"
Write-Host "   2. Test all features"
Write-Host "   3. Add to home screen on mobile"
Write-Host "   4. Add Azure URL to Firebase authorized domains"
Write-Host ""
Write-Host "🔥 Firebase Configuration:" -ForegroundColor Yellow
Write-Host "   Go to: https://console.firebase.google.com"
Write-Host "   Add domain: $appUrl"
Write-Host ""
Write-Host "✨ Your Smart Nutrition Coach is ready!" -ForegroundColor Green
