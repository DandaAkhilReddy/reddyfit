// twilio.js - Twilio Webhook Route Handlers
// Complete integration with voice processing pipeline

const express = require('express');
const twilio = require('twilio');
const TwilioVoiceService = require('../services/voice/TwilioVoiceService');
const ConversationManager = require('../services/conversation/ConversationManager');
const DatabaseService = require('../services/database/DatabaseService');

const router = express.Router();

class TwilioWebhookHandler {
  constructor(app) {
    this.app = app;
    this.twilioService = new TwilioVoiceService();
    this.conversationManager = null;
    this.db = null;
    
    // Initialize services
    this.initialize();
  }

  async initialize() {
    try {
      this.db = new DatabaseService();
      await this.db.initialize();
      
      this.conversationManager = new ConversationManager(this.db);
      await this.conversationManager.initialize();
      
      await this.twilioService.initialize();
      
      console.log('✅ Twilio Webhook Handler initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Twilio Webhook Handler:', error);
    }
  }

  setupRoutes() {
    // ============ VOICE WEBHOOKS ============

    // Incoming call webhook
    router.post('/voice', async (req, res) => {
      try {
        const { CallSid, From, To, CallStatus } = req.body;
        const sessionId = 'twilio-' + CallSid + '-' + Date.now();
        
        console.log(`📞 Incoming call: ${From} -> ${To} (${CallSid})`);
        
        // Start conversation
        await this.conversationManager.startConversation(sessionId, {
          name: 'Caller',
          phone: From,
          callSid: CallSid,
          channel: 'voice_twilio'
        });
        
        // Generate welcome TwiML
        const twiml = this.twilioService.generateIncomingCallTwiML(sessionId);
        
        res.type('text/xml').send(twiml);
        
      } catch (error) {
        console.error('❌ Error handling incoming call:', error);
        this.sendErrorTwiML(res, 'We are experiencing technical difficulties. Please try again later.');
      }
    });

    // Outbound call webhook
    router.post('/voice/outbound', async (req, res) => {
      try {
        const { CallSid } = req.body;
        const sessionId = req.query.sessionId;
        
        console.log(`📞 Outbound call connected: ${CallSid}`);
        
        // Generate conversation TwiML
        const aiResponse = 'Hello! This is ReddyTalk Medical Center calling. How can we assist you today?';
        const twiml = this.twilioService.generateConversationTwiML(sessionId, aiResponse);
        
        res.type('text/xml').send(twiml);
        
      } catch (error) {
        console.error('❌ Error handling outbound call:', error);
        this.sendErrorTwiML(res, 'Call connection failed.');
      }
    });

    // Conversation flow webhook
    router.post('/voice/conversation', async (req, res) => {
      try {
        const { CallSid, From } = req.body;
        const sessionId = req.query.sessionId;
        const retry = req.query.retry;
        
        let aiResponse = null;
        
        if (retry) {
          aiResponse = "I didn't hear anything. Could you please repeat your request?";
        } else {
          // Get latest AI response from conversation
          const conversation = await this.conversationManager.getConversationHistory(sessionId);
          if (conversation && conversation.messages && conversation.messages.length > 0) {
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            if (lastMessage.type === 'assistant') {
              aiResponse = lastMessage.content;
            }
          }
        }
        
        const twiml = this.twilioService.generateConversationTwiML(sessionId, aiResponse);
        res.type('text/xml').send(twiml);
        
      } catch (error) {
        console.error('❌ Error in conversation flow:', error);
        this.sendErrorTwiML(res, 'Conversation error occurred.');
      }
    });

    // Speech input gathering webhook
    router.post('/voice/gather', async (req, res) => {
      try {
        const { CallSid, SpeechResult, Confidence } = req.body;
        const sessionId = req.query.sessionId;
        
        console.log(`🎤 Speech received: "${SpeechResult}" (${Confidence}% confidence)`);
        
        if (SpeechResult && sessionId) {
          // Process the speech with our conversation manager
          const result = await this.conversationManager.processUserMessage(
            sessionId, 
            SpeechResult, 
            parseFloat(Confidence) / 100
          );
          
          // Handle special intents
          let twiml;
          
          if (result.aiResponse.intent === 'emergency') {
            twiml = this.twilioService.generateHangupTwiML('emergency');
          } else if (result.aiResponse.intent === 'transfer_to_human') {
            twiml = this.twilioService.generateHangupTwiML('transfer_to_human');
          } else if (result.aiResponse.intent === 'appointment_scheduled') {
            twiml = this.twilioService.generateHangupTwiML('appointment_scheduled');
          } else {
            // Continue conversation
            twiml = this.twilioService.generateConversationTwiML(sessionId, result.aiResponse.content);
          }
          
          res.type('text/xml').send(twiml);
          
        } else {
          // No speech detected, try again
          const twiml = this.twilioService.generateConversationTwiML(sessionId, "I didn't catch that. Could you please repeat?");
          res.type('text/xml').send(twiml);
        }
        
      } catch (error) {
        console.error('❌ Error processing speech:', error);
        this.sendErrorTwiML(res, 'Speech processing error.');
      }
    });

    // Recording complete webhook
    router.post('/voice/recording-complete', async (req, res) => {
      try {
        const { CallSid, RecordingUrl, RecordingDuration } = req.body;
        const sessionId = req.query.sessionId;
        
        console.log(`🎵 Recording completed: ${RecordingUrl} (${RecordingDuration}s)`);
        
        // Store recording information in database
        if (sessionId) {
          await this.db.addRecording({
            sessionId: sessionId,
            callSid: CallSid,
            recordingUrl: RecordingUrl,
            duration: parseInt(RecordingDuration),
            timestamp: new Date()
          });
        }
        
        // Continue with conversation
        const twiml = this.twilioService.generateConversationTwiML(sessionId);
        res.type('text/xml').send(twiml);
        
      } catch (error) {
        console.error('❌ Error handling recording:', error);
        this.sendErrorTwiML(res, 'Recording processing error.');
      }
    });

    // ============ STATUS WEBHOOKS ============

    // Call status updates
    router.post('/status', async (req, res) => {
      try {
        const { CallSid, CallStatus, From, To, Direction, Duration } = req.body;
        
        console.log(`📊 Call status update: ${CallSid} -> ${CallStatus}`);
        
        // Update our call tracking
        await this.twilioService.handleCallStatusUpdate(CallSid, CallStatus, From, To);
        
        // Log call details to database
        await this.db.logCallStatus({
          callSid: CallSid,
          status: CallStatus,
          from: From,
          to: To,
          direction: Direction,
          duration: Duration ? parseInt(Duration) : null,
          timestamp: new Date()
        });
        
        res.sendStatus(200);
        
      } catch (error) {
        console.error('❌ Error handling status update:', error);
        res.sendStatus(500);
      }
    });

    // ============ RECORDING WEBHOOKS ============

    // Recording status updates
    router.post('/recording', async (req, res) => {
      try {
        const { CallSid, RecordingSid, RecordingUrl, RecordingStatus } = req.body;
        
        console.log(`🎵 Recording status: ${RecordingSid} -> ${RecordingStatus}`);
        
        if (RecordingStatus === 'completed' && RecordingUrl) {
          // Download and process recording for transcription
          await this.processCallRecording(CallSid, RecordingUrl);
        }
        
        res.sendStatus(200);
        
      } catch (error) {
        console.error('❌ Error handling recording status:', error);
        res.sendStatus(500);
      }
    });

    // Transcription webhook
    router.post('/transcription', async (req, res) => {
      try {
        const { CallSid, TranscriptionText, TranscriptionStatus } = req.body;
        
        console.log(`📝 Transcription: ${CallSid} -> ${TranscriptionText}`);
        
        if (TranscriptionStatus === 'completed') {
          // Store transcription in database
          const sessionId = this.twilioService.callSessions.get(CallSid);
          if (sessionId) {
            await this.db.addTranscription({
              sessionId: sessionId,
              callSid: CallSid,
              transcriptionText: TranscriptionText,
              timestamp: new Date()
            });
          }
        }
        
        res.sendStatus(200);
        
      } catch (error) {
        console.error('❌ Error handling transcription:', error);
        res.sendStatus(500);
      }
    });

    // ============ VOICEMAIL WEBHOOKS ============

    // Voicemail recording
    router.post('/voicemail', async (req, res) => {
      try {
        const { CallSid, RecordingUrl, RecordingDuration, From } = req.body;
        
        console.log(`📧 Voicemail received: ${From} (${RecordingDuration}s)`);
        
        // Store voicemail in database
        await this.db.addVoicemail({
          callSid: CallSid,
          from: From,
          recordingUrl: RecordingUrl,
          duration: parseInt(RecordingDuration),
          timestamp: new Date(),
          isNew: true
        });
        
        // Send notification to staff (implement as needed)
        await this.notifyStaffNewVoicemail(From, RecordingUrl);
        
        res.sendStatus(200);
        
      } catch (error) {
        console.error('❌ Error handling voicemail:', error);
        res.sendStatus(500);
      }
    });

    // Voicemail transcription
    router.post('/voicemail-transcription', async (req, res) => {
      try {
        const { CallSid, TranscriptionText } = req.body;
        
        console.log(`📝 Voicemail transcription: ${TranscriptionText}`);
        
        // Update voicemail with transcription
        await this.db.updateVoicemailTranscription(CallSid, TranscriptionText);
        
        res.sendStatus(200);
        
      } catch (error) {
        console.error('❌ Error handling voicemail transcription:', error);
        res.sendStatus(500);
      }
    });

    // ============ API ENDPOINTS ============

    // Make outbound call
    router.post('/api/call/outbound', async (req, res) => {
      try {
        const { phoneNumber, sessionId, message } = req.body;
        
        if (!phoneNumber || !sessionId) {
          return res.status(400).json({ error: 'phoneNumber and sessionId are required' });
        }
        
        // Validate phone number
        if (!this.twilioService.isValidPhoneNumber(phoneNumber)) {
          return res.status(400).json({ error: 'Invalid phone number format' });
        }
        
        const formattedNumber = this.twilioService.formatPhoneNumber(phoneNumber);
        
        // Make the call
        const call = await this.twilioService.makeOutboundCall(formattedNumber, sessionId, {
          message: message || 'Hello from ReddyTalk Medical Center'
        });
        
        res.json({
          success: true,
          callSid: call.sid,
          to: formattedNumber,
          from: this.twilioService.phoneNumber,
          status: call.status
        });
        
      } catch (error) {
        console.error('❌ Error making outbound call:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Hangup call
    router.post('/api/call/:callSid/hangup', async (req, res) => {
      try {
        const { callSid } = req.params;
        const { reason } = req.body;
        
        const success = await this.twilioService.hangupCall(callSid, reason);
        
        res.json({ success, callSid });
        
      } catch (error) {
        console.error('❌ Error hanging up call:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get call status
    router.get('/api/call/:callSid', async (req, res) => {
      try {
        const { callSid } = req.params;
        
        const call = await this.twilioService.twilioClient.calls(callSid).fetch();
        const callData = this.twilioService.activeCalls.get(callSid);
        
        res.json({
          success: true,
          call: {
            sid: call.sid,
            from: call.from,
            to: call.to,
            status: call.status,
            duration: call.duration,
            startTime: call.startTime,
            endTime: call.endTime,
            direction: call.direction,
            localData: callData
          }
        });
        
      } catch (error) {
        console.error('❌ Error getting call status:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // List active calls
    router.get('/api/calls/active', async (req, res) => {
      try {
        const activeCalls = this.twilioService.getActiveCalls();
        
        res.json({
          success: true,
          count: activeCalls.length,
          calls: activeCalls
        });
        
      } catch (error) {
        console.error('❌ Error listing active calls:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Phone number management
    router.get('/api/phone/available', async (req, res) => {
      try {
        const { countryCode, areaCode, contains, limit } = req.query;
        
        const numbers = await this.twilioService.listAvailablePhoneNumbers(
          countryCode || 'US',
          { areaCode, contains, limit: parseInt(limit) || 20 }
        );
        
        res.json({
          success: true,
          count: numbers.length,
          numbers: numbers
        });
        
      } catch (error) {
        console.error('❌ Error listing phone numbers:', error);
        res.status(500).json({ error: error.message });
      }
    });

    router.post('/api/phone/purchase', async (req, res) => {
      try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
          return res.status(400).json({ error: 'phoneNumber is required' });
        }
        
        const number = await this.twilioService.purchasePhoneNumber(phoneNumber);
        
        res.json({
          success: true,
          phoneNumber: number.phoneNumber,
          sid: number.sid,
          capabilities: number.capabilities
        });
        
      } catch (error) {
        console.error('❌ Error purchasing phone number:', error);
        res.status(500).json({ error: error.message });
      }
    });

    return router;
  }

  // ============ HELPER METHODS ============

  async processCallRecording(callSid, recordingUrl) {
    try {
      // Download recording and process with Azure Speech-to-Text
      // This would be implemented based on your transcription needs
      console.log(`🎵 Processing recording: ${recordingUrl}`);
      
      // For now, just log - implement actual transcription as needed
      await this.db.addRecording({
        callSid: callSid,
        recordingUrl: recordingUrl,
        processed: false,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Error processing recording:', error);
    }
  }

  async notifyStaffNewVoicemail(from, recordingUrl) {
    try {
      // Implement staff notification system
      console.log(`📧 New voicemail from ${from}: ${recordingUrl}`);
      
      // Could send email, SMS, or push notification to staff
      // For now, just log
      
    } catch (error) {
      console.error('❌ Error notifying staff:', error);
    }
  }

  sendErrorTwiML(res, message) {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({
      voice: 'Polly.Joanna',
      language: 'en-US'
    }, message);
    twiml.hangup();
    
    res.type('text/xml').send(twiml.toString());
  }
}

// Export factory function
module.exports = function(app) {
  const handler = new TwilioWebhookHandler(app);
  return handler.setupRoutes();
};