# ReddyTalk.ai Azure Functions Deployment Script
# This script builds and deploys the backend functions to Azure

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$false)]
    [string]$FunctionAppName,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$FunctionsDir = Join-Path $ProjectRoot "functions"
$BuildDir = Join-Path $FunctionsDir "build"

Write-Host "🚀 ReddyTalk.ai Functions Deployment" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Load deployment info if not provided
if (!$ResourceGroupName -or !$FunctionAppName) {
    $deploymentInfoPath = Join-Path $ScriptDir "deployment-$Environment.json"
    if (Test-Path $deploymentInfoPath) {
        $deploymentInfo = Get-Content $deploymentInfoPath | ConvertFrom-Json
        $ResourceGroupName = $ResourceGroupName ?? $deploymentInfo.ResourceGroup
        $FunctionAppName = $FunctionAppName ?? $deploymentInfo.Outputs.functionAppName.value
        Write-Host "✅ Loaded deployment info from: $deploymentInfoPath" -ForegroundColor Green
    } else {
        Write-Host "❌ Please provide ResourceGroupName and FunctionAppName or run infrastructure deployment first" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Function App: $FunctionAppName" -ForegroundColor Yellow

# Verify Function App exists
Write-Host "🔍 Verifying Function App..." -ForegroundColor Green
try {
    $functionApp = az functionapp show --name $FunctionAppName --resource-group $ResourceGroupName --query "name" -o tsv
    if ($functionApp) {
        Write-Host "✅ Function App found: $functionApp" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Function App not found: $FunctionAppName" -ForegroundColor Red
    exit 1
}

# Create functions structure from current codebase
if (!$SkipBuild) {
    Write-Host "🏗️ Preparing functions for deployment..." -ForegroundColor Green
    
    # Create functions directory structure
    if (Test-Path $FunctionsDir) {
        Remove-Item $FunctionsDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $FunctionsDir -Force | Out-Null
    
    # Copy current services to functions format
    Write-Host "📦 Converting services to Azure Functions..." -ForegroundColor Yellow
    
    # Copy shared utilities
    $sharedDir = Join-Path $FunctionsDir "shared"
    New-Item -ItemType Directory -Path $sharedDir -Force | Out-Null
    
    # Copy existing services
    $servicesDir = Join-Path $ProjectRoot "src\services"
    if (Test-Path $servicesDir) {
        Copy-Item "$servicesDir\*" -Destination $sharedDir -Recurse -Force
    }
    
    # Create package.json for functions
    $packageJson = @{
        name = "reddytalk-functions"
        version = "1.0.0"
        description = "ReddyTalk.ai Azure Functions"
        main = "index.js"
        scripts = @{
            start = "func start"
            test = "echo 'No tests yet'"
        }
        dependencies = @{
            "@azure/functions" = "^4.0.0"
            "@azure/cosmos" = "^4.0.0"
            "@azure/storage-blob" = "^12.0.0"
            "jsonwebtoken" = "^9.0.0"
            "bcryptjs" = "^2.4.3"
            "axios" = "^1.6.0"
            "ws" = "^8.14.0"
        }
        devDependencies = @{
            "@azure/functions-core-tools" = "^4.0.0"
        }
    }
    
    $packageJson | ConvertTo-Json -Depth 5 | Out-File (Join-Path $FunctionsDir "package.json") -Encoding UTF8
    
    # Create host.json
    $hostJson = @{
        version = "2.0"
        logging = @{
            applicationInsights = @{
                samplingSettings = @{
                    isEnabled = $true
                    excludedTypes = "Request"
                }
            }
        }
        extensionBundle = @{
            id = "Microsoft.Azure.Functions.ExtensionBundle"
            version = "[3.*, 4.0.0)"
        }
        functionTimeout = "00:05:00"
    }
    
    $hostJson | ConvertTo-Json -Depth 5 | Out-File (Join-Path $FunctionsDir "host.json") -Encoding UTF8
    
    # Create basic HTTP trigger functions
    Write-Host "🔧 Creating function endpoints..." -ForegroundColor Yellow
    
    # Authentication function
    $authDir = Join-Path $FunctionsDir "auth-login"
    New-Item -ItemType Directory -Path $authDir -Force | Out-Null
    
    $authFunction = @'
const { app } = require('@azure/functions');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

app.http('auth-login', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            context.log('Login request received');
            
            const body = await request.json();
            const { email, password } = body;
            
            if (!email || !password) {
                return { 
                    status: 400, 
                    jsonBody: { error: 'Email and password required' } 
                };
            }
            
            // TODO: Integrate with Cosmos DB for user lookup
            // This is a placeholder implementation
            
            const token = jwt.sign(
                { userId: 'temp-user', email: email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            return {
                status: 200,
                jsonBody: { 
                    success: true, 
                    token: token,
                    user: { email: email }
                }
            };
            
        } catch (error) {
            context.log.error('Login error:', error);
            return { 
                status: 500, 
                jsonBody: { error: 'Internal server error' } 
            };
        }
    }
});
'@
    $authFunction | Out-File (Join-Path $authDir "index.js") -Encoding UTF8
    
    # Health check function
    $healthDir = Join-Path $FunctionsDir "health"
    New-Item -ItemType Directory -Path $healthDir -Force | Out-Null
    
    $healthFunction = @'
const { app } = require('@azure/functions');

app.http('health', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'health',
    handler: async (request, context) => {
        return {
            status: 200,
            jsonBody: { 
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            }
        };
    }
});
'@
    $healthFunction | Out-File (Join-Path $healthDir "index.js") -Encoding UTF8
    
    Write-Host "✅ Functions structure created" -ForegroundColor Green
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Green
Push-Location $FunctionsDir
try {
    npm install --production
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Pop-Location
    exit 1
} finally {
    Pop-Location
}

# Deploy to Azure
Write-Host "🚀 Deploying to Azure Functions..." -ForegroundColor Green
try {
    Push-Location $FunctionsDir
    
    # Deploy using Azure CLI
    az functionapp deployment source config-zip `
        --resource-group $ResourceGroupName `
        --name $FunctionAppName `
        --src (Compress-Archive -Path "$FunctionsDir\*" -DestinationPath "$env:TEMP\functions.zip" -Force -PassThru).FullName
    
    Write-Host "✅ Functions deployed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
    
    # Cleanup temp files
    if (Test-Path "$env:TEMP\functions.zip") {
        Remove-Item "$env:TEMP\functions.zip" -Force
    }
}

# Test deployment
Write-Host "🧪 Testing deployment..." -ForegroundColor Green
try {
    $functionAppUrl = az functionapp show --name $FunctionAppName --resource-group $ResourceGroupName --query "defaultHostName" -o tsv
    $healthUrl = "https://$functionAppUrl/api/health"
    
    Write-Host "Testing health endpoint: $healthUrl" -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $healthUrl -Method GET -TimeoutSec 30
    
    if ($response.status -eq "healthy") {
        Write-Host "✅ Health check passed!" -ForegroundColor Green
        Write-Host "🌐 Functions URL: https://$functionAppUrl" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️ Health check returned unexpected status: $($response.status)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "⚠️ Health check failed (functions may still be starting up)" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "🎉 Function deployment completed!" -ForegroundColor Green
Write-Host "📖 Available endpoints:" -ForegroundColor Cyan
Write-Host "  - Health: https://$functionAppUrl/api/health" -ForegroundColor White
Write-Host "  - Auth Login: https://$functionAppUrl/api/auth-login" -ForegroundColor White