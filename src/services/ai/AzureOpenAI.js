// AzureOpenAI.js - Azure OpenAI integration for medical conversations

const { OpenAI } = require('openai');
const EventEmitter = require('events');
const MedicalKnowledgeBase = require('./MedicalKnowledgeBase');

class AzureOpenAI extends EventEmitter {
  constructor(config = {}) {
    super();
    // Support both OpenAI and Azure OpenAI
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY;
    this.endpoint = config.endpoint || process.env.AZURE_OPENAI_ENDPOINT;
    this.deployment = config.deployment || process.env.AZURE_OPENAI_DEPLOYMENT;
    this.apiVersion = config.apiVersion || process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';
    this.model = config.model || process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;
    this.useAzure = !!this.endpoint; // Use Azure if endpoint is provided
    this.openai = null;
    this.conversationHistory = new Map();
    this.knowledgeBase = new MedicalKnowledgeBase();
  }

  async initialize() {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not provided');
      }

      if (this.useAzure) {
        // Initialize Azure OpenAI client
        this.openai = new OpenAI({
          apiKey: this.apiKey,
          baseURL: `${this.endpoint}/openai/deployments/${this.deployment}`,
          defaultQuery: { 'api-version': this.apiVersion },
          defaultHeaders: { 'api-key': this.apiKey }
        });
      } else {
        // Initialize regular OpenAI client
        this.openai = new OpenAI({
          apiKey: this.apiKey
        });
      }

      this.emit('initialized');
      return true;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // System prompt for medical receptionist
  getSystemPrompt() {
    const kb = this.knowledgeBase.getSystemPromptContext();
    
    return `You are ReddyTalk, a professional medical receptionist AI assistant for ${kb.clinicInfo.name}. 

CLINIC INFORMATION:
- Name: ${kb.clinicInfo.name}
- Address: ${kb.clinicInfo.address}
- Phone: ${kb.clinicInfo.phone}
- Hours: ${JSON.stringify(kb.clinicInfo.hours)}

AVAILABLE DOCTORS:
${kb.doctors.map(doc => `- ${doc.name}: ${doc.specialty}, Languages: ${doc.languages.join(', ')}`).join('\n')}

ACCEPTED INSURANCE:
${kb.insurance.join(', ')}

SERVICES OFFERED:
${kb.services.map(svc => `- ${svc.name}: ${svc.duration} min, ${svc.price}`).join('\n')}

YOUR RESPONSIBILITIES:
1. Schedule appointments with appropriate doctors based on patient needs
2. Verify insurance coverage
3. Answer questions about clinic services, hours, and location
4. Collect necessary patient information (name, DOB, contact, insurance)
5. Handle appointment cancellations/rescheduling (24hr notice required)
6. Direct emergencies to 911 immediately
7. Provide wait times and availability information
8. Explain new patient procedures (arrive 15 min early, bring insurance card and ID)

CONVERSATION GUIDELINES:
- Be warm, professional, and empathetic
- Keep responses concise (2-3 sentences max for voice)
- Ask one question at a time
- Confirm important details by repeating them back
- Use natural conversational language
- If unsure, offer to transfer to a human
- Protect patient privacy (HIPAA compliance)
- For symptoms, be caring but don't provide medical advice

COMMON RESPONSES:
${JSON.stringify(kb.commonQuestions, null, 2)}

Remember: You're speaking on the phone, so responses should sound natural when spoken aloud.`;
  }

  // Process conversation with context
  async processConversation(sessionId, userMessage, context = {}) {
    try {
      if (!this.openai) {
        await this.initialize();
      }

      // Get or create conversation history
      if (!this.conversationHistory.has(sessionId)) {
        this.conversationHistory.set(sessionId, [
          { role: 'system', content: this.getSystemPrompt() }
        ]);
      }

      const history = this.conversationHistory.get(sessionId);

      // Add user message to history
      history.push({ role: 'user', content: userMessage });

      // Add context if provided
      if (context.patientInfo) {
        history.push({
          role: 'system',
          content: `Patient context: ${JSON.stringify(context.patientInfo)}`
        });
      }

      // Get completion from OpenAI (Azure or regular)
      const completionParams = {
        messages: history,
        temperature: this.temperature,
        max_tokens: 150, // Keep responses concise for voice
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      };

      // Add model for regular OpenAI
      if (!this.useAzure) {
        completionParams.model = this.model;
      }

      const completion = await this.openai.chat.completions.create(completionParams);

      const assistantMessage = completion.choices[0].message.content;

      // Add assistant response to history
      history.push({ role: 'assistant', content: assistantMessage });

      // Trim history if too long (keep last 20 messages)
      if (history.length > 20) {
        const systemPrompt = history[0];
        history.splice(0, history.length - 20);
        history.unshift(systemPrompt);
      }

      this.emit('response', {
        sessionId,
        message: assistantMessage,
        usage: completion.usage
      });

      return {
        response: assistantMessage,
        intent: this.detectIntent(userMessage),
        entities: this.extractEntities(userMessage)
      };
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Detect conversation intent
  detectIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
      return 'schedule_appointment';
    } else if (lowerMessage.includes('cancel')) {
      return 'cancel_appointment';
    } else if (lowerMessage.includes('reschedule')) {
      return 'reschedule_appointment';
    } else if (lowerMessage.includes('hours') || lowerMessage.includes('open')) {
      return 'clinic_hours';
    } else if (lowerMessage.includes('insurance')) {
      return 'insurance_query';
    } else if (lowerMessage.includes('emergency')) {
      return 'emergency';
    }
    
    return 'general_query';
  }

  // Extract entities from message
  extractEntities(message) {
    const entities = {};
    
    // Extract date/time mentions
    const timePatterns = [
      /tomorrow/i,
      /next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /\d{1,2}:\d{2}\s*(am|pm)?/i
    ];
    
    timePatterns.forEach(pattern => {
      const match = message.match(pattern);
      if (match) {
        entities.time = match[0];
      }
    });
    
    // Extract doctor names
    const doctors = ['Smith', 'Johnson', 'Lee'];
    doctors.forEach(doctor => {
      if (message.toLowerCase().includes(doctor.toLowerCase())) {
        entities.doctor = `Dr. ${doctor}`;
      }
    });
    
    return entities;
  }

  // Clear conversation history
  clearHistory(sessionId) {
    this.conversationHistory.delete(sessionId);
  }

  // Get conversation summary
  async getConversationSummary(sessionId) {
    try {
      const history = this.conversationHistory.get(sessionId);
      if (!history || history.length < 3) return null;

      const summaryPrompt = {
        role: 'system',
        content: 'Summarize this conversation in 2-3 sentences, focusing on the patient\'s needs and any appointments or actions taken.'
      };

      const summaryParams = {
        messages: [...history, summaryPrompt],
        temperature: 0.3,
        max_tokens: 100
      };

      if (!this.useAzure) {
        summaryParams.model = this.model;
      }

      const completion = await this.openai.chat.completions.create(summaryParams);

      return completion.choices[0].message.content;
    } catch (error) {
      this.emit('error', error);
      return null;
    }
  }
}

module.exports = AzureOpenAI;