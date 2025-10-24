import React, { useState, useEffect } from 'react';
import { NutrientDeficit } from '../utils/deficitCalculator';
import { Loader } from './shared/Loader';

interface FoodRecommendation {
  food_name: string;
  quantity_g: number;
  reasoning: string;
  nutrient_contributions: {
    nutrient_key: string;
    display_name: string;
    amount: number;
    unit: string;
    percentage_of_deficit: number;
  }[];
  preparation_tips?: string;
}

interface FoodRecommendationsProps {
  deficits: NutrientDeficit[];
  userPreferences?: {
    diet_type?: 'omnivore' | 'vegetarian' | 'vegan';
    allergies?: string[];
  };
}

export const FoodRecommendations: React.FC<FoodRecommendationsProps> = ({ deficits, userPreferences }) => {
  const [recommendations, setRecommendations] = useState<FoodRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (deficits.length === 0) {
      setRecommendations([]);
      return;
    }

    // Generate smart recommendations
    generateRecommendations();
  }, [deficits]);

  const generateRecommendations = () => {
    setIsLoading(true);
    
    // Smart recommendation algorithm
    // In production, this could call a backend API or use more sophisticated matching
    const recs: FoodRecommendation[] = [];
    
    // Top 3 deficits to address
    const topDeficits = deficits.slice(0, 3);
    
    // Food database (simplified - in production this would be comprehensive)
    const foodDatabase: Record<string, any> = {
      'Salmon (wild-caught)': {
        nutrients: { vitamin_d_mcg: 13, omega3_g: 1.5, vitamin_b12_mcg: 3, protein: 25 },
        diet: ['omnivore'],
        tips: 'Grill or bake with lemon for best flavor'
      },
      'Spinach (cooked)': {
        nutrients: { iron_mg: 3.6, calcium_mg: 136, magnesium_mg: 79, folate_mcg: 146, vitamin_a_mcg: 469 },
        diet: ['omnivore', 'vegetarian', 'vegan'],
        tips: 'Sauté with garlic or add to smoothies'
      },
      'Almonds': {
        nutrients: { magnesium_mg: 76, calcium_mg: 75, vitamin_e_mg: 7.3, fiber_g: 3.5 },
        diet: ['omnivore', 'vegetarian', 'vegan'],
        tips: 'Great as a snack or in oatmeal'
      },
      'Greek Yogurt (plain)': {
        nutrients: { calcium_mg: 110, vitamin_b12_mcg: 0.75, protein: 10 },
        diet: ['omnivore', 'vegetarian'],
        tips: 'Top with berries and honey'
      },
      'Lentils (cooked)': {
        nutrients: { iron_mg: 3.3, folate_mcg: 181, magnesium_mg: 36, fiber_g: 7.9, potassium_mg: 369 },
        diet: ['omnivore', 'vegetarian', 'vegan'],
        tips: 'Add to soups or make dal'
      },
      'Sweet Potato': {
        nutrients: { vitamin_a_mcg: 961, potassium_mg: 337, vitamin_c_mg: 20, fiber_g: 3 },
        diet: ['omnivore', 'vegetarian', 'vegan'],
        tips: 'Roast with olive oil and spices'
      },
      'Sardines (canned)': {
        nutrients: { vitamin_d_mcg: 4.8, calcium_mg: 351, omega3_g: 1.5, vitamin_b12_mcg: 8.9 },
        diet: ['omnivore'],
        tips: 'Eat on whole grain crackers'
      },
      'Fortified Orange Juice': {
        nutrients: { vitamin_c_mg: 50, calcium_mg: 150, vitamin_d_mcg: 2.5 },
        diet: ['omnivore', 'vegetarian', 'vegan'],
        tips: 'Drink with breakfast for iron absorption'
      },
      'Quinoa (cooked)': {
        nutrients: { magnesium_mg: 64, iron_mg: 1.5, zinc_mg: 1.1, fiber_g: 2.8, protein: 4.4 },
        diet: ['omnivore', 'vegetarian', 'vegan'],
        tips: 'Use as rice alternative in any dish'
      }
    };

    // Match foods to deficits
    for (const [foodName, foodData] of Object.entries(foodDatabase)) {
      const contributions = [];
      let score = 0;

      for (const deficit of topDeficits) {
        const nutrientKey = deficit.nutrient_key;
        const foodNutrientAmount = (foodData.nutrients as any)[nutrientKey] || 0;

        if (foodNutrientAmount > 0) {
          const percentageOfDeficit = (foodNutrientAmount / deficit.deficit) * 100;
          score += percentageOfDeficit * (deficit.severity === 'critical' ? 3 : deficit.severity === 'high' ? 2 : 1);

          contributions.push({
            nutrient_key: nutrientKey,
            display_name: deficit.display_name,
            amount: foodNutrientAmount,
            unit: deficit.unit,
            percentage_of_deficit: Math.round(percentageOfDeficit)
          });
        }
      }

      if (contributions.length > 0 && score > 10) {
        // Filter by diet preference
        const dietType = userPreferences?.diet_type || 'omnivore';
        if (!(foodData.diet as string[]).includes(dietType)) continue;

        const topContribution = contributions.sort((a, b) => b.percentage_of_deficit - a.percentage_of_deficit)[0];
        
        recs.push({
          food_name: foodName,
          quantity_g: 100,
          reasoning: `High in ${topContribution.display_name} (${topContribution.percentage_of_deficit}% of your deficit)`,
          nutrient_contributions: contributions.sort((a, b) => b.percentage_of_deficit - a.percentage_of_deficit),
          preparation_tips: foodData.tips
        });
      }
    }

    // Sort by total contribution and take top 5
    setRecommendations(recs.slice(0, 5));
    setIsLoading(false);
  };

  if (deficits.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
        <Loader text="Generating personalized recommendations..." />
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-amber-400 mb-1">🎯 Smart Food Recommendations</h2>
        <p className="text-sm text-slate-400">
          Foods that help close your nutrient gaps (based on top deficits)
        </p>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, idx) => (
          <FoodRecommendationCard key={idx} recommendation={rec} rank={idx + 1} />
        ))}
      </div>

      {recommendations.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">
          No recommendations available. Log more meals to get personalized suggestions!
        </p>
      )}
    </div>
  );
};

const FoodRecommendationCard: React.FC<{ recommendation: FoodRecommendation; rank: number }> = ({ recommendation, rank }) => {
  const { food_name, quantity_g, reasoning, nutrient_contributions, preparation_tips } = recommendation;

  return (
    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-amber-500/50 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold text-sm">
            {rank}
          </span>
          <div>
            <h3 className="font-bold text-white text-base">{food_name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{quantity_g}g serving</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-amber-300 mb-3 pl-11">{reasoning}</p>

      {/* Nutrient contributions */}
      <div className="pl-11 space-y-2 mb-3">
        {nutrient_contributions.slice(0, 3).map((contrib) => (
          <div key={contrib.nutrient_key} className="flex items-center justify-between text-xs">
            <span className="text-slate-300">{contrib.display_name}</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">
                +{contrib.amount.toFixed(1)} {contrib.unit}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">
                {contrib.percentage_of_deficit}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Preparation tip */}
      {preparation_tips && (
        <div className="pl-11 text-xs text-slate-400 border-t border-slate-600 pt-2">
          <span className="font-medium">💡 Tip:</span> {preparation_tips}
        </div>
      )}
    </div>
  );
};
