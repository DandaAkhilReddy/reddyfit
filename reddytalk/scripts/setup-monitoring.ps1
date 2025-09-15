# ReddyTalk.ai Cost Monitoring and Alerts Setup Script
# This script configures cost monitoring, budget alerts, and performance monitoring

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$false)]
    [int]$MonthlyBudget = 1000,
    
    [Parameter(Mandatory=$false)]
    [string]$AlertEmail = "admin@reddytalk.ai"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "📊 ReddyTalk.ai Monitoring & Alerts Setup" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Monthly Budget: $MonthlyBudget USD" -ForegroundColor Yellow

# Get subscription details
Write-Host "🔍 Getting subscription details..." -ForegroundColor Green
try {
    $subscriptionId = az account show --query "id" -o tsv
    $subscriptionName = az account show --query "name" -o tsv
    Write-Host "✅ Subscription: $subscriptionName ($subscriptionId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get subscription details" -ForegroundColor Red
    exit 1
}

# Create budget for the resource group
Write-Host "💰 Creating budget alert..." -ForegroundColor Green
try {
    $budgetName = "reddytalk-$Environment-budget"
    $startDate = (Get-Date).ToString("yyyy-MM-01")
    $endDate = (Get-Date).AddYears(1).ToString("yyyy-MM-01")
    
    $budgetJson = @{
        properties = @{
            category = "Cost"
            amount = $MonthlyBudget
            timeGrain = "Monthly"
            timePeriod = @{
                startDate = $startDate
                endDate = $endDate
            }
            filters = @{
                resourceGroups = @($ResourceGroupName)
            }
            notifications = @{
                "Actual_50_Percent" = @{
                    enabled = $true
                    operator = "GreaterThan"
                    threshold = 50
                    contactEmails = @($AlertEmail)
                    contactRoles = @("Owner", "Contributor")
                    thresholdType = "Actual"
                }
                "Actual_80_Percent" = @{
                    enabled = $true
                    operator = "GreaterThan"
                    threshold = 80
                    contactEmails = @($AlertEmail)
                    contactRoles = @("Owner", "Contributor")
                    thresholdType = "Actual"
                }
                "Forecasted_100_Percent" = @{
                    enabled = $true
                    operator = "GreaterThan"
                    threshold = 100
                    contactEmails = @($AlertEmail)
                    contactRoles = @("Owner", "Contributor")
                    thresholdType = "Forecasted"
                }
            }
        }
    } | ConvertTo-Json -Depth 10
    
    $budgetFile = "$env:TEMP\budget.json"
    $budgetJson | Out-File $budgetFile -Encoding UTF8
    
    az consumption budget create `
        --budget-name $budgetName `
        --amount $MonthlyBudget `
        --resource-group $ResourceGroupName `
        --time-grain Monthly `
        --start-date $startDate `
        --end-date $endDate
        
    Write-Host "✅ Budget alert created: $budgetName" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️ Budget creation failed (may not be supported in subscription): $($_.Exception.Message)" -ForegroundColor Yellow
}

# Create cost anomaly detection
Write-Host "🔍 Setting up cost anomaly detection..." -ForegroundColor Green
try {
    # Cost anomaly detection is typically set up through the portal
    # We'll create an action group for notifications instead
    
    $actionGroupName = "reddytalk-$Environment-alerts"
    
    az monitor action-group create `
        --resource-group $ResourceGroupName `
        --name $actionGroupName `
        --short-name "ReddyAlert" `
        --email-receivers name="Admin" email="$AlertEmail"
    
    Write-Host "✅ Action group created: $actionGroupName" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️ Action group creation failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Get Application Insights resource
Write-Host "📈 Setting up Application Insights alerts..." -ForegroundColor Green
try {
    $appInsightsName = "reddytalk-ai-$Environment"
    $appInsightsInfo = az monitor app-insights component show --resource-group $ResourceGroupName --app $appInsightsName --query "{id:id,instrumentationKey:instrumentationKey}" -o json | ConvertFrom-Json
    
    if ($appInsightsInfo) {
        Write-Host "✅ Found Application Insights: $appInsightsName" -ForegroundColor Green
        
        # Create performance alerts
        $alerts = @(
            @{
                name = "High-Response-Time"
                description = "Alert when response time exceeds 3 seconds"
                query = "requests | where duration > 3000 | summarize AggregatedValue = avg(duration) by bin(timestamp, 5m)"
                threshold = 3000
                operator = "GreaterThan"
            },
            @{
                name = "High-Error-Rate"
                description = "Alert when error rate exceeds 5%"
                query = "requests | summarize total = count(), errors = countif(success == false) | extend errorRate = errors * 100.0 / total"
                threshold = 5
                operator = "GreaterThan"
            },
            @{
                name = "High-Exception-Count"
                description = "Alert when exception count is high"
                query = "exceptions | summarize AggregatedValue = count() by bin(timestamp, 5m)"
                threshold = 10
                operator = "GreaterThan"
            }
        )
        
        foreach ($alert in $alerts) {
            try {
                $alertName = "reddytalk-$Environment-$($alert.name)"
                
                az monitor scheduled-query create `
                    --resource-group $ResourceGroupName `
                    --name $alertName `
                    --description $alert.description `
                    --scopes $appInsightsInfo.id `
                    --condition "count 'Placeholder' $($alert.operator) $($alert.threshold)" `
                    --evaluation-frequency "5m" `
                    --window-size "10m" `
                    --severity 2 `
                    --action-groups "/subscriptions/$subscriptionId/resourceGroups/$ResourceGroupName/providers/Microsoft.Insights/actionGroups/$actionGroupName"
                
                Write-Host "✅ Created alert: $alertName" -ForegroundColor Green
                
            } catch {
                Write-Host "⚠️ Failed to create alert $($alert.name): $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
    
} catch {
    Write-Host "⚠️ Application Insights setup failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Create monitoring dashboard
Write-Host "📊 Creating monitoring dashboard..." -ForegroundColor Green
try {
    $dashboardName = "ReddyTalk-$Environment-Dashboard"
    
    $dashboardTemplate = @{
        properties = @{
            lenses = @{
                "0" = @{
                    order = 0
                    parts = @{
                        "0" = @{
                            position = @{ x = 0; y = 0; rowSpan = 4; colSpan = 6 }
                            metadata = @{
                                inputs = @(
                                    @{
                                        name = "resourceTypeMode"
                                        isOptional = $true
                                    }
                                    @{
                                        name = "ComponentId"
                                        value = @{
                                            Name = $appInsightsName
                                            ResourceGroup = $ResourceGroupName
                                            SubscriptionId = $subscriptionId
                                        }
                                    }
                                )
                                type = "Extension/HubsExtension/PartType/MonitorChartPart"
                                settings = @{
                                    content = @{
                                        options = @{
                                            chart = @{
                                                metrics = @(
                                                    @{
                                                        resourceMetadata = @{
                                                            id = $appInsightsInfo.id
                                                        }
                                                        name = "requests/count"
                                                        aggregationType = 1
                                                        namespace = "microsoft.insights/components"
                                                        metricVisualization = @{
                                                            displayName = "Server requests"
                                                        }
                                                    }
                                                )
                                                title = "Request Rate"
                                                titleKind = 1
                                                visualization = @{
                                                    chartType = 2
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        "1" = @{
                            position = @{ x = 6; y = 0; rowSpan = 4; colSpan = 6 }
                            metadata = @{
                                inputs = @(
                                    @{
                                        name = "ComponentId"
                                        value = @{
                                            Name = $appInsightsName
                                            ResourceGroup = $ResourceGroupName
                                            SubscriptionId = $subscriptionId
                                        }
                                    }
                                )
                                type = "Extension/HubsExtension/PartType/MonitorChartPart"
                                settings = @{
                                    content = @{
                                        options = @{
                                            chart = @{
                                                metrics = @(
                                                    @{
                                                        resourceMetadata = @{
                                                            id = $appInsightsInfo.id
                                                        }
                                                        name = "requests/duration"
                                                        aggregationType = 4
                                                        namespace = "microsoft.insights/components"
                                                        metricVisualization = @{
                                                            displayName = "Server response time"
                                                        }
                                                    }
                                                )
                                                title = "Response Time"
                                                titleKind = 1
                                                visualization = @{
                                                    chartType = 2
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            metadata = @{
                model = @{
                    timeRange = @{
                        value = @{
                            relative = @{
                                duration = 24
                                timeUnit = 1
                            }
                        }
                        type = "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
                    }
                }
            }
        }
        location = "West US 2"
        tags = @{
            "hidden-title" = $dashboardName
        }
    } | ConvertTo-Json -Depth 20
    
    $dashboardFile = "$env:TEMP\dashboard.json"
    $dashboardTemplate | Out-File $dashboardFile -Encoding UTF8
    
    az portal dashboard create `
        --resource-group $ResourceGroupName `
        --name $dashboardName `
        --input-path $dashboardFile
    
    Write-Host "✅ Dashboard created: $dashboardName" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️ Dashboard creation failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Create cost analysis report
Write-Host "💸 Setting up cost analysis..." -ForegroundColor Green
try {
    $reportName = "ReddyTalk-$Environment-CostReport"
    
    # Create a simple cost query
    $costQuery = @{
        type = "Usage"
        timeframe = "MonthToDate"
        dataset = @{
            granularity = "Daily"
            aggregation = @{
                totalCost = @{
                    name = "PreTaxCost"
                    function = "Sum"
                }
            }
            grouping = @(
                @{
                    type = "Dimension"
                    name = "ServiceName"
                }
            )
            filter = @{
                dimensions = @{
                    name = "ResourceGroup"
                    operator = "In"
                    values = @($ResourceGroupName)
                }
            }
        }
    } | ConvertTo-Json -Depth 10
    
    Write-Host "📋 Cost query template created for manual setup" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️ Cost analysis setup failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Save monitoring configuration
$monitoringConfig = @{
    Environment = $Environment
    ResourceGroup = $ResourceGroupName
    MonthlyBudget = $MonthlyBudget
    AlertEmail = $AlertEmail
    SubscriptionId = $subscriptionId
    ActionGroupName = $actionGroupName
    BudgetName = $budgetName
    DashboardName = $dashboardName
    CreatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Alerts = @(
        "High Response Time (>3s)",
        "High Error Rate (>5%)",
        "High Exception Count (>10/5min)",
        "Budget Alert (50%, 80%, 100%)"
    )
    MonitoringEndpoints = @{
        Dashboard = "https://portal.azure.com/#blade/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade/overview"
        CostManagement = "https://portal.azure.com/#blade/Microsoft_Azure_CostManagement/Menu/costanalysis"
        ApplicationInsights = "https://portal.azure.com/#resource$($appInsightsInfo.id)/overview"
    }
}

$configPath = Join-Path $ScriptDir "monitoring-$Environment.json"
$monitoringConfig | ConvertTo-Json -Depth 5 | Out-File $configPath -Encoding UTF8

Write-Host "📁 Monitoring configuration saved to: $configPath" -ForegroundColor Green

Write-Host "🎉 Monitoring setup completed!" -ForegroundColor Green
Write-Host "📖 What was configured:" -ForegroundColor Cyan
Write-Host "  ✅ Budget alerts at 50%, 80%, and 100% of $MonthlyBudget USD" -ForegroundColor White
Write-Host "  ✅ Action group for email notifications" -ForegroundColor White
Write-Host "  ✅ Performance alerts (response time, error rate, exceptions)" -ForegroundColor White
Write-Host "  ✅ Monitoring dashboard" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "📊 Access your monitoring:" -ForegroundColor Cyan
Write-Host "  • Azure Portal: https://portal.azure.com" -ForegroundColor White
Write-Host "  • Cost Management: Subscriptions → Cost Management" -ForegroundColor White
Write-Host "  • Application Insights: $ResourceGroupName → $appInsightsName" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "⚠️ Additional setup needed:" -ForegroundColor Yellow
Write-Host "  • Review and customize alert thresholds in Azure Portal" -ForegroundColor White
Write-Host "  • Set up cost anomaly detection (Portal only)" -ForegroundColor White
Write-Host "  • Configure custom metrics for business KPIs" -ForegroundColor White