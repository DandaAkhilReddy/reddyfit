/**
 * Deficit Calculator - Identifies nutrient gaps and prioritizes them
 */

import { NutritionTargets } from './nutritionCalculator';

export type DeficitSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface NutrientDeficit {
  nutrient_key: string;
  display_name: string;
  unit: string;
  current: number;
  target: number;
  deficit: number;
  percentage_met: number;
  severity: DeficitSeverity;
  health_impact: string[];
  food_sources: string[];
}

export interface NutrientExcess {
  nutrient_key: string;
  display_name: string;
  unit: string;
  current: number;
  target: number;
  excess: number;
  percentage_over: number;
  health_risks: string[];
}

/**
 * Nutrient metadata for user-friendly display and education
 */
export const NUTRIENT_INFO: Record<string, {
  display_name: string;
  unit: string;
  category: 'macro' | 'vitamin' | 'mineral' | 'other';
  health_impact: string[];
  deficiency_symptoms: string[];
  food_sources: string[];
  upper_limit?: number; // For excess detection
}> = {
  // Macros
  protein_g: {
    display_name: 'Protein',
    unit: 'g',
    category: 'macro',
    health_impact: ['Muscle growth and repair', 'Immune function', 'Hormone production'],
    deficiency_symptoms: ['Muscle loss', 'Weakness', 'Poor wound healing'],
    food_sources: ['Chicken', 'Fish', 'Eggs', 'Tofu', 'Legumes', 'Greek yogurt']
  },
  carbs_g: {
    display_name: 'Carbohydrates',
    unit: 'g',
    category: 'macro',
    health_impact: ['Primary energy source', 'Brain function', 'Exercise performance'],
    deficiency_symptoms: ['Fatigue', 'Brain fog', 'Low energy'],
    food_sources: ['Whole grains', 'Fruits', 'Vegetables', 'Legumes']
  },
  fat_g: {
    display_name: 'Fat',
    unit: 'g',
    category: 'macro',
    health_impact: ['Hormone production', 'Vitamin absorption', 'Cell structure'],
    deficiency_symptoms: ['Dry skin', 'Hair loss', 'Vitamin deficiencies'],
    food_sources: ['Avocado', 'Nuts', 'Olive oil', 'Fatty fish', 'Seeds']
  },
  fiber_g: {
    display_name: 'Fiber',
    unit: 'g',
    category: 'macro',
    health_impact: ['Digestive health', 'Blood sugar control', 'Heart health'],
    deficiency_symptoms: ['Constipation', 'High cholesterol', 'Blood sugar spikes'],
    food_sources: ['Whole grains', 'Legumes', 'Vegetables', 'Fruits', 'Nuts']
  },
  
  // Vitamins
  vitamin_d_mcg: {
    display_name: 'Vitamin D',
    unit: 'mcg',
    category: 'vitamin',
    health_impact: ['Bone health', 'Immune function', 'Mood regulation'],
    deficiency_symptoms: ['Weak bones', 'Fatigue', 'Depression', 'Muscle weakness'],
    food_sources: ['Fatty fish', 'Egg yolks', 'Fortified milk', 'Mushrooms', 'Sunlight exposure'],
    upper_limit: 100
  },
  vitamin_c_mg: {
    display_name: 'Vitamin C',
    unit: 'mg',
    category: 'vitamin',
    health_impact: ['Immune function', 'Antioxidant', 'Collagen production', 'Iron absorption'],
    deficiency_symptoms: ['Slow wound healing', 'Frequent infections', 'Bleeding gums'],
    food_sources: ['Citrus fruits', 'Bell peppers', 'Strawberries', 'Broccoli', 'Kiwi'],
    upper_limit: 2000
  },
  vitamin_b12_mcg: {
    display_name: 'Vitamin B12',
    unit: 'mcg',
    category: 'vitamin',
    health_impact: ['Nerve function', 'Red blood cell production', 'DNA synthesis'],
    deficiency_symptoms: ['Fatigue', 'Numbness', 'Memory problems', 'Anemia'],
    food_sources: ['Meat', 'Fish', 'Eggs', 'Dairy', 'Fortified cereals']
  },
  folate_mcg: {
    display_name: 'Folate (B9)',
    unit: 'mcg',
    category: 'vitamin',
    health_impact: ['Cell division', 'DNA synthesis', 'Fetal development'],
    deficiency_symptoms: ['Anemia', 'Fatigue', 'Birth defects'],
    food_sources: ['Leafy greens', 'Legumes', 'Fortified grains', 'Asparagus'],
    upper_limit: 1000
  },
  
  // Minerals
  iron_mg: {
    display_name: 'Iron',
    unit: 'mg',
    category: 'mineral',
    health_impact: ['Oxygen transport', 'Energy production', 'Immune function'],
    deficiency_symptoms: ['Anemia', 'Fatigue', 'Pale skin', 'Shortness of breath'],
    food_sources: ['Red meat', 'Spinach', 'Legumes', 'Fortified cereals', 'Oysters'],
    upper_limit: 45
  },
  calcium_mg: {
    display_name: 'Calcium',
    unit: 'mg',
    category: 'mineral',
    health_impact: ['Bone health', 'Muscle function', 'Nerve signaling'],
    deficiency_symptoms: ['Weak bones', 'Osteoporosis', 'Muscle cramps'],
    food_sources: ['Dairy products', 'Leafy greens', 'Fortified foods', 'Sardines'],
    upper_limit: 2500
  },
  magnesium_mg: {
    display_name: 'Magnesium',
    unit: 'mg',
    category: 'mineral',
    health_impact: ['Muscle function', 'Nerve function', 'Energy production', 'Sleep quality'],
    deficiency_symptoms: ['Muscle cramps', 'Fatigue', 'Insomnia', 'Anxiety'],
    food_sources: ['Nuts', 'Seeds', 'Whole grains', 'Leafy greens', 'Dark chocolate']
  },
  potassium_mg: {
    display_name: 'Potassium',
    unit: 'mg',
    category: 'mineral',
    health_impact: ['Blood pressure regulation', 'Muscle function', 'Fluid balance'],
    deficiency_symptoms: ['Muscle weakness', 'Fatigue', 'Irregular heartbeat'],
    food_sources: ['Bananas', 'Potatoes', 'Spinach', 'Beans', 'Avocado']
  },
  zinc_mg: {
    display_name: 'Zinc',
    unit: 'mg',
    category: 'mineral',
    health_impact: ['Immune function', 'Wound healing', 'Taste and smell'],
    deficiency_symptoms: ['Slow wound healing', 'Hair loss', 'Frequent infections'],
    food_sources: ['Meat', 'Shellfish', 'Legumes', 'Seeds', 'Nuts'],
    upper_limit: 40
  },
  
  // Essential fatty acids
  omega3_g: {
    display_name: 'Omega-3',
    unit: 'g',
    category: 'other',
    health_impact: ['Heart health', 'Brain function', 'Inflammation reduction'],
    deficiency_symptoms: ['Dry skin', 'Poor concentration', 'Joint pain'],
    food_sources: ['Fatty fish', 'Walnuts', 'Flax seeds', 'Chia seeds', 'Algae oil']
  }
};

/**
 * Calculate deficit severity based on percentage met
 */
export function classifySeverity(percentage_met: number): DeficitSeverity {
  if (percentage_met >= 80) return 'low';
  if (percentage_met >= 50) return 'medium';
  if (percentage_met >= 25) return 'high';
  return 'critical';
}

/**
 * Compute nutrient deficits from current intake vs targets
 */
export function computeDeficits(
  current: Partial<NutritionTargets>,
  targets: NutritionTargets
): NutrientDeficit[] {
  const deficits: NutrientDeficit[] = [];
  
  // Check all tracked nutrients
  const nutrientsToTrack = Object.keys(NUTRIENT_INFO);
  
  for (const nutrient_key of nutrientsToTrack) {
    const currentValue = (current as any)[nutrient_key] || 0;
    const targetValue = (targets as any)[nutrient_key];
    
    if (!targetValue) continue; // Skip if no target defined
    
    const deficit = targetValue - currentValue;
    
    if (deficit > 0) {
      const percentage_met = (currentValue / targetValue) * 100;
      const severity = classifySeverity(percentage_met);
      const info = NUTRIENT_INFO[nutrient_key];
      
      deficits.push({
        nutrient_key,
        display_name: info.display_name,
        unit: info.unit,
        current: Number(currentValue.toFixed(1)),
        target: Number(targetValue.toFixed(1)),
        deficit: Number(deficit.toFixed(1)),
        percentage_met: Number(percentage_met.toFixed(0)),
        severity,
        health_impact: info.health_impact,
        food_sources: info.food_sources
      });
    }
  }
  
  // Sort by severity (critical first) then by % deficit
  return deficits.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[b.severity] - severityOrder[a.severity];
    }
    return a.percentage_met - b.percentage_met;
  });
}

/**
 * Compute nutrient excesses (over upper limits)
 */
export function computeExcesses(
  current: Partial<NutritionTargets>
): NutrientExcess[] {
  const excesses: NutrientExcess[] = [];
  
  for (const [nutrient_key, info] of Object.entries(NUTRIENT_INFO)) {
    if (!info.upper_limit) continue;
    
    const currentValue = (current as any)[nutrient_key] || 0;
    const excess = currentValue - info.upper_limit;
    
    if (excess > 0) {
      const percentage_over = (excess / info.upper_limit) * 100;
      
      excesses.push({
        nutrient_key,
        display_name: info.display_name,
        unit: info.unit,
        current: Number(currentValue.toFixed(1)),
        target: info.upper_limit,
        excess: Number(excess.toFixed(1)),
        percentage_over: Number(percentage_over.toFixed(0)),
        health_risks: [`Exceeding upper limit by ${percentage_over.toFixed(0)}%`]
      });
    }
  }
  
  return excesses;
}

/**
 * Get top N deficits for quick summary
 */
export function getTopDeficits(
  current: Partial<NutritionTargets>,
  targets: NutritionTargets,
  count: number = 3
): NutrientDeficit[] {
  const allDeficits = computeDeficits(current, targets);
  return allDeficits.slice(0, count);
}

/**
 * Check if user has chronic deficits (same nutrient deficient for multiple days)
 */
export function identifyChronicDeficits(
  dailyDeficits: Array<{ date: string; deficits: NutrientDeficit[] }>,
  daysThreshold: number = 3
): string[] {
  const nutrientCounts: Record<string, number> = {};
  
  for (const day of dailyDeficits) {
    for (const deficit of day.deficits) {
      nutrientCounts[deficit.nutrient_key] = (nutrientCounts[deficit.nutrient_key] || 0) + 1;
    }
  }
  
  return Object.entries(nutrientCounts)
    .filter(([_, count]) => count >= daysThreshold)
    .map(([nutrient, _]) => nutrient);
}

/**
 * Generate summary message for deficits
 */
export function generateDeficitSummary(deficits: NutrientDeficit[]): string {
  if (deficits.length === 0) {
    return 'Great job! You\'re meeting all your nutrition targets today.';
  }
  
  const critical = deficits.filter(d => d.severity === 'critical').length;
  const high = deficits.filter(d => d.severity === 'high').length;
  
  if (critical > 0) {
    return `You have ${critical} critical nutrient gap${critical > 1 ? 's' : ''}. Priority: ${deficits[0].display_name}.`;
  }
  
  if (high > 0) {
    return `You're low on ${high} nutrient${high > 1 ? 's' : ''}. Top gap: ${deficits[0].display_name}.`;
  }
  
  return `Minor gaps in ${deficits.length} nutrient${deficits.length > 1 ? 's' : ''}. You're doing well!`;
}
