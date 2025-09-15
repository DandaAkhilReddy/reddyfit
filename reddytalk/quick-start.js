#!/usr/bin/env node
// ReddyTalk Quick Start Script
// Starts the backend with simplified database for immediate testing

const path = require('path');

// Override the database service to use the simple one
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.USE_SIMPLE_DB = 'true';

// Load the main app
const ReddyTalkApp = require('./src/app-comprehensive');

// Override DatabaseService to use SimpleDatabaseService
const SimpleDatabaseService = require('./src/services/database/SimpleDatabaseService');

// Monkey patch the main app to use SimpleDatabaseService
const originalRequire = require;
require = function(id) {
  if (id === './services/database/DatabaseService') {
    return SimpleDatabaseService;
  }
  return originalRequire.apply(this, arguments);
};

async function quickStart() {
  console.log('🚀 ReddyTalk Quick Start');
  console.log('========================');
  console.log('Starting backend with simplified in-memory database...');
  console.log('Perfect for testing Twilio integration!\n');

  try {
    // Initialize and start the app
    const app = ReddyTalkApp;
    await app.start();
    
    console.log('\n🎉 ReddyTalk Backend is running!');
    console.log('\n📞 Test your Twilio integration:');
    console.log(`   Call: ${process.env.TWILIO_PHONE_NUMBER}`);
    console.log(`   SMS: Send a message to ${process.env.TWILIO_PHONE_NUMBER}`);
    
    console.log('\n🌐 API Endpoints:');
    console.log(`   Health: http://localhost:${process.env.PORT || 8080}/health`);
    console.log(`   API Info: http://localhost:${process.env.PORT || 8080}/api`);
    console.log(`   Webhook: http://localhost:${process.env.PORT || 8080}/webhooks/twilio/voice`);
    
    console.log('\n🧪 Test Endpoints:');
    console.log(`   Make Call: POST http://localhost:${process.env.PORT || 8080}/webhooks/twilio/api/call/outbound`);
    console.log(`   Active Calls: GET http://localhost:${process.env.PORT || 8080}/webhooks/twilio/api/calls/active`);
    
    console.log('\n🔧 Quick Test Commands:');
    console.log('   1. Run: node test-backend.js');
    console.log('   2. Call your Twilio number');
    console.log('   3. Check the logs here');
    
    console.log('\n✅ Ready for medical AI appointment scheduling!');
    
  } catch (error) {
    console.error('❌ Failed to start ReddyTalk:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  process.exit(0);
});

// Start the application
if (require.main === module) {
  quickStart();
}

module.exports = quickStart;