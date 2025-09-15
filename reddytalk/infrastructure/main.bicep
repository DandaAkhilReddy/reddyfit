// ReddyTalk.ai MVP Infrastructure - Cost Optimized
// This template creates all Azure resources for the MVP architecture
// Target cost: $500-1000/month for 100-1000 concurrent users

targetScope = 'resourceGroup'

@description('Environment name (dev, staging, prod)')
param environment string = 'dev'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Unique suffix for resource names')
param uniqueSuffix string = substring(uniqueString(resourceGroup().id), 0, 6)

@description('GitHub repository for Static Web Apps')
param githubRepo string = 'DandaAkhilReddy/ReddyTalk'

@description('GitHub branch for deployment')
param githubBranch string = 'master'

// Variables
var resourcePrefix = 'reddytalk'
var tags = {
  Environment: environment
  Application: 'ReddyTalk-AI'
  CostCenter: 'MVP'
  Owner: 'Engineering'
}

// Naming convention
var storageAccountName = '${resourcePrefix}data${uniqueSuffix}'
var functionAppName = '${resourcePrefix}-api-${environment}-${uniqueSuffix}'
var staticWebAppName = '${resourcePrefix}-frontend-${environment}'
var cosmosAccountName = '${resourcePrefix}-cosmos-${environment}-${uniqueSuffix}'
var speechServiceName = '${resourcePrefix}-speech-${environment}-${uniqueSuffix}'
var openAIServiceName = '${resourcePrefix}-openai-${environment}-${uniqueSuffix}'
var signalRServiceName = '${resourcePrefix}-signalr-${environment}-${uniqueSuffix}'
var keyVaultName = '${resourcePrefix}-kv-${uniqueSuffix}'
var appInsightsName = '${resourcePrefix}-ai-${environment}-${uniqueSuffix}'
var logAnalyticsName = '${resourcePrefix}-logs-${environment}-${uniqueSuffix}'

// ==============================================================================
// STORAGE ACCOUNT (Blob Storage for audio files, function storage)
// ==============================================================================

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS' // Cheapest option for MVP
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    networkAcls: {
      defaultAction: 'Allow' // Restrict in production
    }
  }

  resource blobServices 'blobServices@2023-01-01' = {
    name: 'default'
    properties: {
      deleteRetentionPolicy: {
        enabled: true
        days: 7 // Cost optimization
      }
    }

    // Containers for different types of data
    resource audioContainer 'containers@2023-01-01' = {
      name: 'audio-files'
      properties: {
        publicAccess: 'None'
        metadata: {
          description: 'Audio recordings and TTS cache'
        }
      }
    }

    resource logsContainer 'containers@2023-01-01' = {
      name: 'logs'
      properties: {
        publicAccess: 'None'
        metadata: {
          description: 'Application logs and diagnostics'
        }
      }
    }

    resource tempContainer 'containers@2023-01-01' = {
      name: 'temp'
      properties: {
        publicAccess: 'None'
        metadata: {
          description: 'Temporary files - auto-delete after 24h'
        }
      }
    }
  }
}

// Storage lifecycle management for cost optimization
resource storageLifecyclePolicy 'Microsoft.Storage/storageAccounts/managementPolicies@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    policy: {
      rules: [
        {
          name: 'DeleteTempFiles'
          enabled: true
          type: 'Lifecycle'
          definition: {
            actions: {
              baseBlob: {
                delete: {
                  daysAfterModificationGreaterThan: 1
                }
              }
            }
            filters: {
              blobTypes: ['blockBlob']
              prefixMatch: ['temp/']
            }
          }
        }
        {
          name: 'MoveToArchive'
          enabled: true
          type: 'Lifecycle'
          definition: {
            actions: {
              baseBlob: {
                tierToArchive: {
                  daysAfterModificationGreaterThan: 30
                }
              }
            }
            filters: {
              blobTypes: ['blockBlob']
              prefixMatch: ['audio-files/']
            }
          }
        }
      ]
    }
  }
}

// ==============================================================================
// LOG ANALYTICS WORKSPACE (For Application Insights)
// ==============================================================================

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30 // Cost optimization - reduce for MVP
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// ==============================================================================
// APPLICATION INSIGHTS (Monitoring - Free tier)
// ==============================================================================

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ==============================================================================
// KEY VAULT (Secrets management)
// ==============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard' // Cheapest option
    }
    accessPolicies: []
    enabledForTemplateDeployment: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7 // Minimum for cost optimization
    enablePurgeProtection: false // Enable in production
    publicNetworkAccess: 'enabled' // Restrict in production
  }
}

// ==============================================================================
// COSMOS DB (Serverless - Pay per request)
// ==============================================================================

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: cosmosAccountName
  location: location
  tags: tags
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session' // Good balance of consistency and performance
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    capabilities: [
      {
        name: 'EnableServerless' // Cost optimization - pay per request
      }
    ]
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 240 // 4 hours
        backupRetentionIntervalInHours: 720 // 30 days
        backupStorageRedundancy: 'Local' // Cost optimization
      }
    }
  }

  resource cosmosDatabase 'sqlDatabases@2023-04-15' = {
    name: 'reddytalk-data'
    properties: {
      resource: {
        id: 'reddytalk-data'
      }
    }

    // Users collection
    resource usersContainer 'containers@2023-04-15' = {
      name: 'users'
      properties: {
        resource: {
          id: 'users'
          partitionKey: {
            paths: ['/id']
            kind: 'Hash'
          }
          defaultTtl: -1 // No automatic expiration
          indexingPolicy: {
            indexingMode: 'consistent'
            includedPaths: [
              {
                path: '/*'
              }
            ]
            excludedPaths: [
              {
                path: '/"_etag"/?'
              }
            ]
          }
        }
      }
    }

    // Sessions collection with TTL for cost optimization
    resource sessionsContainer 'containers@2023-04-15' = {
      name: 'sessions'
      properties: {
        resource: {
          id: 'sessions'
          partitionKey: {
            paths: ['/userId']
            kind: 'Hash'
          }
          defaultTtl: 604800 // 7 days automatic cleanup
        }
      }
    }

    // Patients collection
    resource patientsContainer 'containers@2023-04-15' = {
      name: 'patients'
      properties: {
        resource: {
          id: 'patients'
          partitionKey: {
            paths: ['/patientId']
            kind: 'Hash'
          }
          defaultTtl: -1 // No automatic expiration for patient data
        }
      }
    }

    // Transcripts collection with TTL
    resource transcriptsContainer 'containers@2023-04-15' = {
      name: 'transcripts'
      properties: {
        resource: {
          id: 'transcripts'
          partitionKey: {
            paths: ['/sessionId']
            kind: 'Hash'
          }
          defaultTtl: 2592000 // 30 days
        }
      }
    }

    // Training data collection
    resource trainingContainer 'containers@2023-04-15' = {
      name: 'training-data'
      properties: {
        resource: {
          id: 'training-data'
          partitionKey: {
            paths: ['/type']
            kind: 'Hash'
          }
          defaultTtl: -1 // Keep training data
        }
      }
    }
  }
}

// ==============================================================================
// AZURE SPEECH SERVICES (STT/TTS)
// ==============================================================================

resource speechService 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: speechServiceName
  location: location
  tags: tags
  sku: {
    name: 'F0' // Free tier to start - 5 hours STT, 0.5M chars TTS
  }
  kind: 'SpeechServices'
  properties: {
    customSubDomainName: speechServiceName
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
}

// ==============================================================================
// AZURE OPENAI (When available)
// ==============================================================================

// Note: This may need to be created manually or through request process
resource openAIService 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: openAIServiceName
  location: location
  tags: tags
  sku: {
    name: 'S0' // Pay-as-you-go
  }
  kind: 'OpenAI'
  properties: {
    customSubDomainName: openAIServiceName
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
}

// ==============================================================================
// SIGNALR SERVICE (Real-time communication)
// ==============================================================================

resource signalRService 'Microsoft.SignalRService/signalR@2023-02-01' = {
  name: signalRServiceName
  location: location
  tags: tags
  sku: {
    name: 'Free_F1' // Free tier - 20 concurrent connections
    capacity: 1
  }
  properties: {
    features: [
      {
        flag: 'ServiceMode'
        value: 'Serverless'
      }
    ]
    cors: {
      allowedOrigins: ['*'] // Restrict in production
    }
  }
}

// ==============================================================================
// FUNCTION APP (Serverless backend)
// ==============================================================================

// App Service Plan for Functions (Consumption - pay per execution)
resource functionAppServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${functionAppName}-plan'
  location: location
  tags: tags
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved: false // Windows functions
  }
}

// Function App
resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: functionAppName
  location: location
  tags: tags
  kind: 'functionapp'
  properties: {
    serverFarmId: functionAppServicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${az.environment().suffixes.storage}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${az.environment().suffixes.storage}'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: '${functionAppName}-content'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: applicationInsights.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
        {
          name: 'COSMOS_DB_CONNECTION'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/cosmos-connection-string/)'
        }
        {
          name: 'SIGNALR_CONNECTION'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/signalr-connection-string/)'
        }
        {
          name: 'SPEECH_SERVICE_KEY'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/speech-service-key/)'
        }
        {
          name: 'OPENAI_API_KEY'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/openai-api-key/)'
        }
        {
          name: 'JWT_SECRET'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/jwt-secret/)'
        }
        {
          name: 'NODE_ENV'
          value: environment
        }
      ]
      cors: {
        allowedOrigins: ['*'] // Update with actual domains in production
        supportCredentials: true
      }
      use32BitWorkerProcess: false // Use 64-bit for better performance
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
    }
    httpsOnly: true
  }
  dependsOn: [
    applicationInsights
    storageAccount
  ]
}

// ==============================================================================
// STATIC WEB APP (Frontend hosting - FREE tier)
// ==============================================================================

resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: 'https://github.com/${githubRepo}'
    branch: githubBranch
    buildProperties: {
      appLocation: '/frontend'
      apiLocation: '' // We're using separate Function App for API
      outputLocation: 'build'
    }
  }
}

// ==============================================================================
// KEY VAULT SECRETS (Store sensitive data)
// ==============================================================================

// Function App system-assigned identity for Key Vault access
resource functionAppIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${functionAppName}-identity'
  location: location
  tags: tags
}

// Key Vault access policy for Function App
resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-02-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: functionApp.identity.principalId
        permissions: {
          secrets: ['get', 'list']
        }
      }
    ]
  }
}

// Store connection strings and keys in Key Vault
resource cosmosConnectionSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'cosmos-connection-string'
  properties: {
    value: cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString
  }
  dependsOn: [
    keyVaultAccessPolicy
  ]
}

resource signalRConnectionSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'signalr-connection-string'
  properties: {
    value: signalRService.listKeys().primaryConnectionString
  }
  dependsOn: [
    keyVaultAccessPolicy
  ]
}

resource speechServiceKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'speech-service-key'
  properties: {
    value: speechService.listKeys().key1
  }
  dependsOn: [
    keyVaultAccessPolicy
  ]
}

resource openAIKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'openai-api-key'
  properties: {
    value: openAIService.listKeys().key1
  }
  dependsOn: [
    keyVaultAccessPolicy
  ]
}

resource jwtSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'jwt-secret'
  properties: {
    value: uniqueString(resourceGroup().id, deployment().name)
  }
  dependsOn: [
    keyVaultAccessPolicy
  ]
}

// ==============================================================================
// OUTPUTS (For use in other templates or scripts)
// ==============================================================================

@description('Function App name')
output functionAppName string = functionApp.name

@description('Static Web App name')
output staticWebAppName string = staticWebApp.name

@description('Storage Account name')
output storageAccountName string = storageAccount.name

@description('Cosmos DB account name')
output cosmosAccountName string = cosmosAccount.name

@description('Key Vault name')
output keyVaultName string = keyVault.name

@description('Application Insights instrumentation key')
output appInsightsInstrumentationKey string = applicationInsights.properties.InstrumentationKey

@description('Static Web App default hostname')
output staticWebAppUrl string = staticWebApp.properties.defaultHostname

@description('Function App default hostname')
output functionAppUrl string = functionApp.properties.defaultHostName

@description('Resource Group name')
output resourceGroupName string = resourceGroup().name

@description('Estimated monthly cost (USD)')
output estimatedMonthlyCost string = 'Static Web App: $0, Functions: $20-50, Cosmos DB: $25-50, Speech: $50-100, Storage: $5-10, Total: $100-210'