// services/videoExerciseService.ts - Extract exercises from video
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export interface ExtractedExercise {
  name: string;
  sets?: number;
  reps?: number;
  duration?: string; // "30 seconds", "2 minutes"
  restTime?: string;
  muscleGroups: string[];
  equipment?: string[];
  formNotes?: string;
  timestamp?: string; // when in video this exercise appears
}

export interface VideoAnalysisResult {
  exercises: ExtractedExercise[];
  totalDuration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedCaloriesBurned: number;
  workoutType: string; // "Strength", "Cardio", "HIIT", "Flexibility"
  summary: string;
}

// Extract frames from video at intervals
export async function extractVideoFrames(
  videoFile: File,
  intervalSeconds: number = 5
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames: string[] = [];

    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const frameCount = Math.min(10, Math.floor(duration / intervalSeconds)); // Max 10 frames
      let currentFrame = 0;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const captureFrame = () => {
        if (currentFrame >= frameCount) {
          URL.revokeObjectURL(video.src);
          resolve(frames);
          return;
        }

        const timestamp = (duration / frameCount) * currentFrame;
        video.currentTime = timestamp;
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL('image/jpeg', 0.8));
          currentFrame++;
          captureFrame();
        }
      };

      video.onerror = () => reject(new Error('Video loading error'));
      captureFrame();
    };
  });
}

// Analyze video frames to extract exercises
export async function analyzeWorkoutVideo(
  frames: string[],
  onProgress?: (progress: number) => void
): Promise<VideoAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    if (onProgress) onProgress(10);

    // Prepare frames for analysis
    const imageParts = frames.map(frame => ({
      inlineData: {
        data: frame.replace(/^data:image\/\w+;base64,/, ''),
        mimeType: 'image/jpeg'
      }
    }));

    const prompt = `Analyze this workout video (shown as ${frames.length} frames) and extract ALL exercises performed.

For each exercise identify:
- Exercise name
- Number of sets (if visible)
- Number of reps (if visible)
- Duration (if timed exercise)
- Muscle groups worked
- Equipment used
- Any form notes or tips

Return a JSON response with this structure:
{
  "exercises": [
    {
      "name": "Push-ups",
      "sets": 3,
      "reps": 10,
      "duration": null,
      "muscleGroups": ["chest", "triceps", "shoulders"],
      "equipment": [],
      "formNotes": "Keep back straight",
      "timestamp": "0:05"
    }
  ],
  "totalDuration": "15 minutes",
  "difficulty": "Intermediate",
  "estimatedCaloriesBurned": 150,
  "workoutType": "Strength",
  "summary": "Full body strength workout focusing on compound movements"
}

Be thorough and identify ALL exercises visible in the frames.
Return ONLY valid JSON, no markdown or explanations.`;

    if (onProgress) onProgress(50);

    const result = await model.generateContent([prompt, ...imageParts]);
    
    if (onProgress) onProgress(90);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    if (onProgress) onProgress(100);

    return analysis;
  } catch (error) {
    console.error('Video analysis error:', error);
    throw error;
  }
}

// Analyze single frame for exercise form
export async function analyzeExerciseForm(
  imageBase64: string,
  mimeType: string,
  exerciseName?: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = exerciseName
      ? `Analyze the form for this ${exerciseName} exercise. Provide specific feedback on:
- Body positioning
- Common mistakes to avoid
- Improvements needed
- Safety concerns

Be concise and actionable.`
      : `Identify the exercise being performed and analyze the form. Provide feedback on technique and safety.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
          mimeType
        }
      }
    ]);

    return result.response.text();
  } catch (error) {
    console.error('Exercise form analysis error:', error);
    throw error;
  }
}

// Convert video file to base64
export async function videoToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
