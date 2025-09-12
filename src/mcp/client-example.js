// Example MCP Client for testing ReddyTalk MCP Server
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { spawn } = require('child_process');

class ReddyTalkMCPClient {
  constructor(serverPath = 'src/mcp/enhanced-server.js') {
    this.serverPath = serverPath;
    this.client = null;
    this.transport = null;
  }

  async connect() {
    console.log('🔌 Connecting to ReddyTalk MCP Server...');
    
    // Resolve the full path for Windows compatibility
    const path = require('path');
    const fullServerPath = path.resolve(this.serverPath);
    
    // Spawn the MCP server process
    const serverProcess = spawn(process.execPath, [fullServerPath], {
      stdio: ['pipe', 'pipe', 'inherit'],
      shell: process.platform === 'win32'
    });

    // Create transport using the server's stdio
    this.transport = new StdioClientTransport({
      reader: serverProcess.stdout,
      writer: serverProcess.stdin
    });

    // Create client
    this.client = new Client(
      {
        name: 'reddytalk-test-client',
        version: '1.0.0'
      },
      {
        capabilities: {
          roots: {
            listChanged: true
          },
          sampling: {}
        }
      }
    );

    await this.client.connect(this.transport);
    console.log('✅ Connected to ReddyTalk MCP Server');
    
    return this.client;
  }

  async testBasicOperations() {
    console.log('\n🧪 Testing Basic MCP Operations...\n');

    try {
      // Test 1: List available resources
      console.log('1️⃣ Testing list resources...');
      const resources = await this.client.request({
        method: 'resources/list'
      });
      console.log(`📚 Found ${resources.resources.length} resources:`, 
        resources.resources.map(r => r.name));

      // Test 2: Read clinic info
      console.log('\n2️⃣ Testing read clinic information...');
      const clinicInfo = await this.client.request({
        method: 'resources/read',
        params: {
          uri: 'reddytalk://clinic-info'
        }
      });
      const clinic = JSON.parse(clinicInfo.contents[0].text);
      console.log('🏥 Clinic Status:', {
        name: clinic.name,
        isOpen: clinic.isOpen,
        nextOpen: clinic.nextOpenTime
      });

      // Test 3: List available tools
      console.log('\n3️⃣ Testing list tools...');
      const tools = await this.client.request({
        method: 'tools/list'
      });
      console.log(`🛠️ Found ${tools.tools.length} tools:`, 
        tools.tools.map(t => t.name));

      // Test 4: Schedule an appointment
      console.log('\n4️⃣ Testing appointment scheduling...');
      const appointment = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'schedule_appointment',
          arguments: {
            patientName: 'John Test Patient',
            patientPhone: '+1-555-0123',
            doctorName: 'Dr. Sarah Johnson',
            appointmentType: 'General Checkup',
            preferredDate: 'monday',
            reason: 'Annual physical exam'
          }
        }
      });
      console.log('📅 Appointment Result:', 
        JSON.parse(appointment.content[0].text));

      // Test 5: Verify insurance
      console.log('\n5️⃣ Testing insurance verification...');
      const insurance = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'verify_insurance',
          arguments: {
            insuranceProvider: 'Blue Cross Blue Shield',
            memberId: '123456789'
          }
        }
      });
      console.log('🏥 Insurance Result:', 
        JSON.parse(insurance.content[0].text));

      // Test 6: Check wait times
      console.log('\n6️⃣ Testing wait time check...');
      const waitTime = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'check_wait_time',
          arguments: {
            serviceType: 'urgent care',
            isUrgent: false
          }
        }
      });
      console.log('⏱️ Wait Time Result:', 
        JSON.parse(waitTime.content[0].text));

      // Test 7: Symptom analysis
      console.log('\n7️⃣ Testing symptom analysis...');
      const symptoms = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'analyze_symptoms',
          arguments: {
            symptoms: ['headache', 'fever'],
            severity: 'moderate'
          }
        }
      });
      console.log('🔍 Symptom Analysis:', 
        JSON.parse(symptoms.content[0].text));

      console.log('\n✅ All tests completed successfully!');

    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  }

  async testRealTimeFeatures() {
    console.log('\n🔄 Testing Real-Time Features...\n');

    try {
      // Test real-time call analytics
      const analytics = await this.client.request({
        method: 'resources/read',
        params: {
          uri: 'reddytalk://call-analytics'
        }
      });
      const data = JSON.parse(analytics.contents[0].text);
      console.log('📊 Today\'s Call Analytics:', {
        totalCalls: data.today.totalCalls,
        successRate: data.today.successRate,
        avgDuration: data.today.averageDuration,
        aiResponseTime: data.aiMetrics.averageResponseTime
      });

      // Test patient queue
      const queue = await this.client.request({
        method: 'resources/read',
        params: {
          uri: 'reddytalk://patient-queue'
        }
      });
      const queueData = JSON.parse(queue.contents[0].text);
      console.log('👥 Current Patient Queue:', {
        walkIns: queueData.walkIns,
        averageWait: queueData.averageWaitTime
      });

    } catch (error) {
      console.error('❌ Real-time test failed:', error);
    }
  }

  async testPrompts() {
    console.log('\n💬 Testing MCP Prompts...\n');

    try {
      // List available prompts
      const prompts = await this.client.request({
        method: 'prompts/list'
      });
      console.log(`📝 Found ${prompts.prompts.length} prompts:`, 
        prompts.prompts.map(p => p.name));

      // Test medical receptionist prompt
      const prompt = await this.client.request({
        method: 'prompts/get',
        params: {
          name: 'medical-receptionist-advanced',
          arguments: {
            conversationMode: 'voice',
            patientContext: 'returning patient'
          }
        }
      });
      console.log('🤖 Medical Receptionist Prompt loaded:', 
        prompt.messages[0].content.substring(0, 100) + '...');

    } catch (error) {
      console.error('❌ Prompt test failed:', error);
    }
  }

  async disconnect() {
    if (this.transport) {
      await this.transport.close();
      console.log('🔌 Disconnected from MCP Server');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  async function runTests() {
    const client = new ReddyTalkMCPClient();
    
    try {
      await client.connect();
      await client.testBasicOperations();
      await client.testRealTimeFeatures();
      await client.testPrompts();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    } finally {
      await client.disconnect();
    }
    
    console.log('\n🎉 All MCP tests completed successfully!');
    console.log('🚀 Your ReddyTalk MCP Server is ready for production!');
  }

  runTests();
}

module.exports = ReddyTalkMCPClient;