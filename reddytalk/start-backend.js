#!/usr/bin/env node

// Simple startup script that sets environment and starts backend
process.env.PORT = process.env.PORT || '8082';
process.env.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'demo_mode';
process.env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'demo_mode';
process.env.TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+1234567890';
process.env.ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'demo_mode';

console.log('🚀 Starting ReddyTalk Backend with environment setup...');
console.log(`📊 Port: ${process.env.PORT}`);
console.log(`📞 Twilio: ${process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Demo Mode'}`);
console.log(`🎤 ElevenLabs: ${process.env.ELEVENLABS_API_KEY ? 'Configured' : 'Demo Mode'}`);

// Start the backend
require('./backend-api-complete.js');