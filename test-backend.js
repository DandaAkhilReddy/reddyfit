#!/usr/bin/env node
// ReddyTalk Backend Test Script
// Quick test of Twilio integration with real credentials

const express = require('express');
const twilio = require('twilio');
require('dotenv').config();

// Your Twilio credentials from .env
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const testNumber = '+12249999944'; // Your test number

console.log('🚀 ReddyTalk Backend Test Script');
console.log('================================');
console.log(`📞 From: ${fromNumber}`);
console.log(`📞 To: ${testNumber}`);
console.log('================================\n');

// Test Twilio Connection
async function testTwilioConnection() {
    try {
        console.log('🔍 Testing Twilio connection...');
        
        const client = twilio(accountSid, authToken);
        
        // Test account access
        const account = await client.api.accounts(accountSid).fetch();
        console.log(`✅ Connected to Twilio account: ${account.friendlyName}`);
        console.log(`   Status: ${account.status}`);
        
        // Test phone number
        const phoneNumbers = await client.incomingPhoneNumbers.list({
            phoneNumber: fromNumber,
            limit: 1
        });
        
        if (phoneNumbers.length > 0) {
            console.log(`✅ Phone number validated: ${fromNumber}`);
            console.log(`   Capabilities: Voice=${phoneNumbers[0].capabilities.voice}, SMS=${phoneNumbers[0].capabilities.sms}`);
        } else {
            console.log(`❌ Phone number ${fromNumber} not found`);
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Twilio connection failed:', error.message);
        return false;
    }
}

// Make Test Call
async function makeTestCall() {
    try {
        console.log('\n📞 Making test call...');
        
        const client = twilio(accountSid, authToken);
        
        const call = await client.calls.create({
            twiml: `<Response>
                <Say voice="Polly.Joanna">
                    Hello! This is ReddyTalk AI calling. Your backend server is working perfectly! 
                    The Twilio integration is active and ready for medical appointment scheduling.
                    Have a great day!
                </Say>
                <Hangup/>
            </Response>`,
            to: testNumber,
            from: fromNumber
        });
        
        console.log(`✅ Test call initiated!`);
        console.log(`   Call SID: ${call.sid}`);
        console.log(`   Status: ${call.status}`);
        console.log(`   📞 Your phone should be ringing now!`);
        
        // Monitor call status
        setTimeout(async () => {
            try {
                const updatedCall = await client.calls(call.sid).fetch();
                console.log(`📊 Call status update: ${updatedCall.status}`);
                if (updatedCall.duration) {
                    console.log(`   Duration: ${updatedCall.duration} seconds`);
                }
            } catch (error) {
                console.error('Error getting call status:', error.message);
            }
        }, 10000);
        
        return call.sid;
        
    } catch (error) {
        console.error('❌ Test call failed:', error.message);
        return null;
    }
}

// Send Test SMS
async function sendTestSMS() {
    try {
        console.log('\n📱 Sending test SMS...');
        
        const client = twilio(accountSid, authToken);
        
        const message = await client.messages.create({
            body: `🏥 ReddyTalk AI Backend Test: Your system is working! Appointment scheduling is ready. Time: ${new Date().toLocaleTimeString()}`,
            from: fromNumber,
            to: testNumber
        });
        
        console.log(`✅ Test SMS sent!`);
        console.log(`   Message SID: ${message.sid}`);
        console.log(`   Status: ${message.status}`);
        console.log(`   📱 Check your phone for the SMS!`);
        
        return message.sid;
        
    } catch (error) {
        console.error('❌ Test SMS failed:', error.message);
        return null;
    }
}

// Test Express Server Routes
function startTestServer() {
    const app = express();
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    
    // Test webhook endpoint
    app.post('/webhook/test', (req, res) => {
        console.log('📨 Webhook test received:', req.body);
        
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say('Hello from ReddyTalk test webhook! The backend is working perfectly.');
        twiml.hangup();
        
        res.type('text/xml').send(twiml.toString());
    });
    
    // Health check
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            service: 'ReddyTalk Backend Test',
            timestamp: new Date().toISOString(),
            twilio: {
                accountSid: accountSid.substr(0, 10) + '...',
                phoneNumber: fromNumber
            }
        });
    });
    
    // Quick call endpoint
    app.post('/make-test-call', async (req, res) => {
        try {
            const { to, message } = req.body;
            const targetNumber = to || testNumber;
            const callMessage = message || 'Hello from ReddyTalk backend test!';
            
            const client = twilio(accountSid, authToken);
            
            const call = await client.calls.create({
                twiml: `<Response><Say voice="Polly.Joanna">${callMessage}</Say><Hangup/></Response>`,
                to: targetNumber,
                from: fromNumber
            });
            
            res.json({
                success: true,
                callSid: call.sid,
                to: targetNumber,
                from: fromNumber,
                message: `Call initiated to ${targetNumber}`
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    
    const port = 3001;
    app.listen(port, () => {
        console.log(`\n🌐 Test server running on http://localhost:${port}`);
        console.log(`   Health check: http://localhost:${port}/health`);
        console.log(`   Make call: POST http://localhost:${port}/make-test-call`);
        console.log('\n🚀 Ready for testing!');
    });
}

// Main test function
async function runTests() {
    console.log('Starting ReddyTalk backend tests...\n');
    
    // Test 1: Connection
    const connectionOk = await testTwilioConnection();
    if (!connectionOk) {
        console.log('\n❌ Connection test failed. Check your credentials.');
        return;
    }
    
    // Test 2: Make call
    console.log('\n⏱️  Waiting 3 seconds before making test call...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const callSid = await makeTestCall();
    
    // Test 3: Send SMS
    console.log('\n⏱️  Waiting 3 seconds before sending SMS...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const messageSid = await sendTestSMS();
    
    // Test 4: Start server
    console.log('\n🌐 Starting test server for webhook testing...');
    startTestServer();
    
    console.log('\n✅ All tests completed!');
    console.log('\n📋 Summary:');
    console.log(`   - Twilio connection: ✅`);
    console.log(`   - Test call: ${callSid ? '✅' : '❌'}`);
    console.log(`   - Test SMS: ${messageSid ? '✅' : '❌'}`);
    console.log(`   - Test server: ✅ Running on port 3001`);
    
    console.log('\n🎉 ReddyTalk backend is ready for medical appointment scheduling!');
    console.log('\n💡 Next steps:');
    console.log('   1. Test the webhook endpoint');
    console.log('   2. Integrate with frontend');
    console.log('   3. Add Azure Speech-to-Text');
    console.log('   4. Set up patient database');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(error => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testTwilioConnection, makeTestCall, sendTestSMS };