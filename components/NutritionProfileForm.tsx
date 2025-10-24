import React from 'react';
import { ACTIVITY_LEVELS } from '../utils/nutritionCalculator';

interface NutritionProfileFormProps {
  age: number;
  setAge: (value: number) => void;
  sex: 'male' | 'female' | 'other';
  setSex: (value: 'male' | 'female' | 'other') => void;
  weight: number;
  setWeight: (value: number) => void;
  height: number;
  setHeight: (value: number) => void;
  activityLevel: 1.2 | 1.375 | 1.55 | 1.725 | 1.9;
  setActivityLevel: (value: 1.2 | 1.375 | 1.55 | 1.725 | 1.9) => void;
  goal: 'maintain' | 'lose' | 'gain';
  setGoal: (value: 'maintain' | 'lose' | 'gain') => void;
  bmi?: number;
  bmiClass?: string;
  onCalculate: () => void;
  isCalculating: boolean;
}

export const NutritionProfileForm: React.FC<NutritionProfileFormProps> = ({
  age, setAge, sex, setSex, weight, setWeight, height, setHeight,
  activityLevel, setActivityLevel, goal, setGoal, bmi, bmiClass,
  onCalculate, isCalculating
}) => {
  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-amber-400 mb-2">Body Metrics</h2>
        <p className="text-sm text-slate-400">Enter your details for personalized nutrition targets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Age (years)
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            min={13}
            max={120}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Sex */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Sex
          </label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value as 'male' | 'female' | 'other')}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Weight (kg)
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            min={30}
            max={300}
            step={0.1}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Height (cm)
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            min={100}
            max={250}
            step={0.1}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* BMI Display */}
      {bmi && bmiClass && (
        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">Body Mass Index (BMI)</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">{bmi}</span>
              <span className="block text-xs text-slate-400">{bmiClass}</span>
            </div>
          </div>
        </div>
      )}

      {/* Activity Level */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Activity Level
        </label>
        <select
          value={activityLevel}
          onChange={(e) => setActivityLevel(Number(e.target.value) as any)}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        >
          {Object.entries(ACTIVITY_LEVELS).map(([value, info]) => (
            <option key={value} value={value}>
              {info.label} - {info.description}
            </option>
          ))}
        </select>
      </div>

      {/* Goal */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Fitness Goal
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setGoal('lose')}
            className={`py-3 px-4 rounded-lg font-medium transition-all ${
              goal === 'lose'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Lose Weight
          </button>
          <button
            onClick={() => setGoal('maintain')}
            className={`py-3 px-4 rounded-lg font-medium transition-all ${
              goal === 'maintain'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Maintain
          </button>
          <button
            onClick={() => setGoal('gain')}
            className={`py-3 px-4 rounded-lg font-medium transition-all ${
              goal === 'gain'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Gain Weight
          </button>
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={onCalculate}
        disabled={isCalculating}
        className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCalculating ? 'Calculating...' : 'Calculate My Nutrition Targets'}
      </button>

      <p className="text-xs text-slate-500 text-center">
        Calculations based on Mifflin-St Jeor equation and NIH dietary reference intakes
      </p>
    </div>
  );
};
