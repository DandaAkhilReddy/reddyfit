import React, { useRef, useEffect, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface VoiceVisualizerProps {
  isRecording: boolean;
  audioLevel: number;
  width?: number;
  height?: number;
  barCount?: number;
  color?: string;
  backgroundColor?: string;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isRecording,
  audioLevel,
  width = 300,
  height = 60,
  barCount = 20,
  color = '#1976d2',
  backgroundColor = '#f5f5f5'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [bars, setBars] = useState<number[]>([]);

  // Initialize bars array
  useEffect(() => {
    setBars(new Array(barCount).fill(0));
  }, [barCount]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      if (isRecording) {
        // Update bars with audio level and some randomness for visual appeal
        const newBars = bars.map((_, index) => {
          const randomFactor = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
          const levelFactor = (audioLevel / 100) * randomFactor;
          const targetHeight = Math.max(2, levelFactor * height * 0.8);
          
          // Smooth transition to target height
          const currentHeight = bars[index] || 0;
          return currentHeight + (targetHeight - currentHeight) * 0.1;
        });
        
        setBars(newBars);

        // Draw bars
        const barWidth = (width - (barCount - 1) * 2) / barCount; // 2px gap between bars
        
        newBars.forEach((barHeight, index) => {
          const x = index * (barWidth + 2);
          const y = height - barHeight;
          
          // Gradient effect
          const gradient = ctx.createLinearGradient(0, y, 0, height);
          gradient.addColorStop(0, color + '80'); // Semi-transparent
          gradient.addColorStop(1, color);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barHeight);
          
          // Add glow effect for higher bars
          if (barHeight > height * 0.5) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 3;
            ctx.fillRect(x, y, barWidth, barHeight);
            ctx.shadowBlur = 0;
          }
        });
      } else {
        // Fade out bars when not recording
        const fadingBars = bars.map(bar => Math.max(0, bar * 0.9));
        setBars(fadingBars);
        
        // Draw fading bars
        const barWidth = (width - (barCount - 1) * 2) / barCount;
        
        fadingBars.forEach((barHeight, index) => {
          if (barHeight > 1) {
            const x = index * (barWidth + 2);
            const y = height - barHeight;
            
            ctx.fillStyle = color + '40'; // More transparent
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, audioLevel, bars, width, height, barCount, color, backgroundColor]);

  return (
    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {isRecording ? 'Recording...' : 'Voice Visualizer'}
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            borderRadius: '8px',
            backgroundColor: backgroundColor,
          }}
        />
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Audio Level: {Math.round(audioLevel)}%
      </Typography>
    </Paper>
  );
};

export default VoiceVisualizer;