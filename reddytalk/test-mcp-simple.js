// Simple MCP Server Test
const { spawn } = require('child_process');

function testMCPServer() {
  console.log('🧪 Testing ReddyTalk MCP Server...\n');

  return new Promise((resolve, reject) => {
    // Test 1: List resources
    console.log('1️⃣ Testing list resources...');
    const testProcess = spawn('node', ['src/mcp/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Send test request
    testProcess.stdin.write('{"method":"resources/list"}\n');
    testProcess.stdin.end();

    let output = '';
    let errorOutput = '';

    testProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    testProcess.on('close', (code) => {
      console.log('📊 Server output:', errorOutput);
      
      if (code === 0) {
        console.log('✅ MCP Server started successfully');
        console.log('📋 Server is ready to handle requests');
      } else {
        console.log('❌ MCP Server failed with code:', code);
      }
      
      resolve();
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      testProcess.kill();
      resolve();
    }, 5000);
  });
}

// Test the enhanced server
function testEnhancedMCPServer() {
  console.log('\n🚀 Testing Enhanced MCP Server...\n');

  return new Promise((resolve, reject) => {
    const testProcess = spawn('node', ['src/mcp/enhanced-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    testProcess.stdin.write('{"method":"resources/list"}\n');
    testProcess.stdin.end();

    let errorOutput = '';

    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    testProcess.on('close', (code) => {
      console.log('📊 Enhanced server output:', errorOutput);
      
      if (code === 0) {
        console.log('✅ Enhanced MCP Server started successfully');
      } else {
        console.log('❌ Enhanced MCP Server failed with code:', code);
      }
      
      resolve();
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      testProcess.kill();
      resolve();
    }, 5000);
  });
}

async function runTests() {
  console.log('🎯 ReddyTalk MCP Server Test Suite\n');
  
  try {
    await testMCPServer();
    await testEnhancedMCPServer();
    
    console.log('\n🎉 MCP Server testing completed!');
    console.log('\n📋 Next steps:');
    console.log('  1. Start server: npm run mcp:start');
    console.log('  2. Connect from Claude Desktop using mcp-enhanced.json config');
    console.log('  3. Use medical tools for appointment scheduling and patient care');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testMCPServer, testEnhancedMCPServer };