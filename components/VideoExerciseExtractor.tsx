// components/VideoExerciseExtractor.tsx
import { useState } from 'react';
import { useToast } from '../hooks/useToast';
import { 
  extractVideoFrames, 
  analyzeWorkoutVideo, 
  VideoAnalysisResult 
} from '../services/videoExerciseService';

export default function VideoExerciseExtractor() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  const { showToast } = useToast();

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      showToast('Please select a video file', 'error');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      showToast('Video file too large (max 100MB)', 'error');
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;

    setAnalyzing(true);
    setProgress(0);

    try {
      showToast('Extracting frames from video...', 'info');
      setProgress(20);

      // Extract frames
      const frames = await extractVideoFrames(videoFile, 5);
      setProgress(40);

      showToast(`Analyzing ${frames.length} frames with AI...`, 'info');

      // Analyze with AI
      const analysis = await analyzeWorkoutVideo(frames, (p) => {
        setProgress(40 + (p * 0.6)); // 40% to 100%
      });

      setResult(analysis);
      showToast('✅ Exercise extraction complete!', 'success');
    } catch (error) {
      console.error('Analysis error:', error);
      showToast('Failed to analyze video. Please try again.', 'error');
    } finally {
      setAnalyzing(false);
      setProgress(0);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-400';
      case 'Intermediate': return 'text-yellow-400';
      case 'Advanced': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">
          🎥 Video Exercise Extractor
        </h2>
        <p className="text-slate-400">
          Upload workout videos and AI will extract all exercises automatically
        </p>
      </div>

      {/* Video Upload */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="space-y-4">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Workout Video
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="block w-full text-sm text-slate-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-amber-600 file:text-white
                hover:file:bg-amber-700
                file:cursor-pointer cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-2">
              Supports MP4, MOV, AVI, WebM • Max 100MB
            </p>
          </div>

          {/* Video Preview */}
          {videoPreview && (
            <div className="space-y-4">
              <video
                src={videoPreview}
                controls
                className="w-full max-h-96 rounded-lg bg-black"
              />

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 
                  text-white font-semibold rounded-lg hover:from-amber-700 hover:to-orange-700 
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {analyzing ? '🔄 Analyzing Video...' : '🚀 Extract Exercises'}
              </button>

              {/* Progress Bar */}
              {analyzing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Analyzing...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-lg p-4">
              <div className="text-blue-400 text-sm mb-1">Exercises Found</div>
              <div className="text-white text-2xl font-bold">{result.exercises.length}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-lg p-4">
              <div className="text-purple-400 text-sm mb-1">Duration</div>
              <div className="text-white text-2xl font-bold">{result.totalDuration}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-lg p-4">
              <div className="text-orange-400 text-sm mb-1">Calories</div>
              <div className="text-white text-2xl font-bold">{result.estimatedCaloriesBurned}</div>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-lg p-4">
              <div className="text-green-400 text-sm mb-1">Type</div>
              <div className="text-white text-xl font-bold">{result.workoutType}</div>
            </div>
          </div>

          {/* Workout Info */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Workout Summary</h3>
              <span className={`text-sm font-semibold ${getDifficultyColor(result.difficulty)}`}>
                {result.difficulty}
              </span>
            </div>
            <p className="text-slate-300">{result.summary}</p>
          </div>

          {/* Exercises Table */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-4">Extracted Exercises</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">#</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Exercise</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Sets × Reps</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Muscles</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Equipment</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {result.exercises.map((exercise, index) => (
                    <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-4 text-slate-500">{index + 1}</td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">{exercise.name}</div>
                        {exercise.formNotes && (
                          <div className="text-xs text-slate-400 mt-1">{exercise.formNotes}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-amber-400 font-medium">
                        {exercise.sets && exercise.reps ? (
                          `${exercise.sets} × ${exercise.reps}`
                        ) : exercise.duration ? (
                          exercise.duration
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {exercise.muscleGroups.map((muscle, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full"
                            >
                              {muscle}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {exercise.equipment && exercise.equipment.length > 0 ? (
                            exercise.equipment.map((eq, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full"
                              >
                                {eq}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 text-sm">Bodyweight</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-400 text-sm">
                        {exercise.timestamp || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!videoFile && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <h4 className="text-blue-400 font-semibold mb-2">💡 How it works</h4>
          <ul className="text-slate-300 space-y-2 text-sm">
            <li>• Upload any workout video (gym session, home workout, etc.)</li>
            <li>• AI extracts frames and identifies all exercises</li>
            <li>• Get sets, reps, muscle groups, and equipment used</li>
            <li>• See calorie estimates and difficulty level</li>
            <li>• Perfect for tracking workouts and form analysis!</li>
          </ul>
        </div>
      )}
    </div>
  );
}
