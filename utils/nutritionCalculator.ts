/**
 * Nutrition Calculator - BMR, TDEE, Macros, and RDA calculations
 * Based on Mifflin-St Jeor equation and NIH guidelines
 */

export type Sex = 'male' | 'female' | 'other';
export type ActivityLevel = 1.2 | 1.375 | 1.55 | 1.725 | 1.9;
export type Goal = 'maintain' | 'lose' | 'gain';

export interface UserMetrics {
  age: number;
  sex: Sex;
  weight_kg: number;
  height_cm: number;
  activity_level: ActivityLevel;
  goal: Goal;
}

export interface NutritionTargets {
  // Energy
  bmr: number;
  tdee: number;
  calories: number;
  
  // Macros
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  
  // Micronutrients (RDA-based)
  vitamin_d_mcg: number;
  vitamin_c_mg: number;
  vitamin_a_mcg: number;
  vitamin_e_mg: number;
  vitamin_k_mcg: number;
  thiamin_mg: number;
  riboflavin_mg: number;
  niacin_mg: number;
  vitamin_b6_mg: number;
  folate_mcg: number;
  vitamin_b12_mcg: number;
  
  calcium_mg: number;
  iron_mg: number;
  magnesium_mg: number;
  phosphorus_mg: number;
  potassium_mg: number;
  sodium_mg: number;
  zinc_mg: number;
  copper_mg: number;
  manganese_mg: number;
  selenium_mcg: number;
  
  omega3_g: number;
  omega6_g: number;
  
  water_l: number;
}

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 */
export function calculateBMR(metrics: UserMetrics): number {
  const { age, sex, weight_kg, height_cm } = metrics;
  
  // BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + sex_offset
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  
  if (sex === 'male') {
    return base + 5;
  } else if (sex === 'female') {
    return base - 161;
  } else {
    // For 'other', use average
    return base - 78;
  }
}

/**
 * Calculate Total Daily Energy Expenditure
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * activityLevel);
}

/**
 * Adjust calories based on goal
 */
export function calculateTargetCalories(tdee: number, goal: Goal): number {
  switch (goal) {
    case 'lose':
      return Math.round(tdee * 0.8); // 20% deficit (safe 0.5-1kg/week loss)
    case 'gain':
      return Math.round(tdee * 1.15); // 15% surplus (clean bulk)
    case 'maintain':
    default:
      return tdee;
  }
}

/**
 * Calculate macro targets based on calories and goal
 */
export function calculateMacros(calories: number, weight_kg: number, goal: Goal) {
  let protein_g: number;
  let fat_g: number;
  let carbs_g: number;
  
  // Protein targets (g/kg body weight)
  switch (goal) {
    case 'lose':
      protein_g = weight_kg * 2.2; // Higher protein to preserve muscle
      break;
    case 'gain':
      protein_g = weight_kg * 2.0; // High protein for muscle growth
      break;
    case 'maintain':
    default:
      protein_g = weight_kg * 1.6; // Moderate protein
  }
  
  // Fat: 25-30% of calories
  const fat_calories = calories * 0.27;
  fat_g = fat_calories / 9; // 9 cal/g for fat
  
  // Carbs: remaining calories
  const protein_calories = protein_g * 4; // 4 cal/g for protein
  const remaining_calories = calories - protein_calories - fat_calories;
  carbs_g = remaining_calories / 4; // 4 cal/g for carbs
  
  // Fiber: 14g per 1000 calories (DRI)
  const fiber_g = (calories / 1000) * 14;
  
  return {
    protein_g: Math.round(protein_g),
    carbs_g: Math.round(carbs_g),
    fat_g: Math.round(fat_g),
    fiber_g: Math.round(fiber_g)
  };
}

/**
 * Get RDA values for micronutrients based on age and sex
 * Source: NIH Dietary Reference Intakes
 */
export function getMicronutrientRDA(age: number, sex: Sex): Omit<NutritionTargets, 'bmr' | 'tdee' | 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fiber_g'> {
  // Simplified RDA table for adults 19-50
  // In production, this should be a comprehensive lookup table
  
  const isMale = sex === 'male';
  
  return {
    // Vitamins
    vitamin_d_mcg: 15,
    vitamin_c_mg: isMale ? 90 : 75,
    vitamin_a_mcg: isMale ? 900 : 700,
    vitamin_e_mg: 15,
    vitamin_k_mcg: isMale ? 120 : 90,
    thiamin_mg: isMale ? 1.2 : 1.1,
    riboflavin_mg: isMale ? 1.3 : 1.1,
    niacin_mg: isMale ? 16 : 14,
    vitamin_b6_mg: age < 50 ? 1.3 : (isMale ? 1.7 : 1.5),
    folate_mcg: 400,
    vitamin_b12_mcg: 2.4,
    
    // Minerals
    calcium_mg: age < 50 ? 1000 : (isMale ? 1000 : 1200),
    iron_mg: isMale ? 8 : (age < 50 ? 18 : 8),
    magnesium_mg: isMale ? (age < 30 ? 400 : 420) : (age < 30 ? 310 : 320),
    phosphorus_mg: 700,
    potassium_mg: isMale ? 3400 : 2600,
    sodium_mg: 2300, // Upper limit (actually AI is 1500mg)
    zinc_mg: isMale ? 11 : 8,
    copper_mg: 0.9,
    manganese_mg: isMale ? 2.3 : 1.8,
    selenium_mcg: 55,
    
    // Essential fatty acids
    omega3_g: isMale ? 1.6 : 1.1,
    omega6_g: isMale ? 17 : 12,
    
    // Water
    water_l: isMale ? 3.7 : 2.7
  };
}

/**
 * Calculate complete nutrition targets for a user
 */
export function calculateNutritionTargets(metrics: UserMetrics): NutritionTargets {
  const bmr = calculateBMR(metrics);
  const tdee = calculateTDEE(bmr, metrics.activity_level);
  const calories = calculateTargetCalories(tdee, metrics.goal);
  const macros = calculateMacros(calories, metrics.weight_kg, metrics.goal);
  const micros = getMicronutrientRDA(metrics.age, metrics.sex);
  
  return {
    bmr: Math.round(bmr),
    tdee,
    calories,
    ...macros,
    ...micros
  };
}

/**
 * Validate user metrics
 */
export function validateUserMetrics(metrics: Partial<UserMetrics>): string[] {
  const errors: string[] = [];
  
  if (!metrics.age || metrics.age < 13 || metrics.age > 120) {
    errors.push('Age must be between 13 and 120');
  }
  
  if (!metrics.weight_kg || metrics.weight_kg < 30 || metrics.weight_kg > 300) {
    errors.push('Weight must be between 30 and 300 kg');
  }
  
  if (!metrics.height_cm || metrics.height_cm < 100 || metrics.height_cm > 250) {
    errors.push('Height must be between 100 and 250 cm');
  }
  
  if (!metrics.sex || !['male', 'female', 'other'].includes(metrics.sex)) {
    errors.push('Sex must be male, female, or other');
  }
  
  if (!metrics.activity_level || ![1.2, 1.375, 1.55, 1.725, 1.9].includes(metrics.activity_level)) {
    errors.push('Invalid activity level');
  }
  
  if (!metrics.goal || !['maintain', 'lose', 'gain'].includes(metrics.goal)) {
    errors.push('Goal must be maintain, lose, or gain');
  }
  
  return errors;
}

/**
 * Activity level descriptors
 */
export const ACTIVITY_LEVELS = {
  1.2: { label: 'Sedentary', description: 'Little or no exercise' },
  1.375: { label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
  1.55: { label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
  1.725: { label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
  1.9: { label: 'Extra Active', description: 'Very hard exercise & physical job' }
} as const;

/**
 * Calculate BMI for reference
 */
export function calculateBMI(weight_kg: number, height_cm: number): number {
  const height_m = height_cm / 100;
  return Number((weight_kg / (height_m * height_m)).toFixed(1));
}

/**
 * BMI classification
 */
export function classifyBMI(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}
