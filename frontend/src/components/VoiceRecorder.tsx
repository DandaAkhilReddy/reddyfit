import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Box, Typography, Paper, LinearProgress, Alert, Chip } from '@mui/material';
import { Mic, MicOff, Stop, Send, VolumeUp } from '@mui/icons-material';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onTranscriptionReceived?: (text: string) => void;
  onAIResponse?: (text: string, audioUrl: string) => void;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onTranscriptionReceived,
  onAIResponse,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize audio context and get microphone permission
  const initializeAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1
        } 
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      setError(null);

      // Setup audio analysis for visual feedback
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Start monitoring audio levels
      const monitorAudio = () => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(Math.min(100, (average / 256) * 100));
        
        if (isRecording) {
          requestAnimationFrame(monitorAudio);
        }
      };

      return { stream, audioContext, analyser, monitorAudio };
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setHasPermission(false);
      setError('Microphone access denied. Please allow microphone access and refresh.');
      throw err;
    }
  }, [isRecording]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setIsProcessing(false);
      
      const { stream, monitorAudio } = await initializeAudio();
      
      // Clear previous chunks
      audioChunksRef.current = [];
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob, recordingTime);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start audio monitoring
      monitorAudio();

    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please check your microphone.');
    }
  }, [initializeAudio, onRecordingComplete, recordingTime]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  }, [isRecording]);

  // Toggle pause/resume
  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isPaused]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Request permission on mount
  useEffect(() => {
    if (hasPermission === null) {
      initializeAudio().catch(() => {
        // Permission handled in initializeAudio
      });
    }
  }, [hasPermission, initializeAudio]);

  if (hasPermission === false) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Microphone access is required for voice recording.
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, textAlign: 'center', maxWidth: 400, mx: 'auto' }}>
      {/* Status Display */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Voice Assistant
        </Typography>
        
        {isRecording && (
          <Chip 
            label={isPaused ? 'PAUSED' : 'RECORDING'} 
            color={isPaused ? 'warning' : 'error'}
            variant="filled"
            sx={{ mb: 1 }}
          />
        )}

        {isProcessing && (
          <Chip 
            label={processingStage || 'PROCESSING'} 
            color="info"
            variant="filled"
            sx={{ mb: 1 }}
          />
        )}
      </Box>

      {/* Audio Level Indicator */}
      {isRecording && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Audio Level
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={audioLevel} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: audioLevel > 50 ? '#4caf50' : '#ff9800'
              }
            }}
          />
        </Box>
      )}

      {/* Recording Timer */}
      {isRecording && (
        <Typography variant="h4" sx={{ mb: 2, fontFamily: 'monospace' }}>
          {formatTime(recordingTime)}
        </Typography>
      )}

      {/* Control Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
        {!isRecording ? (
          <Button
            variant="contained"
            size="large"
            startIcon={<Mic />}
            onClick={startRecording}
            disabled={disabled || hasPermission === false}
            sx={{ 
              minWidth: 140,
              backgroundColor: '#4caf50',
              '&:hover': { backgroundColor: '#45a049' }
            }}
          >
            Start Recording
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={togglePause}
              disabled={disabled}
              startIcon={isPaused ? <Mic /> : <MicOff />}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            
            <Button
              variant="contained"
              color="error"
              onClick={stopRecording}
              disabled={disabled}
              startIcon={<Stop />}
            >
              Stop & Send
            </Button>
          </>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {processingStage || 'Processing your request...'}
          </Typography>
        </Box>
      )}

      {/* Instructions */}
      {!isRecording && !isProcessing && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Click "Start Recording" and speak clearly. The AI will respond with voice.
        </Typography>
      )}
    </Paper>
  );
};

export default VoiceRecorder;