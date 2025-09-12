// test.js - Test endpoints for voice pipeline functionality

async function testRoutes(fastify, options) {
  // Test voice pipeline with sample audio
  fastify.post('/test/voice-pipeline', async (request, reply) => {
    try {
      const { text } = request.body;
      
      if (!text) {
        return reply.code(400).send({ error: 'Text input required' });
      }

      // Create a test session
      const sessionId = `test-${Date.now()}`;
      const VoiceEngine = require('../core/VoiceEngine');
      
      const voiceEngine = new VoiceEngine(sessionId, {
        logger: fastify.log
      });

      await voiceEngine.initialize();
      
      // Simulate the full pipeline
      const pipeline = voiceEngine.pipeline;
      
      // Test AI processing
      const aiResponse = await pipeline.ai.processConversation(
        sessionId,
        text,
        {}
      );
      
      // Test TTS
      const audioBuffer = await pipeline.tts.synthesizeToBuffer(aiResponse.response);
      
      // Clean up
      await voiceEngine.cleanup();
      
      return {
        success: true,
        sessionId,
        input: text,
        aiResponse: aiResponse.response,
        intent: aiResponse.intent,
        entities: aiResponse.entities,
        audioSize: audioBuffer.length,
        audioFormat: '8kHz 16-bit PCM'
      };
    } catch (error) {
      fastify.log.error('Test pipeline error:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Test individual components
  fastify.get('/test/components', async (request, reply) => {
    const results = {
      timestamp: new Date().toISOString(),
      components: {}
    };

    // Test Azure Speech STT
    try {
      const AzureSpeechToText = require('../services/voice/AzureSpeechToText');
      const stt = new AzureSpeechToText();
      await stt.initialize();
      results.components.azureSpeechSTT = { status: 'ready' };
    } catch (error) {
      results.components.azureSpeechSTT = { status: 'error', message: error.message };
    }

    // Test Azure OpenAI
    try {
      const AzureOpenAI = require('../services/ai/AzureOpenAI');
      const ai = new AzureOpenAI();
      await ai.initialize();
      results.components.azureOpenAI = { status: 'ready' };
    } catch (error) {
      results.components.azureOpenAI = { status: 'error', message: error.message };
    }

    // Test Azure Speech TTS
    try {
      const AzureTextToSpeech = require('../services/voice/AzureTextToSpeech');
      const tts = new AzureTextToSpeech();
      await tts.initialize();
      results.components.azureSpeechTTS = { status: 'ready' };
    } catch (error) {
      results.components.azureSpeechTTS = { status: 'error', message: error.message };
    }

    // Test Azure Communication Services
    try {
      const AzureCommunicationVoIP = require('../services/telephony/AzureCommunicationVoIP');
      const voip = new AzureCommunicationVoIP();
      // Don't fully initialize to avoid creating actual calls
      if (!voip.connectionString) {
        throw new Error('Connection string not configured');
      }
      results.components.azureCommunicationServices = { status: 'configured' };
    } catch (error) {
      results.components.azureCommunicationServices = { status: 'error', message: error.message };
    }

    return results;
  });

  // Test conversation scenarios
  fastify.post('/test/conversation', async (request, reply) => {
    const scenarios = [
      {
        input: "I'd like to schedule an appointment with a doctor",
        expectedIntent: "schedule_appointment"
      },
      {
        input: "What are your clinic hours?",
        expectedIntent: "clinic_hours"
      },
      {
        input: "Do you accept Blue Cross insurance?",
        expectedIntent: "insurance_query"
      },
      {
        input: "I need to cancel my appointment",
        expectedIntent: "cancel_appointment"
      }
    ];

    const results = [];
    const sessionId = `test-conv-${Date.now()}`;

    try {
      const AzureOpenAI = require('../services/ai/AzureOpenAI');
      const ai = new AzureOpenAI();
      await ai.initialize();

      for (const scenario of scenarios) {
        const response = await ai.processConversation(
          sessionId,
          scenario.input,
          {}
        );

        results.push({
          input: scenario.input,
          expectedIntent: scenario.expectedIntent,
          actualIntent: response.intent,
          response: response.response,
          match: response.intent === scenario.expectedIntent
        });
      }

      const successRate = results.filter(r => r.match).length / results.length * 100;

      return {
        sessionId,
        totalScenarios: results.length,
        passed: results.filter(r => r.match).length,
        failed: results.filter(r => !r.match).length,
        successRate: `${successRate}%`,
        results
      };
    } catch (error) {
      fastify.log.error('Conversation test error:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Test latency measurement
  fastify.post('/test/latency', async (request, reply) => {
    const { text = "Hello, I need to schedule an appointment" } = request.body;
    
    const latencyTest = {
      input: text,
      measurements: {}
    };

    try {
      const sessionId = `test-latency-${Date.now()}`;
      
      // Test STT latency (simulated)
      const sttStart = Date.now();
      // Simulate STT processing time
      await new Promise(resolve => setTimeout(resolve, 100));
      latencyTest.measurements.stt = Date.now() - sttStart;

      // Test AI latency
      const aiStart = Date.now();
      const AzureOpenAI = require('../services/ai/AzureOpenAI');
      const ai = new AzureOpenAI();
      await ai.initialize();
      const aiResponse = await ai.processConversation(sessionId, text, {});
      latencyTest.measurements.ai = Date.now() - aiStart;

      // Test TTS latency
      const ttsStart = Date.now();
      const AzureTextToSpeech = require('../services/voice/AzureTextToSpeech');
      const tts = new AzureTextToSpeech();
      await tts.initialize();
      const audioBuffer = await tts.synthesizeToBuffer(aiResponse.response);
      latencyTest.measurements.tts = Date.now() - ttsStart;

      // Calculate total
      latencyTest.measurements.total = 
        latencyTest.measurements.stt + 
        latencyTest.measurements.ai + 
        latencyTest.measurements.tts;

      latencyTest.targetMet = latencyTest.measurements.total < 500;
      latencyTest.response = aiResponse.response;
      latencyTest.audioSize = audioBuffer.length;

      return latencyTest;
    } catch (error) {
      fastify.log.error('Latency test error:', error);
      return reply.code(500).send({ error: error.message });
    }
  });
}

module.exports = testRoutes;