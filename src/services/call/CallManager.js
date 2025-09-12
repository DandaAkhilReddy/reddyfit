// Enhanced Call Manager with Recording and AI Voice Response
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class CallManager extends EventEmitter {
  constructor(twilioService, elevenLabsService, conversationManager) {
    super();
    
    this.twilioService = twilioService;
    this.elevenLabsService = elevenLabsService;
    this.conversationManager = conversationManager;
    
    this.activeCalls = new Map();
    this.recordings = new Map();
    
    // Call statistics
    this.metrics = {
      totalCalls: 0,
      activeCalls: 0,
      completedCalls: 0,
      averageCallDuration: 0,
      callsWithRecording: 0,
      aiResponses: 0
    };
    
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('📞 Initializing Enhanced Call Manager...');
      
      // Initialize dependencies
      if (this.elevenLabsService && !this.elevenLabsService.isInitialized) {
        await this.elevenLabsService.initialize();
      }
      
      this.isInitialized = true;
      console.log('✅ Call Manager initialized successfully');
      
    } catch (error) {
      console.error('❌ Call Manager initialization failed:', error);
      throw error;
    }
  }

  async handleIncomingCall(callSid, from, to) {
    try {
      console.log(`📞 Incoming call: ${callSid} from ${from}`);
      
      const call = {
        sid: callSid,
        from: from,
        to: to,
        startTime: new Date(),
        status: 'ringing',
        recordingEnabled: true,
        transcriptionEnabled: true,
        aiResponseEnabled: true,
        conversationId: null
      };
      
      this.activeCalls.set(callSid, call);
      this.metrics.totalCalls++;
      this.metrics.activeCalls++;
      
      // Start conversation session
      const conversationId = `call-${callSid}-${Date.now()}`;
      call.conversationId = conversationId;
      
      if (this.conversationManager) {
        await this.conversationManager.startConversation(conversationId, {
          phoneNumber: from,
          callSid: callSid,
          type: 'phone_call'
        });
      }
      
      this.emit('callStarted', call);
      
      // Answer the call with AI greeting
      await this.answerCallWithAI(callSid);
      
      return call;
      
    } catch (error) {
      console.error('❌ Error handling incoming call:', error);
      throw error;
    }
  }

  async answerCallWithAI(callSid) {
    try {
      const call = this.activeCalls.get(callSid);
      if (!call) {
        throw new Error('Call not found');
      }

      console.log(`🤖 Answering call ${callSid} with AI...`);
      
      // Generate AI greeting
      const greetingResponse = await this.elevenLabsService.generateMedicalReceptionistResponse(
        "greeting",
        { 
          isNewCall: true, 
          timeOfDay: this.getTimeOfDay(),
          callerNumber: call.from 
        }
      );

      // Create TwiML response with AI voice
      const twimlResponse = this.createAnswerTwiML(callSid, greetingResponse);
      
      // Update call status
      call.status = 'answered';
      call.aiGreeting = greetingResponse.text;
      this.metrics.aiResponses++;
      
      this.emit('callAnswered', call);
      
      return {
        callSid: callSid,
        twiml: twimlResponse,
        aiResponse: greetingResponse
      };
      
    } catch (error) {
      console.error('❌ Error answering call with AI:', error);
      return this.createErrorTwiML(callSid);
    }
  }

  createAnswerTwiML(callSid, aiResponse) {
    // Create TwiML that plays AI voice and starts recording
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna-Neural" language="en-US">
        ${aiResponse.text}
    </Say>
    <Record 
        action="/webhooks/twilio/recording-complete"
        method="POST"
        maxLength="600"
        recordingStatusCallback="/webhooks/twilio/recording-status"
        transcribe="true"
        transcribeCallback="/webhooks/twilio/transcription"
        playBeep="false"
        timeout="5"
    />
    <Say voice="Polly.Joanna-Neural">
        I'm sorry, I didn't catch that. Please try again or hold for a human representative.
    </Say>
    <Pause length="2"/>
    <Redirect>/webhooks/twilio/voice-menu</Redirect>
</Response>`;

    return twiml;
  }

  createErrorTwiML(callSid) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna-Neural">
        Thank you for calling our medical office. Please hold while I connect you with a representative.
    </Say>
    <Play>https://www.soundjay.com/misc/sounds/bell-ringing-05.wav</Play>
</Response>`;
  }

  async processCallRecording(callSid, recordingUrl, transcription) {
    try {
      const call = this.activeCalls.get(callSid);
      if (!call) {
        console.warn(`⚠️ Call ${callSid} not found for recording processing`);
        return;
      }

      console.log(`🎙️ Processing recording for call ${callSid}`);
      
      const recording = {
        callSid: callSid,
        url: recordingUrl,
        transcription: transcription,
        timestamp: new Date(),
        processed: false
      };
      
      this.recordings.set(callSid, recording);
      call.recordingUrl = recordingUrl;
      call.transcription = transcription;
      this.metrics.callsWithRecording++;
      
      // Process transcription with conversation manager
      if (this.conversationManager && transcription) {
        const aiResponse = await this.conversationManager.processUserMessage(
          call.conversationId,
          transcription,
          0.85 // confidence from Twilio transcription
        );
        
        // Generate AI voice response
        if (this.elevenLabsService && aiResponse) {
          const voiceResponse = await this.elevenLabsService.generateMedicalReceptionistResponse(
            transcription,
            { 
              conversationId: call.conversationId,
              previousResponses: call.aiResponses || []
            }
          );
          
          call.aiResponses = call.aiResponses || [];
          call.aiResponses.push(voiceResponse);
          this.metrics.aiResponses++;
          
          // Send voice response back to caller
          await this.sendVoiceResponseToCall(callSid, voiceResponse);
        }
      }
      
      this.emit('recordingProcessed', { call, recording });
      
      return recording;
      
    } catch (error) {
      console.error('❌ Error processing call recording:', error);
    }
  }

  async sendVoiceResponseToCall(callSid, voiceResponse) {
    try {
      // In a real implementation, this would use Twilio's API to play the AI voice response
      // For now, we'll log it and emit an event
      console.log(`🎤 Sending AI voice response to call ${callSid}: "${voiceResponse.text}"`);
      
      const call = this.activeCalls.get(callSid);
      if (call) {
        this.emit('aiResponseSent', { callSid, response: voiceResponse });
      }
      
    } catch (error) {
      console.error('❌ Error sending voice response:', error);
    }
  }

  async endCall(callSid, reason = 'completed') {
    try {
      const call = this.activeCalls.get(callSid);
      if (!call) {
        console.warn(`⚠️ Call ${callSid} not found`);
        return;
      }

      console.log(`📞 Ending call ${callSid}: ${reason}`);
      
      call.endTime = new Date();
      call.duration = call.endTime - call.startTime;
      call.endReason = reason;
      call.status = 'completed';
      
      this.metrics.activeCalls--;
      this.metrics.completedCalls++;
      
      // Update average call duration
      this.updateAverageCallDuration(call.duration);
      
      // End conversation session
      if (this.conversationManager && call.conversationId) {
        await this.conversationManager.endConversation(call.conversationId, reason);
      }
      
      // Move to completed calls
      this.activeCalls.delete(callSid);
      
      this.emit('callEnded', call);
      
      return call;
      
    } catch (error) {
      console.error('❌ Error ending call:', error);
    }
  }

  updateAverageCallDuration(duration) {
    const totalDuration = (this.metrics.averageCallDuration * (this.metrics.completedCalls - 1)) + duration;
    this.metrics.averageCallDuration = Math.round(totalDuration / this.metrics.completedCalls);
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  // Dashboard API methods
  getActiveCalls() {
    return Array.from(this.activeCalls.values());
  }

  getCallHistory(limit = 50) {
    // In a real implementation, this would fetch from database
    return {
      total: this.metrics.totalCalls,
      completed: this.metrics.completedCalls,
      active: this.metrics.activeCalls,
      recentCalls: Array.from(this.activeCalls.values()).slice(-limit)
    };
  }

  getCallMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  async testCallFlow() {
    try {
      console.log('🧪 Testing call flow...');
      
      // Test AI voice generation
      const testResponse = await this.elevenLabsService.testVoiceSynthesis();
      
      // Test call handling flow
      const testCallSid = `test-${Date.now()}`;
      const testCall = await this.handleIncomingCall(testCallSid, '+1234567890', '+1987654321');
      
      // Simulate recording and transcription
      await this.processCallRecording(testCallSid, 'test-recording-url', 'Hello, I would like to schedule an appointment');
      
      // End test call
      await this.endCall(testCallSid, 'test-completed');
      
      return {
        success: true,
        message: 'Call flow test completed',
        testCall: testCall,
        voiceTest: testResponse
      };
      
    } catch (error) {
      console.error('❌ Call flow test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CallManager;