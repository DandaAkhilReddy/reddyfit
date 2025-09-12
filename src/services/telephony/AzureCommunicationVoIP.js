// AzureCommunicationVoIP.js - Azure Communication Services for VoIP/WebRTC

const { CommunicationIdentityClient } = require('@azure/communication-identity');
// Note: @azure/communication-calling requires browser environment
// For server-side, we'll use REST APIs instead
const axios = require('axios');
const { PhoneNumbersClient } = require('@azure/communication-phone-numbers');
const EventEmitter = require('events');

class AzureCommunicationVoIP extends EventEmitter {
  constructor(config = {}) {
    super();
    this.connectionString = config.connectionString || process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
    this.phoneNumber = config.phoneNumber || process.env.AZURE_COMMUNICATION_PHONE_NUMBER;
    this.identityClient = null;
    this.phoneNumbersClient = null;
    this.callAgent = null;
    this.deviceManager = null;
    this.currentCall = null;
    this.audioStream = null;
  }

  async initialize() {
    try {
      if (!this.connectionString) {
        throw new Error('Azure Communication Services connection string not provided');
      }

      // Initialize clients
      this.identityClient = new CommunicationIdentityClient(this.connectionString);
      this.phoneNumbersClient = new PhoneNumbersClient(this.connectionString);

      // Create user identity and token
      const user = await this.identityClient.createUser();
      const tokenResponse = await this.identityClient.getToken(user, ["voip"]);

      // Initialize calling client
      const callClient = new CallClient();
      this.callAgent = await callClient.createCallAgent(tokenResponse.token, {
        displayName: 'ReddyTalk AI Receptionist'
      });

      // Set up device manager for audio
      this.deviceManager = await callClient.getDeviceManager();
      await this.deviceManager.askDevicePermission({ audio: true });

      // Register for incoming calls
      this.callAgent.on('incomingCall', async (args) => {
        const incomingCall = args.incomingCall;
        this.emit('incomingCall', {
          callId: incomingCall.id,
          callerInfo: incomingCall.callerInfo
        });
        
        // Auto-answer for AI receptionist
        await this.answerCall(incomingCall);
      });

      this.emit('initialized');
      return true;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Answer incoming call
  async answerCall(incomingCall) {
    try {
      const acceptCallOptions = {
        audioOptions: {
          muted: false
        }
      };

      this.currentCall = await incomingCall.accept(acceptCallOptions);
      this.setupCallHandlers();
      
      this.emit('callAnswered', {
        callId: this.currentCall.id,
        remoteParticipants: this.currentCall.remoteParticipants
      });

      // Start audio processing
      await this.startAudioProcessing();
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Make outbound call
  async makeCall(phoneNumber) {
    try {
      if (!this.callAgent) {
        await this.initialize();
      }

      const callOptions = {
        alternateCallerId: { phoneNumber: this.phoneNumber },
        audioOptions: { muted: false }
      };

      this.currentCall = await this.callAgent.startCall(
        [{ phoneNumber: phoneNumber }],
        callOptions
      );

      this.setupCallHandlers();
      
      this.emit('callStarted', {
        callId: this.currentCall.id,
        phoneNumber: phoneNumber
      });

      // Start audio processing
      await this.startAudioProcessing();
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Set up call event handlers
  setupCallHandlers() {
    if (!this.currentCall) return;

    this.currentCall.on('stateChanged', () => {
      this.emit('callStateChanged', {
        callId: this.currentCall.id,
        state: this.currentCall.state
      });

      if (this.currentCall.state === 'Disconnected') {
        this.handleCallDisconnected();
      }
    });

    this.currentCall.on('remoteParticipantsUpdated', (e) => {
      e.added.forEach(participant => {
        this.emit('participantAdded', {
          callId: this.currentCall.id,
          participant: participant
        });
      });

      e.removed.forEach(participant => {
        this.emit('participantRemoved', {
          callId: this.currentCall.id,
          participant: participant
        });
      });
    });
  }

  // Start audio stream processing
  async startAudioProcessing() {
    try {
      // Get audio stream from the call
      const audioStream = await this.getAudioStream();
      
      if (audioStream) {
        // Process incoming audio
        audioStream.on('data', (audioData) => {
          this.emit('audioReceived', {
            callId: this.currentCall.id,
            audioData: audioData,
            timestamp: Date.now()
          });
        });

        this.audioStream = audioStream;
        this.emit('audioStreamStarted', { callId: this.currentCall.id });
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  // Send audio to the call
  async sendAudio(audioBuffer) {
    try {
      if (this.currentCall && this.currentCall.state === 'Connected' && this.audioStream) {
        // Convert audio buffer to appropriate format for sending
        // Azure Communication Services expects specific audio format
        const processedAudio = this.processAudioForSending(audioBuffer);
        
        // Send audio through the stream
        this.audioStream.write(processedAudio);
        
        this.emit('audioSent', {
          callId: this.currentCall.id,
          size: audioBuffer.length,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  // Process audio for correct format
  processAudioForSending(audioBuffer) {
    // Ensure audio is in correct format: 16-bit PCM, 8kHz mono for telephony
    // This is a placeholder - implement actual audio processing
    return audioBuffer;
  }

  // Get audio stream from call
  async getAudioStream() {
    // This would integrate with the actual Azure Communication Services SDK
    // to get the raw audio stream from the call
    // Placeholder for actual implementation
    return {
      on: (event, callback) => {
        // Mock audio stream events
        if (event === 'data') {
          // Simulate incoming audio chunks
          setInterval(() => {
            const mockAudioData = Buffer.alloc(320); // 20ms of 8kHz audio
            callback(mockAudioData);
          }, 20);
        }
      },
      write: (data) => {
        // Mock sending audio
        return true;
      }
    };
  }

  // End current call
  async endCall() {
    try {
      if (this.currentCall) {
        await this.currentCall.hangUp();
        this.emit('callEnded', {
          callId: this.currentCall.id,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  // Handle call disconnection
  handleCallDisconnected() {
    const reason = this.currentCall.callEndReason;
    
    this.emit('callDisconnected', {
      callId: this.currentCall.id,
      reason: reason,
      timestamp: Date.now()
    });

    // Clean up
    if (this.audioStream) {
      this.audioStream.destroy();
      this.audioStream = null;
    }
    
    this.currentCall = null;
  }

  // Get call statistics
  getCallStats() {
    if (!this.currentCall) return null;

    return {
      callId: this.currentCall.id,
      state: this.currentCall.state,
      direction: this.currentCall.direction,
      startTime: this.currentCall.startTime,
      participants: this.currentCall.remoteParticipants.length
    };
  }

  // Mute/unmute
  async setMute(muted) {
    try {
      if (this.currentCall) {
        await this.currentCall.mute();
        this.emit('muteStateChanged', { muted });
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  // Transfer call
  async transferCall(targetPhoneNumber) {
    try {
      if (this.currentCall) {
        const transferCallOptions = {
          targetParticipant: { phoneNumber: targetPhoneNumber }
        };
        
        const transfer = this.currentCall.transfer(transferCallOptions);
        
        transfer.on('stateChanged', () => {
          if (transfer.state === 'Accepted') {
            this.emit('callTransferred', {
              callId: this.currentCall.id,
              transferTo: targetPhoneNumber
            });
          }
        });
      }
    } catch (error) {
      this.emit('error', error);
    }
  }
}

module.exports = AzureCommunicationVoIP;