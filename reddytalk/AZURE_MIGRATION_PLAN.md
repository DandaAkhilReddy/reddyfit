# ReddyTalk.ai Azure Migration Plan
## From Current Setup to Cost-Optimized MVP Architecture

---

## Migration Overview

**Current State**: Node.js/Express app with comprehensive backend
**Target State**: Azure Serverless MVP ($500-1000/month)
**Migration Strategy**: Gradual refactoring to serverless functions

---

## Phase 1: Infrastructure Setup (Week 1)

### 1.1 Azure Services to Create
```
Priority 1 - Core Services (Free Tiers):
├── Resource Group: rg-reddytalk-mvp
├── Static Web App: swa-reddytalk-frontend
├── Function App: func-reddytalk-api (Consumption)
├── Storage Account: streddytalkdata001
├── Application Insights: ai-reddytalk-monitoring
└── SignalR Service: signalr-reddytalk (Free - 20 connections)

Priority 2 - Data & AI Services:
├── Cosmos DB: cosmos-reddytalk-data (Serverless)
├── Azure OpenAI: openai-reddytalk-gpt
├── Speech Services: speech-reddytalk-stt
└── Key Vault: kv-reddytalk-secrets
```

### 1.2 Cost Estimation (Month 1)
| Service | Expected Cost | Notes |
|---------|---------------|--------|
| Static Web Apps | $0 | Free tier (100GB) |
| Function App | $20-50 | Pay per execution |
| Storage Account | $5-10 | Blob + table storage |
| Application Insights | $0 | Free 5GB/month |
| SignalR Service | $0 | Free 20 connections |
| Cosmos DB | $25-50 | Serverless billing |
| Azure OpenAI | $100-200 | Pay per token |
| Speech Services | $50-100 | STT/TTS usage |
| Key Vault | $2 | Secret operations |
| **TOTAL** | **$202-412** | Well under budget |

---

## Phase 2: Service Mapping (Week 2)

### 2.1 Current → Azure Service Mapping

```
CURRENT COMPONENTS → AZURE SERVICES

1. Express.js API Server
   ├── Authentication routes → Azure Function (HTTP Trigger)
   ├── Patient management → Azure Function (HTTP Trigger)
   ├── Call recording → Azure Function + SignalR
   ├── Live transcription → Azure Function + Speech Services
   └── Training pipeline → Azure Function (Timer Trigger)

2. Database Layer
   ├── PostgreSQL → Cosmos DB (SQL API)
   ├── User sessions → Cosmos DB + Redis Cache (later)
   └── File storage → Azure Blob Storage

3. Real-time Communication
   ├── Socket.IO → Azure SignalR Service
   ├── WebSocket management → SignalR Functions
   └── Live updates → SignalR broadcast

4. AI/Voice Services
   ├── ElevenLabs → Keep as external + Azure TTS backup
   ├── OpenAI → Azure OpenAI Service
   ├── Speech processing → Azure Speech Services
   └── NLP analysis → Azure Cognitive Services

5. Frontend
   ├── React Dashboard → Static Web Apps
   ├── Login/Register pages → Static Web Apps
   └── Real-time UI → SignalR client
```

### 2.2 Data Migration Strategy

```
DATABASE SCHEMA MIGRATION:

PostgreSQL Tables → Cosmos DB Collections:
├── users → users (partition: /id)
├── patients → patients (partition: /patient_id) 
├── call_sessions → sessions (partition: /user_id)
├── call_transcripts → transcripts (partition: /session_id)
├── training_data → training (partition: /type)
└── model_versions → models (partition: /version)

Key Considerations:
• Partition key selection for optimal performance
• TTL policies for cost optimization
• Indexing strategy for queries
• Data encryption at rest (automatic)
```

---

## Phase 3: Function Architecture Design

### 3.1 Azure Functions Structure

```
FUNCTION APP ORGANIZATION:

📁 reddytalk-functions/
├── 📁 auth/
│   ├── login.js (HTTP Trigger)
│   ├── register.js (HTTP Trigger)
│   ├── validate-token.js (HTTP Trigger)
│   └── refresh-token.js (HTTP Trigger)
├── 📁 patients/
│   ├── create-patient.js (HTTP Trigger)
│   ├── get-patient.js (HTTP Trigger)
│   ├── search-patients.js (HTTP Trigger)
│   └── update-patient.js (HTTP Trigger)
├── 📁 voice/
│   ├── start-session.js (HTTP Trigger)
│   ├── process-audio.js (SignalR + STT)
│   ├── generate-response.js (OpenAI + TTS)
│   └── end-session.js (HTTP Trigger)
├── 📁 realtime/
│   ├── negotiate.js (SignalR Negotiate)
│   ├── broadcast.js (SignalR Output)
│   └── connection-handler.js (SignalR Hub)
├── 📁 training/
│   ├── collect-data.js (Timer Trigger)
│   ├── process-training.js (Queue Trigger)
│   └── model-update.js (HTTP Trigger)
└── 📁 shared/
    ├── cosmos-client.js
    ├── auth-middleware.js
    ├── error-handler.js
    └── logging.js
```

### 3.2 Function Configuration

```javascript
// Function App Settings (Environment Variables)
{
  "COSMOS_DB_CONNECTION": "@Microsoft.KeyVault(SecretUri=...)",
  "OPENAI_API_KEY": "@Microsoft.KeyVault(SecretUri=...)",
  "ELEVENLABS_API_KEY": "@Microsoft.KeyVault(SecretUri=...)",
  "SPEECH_SERVICE_KEY": "@Microsoft.KeyVault(SecretUri=...)",
  "SIGNALR_CONNECTION": "@Microsoft.KeyVault(SecretUri=...)",
  "JWT_SECRET": "@Microsoft.KeyVault(SecretUri=...)",
  "BLOB_STORAGE_CONNECTION": "DefaultEndpointsProtocol=https...",
  "FUNCTIONS_WORKER_RUNTIME": "node",
  "FUNCTIONS_EXTENSION_VERSION": "~4",
  "NODE_ENV": "production"
}
```

---

## Phase 4: Migration Timeline

### Week 1: Foundation Setup
- [ ] Create Azure resources using Bicep templates
- [ ] Setup GitHub Actions for CI/CD
- [ ] Configure Key Vault and secrets
- [ ] Setup monitoring and alerts
- [ ] Validate all services are accessible

### Week 2: Core Functions
- [ ] Migrate authentication logic to Azure Functions
- [ ] Setup Cosmos DB collections and indexes
- [ ] Implement basic CRUD operations
- [ ] Setup SignalR negotiate function
- [ ] Test function deployments

### Week 3: Voice Integration
- [ ] Implement Azure Speech Services integration
- [ ] Setup Azure OpenAI service connection
- [ ] Create audio processing pipeline
- [ ] Implement real-time voice functions
- [ ] Test end-to-end voice flow

### Week 4: Frontend & Real-time
- [ ] Deploy React app to Static Web Apps
- [ ] Update frontend to use Azure Functions APIs
- [ ] Implement SignalR client integration
- [ ] Setup real-time dashboard updates
- [ ] End-to-end testing

### Week 5: Advanced Features
- [ ] Migrate patient management system
- [ ] Setup training data collection
- [ ] Implement call recording functions
- [ ] Add live transcription features
- [ ] Performance optimization

### Week 6: Production Readiness
- [ ] Setup monitoring dashboards
- [ ] Implement error handling and retry logic
- [ ] Load testing and optimization
- [ ] Security audit and fixes
- [ ] Go-live preparation

---

## Phase 5: Data Migration Strategy

### 5.1 Zero-Downtime Migration

```
MIGRATION APPROACH:

1. Parallel Running (2 weeks)
   ├── Keep current PostgreSQL system running
   ├── Sync data to Cosmos DB in real-time
   ├── Route read traffic gradually to new system
   └── Validate data consistency

2. Cutover Weekend
   ├── Final data synchronization
   ├── Update DNS/routing
   ├── Monitor for issues
   └── Rollback plan ready

3. Cleanup (1 week after)
   ├── Verify new system stability
   ├── Remove old infrastructure
   ├── Update documentation
   └── Team training on new system
```

### 5.2 Data Sync Script

```javascript
// Cosmos DB Migration Script
const migrateData = async () => {
  // 1. Export PostgreSQL data
  const pgData = await exportPostgreSQLData();
  
  // 2. Transform to Cosmos DB format
  const cosmosData = transformToCosmosFormat(pgData);
  
  // 3. Batch insert to Cosmos DB
  await batchInsertToCosmos(cosmosData);
  
  // 4. Validate data integrity
  await validateMigration();
};
```

---

## Phase 6: Cost Optimization

### 6.1 Immediate Optimizations

```
COST REDUCTION STRATEGIES:

1. Function Optimization
   ├── Use async/await properly
   ├── Minimize cold start times
   ├── Implement connection pooling
   └── Cache frequently accessed data

2. Storage Optimization
   ├── Implement blob lifecycle policies
   ├── Use appropriate storage tiers
   ├── Compress audio files
   └── Set TTL on temporary data

3. AI Service Optimization
   ├── Cache TTS responses
   ├── Optimize OpenAI prompts
   ├── Use batch processing where possible
   └── Implement rate limiting
```

### 6.2 Monitoring & Alerts

```
COST MONITORING SETUP:

Azure Cost Management:
├── Daily budget: $50
├── Weekly budget: $300
├── Monthly budget: $1000
├── Alert thresholds: 50%, 80%, 95%
└── Automatic scaling rules

Application Insights:
├── Performance degradation alerts
├── High error rate notifications
├── Dependency failure alerts
└── Custom metrics for voice quality
```

---

## Phase 7: Rollback Plan

### 7.1 Rollback Triggers
- Function failure rate > 5%
- Response time > 3 seconds
- Cost exceeds 150% of budget
- Data corruption detected
- Critical security issue

### 7.2 Rollback Procedure
1. **Immediate**: Route traffic back to current system
2. **Data**: Stop Cosmos DB sync, validate PostgreSQL data
3. **DNS**: Update routing rules (5 min rollback)
4. **Monitoring**: Alert stakeholders of rollback
5. **Analysis**: Root cause analysis and fix planning

---

## Success Metrics

### Technical KPIs
- Function execution success rate: >99.9%
- Average response time: <500ms
- Voice processing latency: <2 seconds
- Data consistency: 100%
- Uptime: >99.95%

### Business KPIs
- Monthly cost reduction: >60%
- Scalability improvement: 10x capacity
- Development velocity: +50%
- Deployment frequency: Daily vs Weekly
- Time to market: -75% for new features

### User Experience KPIs
- Voice recognition accuracy: >95%
- User session success rate: >98%
- Real-time update latency: <100ms
- Dashboard load time: <2 seconds
- Mobile responsiveness: Full support

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Function cold start | High | Medium | Premium plan upgrade |
| Cosmos DB throttling | Medium | High | Auto-scale settings |
| Cost overrun | Medium | High | Budget alerts + limits |
| Data loss | Low | Critical | Backup strategy |
| Service outage | Low | High | Multi-region deployment |

---

## Next Steps

1. **Review and Approve** this migration plan
2. **Provision Azure Resources** using Bicep templates
3. **Setup Development Environment** with local Azure Functions
4. **Begin Function Development** starting with authentication
5. **Implement CI/CD Pipeline** for continuous deployment

**Estimated Timeline**: 6 weeks
**Estimated Cost Savings**: 60-80% monthly reduction
**Risk Level**: Medium (well-planned migration)
**Rollback Time**: <5 minutes if needed