// TwilioVoiceService.js - Complete Twilio Integration for Voice Calls
// Principal VoIP Engineer implementation with real-time voice processing

const twilio = require('twilio');
const EventEmitter = require('events');
const AzureSpeechToText = require('./AzureSpeechToText');
const AzureTextToSpeech = require('./AzureTextToSpeech');

class TwilioVoiceService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Twilio configuration
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.webhookUrl = process.env.TWILIO_WEBHOOK_URL;
    
    // Initialize Twilio client
    this.twilioClient = null;
    
    // Voice processing services
    this.speechToText = new AzureSpeechToText();
    this.textToSpeech = new AzureTextToSpeech();
    
    // Call management
    this.activeCalls = new Map();
    this.callSessions = new Map(); // Maps Twilio CallSid to our SessionId
    
    this.options = {
      enableRecording: options.enableRecording !== false,
      enableTranscription: options.enableTranscription !== false,
      maxCallDuration: options.maxCallDuration || 3600, // 1 hour
      enableVoicemail: options.enableVoicemail !== false,
      ...options
    };
    
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Twilio Voice Service...');
      
      // Validate configuration
      this.validateConfiguration();
      
      // Initialize Twilio client
      this.twilioClient = twilio(this.accountSid, this.authToken);
      
      // Initialize speech services
      await this.speechToText.initialize();
      await this.textToSpeech.initialize();
      
      // Validate phone number and webhook
      await this.validateTwilioSetup();
      
      this.isInitialized = true;
      console.log('✅ Twilio Voice Service initialized successfully');
      this.emit('initialized');
      
      return true;
    } catch (error) {
      console.error('❌ Twilio Voice Service initialization failed:', error);
      throw error;
    }
  }

  validateConfiguration() {
    if (!this.accountSid) {
      throw new Error('TWILIO_ACCOUNT_SID environment variable is required');
    }
    
    if (!this.authToken) {
      throw new Error('TWILIO_AUTH_TOKEN environment variable is required');
    }
    
    if (!this.phoneNumber) {
      throw new Error('TWILIO_PHONE_NUMBER environment variable is required');
    }
    
    if (!this.webhookUrl) {
      console.warn('⚠️ TWILIO_WEBHOOK_URL not set - webhook functionality will be limited');
    }
  }

  async validateTwilioSetup() {
    try {
      // Test account access
      const account = await this.twilioClient.api.accounts(this.accountSid).fetch();
      console.log(`✅ Twilio account validated: ${account.friendlyName}`);
      
      // Validate phone number
      const phoneNumbers = await this.twilioClient.incomingPhoneNumbers.list({
        phoneNumber: this.phoneNumber,
        limit: 1
      });
      
      if (phoneNumbers.length === 0) {
        throw new Error(`Phone number ${this.phoneNumber} not found in Twilio account`);
      }
      
      console.log(`✅ Phone number validated: ${this.phoneNumber}`);
      
      // Update webhook URL if provided
      if (this.webhookUrl) {
        await this.updatePhoneNumberWebhook();
      }
      
    } catch (error) {
      console.error('❌ Twilio setup validation failed:', error);
      throw error;
    }
  }

  async updatePhoneNumberWebhook() {
    try {
      const phoneNumbers = await this.twilioClient.incomingPhoneNumbers.list({
        phoneNumber: this.phoneNumber,
        limit: 1
      });
      
      if (phoneNumbers.length > 0) {
        await this.twilioClient.incomingPhoneNumbers(phoneNumbers[0].sid)
          .update({
            voiceUrl: `${this.webhookUrl}/webhooks/twilio/voice`,
            voiceMethod: 'POST',
            statusCallback: `${this.webhookUrl}/webhooks/twilio/status`,
            statusCallbackMethod: 'POST'
          });
        
        console.log('✅ Webhook URL updated for phone number');
      }
    } catch (error) {
      console.error('❌ Failed to update webhook URL:', error);
    }
  }

  // ============ OUTBOUND CALLING ============

  async makeOutboundCall(toPhoneNumber, sessionId, options = {}) {
    try {
      console.log(`📞 Making outbound call to ${toPhoneNumber}`);
      
      const callOptions = {
        to: toPhoneNumber,
        from: this.phoneNumber,
        url: `${this.webhookUrl}/webhooks/twilio/voice/outbound?sessionId=${sessionId}`,
        method: 'POST',
        record: this.options.enableRecording,
        recordingStatusCallback: `${this.webhookUrl}/webhooks/twilio/recording`,
        timeout: options.timeout || 30,
        ...options
      };
      
      const call = await this.twilioClient.calls.create(callOptions);
      
      // Store call information
      this.activeCalls.set(call.sid, {
        callSid: call.sid,
        sessionId: sessionId,
        toPhoneNumber: toPhoneNumber,
        startTime: new Date(),
        status: 'initiated',
        direction: 'outbound'
      });
      
      this.callSessions.set(call.sid, sessionId);
      
      console.log(`✅ Outbound call initiated: ${call.sid}`);
      this.emit('callInitiated', { callSid: call.sid, sessionId, direction: 'outbound' });
      
      return call;
    } catch (error) {
      console.error('❌ Failed to make outbound call:', error);
      throw error;
    }
  }

  // ============ WEBHOOK HANDLERS ============

  generateIncomingCallTwiML(sessionId) {
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Welcome message
    twiml.say({
      voice: 'Polly.Joanna',
      language: 'en-US'
    }, 'Hello! Thank you for calling ReddyTalk Medical Center. Please hold while we connect you to our AI assistant.');
    
    // Start recording if enabled
    if (this.options.enableRecording) {
      twiml.record({
        maxLength: 30,
        timeout: 5,
        transcribe: this.options.enableTranscription,
        transcribeCallback: `${this.webhookUrl}/webhooks/twilio/transcription`,
        recordingStatusCallback: `${this.webhookUrl}/webhooks/twilio/recording`,
        action: `${this.webhookUrl}/webhooks/twilio/voice/recording-complete?sessionId=${sessionId}`,
        method: 'POST'
      });
    }
    
    // Connect to our conversation handler
    twiml.redirect(`${this.webhookUrl}/webhooks/twilio/voice/conversation?sessionId=${sessionId}`);
    
    return twiml.toString();
  }

  generateConversationTwiML(sessionId, aiResponse) {
    const twiml = new twilio.twiml.VoiceResponse();
    
    if (aiResponse) {
      // Speak the AI response
      twiml.say({
        voice: 'Polly.Joanna',
        language: 'en-US'
      }, aiResponse);
    }
    
    // Gather user input
    const gather = twiml.gather({
      input: 'speech',
      speechTimeout: 5,
      speechModel: 'experimental_conversations',
      action: `${this.webhookUrl}/webhooks/twilio/voice/gather?sessionId=${sessionId}`,
      method: 'POST',
      timeout: 10
    });
    
    gather.say({
      voice: 'Polly.Joanna',
      language: 'en-US'
    }, 'Please speak your request, and I will help you.');
    
    // If no input, try again
    twiml.redirect(`${this.webhookUrl}/webhooks/twilio/voice/conversation?sessionId=${sessionId}&retry=1`);
    
    return twiml.toString();
  }

  generateHangupTwiML(reason = 'conversation_complete') {
    const twiml = new twilio.twiml.VoiceResponse();
    
    switch (reason) {
      case 'emergency':
        twiml.say({
          voice: 'Polly.Joanna',
          language: 'en-US'
        }, 'I understand this is an emergency. Please hang up and dial 911 immediately, or stay on the line while I transfer you to emergency services.');
        break;
        
      case 'transfer_to_human':
        twiml.say({
          voice: 'Polly.Joanna',
          language: 'en-US'
        }, 'Let me transfer you to a human representative. Please hold.');
        // In production, add dial to human queue
        break;
        
      case 'appointment_scheduled':
        twiml.say({
          voice: 'Polly.Joanna',
          language: 'en-US'
        }, 'Perfect! Your appointment has been scheduled. You will receive a confirmation text message shortly. Thank you for calling ReddyTalk Medical Center. Goodbye!');
        break;
        
      default:
        twiml.say({
          voice: 'Polly.Joanna',
          language: 'en-US'
        }, 'Thank you for calling ReddyTalk Medical Center. Have a great day! Goodbye.');
    }
    
    twiml.hangup();
    return twiml.toString();
  }

  generateVoicemailTwiML() {
    const twiml = new twilio.twiml.VoiceResponse();
    
    twiml.say({
      voice: 'Polly.Joanna',
      language: 'en-US'
    }, 'Thank you for calling ReddyTalk Medical Center. Our office hours are Monday through Friday, 8 AM to 5 PM. Please leave a detailed message after the beep, and we will return your call as soon as possible.');
    
    twiml.record({
      maxLength: 180, // 3 minutes
      recordingStatusCallback: `${this.webhookUrl}/webhooks/twilio/voicemail`,
      transcribe: true,
      transcribeCallback: `${this.webhookUrl}/webhooks/twilio/voicemail-transcription`
    });
    
    twiml.say({
      voice: 'Polly.Joanna',
      language: 'en-US'
    }, 'Thank you for your message. Goodbye.');
    
    twiml.hangup();
    return twiml.toString();
  }

  // ============ CALL MANAGEMENT ============

  async handleCallStatusUpdate(callSid, status, from, to) {
    try {
      const callData = this.activeCalls.get(callSid);
      
      if (callData) {
        callData.status = status;
        callData.lastUpdate = new Date();
        
        console.log(`📞 Call ${callSid} status updated: ${status}`);
        this.emit('callStatusUpdate', { callSid, status, sessionId: callData.sessionId });
        
        // Handle specific status changes
        switch (status) {
          case 'completed':
          case 'busy':
          case 'no-answer':
          case 'failed':
          case 'canceled':
            await this.handleCallEnded(callSid, status);
            break;
            
          case 'in-progress':
            console.log(`✅ Call ${callSid} connected successfully`);
            break;
        }
      }
    } catch (error) {
      console.error('❌ Error handling call status update:', error);
    }
  }

  async handleCallEnded(callSid, reason) {
    try {
      const callData = this.activeCalls.get(callSid);
      
      if (callData) {
        callData.endTime = new Date();
        callData.duration = callData.endTime - callData.startTime;
        callData.endReason = reason;
        
        console.log(`✅ Call ${callSid} ended: ${reason} (${Math.floor(callData.duration / 1000)}s)`);
        
        this.emit('callEnded', {
          callSid,
          sessionId: callData.sessionId,
          duration: callData.duration,
          reason: reason
        });
        
        // Cleanup
        this.activeCalls.delete(callSid);
        this.callSessions.delete(callSid);
      }
    } catch (error) {
      console.error('❌ Error handling call end:', error);
    }
  }

  async hangupCall(callSid, reason = 'user_requested') {
    try {
      await this.twilioClient.calls(callSid).update({ status: 'completed' });
      console.log(`📞 Call ${callSid} hung up: ${reason}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to hangup call:', error);
      return false;
    }
  }

  // ============ CALL ANALYTICS ============

  getActiveCallsCount() {
    return this.activeCalls.size;
  }

  getActiveCalls() {
    return Array.from(this.activeCalls.values());
  }

  getCallBySessionId(sessionId) {
    for (const [callSid, callData] of this.activeCalls.entries()) {
      if (callData.sessionId === sessionId) {
        return callData;
      }
    }
    return null;
  }

  // ============ PHONE NUMBER MANAGEMENT ============

  async listAvailablePhoneNumbers(countryCode = 'US', options = {}) {
    try {
      const numbers = await this.twilioClient.availablePhoneNumbers(countryCode)
        .local
        .list({
          areaCode: options.areaCode,
          contains: options.contains,
          smsEnabled: true,
          voiceEnabled: true,
          limit: options.limit || 20
        });
      
      return numbers.map(number => ({
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        locality: number.locality,
        region: number.region,
        capabilities: number.capabilities
      }));
    } catch (error) {
      console.error('❌ Failed to list available phone numbers:', error);
      throw error;
    }
  }

  async purchasePhoneNumber(phoneNumber) {
    try {
      const number = await this.twilioClient.incomingPhoneNumbers.create({
        phoneNumber: phoneNumber,
        voiceUrl: `${this.webhookUrl}/webhooks/twilio/voice`,
        voiceMethod: 'POST',
        statusCallback: `${this.webhookUrl}/webhooks/twilio/status`,
        statusCallbackMethod: 'POST'
      });
      
      console.log(`✅ Phone number purchased: ${phoneNumber}`);
      return number;
    } catch (error) {
      console.error('❌ Failed to purchase phone number:', error);
      throw error;
    }
  }

  // ============ WEBHOOK HANDLERS ============

  handleIncomingCall(req, res) {
    try {
      const { CallSid, From, To, CallStatus } = req.body;
      const sessionId = 'twilio-' + CallSid + '-' + Date.now();
      
      console.log(`📞 Incoming call webhook: ${From} -> ${To} (${CallSid})`);
      
      // Store call information
      this.activeCalls.set(CallSid, {
        callSid: CallSid,
        sessionId: sessionId,
        from: From,
        to: To,
        startTime: new Date(),
        status: 'incoming',
        direction: 'inbound'
      });
      
      this.callSessions.set(CallSid, sessionId);
      
      // Generate welcome TwiML
      const twiml = this.generateIncomingCallTwiML(sessionId);
      
      res.type('text/xml').send(twiml);
      
      this.emit('callReceived', { callSid: CallSid, sessionId, from: From, to: To });
      
    } catch (error) {
      console.error('❌ Error handling incoming call webhook:', error);
      this.handleTwilioError(error, 'handleIncomingCall');
      res.status(500).type('text/xml').send('<Response><Say>Service temporarily unavailable</Say><Hangup/></Response>');
    }
  }

  handleVoiceWebhook(req, res) {
    try {
      const { CallSid, SpeechResult, Confidence } = req.body;
      const sessionId = req.query.sessionId;
      
      console.log(`🎤 Voice webhook - Speech: "${SpeechResult}" (${Confidence}% confidence)`);
      
      if (SpeechResult && sessionId) {
        // Emit speech event for processing
        this.emit('speechReceived', {
          callSid: CallSid,
          sessionId: sessionId,
          speechText: SpeechResult,
          confidence: parseFloat(Confidence) / 100
        });
        
        // Generate response TwiML (conversation manager will handle the logic)
        const twiml = this.generateConversationTwiML(sessionId, "Please hold while I process your request...");
        res.type('text/xml').send(twiml);
        
      } else {
        // No speech detected
        const twiml = this.generateConversationTwiML(sessionId, "I didn't catch that. Could you please repeat?");
        res.type('text/xml').send(twiml);
      }
      
    } catch (error) {
      console.error('❌ Error handling voice webhook:', error);
      this.handleTwilioError(error, 'handleVoiceWebhook');
      res.status(500).type('text/xml').send('<Response><Say>Service error</Say><Hangup/></Response>');
    }
  }

  handleStatusWebhook(req, res) {
    try {
      const { CallSid, CallStatus, From, To, Direction, Duration } = req.body;
      
      console.log(`📊 Status webhook: ${CallSid} -> ${CallStatus}`);
      
      // Update call status
      this.handleCallStatusUpdate(CallSid, CallStatus, From, To);
      
      // Emit status event
      this.emit('callStatusChanged', {
        callSid: CallSid,
        status: CallStatus,
        from: From,
        to: To,
        direction: Direction,
        duration: Duration ? parseInt(Duration) : null
      });
      
      res.sendStatus(200);
      
    } catch (error) {
      console.error('❌ Error handling status webhook:', error);
      this.handleTwilioError(error, 'handleStatusWebhook');
      res.sendStatus(500);
    }
  }

  // ============ UTILITY METHODS ============

  formatPhoneNumber(phoneNumber) {
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add +1 for US numbers if not present
    if (cleaned.length === 10) {
      return '+1' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return '+' + cleaned;
    }
    
    return phoneNumber; // Return as-is if format is unclear
  }

  isValidPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  getCallMetrics() {
    const activeCalls = this.getActiveCalls();
    
    return {
      activeCallsCount: activeCalls.length,
      totalCallsToday: this.activeCalls.size, // Would be tracked in database
      averageCallDuration: 0, // Calculate from completed calls
      callsInQueue: 0,
      timestamp: new Date().toISOString()
    };
  }

  // ============ ERROR HANDLING ============

  handleTwilioError(error, context) {
    console.error(`❌ Twilio error in ${context}:`, {
      code: error.code,
      message: error.message,
      details: error.details,
      status: error.status
    });
    
    this.emit('error', { error, context });
    
    // Common error codes and handling
    switch (error.code) {
      case 20003:
        console.error('❌ Authentication failed - check credentials');
        break;
      case 21211:
        console.error('❌ Invalid phone number format');
        break;
      case 21214:
        console.error('❌ Phone number not found');
        break;
      default:
        console.error('❌ Unknown Twilio error:', error);
    }
  }

  async shutdown() {
    console.log('🔌 Shutting down Twilio Voice Service...');
    
    try {
      // Hangup all active calls
      const promises = Array.from(this.activeCalls.keys()).map(callSid => 
        this.hangupCall(callSid, 'service_shutdown')
      );
      
      await Promise.all(promises);
      
      console.log('✅ Twilio Voice Service shutdown complete');
    } catch (error) {
      console.error('❌ Error during Twilio service shutdown:', error);
    }
  }
}

module.exports = TwilioVoiceService;