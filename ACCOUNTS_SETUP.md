# ReddyTalk.ai - Required Accounts & Setup Guide

This document outlines all the accounts and services you need to set up to get ReddyTalk.ai fully operational with voice calling capabilities.

## 🏗️ Architecture Overview

ReddyTalk.ai uses the following services:
- **Frontend**: Azure Static Web Apps (HTML/CSS/JS)
- **Backend API**: Azure Container Apps (Node.js/Express)
- **Database**: Azure Database for PostgreSQL
- **AI**: Azure OpenAI Service (GPT-4 Turbo)
- **Speech**: Azure Cognitive Services (Speech-to-Text + Text-to-Speech)
- **Voice Calls**: Twilio Voice API
- **Messaging**: Twilio SMS (optional)
- **Storage**: Azure Blob Storage (for recordings)

## 📋 Required Accounts & Services

### 1. Azure Account (Primary Cloud Provider)
**What you need**: Azure account with active subscription
**Cost**: Pay-as-you-go pricing
**Setup steps**:
1. Go to [portal.azure.com](https://portal.azure.com)
2. Sign up for free account (includes $200 free credits)
3. Enable pay-as-you-go billing after credits

**Required Azure Services**:
- ✅ **Azure Container Apps** (Backend hosting)
- ✅ **Azure Static Web Apps** (Frontend hosting) 
- ✅ **Azure Database for PostgreSQL** (Database)
- ✅ **Azure OpenAI Service** (AI/GPT-4)
- ✅ **Azure Cognitive Services - Speech** (Voice processing)
- ⚪ **Azure Blob Storage** (Call recordings - optional)
- ⚪ **Azure Application Insights** (Monitoring - optional)

### 2. Twilio Account (Voice & SMS)
**What you need**: Twilio account for voice calls
**Cost**: Pay-per-use (approx $0.0085/minute for calls)
**Setup steps**:

1. **Sign up for Twilio**:
   - Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
   - Sign up and verify your phone number
   - Get $15 free trial credit

2. **Get your credentials**:
   ```
   Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Auth Token: your_auth_token_here
   ```

3. **Purchase a phone number**:
   - Go to Console → Phone Numbers → Manage → Buy a number
   - Choose a local number with Voice capabilities
   - Cost: ~$1-5/month depending on features

4. **Configure webhook URLs** (we'll do this after deployment):
   ```
   Voice URL: https://your-api-domain.com/webhooks/twilio/voice
   Status Callback: https://your-api-domain.com/webhooks/twilio/status
   ```

**Twilio Services Needed**:
- ✅ **Voice API** (Phone calls)
- ⚪ **SMS API** (Text messaging - optional)
- ⚪ **Studio** (Call flows - optional for complex routing)

### 3. Domain & SSL (Optional but Recommended)
**What you need**: Custom domain for professional setup
**Options**:
- **Azure Custom Domains** (recommended)
- **Cloudflare** (DNS + CDN)
- **GoDaddy/Namecheap** (Domain registrar)

## 💰 Cost Breakdown (Monthly Estimates)

### Azure Costs:
- **Container Apps**: $10-50/month (depending on traffic)
- **Static Web Apps**: Free tier available
- **PostgreSQL**: $20-100/month (depends on size)
- **Azure OpenAI**: $20-200/month (depends on usage)
- **Speech Services**: $1-10/month (pay per use)
- **Total Azure**: ~$50-350/month

### Twilio Costs:
- **Phone Number**: $1-5/month
- **Voice Calls**: $0.0085/minute (~$0.50 per hour)
- **SMS** (optional): $0.0075/message
- **Estimated for 100 calls/month**: $15-25/month

### **Total Estimated Monthly Cost**: $65-375/month
*(Depending on usage and scaling needs)*

## 🔧 Detailed Setup Instructions

### Step 1: Azure Setup

1. **Create Resource Group**:
   ```bash
   az group create --name reddytalk-prod --location eastus
   ```

2. **Create Azure OpenAI Service**:
   - Request access at [oai.azure.com](https://oai.azure.com)
   - Wait for approval (can take 24-48 hours)
   - Deploy GPT-4 Turbo model

3. **Create Speech Service**:
   ```bash
   az cognitiveservices account create \
     --name reddytalk-speech \
     --resource-group reddytalk-prod \
     --kind SpeechServices \
     --sku S0 \
     --location eastus
   ```

4. **Create PostgreSQL Database**:
   ```bash
   az postgres server create \
     --resource-group reddytalk-prod \
     --name reddytalk-db \
     --location eastus \
     --admin-user reddytalkadmin \
     --admin-password "YourSecurePassword123!" \
     --sku-name GP_Gen5_2
   ```

### Step 2: Twilio Setup

1. **Get Twilio Console credentials**:
   - Login to [console.twilio.com](https://console.twilio.com)
   - Copy Account SID and Auth Token

2. **Buy a phone number**:
   ```javascript
   // Using Twilio Console or API
   const client = require('twilio')(accountSid, authToken);
   
   client.availablePhoneNumbers('US')
     .local
     .list({voiceEnabled: true, limit: 20})
     .then(numbers => console.log(numbers));
   ```

3. **Configure webhooks** (after deployment):
   ```bash
   # Update phone number with webhook URLs
   curl -X POST https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/IncomingPhoneNumbers/$PHONE_NUMBER_SID \
     -d "VoiceUrl=https://your-api.azurecontainerapps.io/webhooks/twilio/voice" \
     -d "VoiceMethod=POST" \
     -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
   ```

## 🔐 Environment Variables Setup

Update your `.env` file with all the credentials:

```env
# ============================
# Azure Services
# ============================
AZURE_OPENAI_API_KEY=your_openai_key
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4-turbo
AZURE_SPEECH_KEY=your_speech_key
AZURE_SPEECH_REGION=eastus
AZURE_SPEECH_ENDPOINT=https://your-speech.cognitiveservices.azure.com/

# ============================
# Database
# ============================
DB_HOST=your-db.postgres.database.azure.com
DB_NAME=reddytalk
DB_USER=reddytalkadmin
DB_PASSWORD=YourSecurePassword123!
DATABASE_URL=postgresql://reddytalkadmin:YourSecurePassword123!@your-db.postgres.database.azure.com:5432/reddytalk?sslmode=require

# ============================
# Twilio Configuration
# ============================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+15551234567
TWILIO_WEBHOOK_URL=https://your-api.azurecontainerapps.io

# ============================
# Application URLs
# ============================
APP_URL=https://your-frontend.azurestaticapps.net
API_URL=https://your-api.azurecontainerapps.io
NODE_ENV=production
```

## 🚀 Deployment Checklist

### Pre-Deployment:
- [ ] Azure account created and billing enabled
- [ ] Twilio account created with phone number purchased
- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] SSL certificates configured

### Post-Deployment:
- [ ] Twilio webhook URLs updated with production domain
- [ ] Phone number tested for incoming calls
- [ ] AI responses tested and working
- [ ] Database connectivity verified
- [ ] Monitoring and alerts configured

## 🧪 Testing Your Setup

### 1. Test Individual Services:
```bash
# Test Azure Speech
curl -X POST "https://your-api.com/api/voice/transcribe" \
  -H "Content-Type: application/json" \
  -d '{"audioData": "base64_audio_data"}'

# Test Azure OpenAI
curl -X GET "https://your-api.com/api/test/simple/knowledge"

# Test Twilio
curl -X POST "https://your-api.com/api/call/outbound" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15551234567", "sessionId": "test-123"}'
```

### 2. End-to-End Testing:
1. Open the test interface: `https://your-domain.com/test-interface.html`
2. Test microphone access
3. Start a conversation flow
4. Make a test call using Twilio
5. Verify transcription and AI responses

## 🔧 Maintenance & Monitoring

### Regular Tasks:
- **Monthly**: Review Twilio usage and costs
- **Weekly**: Check Azure service health
- **Daily**: Monitor call quality and AI response times

### Monitoring Setup:
```bash
# Enable Application Insights
az monitor app-insights component create \
  --app reddytalk-insights \
  --location eastus \
  --resource-group reddytalk-prod
```

### Backup Strategy:
- **Database**: Automated daily backups via Azure
- **Recordings**: Store in Azure Blob Storage
- **Configuration**: Keep `.env` file backed up securely

## 🆘 Troubleshooting Common Issues

### Twilio Issues:
```bash
# Check webhook connectivity
curl -X POST "https://your-api.com/webhooks/twilio/voice" \
  -d "CallSid=test&From=+15551234567&To=+15551234567"

# Validate phone number
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/IncomingPhoneNumbers.json" \
  -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

### Azure Issues:
```bash
# Check service health
az resource list --resource-group reddytalk-prod --output table

# Test database connection
psql "postgresql://user:pass@host:5432/dbname?sslmode=require"
```

## 📞 Support & Resources

### Documentation:
- [Twilio Voice API Docs](https://www.twilio.com/docs/voice)
- [Azure OpenAI Service Docs](https://docs.microsoft.com/azure/cognitive-services/openai/)
- [Azure Speech Service Docs](https://docs.microsoft.com/azure/cognitive-services/speech-service/)

### Support Contacts:
- **Twilio Support**: [support.twilio.com](https://support.twilio.com)
- **Azure Support**: [azure.microsoft.com/support](https://azure.microsoft.com/support/)

---

## 🎯 Next Steps After Setup

1. **Deploy the complete system** using the provided Docker configuration
2. **Configure Twilio webhooks** with your production URLs
3. **Test end-to-end calling functionality**
4. **Set up monitoring and alerts**
5. **Train your team** on the dashboard and admin features

**Estimated Setup Time**: 4-8 hours for complete deployment
**Technical Skill Level**: Intermediate to Advanced

---

*This setup guide ensures you have everything needed for a production-ready ReddyTalk.ai deployment with full voice calling capabilities.*