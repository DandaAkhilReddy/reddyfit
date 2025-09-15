const twilio = require('twilio');

class TwilioService {
    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
        
        if (this.accountSid && this.authToken) {
            this.client = twilio(this.accountSid, this.authToken);
            console.log('✅ Twilio service initialized successfully');
        } else {
            console.log('⚠️ Twilio credentials not found in environment variables');
        }
    }

    async makeCall(toNumber, message) {
        try {
            if (!this.client) {
                throw new Error('Twilio client not initialized - check credentials');
            }

            console.log(`📞 Making call to ${toNumber} with message: "${message.substring(0, 50)}..."`);

            const call = await this.client.calls.create({
                twiml: `<Response><Say voice="alice">${message}</Say></Response>`,
                to: toNumber,
                from: this.phoneNumber
            });

            console.log(`✅ Call initiated successfully - SID: ${call.sid}`);
            
            return {
                success: true,
                callSid: call.sid,
                status: call.status,
                to: toNumber,
                from: this.phoneNumber,
                message: message
            };

        } catch (error) {
            console.error('❌ Twilio call failed:', error.message);
            return {
                success: false,
                error: error.message,
                to: toNumber
            };
        }
    }

    async sendSMS(toNumber, message) {
        try {
            if (!this.client) {
                throw new Error('Twilio client not initialized - check credentials');
            }

            console.log(`📱 Sending SMS to ${toNumber}: "${message.substring(0, 50)}..."`);

            const sms = await this.client.messages.create({
                body: message,
                from: this.phoneNumber,
                to: toNumber
            });

            console.log(`✅ SMS sent successfully - SID: ${sms.sid}`);
            
            return {
                success: true,
                messageSid: sms.sid,
                status: sms.status,
                to: toNumber,
                from: this.phoneNumber,
                message: message
            };

        } catch (error) {
            console.error('❌ Twilio SMS failed:', error.message);
            return {
                success: false,
                error: error.message,
                to: toNumber
            };
        }
    }

    async getCallStatus(callSid) {
        try {
            if (!this.client) {
                throw new Error('Twilio client not initialized - check credentials');
            }

            const call = await this.client.calls(callSid).fetch();
            
            return {
                success: true,
                callSid: call.sid,
                status: call.status,
                duration: call.duration,
                startTime: call.startTime,
                endTime: call.endTime
            };

        } catch (error) {
            console.error('❌ Failed to get call status:', error.message);
            return {
                success: false,
                error: error.message,
                callSid
            };
        }
    }

    async handleIncomingCall(req, res) {
        try {
            console.log('📞 Incoming call received');
            
            // Create TwiML response for incoming calls
            const twiml = new twilio.twiml.VoiceResponse();
            
            // Greet the caller
            twiml.say({
                voice: 'alice'
            }, 'Hello! You have reached ReddyTalk AI Medical Receptionist. How can I help you today?');
            
            // Gather user input
            const gather = twiml.gather({
                input: 'speech',
                timeout: 5,
                action: '/api/twilio/process-speech'
            });
            
            gather.say('Please tell me how I can assist you.');
            
            // If no input, repeat
            twiml.say('I didn\'t catch that. Please call back if you need assistance.');
            
            res.type('text/xml');
            res.send(twiml.toString());
            
            console.log('✅ TwiML response sent for incoming call');

        } catch (error) {
            console.error('❌ Error handling incoming call:', error.message);
            res.status(500).send('Error processing call');
        }
    }

    async processSpeechInput(req, res) {
        try {
            const speechResult = req.body.SpeechResult;
            const callSid = req.body.CallSid;
            
            console.log(`🎤 Speech received from ${callSid}: "${speechResult}"`);
            
            // Here you would integrate with your AI service
            // For now, we'll create a simple response based on keywords
            
            let response = "Thank you for calling. Let me help you with that.";
            
            if (speechResult.toLowerCase().includes('appointment')) {
                response = "I can help you schedule an appointment. Let me transfer you to our scheduling system.";
            } else if (speechResult.toLowerCase().includes('emergency')) {
                response = "If this is a medical emergency, please hang up and call 911 immediately.";
            } else if (speechResult.toLowerCase().includes('hours')) {
                response = "Our clinic hours are Monday through Friday, 8 AM to 6 PM, and Saturday 9 AM to 2 PM.";
            }
            
            const twiml = new twilio.twiml.VoiceResponse();
            twiml.say({ voice: 'alice' }, response);
            twiml.hangup();
            
            res.type('text/xml');
            res.send(twiml.toString());
            
            console.log(`✅ AI response sent: "${response.substring(0, 50)}..."`);

        } catch (error) {
            console.error('❌ Error processing speech:', error.message);
            
            const twiml = new twilio.twiml.VoiceResponse();
            twiml.say('I apologize, but I encountered an error. Please try calling again.');
            twiml.hangup();
            
            res.type('text/xml');
            res.send(twiml.toString());
        }
    }

    getWebhookUrl() {
        // Return the webhook URL for Twilio configuration
        return {
            voice_url: `${process.env.BASE_URL || 'http://localhost:8081'}/api/twilio/incoming-call`,
            sms_url: `${process.env.BASE_URL || 'http://localhost:8081'}/api/twilio/incoming-sms`,
            status_callback: `${process.env.BASE_URL || 'http://localhost:8081'}/api/twilio/status-callback`
        };
    }
}

module.exports = new TwilioService();