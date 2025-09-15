/**
 * AudioService - Handles all audio-related operations
 * - Recording audio from microphone
 * - Playing audio responses
 * - Audio format conversion
 * - Audio upload to Azure Storage
 */

export class AudioService {
  private audioContext: AudioContext | null = null;
  private currentPlayingAudio: HTMLAudioElement | null = null;
  private recordingStream: MediaStream | null = null;

  constructor() {
    // Initialize audio context on user gesture
    this.initializeAudioContext();
  }

  /**
   * Initialize Web Audio API context
   */
  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw new Error('Web Audio API not supported');
    }
  }

  /**
   * Get user media stream with optimal settings for speech recognition
   */
  async getAudioStream(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimal for speech recognition
          channelCount: 1,    // Mono audio
        }
      });

      this.recordingStream = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw new Error('Microphone access denied or not available');
    }
  }

  /**
   * Convert audio blob to optimal format for Azure Speech Services
   */
  async convertAudioFormat(audioBlob: Blob): Promise<Blob> {
    try {
      if (!this.audioContext) {
        await this.initializeAudioContext();
      }

      // Read the audio blob
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);

      // Convert to 16kHz mono WAV format (preferred by Azure Speech)
      const wavBlob = await this.audioBufferToWav(audioBuffer, 16000, 1);
      return wavBlob;
    } catch (error) {
      console.error('Error converting audio format:', error);
      // Return original blob if conversion fails
      return audioBlob;
    }
  }

  /**
   * Convert AudioBuffer to WAV format
   */
  private async audioBufferToWav(
    audioBuffer: AudioBuffer, 
    sampleRate: number = 16000, 
    channels: number = 1
  ): Promise<Blob> {
    const length = audioBuffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // RIFF header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    // Convert audio data
    const channelData = audioBuffer.getChannelData(0);
    let offset = 44;
    
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Upload audio blob to backend API
   */
  async uploadAudio(audioBlob: Blob, sessionId?: string): Promise<string> {
    try {
      const formData = new FormData();
      const timestamp = new Date().toISOString();
      const fileName = `audio-${timestamp}.wav`;
      
      formData.append('audio', audioBlob, fileName);
      if (sessionId) {
        formData.append('sessionId', sessionId);
      }

      const response = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.audioUrl;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw new Error('Failed to upload audio');
    }
  }

  /**
   * Play audio from URL with proper error handling
   */
  async playAudio(audioUrl: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      // Stop any currently playing audio
      this.stopCurrentAudio();

      const audio = new HTMLAudioElement();
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      
      audio.onloadeddata = () => {
        console.log('Audio loaded, ready to play');
      };

      audio.oncanplay = () => {
        console.log('Audio can start playing');
        this.currentPlayingAudio = audio;
        audio.play().then(() => {
          resolve(audio);
        }).catch(reject);
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        reject(new Error('Failed to play audio'));
      };

      audio.onended = () => {
        this.currentPlayingAudio = null;
      };

      // Set source and load
      audio.src = audioUrl;
      audio.load();
    });
  }

  /**
   * Stop currently playing audio
   */
  stopCurrentAudio(): void {
    if (this.currentPlayingAudio) {
      this.currentPlayingAudio.pause();
      this.currentPlayingAudio.currentTime = 0;
      this.currentPlayingAudio = null;
    }
  }

  /**
   * Get audio duration from blob
   */
  async getAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new HTMLAudioElement();
      const objectUrl = URL.createObjectURL(audioBlob);
      
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to get audio duration'));
      };
      
      audio.src = objectUrl;
    });
  }

  /**
   * Create audio visualizer analyzer
   */
  createAnalyzer(stream: MediaStream): { analyzer: AnalyserNode; getAudioLevel: () => number } {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    const analyzer = this.audioContext.createAnalyser();
    analyzer.fftSize = 256;
    analyzer.smoothingTimeConstant = 0.8;

    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(analyzer);

    const dataArray = new Uint8Array(analyzer.frequencyBinCount);

    const getAudioLevel = (): number => {
      analyzer.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      return Math.min(100, (average / 256) * 100);
    };

    return { analyzer, getAudioLevel };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopCurrentAudio();
    
    if (this.recordingStream) {
      this.recordingStream.getTracks().forEach(track => track.stop());
      this.recordingStream = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Check if browser supports required audio features
   */
  static checkAudioSupport(): { supported: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      issues.push('getUserMedia not supported');
    }

    // Check for Web Audio API
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      issues.push('Web Audio API not supported');
    }

    // Check for MediaRecorder
    if (!window.MediaRecorder) {
      issues.push('MediaRecorder not supported');
    }

    // Check for WebM support
    const canRecordWebM = MediaRecorder.isTypeSupported('audio/webm;codecs=opus');
    const canRecordMP4 = MediaRecorder.isTypeSupported('audio/mp4;codecs=aac');
    
    if (!canRecordWebM && !canRecordMP4) {
      issues.push('No supported audio recording formats');
    }

    return {
      supported: issues.length === 0,
      issues
    };
  }
}

export default AudioService;