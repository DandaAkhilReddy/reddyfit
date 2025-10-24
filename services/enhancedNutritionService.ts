// services/enhancedNutritionService.ts - Complete nutrition analysis with vitamins & micronutrients
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export interface CompleteNutritionData {
  // Macronutrients
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  
  // Vitamins
  vitaminA?: number; // mcg
  vitaminC?: number; // mg
  vitaminD?: number; // mcg
  vitaminE?: number; // mg
  vitaminK?: number; // mcg
  vitaminB1?: number; // mg (Thiamine)
  vitaminB2?: number; // mg (Riboflavin)
  vitaminB3?: number; // mg (Niacin)
  vitaminB6?: number; // mg
  vitaminB12?: number; // mcg
  folate?: number; // mcg
  
  // Minerals
  calcium?: number; // mg
  iron?: number; // mg
  magnesium?: number; // mg
  phosphorus?: number; // mg
  potassium?: number; // mg
  sodium?: number; // mg
  zinc?: number; // mg
  
  // Other
  cholesterol?: number; // mg
  saturatedFat?: number; // g
  transFat?: number; // g
  omega3?: number; // g
  omega6?: number; // g
  water?: number; // ml
}

export interface MealAnalysis {
  foodItems: string[];
  nutrition: CompleteNutritionData;
  servingSize?: string;
  mealType?: string; // breakfast, lunch, dinner, snack
  confidence: number; // 0-100
}

// Analyze food image and get complete nutrition
export async function analyzeCompleteNutrition(
  imageBase64: string,
  mimeType: string
): Promise<MealAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze this food image and provide COMPLETE nutritional information including vitamins and minerals.

Return a JSON response with this exact structure:
{
  "foodItems": ["item1", "item2"],
  "servingSize": "estimated portion size",
  "mealType": "breakfast/lunch/dinner/snack",
  "confidence": 85,
  "nutrition": {
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0,
    "fiber": 0,
    "sugar": 0,
    "vitaminA": 0,
    "vitaminC": 0,
    "vitaminD": 0,
    "vitaminE": 0,
    "vitaminK": 0,
    "vitaminB1": 0,
    "vitaminB2": 0,
    "vitaminB3": 0,
    "vitaminB6": 0,
    "vitaminB12": 0,
    "folate": 0,
    "calcium": 0,
    "iron": 0,
    "magnesium": 0,
    "phosphorus": 0,
    "potassium": 0,
    "sodium": 0,
    "zinc": 0,
    "cholesterol": 0,
    "saturatedFat": 0,
    "transFat": 0,
    "omega3": 0,
    "omega6": 0,
    "water": 0
  }
}

Provide realistic nutritional values based on visible portion sizes. Use standard serving sizes if unclear.
Return ONLY valid JSON, no markdown or explanations.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
          mimeType
        }
      }
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return analysis;
  } catch (error) {
    console.error('Complete nutrition analysis error:', error);
    throw error;
  }
}

// Get daily recommended intake (DRI) for vitamins/minerals
export function getDailyRecommendedIntake(): CompleteNutritionData {
  return {
    // Macros (based on 2500 cal, active male)
    calories: 2500,
    protein: 150, // g
    carbs: 300, // g
    fat: 80, // g
    fiber: 30, // g
    sugar: 50, // g (max)
    
    // Vitamins
    vitaminA: 900, // mcg
    vitaminC: 90, // mg
    vitaminD: 20, // mcg
    vitaminE: 15, // mg
    vitaminK: 120, // mcg
    vitaminB1: 1.2, // mg
    vitaminB2: 1.3, // mg
    vitaminB3: 16, // mg
    vitaminB6: 1.7, // mg
    vitaminB12: 2.4, // mcg
    folate: 400, // mcg
    
    // Minerals
    calcium: 1000, // mg
    iron: 8, // mg
    magnesium: 400, // mg
    phosphorus: 700, // mg
    potassium: 3400, // mg
    sodium: 2300, // mg (max)
    zinc: 11, // mg
    
    // Other
    cholesterol: 300, // mg (max)
    saturatedFat: 20, // g (max)
    transFat: 0, // g (avoid)
    omega3: 1.6, // g
    omega6: 17, // g
    water: 3700 // ml
  };
}

// Calculate nutrition score (0-100)
export function calculateNutritionScore(consumed: CompleteNutritionData): number {
  const dri = getDailyRecommendedIntake();
  let score = 100;
  
  // Protein adequacy (±10%)
  const proteinRatio = consumed.protein / dri.protein!;
  if (proteinRatio < 0.8 || proteinRatio > 1.2) score -= 15;
  
  // Vitamin adequacy (check key vitamins)
  const vitaminScore = [
    consumed.vitaminC! / dri.vitaminC!,
    consumed.vitaminD! / dri.vitaminD!,
    consumed.vitaminB12! / dri.vitaminB12!
  ].filter(r => r >= 0.8 && r <= 1.5).length;
  score += (vitaminScore - 3) * 10;
  
  // Fiber adequacy
  if (consumed.fiber < dri.fiber! * 0.7) score -= 10;
  
  // Sugar penalty
  if (consumed.sugar > dri.sugar!) score -= 15;
  
  // Sodium penalty
  if (consumed.sodium! > dri.sodium!) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}
