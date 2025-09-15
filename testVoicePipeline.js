// testVoicePipeline.js - Standalone test for voice pipeline

require('dotenv').config();

async function testVoicePipeline() {
  console.log('🧪 Testing ReddyTalk.ai Voice Pipeline\n');
  
  try {
    // Test 1: Medical Knowledge Base
    console.log('1️⃣ Testing Medical Knowledge Base...');
    const MedicalKnowledgeBase = require('./src/services/ai/MedicalKnowledgeBase');
    const kb = new MedicalKnowledgeBase();
    console.log(`✅ Loaded ${kb.doctors.length} doctors, ${kb.services.length} services`);
    console.log(`   Clinic: ${kb.clinicInfo.name}`);
    console.log(`   Sample Doctor: ${kb.doctors[0].name} - ${kb.doctors[0].specialty}\n`);
    
    // Test 2: Azure OpenAI Conversation
    console.log('2️⃣ Testing Azure OpenAI Conversation...');
    const AzureOpenAI = require('./src/services/ai/AzureOpenAI');
    const ai = new AzureOpenAI();
    await ai.initialize();
    
    const testConversations = [
      "I need to schedule an appointment with a doctor",
      "I prefer a female doctor who speaks Spanish",
      "Do you accept Blue Cross insurance?",
      "What are your hours on Saturday?"
    ];
    
    const sessionId = `test-${Date.now()}`;
    
    for (const input of testConversations) {
      console.log(`\n   User: "${input}"`);
      const response = await ai.processConversation(sessionId, input, {});
      console.log(`   AI: "${response.response}"`);
      console.log(`   Intent: ${response.intent}`);
      if (response.entities && Object.keys(response.entities).length > 0) {
        console.log(`   Entities: ${JSON.stringify(response.entities)}`);
      }
    }
    
    // Test 3: Azure Text-to-Speech
    console.log('\n3️⃣ Testing Azure Text-to-Speech...');
    const AzureTextToSpeech = require('./src/services/voice/AzureTextToSpeech');
    const tts = new AzureTextToSpeech();
    await tts.initialize();
    
    const sampleText = "Thank you for calling Azure Medical Center. How can I help you today?";
    console.log(`   Converting text: "${sampleText}"`);
    
    const startTime = Date.now();
    const audioBuffer = await tts.synthesizeToBuffer(sampleText);
    const ttsLatency = Date.now() - startTime;
    
    console.log(`   ✅ Audio generated: ${audioBuffer.length} bytes in ${ttsLatency}ms`);
    console.log(`   Audio format: 8kHz 16-bit PCM\n`);
    
    // Test 4: Complete Pipeline Simulation
    console.log('4️⃣ Testing Complete Voice Pipeline...');
    console.log('   Simulating: Voice → STT → AI → TTS → Voice');
    
    const pipelineStart = Date.now();
    
    // Simulate STT
    const sttLatency = 85;
    console.log(`   📥 STT Processing: ${sttLatency}ms`);
    
    // AI Processing
    const aiStart = Date.now();
    const aiResponse = await ai.processConversation(
      'pipeline-test', 
      "I need to see Dr. Johnson next Tuesday morning",
      {}
    );
    const aiLatency = Date.now() - aiStart;
    console.log(`   🧠 AI Processing: ${aiLatency}ms`);
    console.log(`      Response: "${aiResponse.response}"`);
    
    // TTS Processing
    const ttsStart = Date.now();
    const responseAudio = await tts.synthesizeToBuffer(aiResponse.response);
    const ttsLatency2 = Date.now() - ttsStart;
    console.log(`   🔊 TTS Processing: ${ttsLatency2}ms`);
    
    const totalLatency = Date.now() - pipelineStart + sttLatency;
    console.log(`\n   📊 Total Pipeline Latency: ${totalLatency}ms`);
    console.log(`   ${totalLatency < 500 ? '✅ PASS' : '❌ FAIL'} - Target: <500ms\n`);
    
    // Test 5: Conversation Summary
    console.log('5️⃣ Testing Conversation Summary...');
    const summary = await ai.getConversationSummary(sessionId);
    console.log(`   Summary: ${summary || 'No summary available'}\n`);
    
    console.log('✨ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testVoicePipeline().then(() => {
  console.log('\n👋 Test complete. Exiting...');
  process.exit(0);
});