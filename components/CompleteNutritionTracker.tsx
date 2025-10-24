// components/CompleteNutritionTracker.tsx
import { useState, useRef } from 'react';
import { useToast } from '../hooks/useToast';
import { 
  analyzeCompleteNutrition, 
  getDailyRecommendedIntake,
  calculateNutritionScore,
  MealAnalysis,
  CompleteNutritionData
} from '../services/enhancedNutritionService';

export default function CompleteNutritionTracker() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<MealAnalysis | null>(null);
  const [dailyTotal, setDailyTotal] = useState<CompleteNutritionData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file too large (max 5MB)', 'error');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;

    setAnalyzing(true);

    try {
      showToast('Analyzing nutrition with AI...', 'info');

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        try {
          const analysis = await analyzeCompleteNutrition(base64, imageFile.type);
          setResult(analysis);
          
          // Calculate nutrition score
          const score = calculateNutritionScore(analysis.nutrition);
          showToast(`✅ Analysis complete! Nutrition Score: ${score}/100`, 'success');
        } catch (error) {
          console.error('Analysis error:', error);
          showToast('Failed to analyze image. Please try again.', 'error');
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      setAnalyzing(false);
      showToast('Failed to process image', 'error');
    }
  };

  const dri = getDailyRecommendedIntake();

  const getProgressColor = (consumed: number, recommended: number) => {
    const ratio = consumed / recommended;
    if (ratio < 0.7) return 'bg-red-500';
    if (ratio < 0.9) return 'bg-yellow-500';
    if (ratio <= 1.1) return 'bg-green-500';
    return 'bg-orange-500';
  };

  const NutrientBar = ({ 
    label, 
    consumed, 
    recommended, 
    unit 
  }: { 
    label: string; 
    consumed: number; 
    recommended: number; 
    unit: string;
  }) => {
    const percentage = Math.min((consumed / recommended) * 100, 100);
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-slate-300">{label}</span>
          <span className="text-slate-400">
            {consumed.toFixed(1)}/{recommended.toFixed(1)} {unit}
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getProgressColor(consumed, recommended)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">
          🍔 Complete Nutrition Tracker
        </h2>
        <p className="text-slate-400">
          Upload food photos for complete nutritional analysis with vitamins & minerals
        </p>
      </div>

      {/* Image Upload */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="space-y-4">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-amber-500 transition-colors"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Food preview"
                className="max-h-64 mx-auto rounded-lg"
              />
            ) : (
              <div className="space-y-2">
                <div className="text-6xl">📸</div>
                <div className="text-slate-300">Click to upload food photo</div>
                <div className="text-sm text-slate-500">PNG, JPG up to 5MB</div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Analyze Button */}
          {imageFile && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 
                text-white font-semibold rounded-lg hover:from-amber-700 hover:to-orange-700 
                disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {analyzing ? '🔄 Analyzing Nutrition...' : '🚀 Analyze Nutrition'}
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Food Items & Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Food Items */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-3">Detected Foods</h3>
              <div className="flex flex-wrap gap-2">
                {result.foodItems.map((food, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-amber-600/20 text-amber-400 rounded-full text-sm"
                  >
                    {food}
                  </span>
                ))}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Meal Type:</span>
                  <span className="text-white font-medium">{result.mealType || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Serving:</span>
                  <span className="text-white font-medium">{result.servingSize || 'Standard'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Confidence:</span>
                  <span className="text-green-400 font-medium">{result.confidence}%</span>
                </div>
              </div>
            </div>

            {/* Nutrition Score */}
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-purple-300 mb-3">Nutrition Score</h3>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-white mb-2">
                    {calculateNutritionScore(result.nutrition)}
                  </div>
                  <div className="text-purple-300">out of 100</div>
                  <div className="mt-4 text-sm text-slate-300">
                    Based on protein, vitamins, fiber, sugar & sodium
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Macronutrients */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-4">Macronutrients</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                <div className="text-blue-400 text-sm mb-1">Calories</div>
                <div className="text-white text-3xl font-bold">{result.nutrition.calories}</div>
                <div className="text-slate-400 text-xs mt-1">kcal</div>
              </div>
              <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-4">
                <div className="text-green-400 text-sm mb-1">Protein</div>
                <div className="text-white text-3xl font-bold">{result.nutrition.protein}</div>
                <div className="text-slate-400 text-xs mt-1">grams</div>
              </div>
              <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="text-yellow-400 text-sm mb-1">Carbs</div>
                <div className="text-white text-3xl font-bold">{result.nutrition.carbs}</div>
                <div className="text-slate-400 text-xs mt-1">grams</div>
              </div>
              <div className="bg-orange-600/10 border border-orange-500/30 rounded-lg p-4">
                <div className="text-orange-400 text-sm mb-1">Fat</div>
                <div className="text-white text-3xl font-bold">{result.nutrition.fat}</div>
                <div className="text-slate-400 text-xs mt-1">grams</div>
              </div>
              <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg p-4">
                <div className="text-purple-400 text-sm mb-1">Fiber</div>
                <div className="text-white text-3xl font-bold">{result.nutrition.fiber}</div>
                <div className="text-slate-400 text-xs mt-1">grams</div>
              </div>
              <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-4">
                <div className="text-red-400 text-sm mb-1">Sugar</div>
                <div className="text-white text-3xl font-bold">{result.nutrition.sugar}</div>
                <div className="text-slate-400 text-xs mt-1">grams</div>
              </div>
            </div>
          </div>

          {/* Vitamins */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-4">💊 Vitamins</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.nutrition.vitaminA && dri.vitaminA && (
                <NutrientBar label="Vitamin A" consumed={result.nutrition.vitaminA} recommended={dri.vitaminA} unit="mcg" />
              )}
              {result.nutrition.vitaminC && dri.vitaminC && (
                <NutrientBar label="Vitamin C" consumed={result.nutrition.vitaminC} recommended={dri.vitaminC} unit="mg" />
              )}
              {result.nutrition.vitaminD && dri.vitaminD && (
                <NutrientBar label="Vitamin D" consumed={result.nutrition.vitaminD} recommended={dri.vitaminD} unit="mcg" />
              )}
              {result.nutrition.vitaminE && dri.vitaminE && (
                <NutrientBar label="Vitamin E" consumed={result.nutrition.vitaminE} recommended={dri.vitaminE} unit="mg" />
              )}
              {result.nutrition.vitaminK && dri.vitaminK && (
                <NutrientBar label="Vitamin K" consumed={result.nutrition.vitaminK} recommended={dri.vitaminK} unit="mcg" />
              )}
              {result.nutrition.vitaminB12 && dri.vitaminB12 && (
                <NutrientBar label="Vitamin B12" consumed={result.nutrition.vitaminB12} recommended={dri.vitaminB12} unit="mcg" />
              )}
            </div>
          </div>

          {/* Minerals */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-4">⚡ Essential Minerals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.nutrition.calcium && dri.calcium && (
                <NutrientBar label="Calcium" consumed={result.nutrition.calcium} recommended={dri.calcium} unit="mg" />
              )}
              {result.nutrition.iron && dri.iron && (
                <NutrientBar label="Iron" consumed={result.nutrition.iron} recommended={dri.iron} unit="mg" />
              )}
              {result.nutrition.magnesium && dri.magnesium && (
                <NutrientBar label="Magnesium" consumed={result.nutrition.magnesium} recommended={dri.magnesium} unit="mg" />
              )}
              {result.nutrition.potassium && dri.potassium && (
                <NutrientBar label="Potassium" consumed={result.nutrition.potassium} recommended={dri.potassium} unit="mg" />
              )}
              {result.nutrition.zinc && dri.zinc && (
                <NutrientBar label="Zinc" consumed={result.nutrition.zinc} recommended={dri.zinc} unit="mg" />
              )}
              {result.nutrition.sodium && dri.sodium && (
                <NutrientBar label="Sodium" consumed={result.nutrition.sodium} recommended={dri.sodium} unit="mg" />
              )}
            </div>
          </div>

          {/* Other Nutrients */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-4">🔬 Other Nutrients</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {result.nutrition.cholesterol && (
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-slate-400 text-xs mb-1">Cholesterol</div>
                  <div className="text-white font-bold">{result.nutrition.cholesterol}mg</div>
                </div>
              )}
              {result.nutrition.saturatedFat && (
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-slate-400 text-xs mb-1">Saturated Fat</div>
                  <div className="text-white font-bold">{result.nutrition.saturatedFat}g</div>
                </div>
              )}
              {result.nutrition.omega3 && (
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-slate-400 text-xs mb-1">Omega-3</div>
                  <div className="text-white font-bold">{result.nutrition.omega3}g</div>
                </div>
              )}
              {result.nutrition.omega6 && (
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-slate-400 text-xs mb-1">Omega-6</div>
                  <div className="text-white font-bold">{result.nutrition.omega6}g</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!imageFile && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
          <h4 className="text-green-400 font-semibold mb-2">💡 Complete Nutrition Tracking</h4>
          <ul className="text-slate-300 space-y-2 text-sm">
            <li>• Upload any food photo for instant analysis</li>
            <li>• Get ALL macros: calories, protein, carbs, fat, fiber, sugar</li>
            <li>• Track ALL vitamins: A, C, D, E, K, B-complex</li>
            <li>• Monitor minerals: Calcium, Iron, Magnesium, Zinc, etc.</li>
            <li>• See Omega-3, Omega-6, and cholesterol levels</li>
            <li>• Get nutrition score and daily progress bars</li>
            <li>• Perfect for serious nutrition tracking!</li>
          </ul>
        </div>
      )}
    </div>
  );
}
