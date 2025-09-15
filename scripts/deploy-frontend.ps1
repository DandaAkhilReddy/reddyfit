# ReddyTalk.ai Frontend Deployment Script
# This script builds and deploys the frontend to Azure Static Web Apps

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$false)]
    [string]$StaticWebAppName,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$FrontendDir = Join-Path $ProjectRoot "frontend"
$BuildDir = Join-Path $FrontendDir "build"

Write-Host "🚀 ReddyTalk.ai Frontend Deployment" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Load deployment info if not provided
if (!$ResourceGroupName -or !$StaticWebAppName) {
    $deploymentInfoPath = Join-Path $ScriptDir "deployment-$Environment.json"
    if (Test-Path $deploymentInfoPath) {
        $deploymentInfo = Get-Content $deploymentInfoPath | ConvertFrom-Json
        $ResourceGroupName = $ResourceGroupName ?? $deploymentInfo.ResourceGroup
        $StaticWebAppName = $StaticWebAppName ?? $deploymentInfo.Outputs.staticWebAppName.value
        Write-Host "✅ Loaded deployment info from: $deploymentInfoPath" -ForegroundColor Green
    } else {
        Write-Host "❌ Please provide ResourceGroupName and StaticWebAppName or run infrastructure deployment first" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Static Web App: $StaticWebAppName" -ForegroundColor Yellow

# Verify Static Web App exists
Write-Host "🔍 Verifying Static Web App..." -ForegroundColor Green
try {
    $staticWebApp = az staticwebapp show --name $StaticWebAppName --resource-group $ResourceGroupName --query "name" -o tsv
    if ($staticWebApp) {
        Write-Host "✅ Static Web App found: $staticWebApp" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Static Web App not found: $StaticWebAppName" -ForegroundColor Red
    exit 1
}

# Create frontend structure if it doesn't exist
if (!(Test-Path $FrontendDir)) {
    Write-Host "🏗️ Creating frontend structure..." -ForegroundColor Green
    
    New-Item -ItemType Directory -Path $FrontendDir -Force | Out-Null
    
    # Create package.json for React frontend
    $packageJson = @{
        name = "reddytalk-frontend"
        version = "1.0.0"
        description = "ReddyTalk.ai Frontend"
        dependencies = @{
            "react" = "^18.2.0"
            "react-dom" = "^18.2.0"
            "react-router-dom" = "^6.8.0"
            "axios" = "^1.6.0"
            "@microsoft/signalr" = "^7.0.0"
            "@emotion/react" = "^11.11.0"
            "@emotion/styled" = "^11.11.0"
            "@mui/material" = "^5.15.0"
            "@mui/icons-material" = "^5.15.0"
        }
        devDependencies = @{
            "@vitejs/plugin-react" = "^4.2.0"
            "vite" = "^5.0.0"
            "eslint" = "^8.55.0"
            "eslint-plugin-react" = "^7.33.0"
            "eslint-plugin-react-hooks" = "^4.6.0"
            "eslint-plugin-react-refresh" = "^0.4.5"
        }
        scripts = @{
            "dev" = "vite"
            "build" = "vite build"
            "lint" = "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0"
            "preview" = "vite preview"
        }
    }
    
    $packageJson | ConvertTo-Json -Depth 5 | Out-File (Join-Path $FrontendDir "package.json") -Encoding UTF8
    
    # Create vite.config.js
    $viteConfig = @'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build'
  },
  server: {
    port: 3000
  }
})
'@
    $viteConfig | Out-File (Join-Path $FrontendDir "vite.config.js") -Encoding UTF8
    
    # Create index.html
    $indexHtml = @'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ReddyTalk.ai</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
'@
    $indexHtml | Out-File (Join-Path $FrontendDir "index.html") -Encoding UTF8
    
    # Create src directory and basic React app
    $srcDir = Join-Path $FrontendDir "src"
    New-Item -ItemType Directory -Path $srcDir -Force | Out-Null
    
    $mainJsx = @'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
'@
    $mainJsx | Out-File (Join-Path $srcDir "main.jsx") -Encoding UTF8
    
    $appJsx = @'
import { useState, useEffect } from 'react'
import { Container, Typography, Box, Button, Alert } from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [healthStatus, setHealthStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const checkHealth = async () => {
    setLoading(true)
    try {
      // Get API URL from environment or use default
      const apiUrl = import.meta.env.VITE_API_URL || 'https://your-function-app.azurewebsites.net'
      const response = await fetch(`${apiUrl}/api/health`)
      const data = await response.json()
      setHealthStatus(data)
    } catch (error) {
      setHealthStatus({ status: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          <Typography variant="h2" component="h1" gutterBottom align="center">
            🗣️ ReddyTalk.ai
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
            AI-Powered Medical Voice Assistant
          </Typography>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button 
              variant="contained" 
              onClick={checkHealth}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? 'Checking...' : 'Check API Health'}
            </Button>
            
            {healthStatus && (
              <Box sx={{ mt: 2 }}>
                <Alert 
                  severity={healthStatus.status === 'healthy' ? 'success' : 'error'}
                  sx={{ textAlign: 'left' }}
                >
                  <Typography variant="body2">
                    <strong>Status:</strong> {healthStatus.status}
                  </Typography>
                  {healthStatus.timestamp && (
                    <Typography variant="body2">
                      <strong>Timestamp:</strong> {new Date(healthStatus.timestamp).toLocaleString()}
                    </Typography>
                  )}
                  {healthStatus.environment && (
                    <Typography variant="body2">
                      <strong>Environment:</strong> {healthStatus.environment}
                    </Typography>
                  )}
                  {healthStatus.message && (
                    <Typography variant="body2">
                      <strong>Error:</strong> {healthStatus.message}
                    </Typography>
                  )}
                </Alert>
              </Box>
            )}
          </Box>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Welcome to ReddyTalk.ai - Your AI-powered medical voice assistant platform.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Features coming soon: Voice calls, Real-time transcription, Patient management, and AI training.
            </Typography>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  )
}

export default App
'@
    $appJsx | Out-File (Join-Path $srcDir "App.jsx") -Encoding UTF8
    
    $indexCss = @'
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
'@
    $indexCss | Out-File (Join-Path $srcDir "index.css") -Encoding UTF8
    
    Write-Host "✅ Frontend structure created" -ForegroundColor Green
}

# Build frontend if not skipped
if (!$SkipBuild) {
    Write-Host "🏗️ Building frontend..." -ForegroundColor Green
    
    Push-Location $FrontendDir
    try {
        # Install dependencies
        Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
        npm install
        
        # Build for production
        Write-Host "🔨 Building for production..." -ForegroundColor Yellow
        npm run build
        
        if (!(Test-Path $BuildDir)) {
            Write-Host "❌ Build failed - build directory not found" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✅ Frontend built successfully" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Build failed" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Pop-Location
        exit 1
    } finally {
        Pop-Location
    }
}

# Deploy to Azure Static Web Apps
Write-Host "🚀 Deploying to Azure Static Web Apps..." -ForegroundColor Green
try {
    # Get deployment token
    $deploymentToken = az staticwebapp secrets list --name $StaticWebAppName --resource-group $ResourceGroupName --query "properties.apiKey" -o tsv
    
    if (!$deploymentToken) {
        Write-Host "❌ Could not retrieve deployment token" -ForegroundColor Red
        exit 1
    }
    
    # Install Azure Static Web Apps CLI if not available
    try {
        swa --version | Out-Null
    } catch {
        Write-Host "📦 Installing Azure Static Web Apps CLI..." -ForegroundColor Yellow
        npm install -g @azure/static-web-apps-cli
    }
    
    # Deploy using SWA CLI
    Push-Location $ProjectRoot
    swa deploy $BuildDir --deployment-token $deploymentToken --env $Environment
    Pop-Location
    
    Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Get and display the URL
Write-Host "🌐 Getting deployment URL..." -ForegroundColor Green
try {
    $staticWebAppUrl = az staticwebapp show --name $StaticWebAppName --resource-group $ResourceGroupName --query "defaultHostname" -o tsv
    
    if ($staticWebAppUrl) {
        Write-Host "✅ Frontend deployed to: https://$staticWebAppUrl" -ForegroundColor Cyan
        
        # Test the deployment
        Write-Host "🧪 Testing deployment..." -ForegroundColor Green
        try {
            $response = Invoke-WebRequest -Uri "https://$staticWebAppUrl" -Method GET -TimeoutSec 30
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Frontend is accessible!" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠️ Frontend may still be deploying (this can take a few minutes)" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "⚠️ Could not retrieve frontend URL" -ForegroundColor Yellow
}

Write-Host "🎉 Frontend deployment completed!" -ForegroundColor Green
Write-Host "📖 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Configure custom domain (optional)" -ForegroundColor White
Write-Host "  2. Set up environment-specific configuration" -ForegroundColor White
Write-Host "  3. Configure API URLs in frontend settings" -ForegroundColor White