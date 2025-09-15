# ReddyTalk.ai Azure Deployment Script
# This script deploys the complete infrastructure to Azure using Bicep templates

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus2",
    
    [Parameter(Mandatory=$false)]
    [switch]$WhatIf
)

# Script configuration
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$InfrastructureDir = Join-Path $ScriptDir "..\infrastructure"
$BicepTemplate = Join-Path $InfrastructureDir "main.bicep"
$ParametersFile = Join-Path $InfrastructureDir "parameters\$Environment.parameters.json"

Write-Host "🚀 ReddyTalk.ai Azure Deployment Script" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Location: $Location" -ForegroundColor Yellow

# Verify prerequisites
Write-Host "🔍 Verifying prerequisites..." -ForegroundColor Green

# Check if Azure CLI is installed
try {
    $azVersion = az --version
    Write-Host "✅ Azure CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if logged in to Azure
try {
    $account = az account show --query "user.name" -o tsv
    if ($account) {
        Write-Host "✅ Logged in as: $account" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Not logged in to Azure. Please run 'az login' first." -ForegroundColor Red
    exit 1
}

# Check if Bicep is installed
try {
    az bicep version
    Write-Host "✅ Bicep is available" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Bicep is not installed. Installing..." -ForegroundColor Yellow
    az bicep install
}

# Verify template files exist
if (!(Test-Path $BicepTemplate)) {
    Write-Host "❌ Bicep template not found: $BicepTemplate" -ForegroundColor Red
    exit 1
}

if (!(Test-Path $ParametersFile)) {
    Write-Host "❌ Parameters file not found: $ParametersFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All prerequisites verified" -ForegroundColor Green

# Create or verify resource group
Write-Host "📦 Checking resource group..." -ForegroundColor Green
$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq "false") {
    Write-Host "Creating resource group: $ResourceGroupName" -ForegroundColor Yellow
    az group create --name $ResourceGroupName --location $Location
    Write-Host "✅ Resource group created" -ForegroundColor Green
} else {
    Write-Host "✅ Resource group exists" -ForegroundColor Green
}

# Validate Bicep template
Write-Host "🔍 Validating Bicep template..." -ForegroundColor Green
try {
    az deployment group validate `
        --resource-group $ResourceGroupName `
        --template-file $BicepTemplate `
        --parameters $ParametersFile
    Write-Host "✅ Template validation passed" -ForegroundColor Green
} catch {
    Write-Host "❌ Template validation failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Deploy infrastructure
if ($WhatIf) {
    Write-Host "🔍 Running What-If analysis..." -ForegroundColor Cyan
    az deployment group what-if `
        --resource-group $ResourceGroupName `
        --template-file $BicepTemplate `
        --parameters $ParametersFile
} else {
    Write-Host "🚀 Starting deployment..." -ForegroundColor Green
    Write-Host "This may take 10-15 minutes..." -ForegroundColor Yellow
    
    $deploymentName = "reddytalk-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    
    try {
        $deployment = az deployment group create `
            --resource-group $ResourceGroupName `
            --name $deploymentName `
            --template-file $BicepTemplate `
            --parameters $ParametersFile `
            --output json | ConvertFrom-Json
        
        Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
        
        # Display deployment outputs
        if ($deployment.properties.outputs) {
            Write-Host "📋 Deployment Outputs:" -ForegroundColor Cyan
            $deployment.properties.outputs.PSObject.Properties | ForEach-Object {
                Write-Host "  $($_.Name): $($_.Value.value)" -ForegroundColor White
            }
        }
        
        # Save deployment information
        $deploymentInfo = @{
            DeploymentName = $deploymentName
            Environment = $Environment
            ResourceGroup = $ResourceGroupName
            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Status = "Success"
            Outputs = $deployment.properties.outputs
        }
        
        $deploymentInfoPath = Join-Path $ScriptDir "deployment-$Environment.json"
        $deploymentInfo | ConvertTo-Json -Depth 5 | Out-File $deploymentInfoPath
        Write-Host "📝 Deployment info saved to: $deploymentInfoPath" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Deployment failed" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        
        # Get deployment details for troubleshooting
        Write-Host "🔍 Getting deployment details..." -ForegroundColor Yellow
        az deployment group show `
            --resource-group $ResourceGroupName `
            --name $deploymentName `
            --query "properties.error" -o table
        
        exit 1
    }
}

# Post-deployment configuration
if (!$WhatIf) {
    Write-Host "⚙️ Running post-deployment configuration..." -ForegroundColor Green
    
    # Set up GitHub Actions secrets (if GitHub CLI is available)
    try {
        gh --version | Out-Null
        Write-Host "🔑 Setting up GitHub Actions secrets..." -ForegroundColor Yellow
        
        # Get resource outputs
        $outputs = az deployment group show `
            --resource-group $ResourceGroupName `
            --name $deploymentName `
            --query "properties.outputs" -o json | ConvertFrom-Json
        
        if ($outputs.functionAppName) {
            Write-Host "Setting AZURE_FUNCTION_APP_NAME secret..." -ForegroundColor White
            gh secret set AZURE_FUNCTION_APP_NAME --body $outputs.functionAppName.value
        }
        
        if ($outputs.staticWebAppName) {
            Write-Host "Setting AZURE_STATIC_WEB_APP_NAME secret..." -ForegroundColor White
            gh secret set AZURE_STATIC_WEB_APP_NAME --body $outputs.staticWebAppName.value
        }
        
        if ($outputs.resourceGroupName) {
            Write-Host "Setting AZURE_RESOURCE_GROUP secret..." -ForegroundColor White
            gh secret set AZURE_RESOURCE_GROUP --body $outputs.resourceGroupName.value
        }
        
        Write-Host "✅ GitHub Actions secrets configured" -ForegroundColor Green
        
    } catch {
        Write-Host "⚠️ GitHub CLI not available. Please set up secrets manually:" -ForegroundColor Yellow
        Write-Host "  - AZURE_FUNCTION_APP_NAME" -ForegroundColor White
        Write-Host "  - AZURE_STATIC_WEB_APP_NAME" -ForegroundColor White
        Write-Host "  - AZURE_RESOURCE_GROUP" -ForegroundColor White
    }
    
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host "📖 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Configure GitHub Actions secrets (if not done automatically)" -ForegroundColor White
    Write-Host "  2. Deploy functions: ./deploy-functions.ps1 -Environment $Environment" -ForegroundColor White
    Write-Host "  3. Deploy frontend: ./deploy-frontend.ps1 -Environment $Environment" -ForegroundColor White
    Write-Host "  4. Test the deployment" -ForegroundColor White
}