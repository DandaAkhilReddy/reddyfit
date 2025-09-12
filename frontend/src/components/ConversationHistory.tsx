import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Button
} from '@mui/material';
import {
  Person,
  SmartToy,
  VolumeUp,
  VolumeOff,
  Clear,
  ContentCopy,
  Download
} from '@mui/icons-material';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  audioUrl?: string;
  duration?: number;
  isPlaying?: boolean;
}

interface ConversationHistoryProps {
  messages: Message[];
  onPlayAudio: (messageId: string, audioUrl: string) => void;
  onStopAudio: (messageId: string) => void;
  onClearHistory: () => void;
  maxHeight?: number;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  messages,
  onPlayAudio,
  onStopAudio,
  onClearHistory,
  maxHeight = 400
}) => {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Copy message text to clipboard
  const handleCopyMessage = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopiedMessageId(message.id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Export conversation as text file
  const handleExportConversation = () => {
    const conversationText = messages
      .map(msg => {
        const time = msg.timestamp.toLocaleTimeString();
        const speaker = msg.type === 'user' ? 'You' : 'AI Assistant';
        return `[${time}] ${speaker}: ${msg.text}`;
      })
      .join('\n\n');

    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  if (messages.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <SmartToy sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Start Your Conversation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Click the microphone button below to begin talking with your AI assistant.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Conversation History
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export Conversation">
              <IconButton size="small" onClick={handleExportConversation}>
                <Download />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Clear History">
              <IconButton size="small" onClick={onClearHistory} color="error">
                <Clear />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Messages List */}
      <Box 
        ref={listRef}
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          maxHeight: maxHeight,
          p: 1
        }}
      >
        <List sx={{ p: 0 }}>
          {messages.map((message, index) => (
            <React.Fragment key={message.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  px: 2,
                  py: 1.5,
                  backgroundColor: message.type === 'user' ? 'action.hover' : 'background.default',
                  borderRadius: 2,
                  mb: 1,
                  '&:hover': {
                    backgroundColor: message.type === 'user' ? 'action.selected' : 'action.hover',
                  }
                }}
              >
                {/* Avatar */}
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    mr: 2,
                    backgroundColor: message.type === 'user' ? 'primary.main' : 'secondary.main'
                  }}
                >
                  {message.type === 'user' ? <Person /> : <SmartToy />}
                </Avatar>

                {/* Message Content */}
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  {/* Header with name and timestamp */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mr: 1 }}
                    >
                      {message.type === 'user' ? 'You' : 'AI Assistant'}
                    </Typography>
                    
                    <Chip
                      label={formatTime(message.timestamp)}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />

                    {message.duration && (
                      <Chip
                        label={formatDuration(message.duration)}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20, ml: 0.5 }}
                      />
                    )}
                  </Box>

                  {/* Message Text */}
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 1,
                      lineHeight: 1.5,
                      wordBreak: 'break-word'
                    }}
                  >
                    {message.text}
                  </Typography>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {/* Copy Button */}
                    <Tooltip title={copiedMessageId === message.id ? 'Copied!' : 'Copy text'}>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyMessage(message)}
                        sx={{ color: copiedMessageId === message.id ? 'success.main' : 'text.secondary' }}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* Audio Playback Button (for AI messages) */}
                    {message.type === 'ai' && message.audioUrl && (
                      <Tooltip title={message.isPlaying ? 'Stop audio' : 'Play audio'}>
                        <IconButton
                          size="small"
                          onClick={() => 
                            message.isPlaying 
                              ? onStopAudio(message.id)
                              : onPlayAudio(message.id, message.audioUrl!)
                          }
                          sx={{ 
                            color: message.isPlaying ? 'error.main' : 'primary.main'
                          }}
                        >
                          {message.isPlaying ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </ListItem>

              {/* Divider between messages */}
              {index < messages.length - 1 && (
                <Divider variant="middle" sx={{ my: 1 }} />
              )}
            </React.Fragment>
          ))}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          All conversations are processed securely and not stored permanently.
        </Typography>
      </Box>
    </Paper>
  );
};

export default ConversationHistory;