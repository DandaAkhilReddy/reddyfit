import { describe, it, expect } from 'vitest';
import {
  FOOD_DATABASE,
  getFoodsRichInNutrient,
  getFoodsByDiet,
  calculateNutrientDensity,
  type FoodNutrientProfile
} from '../nutritionDatabase';

describe('nutritionDatabase', () => {
  describe('FOOD_DATABASE', () => {
    it('should have at least 8 foods', () => {
      expect(FOOD_DATABASE.length).toBeGreaterThanOrEqual(8);
    });

    it('should have all required nutrient fields', () => {
      const requiredFields = [
        'id', 'name', 'category', 'serving_size_g', 'diet_types',
        'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g',
        'vitamin_d_mcg', 'vitamin_c_mg', 'calcium_mg', 'iron_mg',
        'magnesium_mg', 'potassium_mg', 'zinc_mg', 'omega3_g',
        'allergens', 'cost_level', 'bioavailability', 'preparation_tips',
        'health_benefits', 'research_source'
      ];

      FOOD_DATABASE.forEach(food => {
        requiredFields.forEach(field => {
          expect(food).toHaveProperty(field);
        });
      });
    });

    it('should have valid bioavailability values (0-1)', () => {
      FOOD_DATABASE.forEach(food => {
        expect(food.bioavailability).toBeGreaterThanOrEqual(0);
        expect(food.bioavailability).toBeLessThanOrEqual(1);
      });
    });

    it('should have valid cost levels', () => {
      const validCostLevels = ['low', 'medium', 'high'];
      FOOD_DATABASE.forEach(food => {
        expect(validCostLevels).toContain(food.cost_level);
      });
    });

    it('should have at least one preparation tip per food', () => {
      FOOD_DATABASE.forEach(food => {
        expect(food.preparation_tips.length).toBeGreaterThan(0);
      });
    });

    it('should have research sources for all foods', () => {
      FOOD_DATABASE.forEach(food => {
        expect(food.research_source).toBeTruthy();
        expect(food.research_source.length).toBeGreaterThan(0);
      });
    });

    it('should have salmon with high omega-3', () => {
      const salmon = FOOD_DATABASE.find(f => f.id === 'salmon_wild');
      expect(salmon).toBeDefined();
      expect(salmon!.omega3_g).toBeGreaterThan(2);
      expect(salmon!.vitamin_d_mcg).toBeGreaterThan(10);
    });

    it('should have spinach with high iron', () => {
      const spinach = FOOD_DATABASE.find(f => f.id === 'spinach_cooked');
      expect(spinach).toBeDefined();
      expect(spinach!.iron_mg).toBeGreaterThan(3);
      expect(spinach!.folate_mcg).toBeGreaterThan(140);
    });

    it('should have chia seeds with exceptional omega-3', () => {
      const chia = FOOD_DATABASE.find(f => f.id === 'chia_seeds');
      expect(chia).toBeDefined();
      expect(chia!.omega3_g).toBeGreaterThan(15);
      expect(chia!.fiber_g).toBeGreaterThan(30);
    });
  });

  describe('getFoodsRichInNutrient', () => {
    it('should find foods rich in omega-3', () => {
      const omega3Foods = getFoodsRichInNutrient('omega3_g', 1.0);
      expect(omega3Foods.length).toBeGreaterThan(0);
      
      // Should be sorted by omega-3 content (descending)
      for (let i = 0; i < omega3Foods.length - 1; i++) {
        expect(omega3Foods[i].omega3_g).toBeGreaterThanOrEqual(omega3Foods[i + 1].omega3_g);
      }
    });

    it('should find foods rich in iron', () => {
      const ironFoods = getFoodsRichInNutrient('iron_mg', 2.0);
      expect(ironFoods.length).toBeGreaterThan(0);
      expect(ironFoods[0].iron_mg).toBeGreaterThanOrEqual(2.0);
    });

    it('should find foods rich in vitamin D', () => {
      const vitaminDFoods = getFoodsRichInNutrient('vitamin_d_mcg', 4.0);
      expect(vitaminDFoods.length).toBeGreaterThan(0);
      expect(vitaminDFoods[0].vitamin_d_mcg).toBeGreaterThanOrEqual(4.0);
    });

    it('should return empty array for impossible threshold', () => {
      const foods = getFoodsRichInNutrient('vitamin_d_mcg', 1000);
      expect(foods).toEqual([]);
    });

    it('should handle non-existent nutrient key gracefully', () => {
      const foods = getFoodsRichInNutrient('nonexistent_nutrient', 10);
      expect(Array.isArray(foods)).toBe(true);
    });
  });

  describe('getFoodsByDiet', () => {
    it('should return all foods for omnivore diet', () => {
      const omnivoreFoods = getFoodsByDiet('omnivore');
      expect(omnivoreFoods.length).toBe(FOOD_DATABASE.length);
    });

    it('should exclude fish for vegetarian diet', () => {
      const vegetarianFoods = getFoodsByDiet('vegetarian');
      const hasFish = vegetarianFoods.some(f => f.category === 'fish');
      expect(hasFish).toBe(false);
    });

    it('should only return plant-based foods for vegan diet', () => {
      const veganFoods = getFoodsByDiet('vegan');
      veganFoods.forEach(food => {
        expect(['fish', 'dairy']).not.toContain(food.category);
      });
    });

    it('should return foods for keto diet', () => {
      const ketoFoods = getFoodsByDiet('keto');
      expect(ketoFoods.length).toBeGreaterThan(0);
      // Keto foods should generally be low carb
      const averageCarbs = ketoFoods.reduce((sum, f) => sum + f.carbs_g, 0) / ketoFoods.length;
      expect(averageCarbs).toBeLessThan(30); // Rough keto guideline
    });

    it('should return foods for paleo diet', () => {
      const paleoFoods = getFoodsByDiet('paleo');
      expect(paleoFoods.length).toBeGreaterThan(0);
    });

    it('should have consistent diet tags', () => {
      FOOD_DATABASE.forEach(food => {
        food.diet_types.forEach(diet => {
          expect(['omnivore', 'vegetarian', 'vegan', 'keto', 'paleo']).toContain(diet);
        });
      });
    });
  });

  describe('calculateNutrientDensity', () => {
    it('should calculate density for salmon', () => {
      const salmon = FOOD_DATABASE.find(f => f.id === 'salmon_wild')!;
      const density = calculateNutrientDensity(salmon);
      
      expect(density).toBeGreaterThan(0);
      expect(typeof density).toBe('number');
      expect(Number.isFinite(density)).toBe(true);
    });

    it('should calculate density for spinach', () => {
      const spinach = FOOD_DATABASE.find(f => f.id === 'spinach_cooked')!;
      const density = calculateNutrientDensity(spinach);
      
      // Spinach should have very high nutrient density (low calories, high nutrients)
      expect(density).toBeGreaterThan(5);
    });

    it('should rank leafy greens higher than high-calorie foods', () => {
      const spinach = FOOD_DATABASE.find(f => f.id === 'spinach_cooked')!;
      const almonds = FOOD_DATABASE.find(f => f.id === 'almonds_raw')!;
      
      const spinachDensity = calculateNutrientDensity(spinach);
      const almondsDensity = calculateNutrientDensity(almonds);
      
      // Spinach (23 cal/100g) should be more nutrient-dense than almonds (579 cal/100g)
      expect(spinachDensity).toBeGreaterThan(almondsDensity);
    });

    it('should handle edge case of zero calories', () => {
      const mockFood: FoodNutrientProfile = {
        ...FOOD_DATABASE[0],
        calories: 0
      };
      
      const density = calculateNutrientDensity(mockFood);
      expect(Number.isFinite(density)).toBe(true);
    });

    it('should weight critical nutrients higher', () => {
      // Create two foods with same total nutrients but different distributions
      const highVitaminD: FoodNutrientProfile = {
        ...FOOD_DATABASE[0],
        calories: 100,
        vitamin_d_mcg: 10,
        iron_mg: 0,
        calcium_mg: 0
      };
      
      const highIron: FoodNutrientProfile = {
        ...FOOD_DATABASE[0],
        calories: 100,
        vitamin_d_mcg: 0,
        iron_mg: 2,
        calcium_mg: 0
      };
      
      const vitaminDDensity = calculateNutrientDensity(highVitaminD);
      const ironDensity = calculateNutrientDensity(highIron);
      
      // Vitamin D is weighted 10x, Iron is weighted 5x
      // So 10 mcg Vit D (×10) = 100 vs 2 mg Iron (×5) = 10
      expect(vitaminDDensity).toBeGreaterThan(ironDensity);
    });
  });

  describe('data integrity', () => {
    it('should have unique food IDs', () => {
      const ids = FOOD_DATABASE.map(f => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(FOOD_DATABASE.length);
    });

    it('should have positive serving sizes', () => {
      FOOD_DATABASE.forEach(food => {
        expect(food.serving_size_g).toBeGreaterThan(0);
      });
    });

    it('should have realistic calorie values', () => {
      FOOD_DATABASE.forEach(food => {
        expect(food.calories).toBeGreaterThanOrEqual(0);
        expect(food.calories).toBeLessThan(1000); // per 100g
      });
    });

    it('should have non-negative nutrient values', () => {
      const nutrientKeys = [
        'protein_g', 'carbs_g', 'fat_g', 'fiber_g',
        'vitamin_d_mcg', 'vitamin_c_mg', 'calcium_mg', 'iron_mg'
      ];
      
      FOOD_DATABASE.forEach(food => {
        nutrientKeys.forEach(key => {
          expect((food as any)[key]).toBeGreaterThanOrEqual(0);
        });
      });
    });

    it('should have valid USDA research sources', () => {
      FOOD_DATABASE.forEach(food => {
        expect(food.research_source).toMatch(/USDA|NIH|FoodData Central|#\d+/);
      });
    });
  });

  describe('performance', () => {
    it('should find foods by nutrient quickly', () => {
      const start = performance.now();
      getFoodsRichInNutrient('iron_mg', 2.0);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(10); // Should complete in < 10ms
    });

    it('should filter by diet quickly', () => {
      const start = performance.now();
      getFoodsByDiet('vegan');
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(5); // Should complete in < 5ms
    });
  });
});
