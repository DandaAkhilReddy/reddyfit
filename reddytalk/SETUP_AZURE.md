# ReddyTalk.ai - Azure Setup Guide for MVP

## Prerequisites

1. **Azure Account**: Create a free Azure account at https://azure.microsoft.com/free/
2. **Node.js 18+**: Already installed
3. **Git**: Already installed

## Azure Services Required

### 1. Azure Cognitive Services (Speech)
1. Go to Azure Portal: https://portal.azure.com
2. Create a new resource → Search "Speech Services"
3. Create Speech resource:
   - Name: `reddytalk-speech`
   - Subscription: Your subscription
   - Location: `East US` (or nearest)
   - Pricing tier: `Free F0` (for testing)
4. Go to "Keys and Endpoint" → Copy Key 1

### 2. Azure OpenAI Service
1. Apply for access: https://azure.microsoft.com/products/ai-services/openai-service
2. Once approved, create Azure OpenAI resource:
   - Name: `reddytalk-openai`
   - Location: `East US`
3. Deploy a model:
   - Go to Azure OpenAI Studio
   - Deploy `gpt-4-turbo` model
   - Name deployment: `gpt-4-turbo`
4. Copy endpoint and key

### 3. Azure Communication Services
1. Create Communication Services resource:
   - Name: `reddytalk-comm`
   - Data location: `United States`
2. Get a phone number:
   - Go to "Phone numbers" → Get → Toll-free
   - Select US number
3. Copy connection string from "Keys"

## Quick Start Guide

### Step 1: Update Environment Variables

Edit `.env` file with your Azure credentials:

```bash
# Azure Cognitive Services for Speech
AZURE_SPEECH_KEY=your_speech_key_here
AZURE_SPEECH_REGION=eastus

# Azure OpenAI
AZURE_OPENAI_API_KEY=your_openai_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4-turbo

# Azure Communication Services
AZURE_COMMUNICATION_CONNECTION_STRING=your_connection_string_here
AZURE_COMMUNICATION_PHONE_NUMBER=+1234567890
```

### Step 2: Install Dependencies

```bash
cd reddytalk
npm install
```

### Step 3: Test the Setup

```bash
# Run the test script
node testVoicePipeline.js
```

### Step 4: Start the Server

```bash
# Start in development mode
npm run dev

# Or production mode
npm start
```

### Step 5: Test Endpoints

The server runs on http://localhost:8081

1. **Health Check**: http://localhost:8081/health/ready
2. **Test Components**: http://localhost:8081/api/test/components
3. **Test Conversation**: 
   ```bash
   curl -X POST http://localhost:8081/api/test/simple/conversation \
     -H "Content-Type: application/json" \
     -d '{"text": "I need to schedule an appointment"}'
   ```

## Testing Voice Calls

### Option 1: WebSocket Test (Recommended for MVP)
Connect to WebSocket: `ws://localhost:8081/ws/test-session`

Send control message to start:
```json
{"type": "start"}
```

### Option 2: Phone Call Test
1. Configure Twilio/Azure Communication Services webhook
2. Point to: `https://your-domain.com/voice/incoming`
3. Call your Azure phone number

## MVP Features Available

1. ✅ Speech-to-Text (Azure Cognitive Services)
2. ✅ AI Conversation (Azure OpenAI)
3. ✅ Text-to-Speech (Azure Cognitive Services)
4. ✅ Medical Knowledge Base
5. ✅ WebSocket Voice Streaming
6. ⚠️ Phone Calls (Requires domain/HTTPS)

## Troubleshooting

### "API Key not provided" Error
- Verify all Azure keys in `.env` file
- Ensure no extra spaces in keys

### "Deployment not found" Error
- Verify deployment name matches in Azure OpenAI Studio
- Check endpoint URL format

### Voice Not Working
- Check microphone permissions
- Verify Azure Speech region matches your resource

## Next Steps for Production

1. **Domain & SSL**: Get a domain and SSL certificate
2. **HIPAA Compliance**: Enable Azure HIPAA compliance features
3. **Monitoring**: Set up Azure Application Insights
4. **Scaling**: Use Azure Kubernetes Service (AKS)
5. **Backup**: Configure Azure Backup for data

## Cost Estimation (MVP)

- Speech Services F0: Free (5 hours/month)
- Azure OpenAI: ~$0.06 per 1K tokens
- Communication Services: ~$0.004/min
- **Monthly MVP Cost**: ~$10-50 (depending on usage)

## Support

- Azure Support: https://azure.microsoft.com/support/
- ReddyTalk Issues: Create issue in this repository