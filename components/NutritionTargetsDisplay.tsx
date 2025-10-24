import React from 'react';
import { NutritionTargets } from '../utils/nutritionCalculator';

interface NutritionTargetsDisplayProps {
  targets: NutritionTargets | null;
}

export const NutritionTargetsDisplay: React.FC<NutritionTargetsDisplayProps> = ({ targets }) => {
  if (!targets) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Energy Targets */}
      <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
        <h3 className="text-lg font-bold text-amber-400 mb-4">Energy & Macros</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">BMR</p>
            <p className="text-2xl font-bold text-white">{targets.bmr}</p>
            <p className="text-xs text-slate-500">cal/day</p>
          </div>
          
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">TDEE</p>
            <p className="text-2xl font-bold text-white">{targets.tdee}</p>
            <p className="text-xs text-slate-500">cal/day</p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 p-4 rounded-lg border border-amber-500/30">
            <p className="text-xs text-amber-300 mb-1">Target Calories</p>
            <p className="text-2xl font-bold text-white">{targets.calories}</p>
            <p className="text-xs text-amber-400">cal/day</p>
          </div>
          
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">Fiber</p>
            <p className="text-2xl font-bold text-white">{targets.fiber_g}g</p>
            <p className="text-xs text-slate-500">/day</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-red-500/20 p-4 rounded-lg border border-red-500/30">
            <p className="text-xs text-red-300 mb-1">Protein</p>
            <p className="text-2xl font-bold text-white">{targets.protein_g}g</p>
            <p className="text-xs text-red-400">/day</p>
          </div>
          
          <div className="bg-blue-500/20 p-4 rounded-lg border border-blue-500/30">
            <p className="text-xs text-blue-300 mb-1">Carbs</p>
            <p className="text-2xl font-bold text-white">{targets.carbs_g}g</p>
            <p className="text-xs text-blue-400">/day</p>
          </div>
          
          <div className="bg-yellow-500/20 p-4 rounded-lg border border-yellow-500/30">
            <p className="text-xs text-yellow-300 mb-1">Fat</p>
            <p className="text-2xl font-bold text-white">{targets.fat_g}g</p>
            <p className="text-xs text-yellow-400">/day</p>
          </div>
        </div>
      </div>

      {/* Micronutrient Targets */}
      <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
        <h3 className="text-lg font-bold text-amber-400 mb-4">Key Micronutrients (RDA)</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <NutrientBadge label="Vitamin D" value={targets.vitamin_d_mcg} unit="mcg" />
          <NutrientBadge label="Vitamin C" value={targets.vitamin_c_mg} unit="mg" />
          <NutrientBadge label="B12" value={targets.vitamin_b12_mcg} unit="mcg" />
          <NutrientBadge label="Folate" value={targets.folate_mcg} unit="mcg" />
          <NutrientBadge label="Iron" value={targets.iron_mg} unit="mg" />
          <NutrientBadge label="Calcium" value={targets.calcium_mg} unit="mg" />
          <NutrientBadge label="Magnesium" value={targets.magnesium_mg} unit="mg" />
          <NutrientBadge label="Potassium" value={targets.potassium_mg} unit="mg" />
          <NutrientBadge label="Zinc" value={targets.zinc_mg} unit="mg" />
          <NutrientBadge label="Omega-3" value={targets.omega3_g} unit="g" />
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-200">
          ✓ Your nutrition targets have been calculated and saved. Track your daily intake on the Dashboard to see how you're progressing!
        </p>
      </div>
    </div>
  );
};

const NutrientBadge: React.FC<{ label: string; value: number; unit: string }> = ({ label, value, unit }) => (
  <div className="bg-slate-700/50 p-3 rounded-lg">
    <p className="text-xs text-slate-400">{label}</p>
    <p className="text-lg font-bold text-white">
      {value} <span className="text-sm text-slate-400">{unit}</span>
    </p>
  </div>
);
