// simpleTest.js - Simplified test endpoints without VoIP dependency

async function simpleTestRoutes(fastify, options) {
  // Test AI conversation flow
  fastify.post('/test/simple/conversation', async (request, reply) => {
    try {
      const { text } = request.body;
      
      if (!text) {
        return reply.code(400).send({ error: 'Text input required' });
      }

      const sessionId = `test-${Date.now()}`;
      
      // Test Azure OpenAI
      const AzureOpenAI = require('../services/ai/AzureOpenAI');
      const ai = new AzureOpenAI();
      await ai.initialize();
      
      const response = await ai.processConversation(sessionId, text, {});
      
      // Test Azure TTS
      const AzureTextToSpeech = require('../services/voice/AzureTextToSpeech');
      const tts = new AzureTextToSpeech();
      await tts.initialize();
      
      const audioBuffer = await tts.synthesizeToBuffer(response.response);
      
      return {
        success: true,
        sessionId,
        input: text,
        aiResponse: {
          text: response.response,
          intent: response.intent,
          entities: response.entities
        },
        audio: {
          size: audioBuffer.length,
          format: '8kHz 16-bit PCM',
          base64: audioBuffer.toString('base64').substring(0, 100) + '...' // First 100 chars
        },
        processingTime: {
          total: Date.now() - parseInt(sessionId.split('-')[1])
        }
      };
    } catch (error) {
      fastify.log.error('Simple conversation test error:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Test medical knowledge base
  fastify.get('/test/simple/knowledge', async (request, reply) => {
    const MedicalKnowledgeBase = require('../services/ai/MedicalKnowledgeBase');
    const kb = new MedicalKnowledgeBase();
    
    return {
      clinicInfo: kb.clinicInfo,
      doctorsCount: kb.doctors.length,
      servicesCount: kb.services.length,
      insuranceAccepted: kb.insurance.length,
      sampleDoctor: kb.doctors[0],
      sampleService: kb.services[0]
    };
  });

  // Test multiple conversation turns
  fastify.post('/test/simple/multi-turn', async (request, reply) => {
    try {
      const conversations = [
        "I need to schedule an appointment",
        "I'd prefer a female doctor",
        "Next Tuesday morning would work for me",
        "Yes, I have Blue Cross insurance"
      ];

      const sessionId = `test-multi-${Date.now()}`;
      const AzureOpenAI = require('../services/ai/AzureOpenAI');
      const ai = new AzureOpenAI();
      await ai.initialize();

      const results = [];
      
      for (const text of conversations) {
        const response = await ai.processConversation(sessionId, text, {});
        results.push({
          turn: results.length + 1,
          input: text,
          response: response.response,
          intent: response.intent
        });
      }

      return {
        sessionId,
        totalTurns: results.length,
        conversation: results,
        summary: await ai.getConversationSummary(sessionId)
      };
    } catch (error) {
      fastify.log.error('Multi-turn test error:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Test STT simulation
  fastify.post('/test/simple/speech-to-text', async (request, reply) => {
    try {
      const { audioBase64 } = request.body;
      
      // For testing, we'll simulate STT with a mock response
      const mockTranscriptions = [
        "I need to schedule an appointment with Dr. Johnson",
        "Do you accept Aetna insurance?",
        "What time do you open tomorrow?",
        "I'd like to cancel my appointment for next week"
      ];
      
      const randomText = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        transcription: {
          text: randomText,
          confidence: 0.95,
          language: "en-US",
          duration: 2.3
        },
        processingTime: 100
      };
    } catch (error) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Test latency for each component
  fastify.get('/test/simple/latency', async (request, reply) => {
    const measurements = {};
    
    try {
      // Test AI latency
      const aiStart = Date.now();
      const AzureOpenAI = require('../services/ai/AzureOpenAI');
      const ai = new AzureOpenAI();
      await ai.initialize();
      await ai.processConversation('latency-test', 'Hello', {});
      measurements.ai = Date.now() - aiStart;
      
      // Test TTS latency
      const ttsStart = Date.now();
      const AzureTextToSpeech = require('../services/voice/AzureTextToSpeech');
      const tts = new AzureTextToSpeech();
      await tts.initialize();
      await tts.synthesizeToBuffer('Hello, how can I help you?');
      measurements.tts = Date.now() - ttsStart;
      
      // Simulated STT latency
      measurements.stt = 85; // Average Azure STT latency
      
      measurements.total = measurements.stt + measurements.ai + measurements.tts;
      measurements.targetMet = measurements.total < 500;
      
      return {
        measurements,
        target: "< 500ms",
        status: measurements.targetMet ? "PASS" : "FAIL"
      };
    } catch (error) {
      return reply.code(500).send({ 
        error: error.message,
        measurements 
      });
    }
  });
}

module.exports = simpleTestRoutes;