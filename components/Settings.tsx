import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { useAuth } from '../hooks/useAuth';
import { useUserPreferences, FitnessLevel, Goal } from '../hooks/useUserPreferences';
import { 
  calculateNutritionTargets, 
  validateUserMetrics,
  calculateBMI,
  classifyBMI,
  ACTIVITY_LEVELS,
  type UserMetrics,
  type NutritionTargets
} from '../utils/nutritionCalculator';
import * as dbService from '../database/dbService';
import { useToast } from '../hooks/useToast';
import { LogoutIcon } from './shared/icons';
import { NutritionProfileForm } from './NutritionProfileForm';
import { NutritionTargetsDisplay } from './NutritionTargetsDisplay';

export const Settings: React.FC = () => {
    const { user, userProfile, signOutUser } = useAuth();
    const { 
        fitnessLevel, setFitnessLevel, 
        goal, setGoal,
        caloriesGoal, setCaloriesGoal,
        proteinGoal, setProteinGoal,
        carbsGoal, setCarbsGoal,
        fatGoal, setFatGoal
    } = useUserPreferences();
    const { showToast } = useToast();

    // Body metrics state
    const [age, setAge] = useState(25);
    const [sex, setSex] = useState<'male' | 'female' | 'other'>('male');
    const [weight, setWeight] = useState(70);
    const [height, setHeight] = useState(170);
    const [activityLevel, setActivityLevel] = useState<1.2 | 1.375 | 1.55 | 1.725 | 1.9>(1.55);
    const [nutritionGoal, setNutritionGoal] = useState<'maintain' | 'lose' | 'gain'>('maintain');
    const [calculatedTargets, setCalculatedTargets] = useState<NutritionTargets | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const handleClearData = async () => {
        if (window.confirm("Are you sure you want to delete all cached workout plans? This action cannot be undone.")) {
            try {
                await dbService.clearAllData();
                showToast("Application data has been cleared successfully.", "success");
            } catch (error) {
                console.error("Failed to clear app data:", error);
                showToast("Failed to clear application data. Please try again.", "error");
            }
        }
    };

    const handleCalculateTargets = () => {
        const metrics: UserMetrics = {
            age,
            sex,
            weight_kg: weight,
            height_cm: height,
            activity_level: activityLevel,
            goal: nutritionGoal
        };
        
        const errors = validateUserMetrics(metrics);
        if (errors.length > 0) {
            showToast(errors[0], 'error');
            return;
        }
        
        setIsCalculating(true);
        try {
            const targets = calculateNutritionTargets(metrics);
            setCalculatedTargets(targets);
            
            // Update preferences with calculated macros
            setCaloriesGoal(targets.calories);
            setProteinGoal(targets.protein_g);
            setCarbsGoal(targets.carbs_g);
            setFatGoal(targets.fat_g);
            
            showToast('Nutrition targets calculated!', 'success');
        } catch (error: any) {
            showToast('Failed to calculate targets: ' + error.message, 'error');
        } finally {
            setIsCalculating(false);
        }
    };
    
    const bmi = calculateBMI(weight, height);
    const bmiClass = classifyBMI(bmi);

    const fitnessLevels: FitnessLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
    const goals: Goal[] = ['Build Muscle', 'Lose Fat', 'Improve Endurance'];

    return (
        <section className="space-y-6">
             <header className="mb-4">
                <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
            </header>
            {user && (
                 <div className="bg-slate-800/50 p-4 rounded-lg shadow-lg border border-slate-700 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <img src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.email}`} alt={userProfile?.displayName || 'User'} className="w-12 h-12 rounded-full border-2 border-slate-600" />
                        <div>
                            <h3 className="text-lg font-semibold text-white truncate max-w-[150px]">{userProfile?.displayName}</h3>
                            <p className="text-xs text-slate-400 truncate max-w-[150px]">{user.email}</p>
                        </div>
                    </div>
                     <button onClick={signOutUser} title="Sign Out" className="flex-shrink-0 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors">
                        <LogoutIcon className="w-6 h-6"/>
                     </button>
                </div>
            )}
            
            <NutritionProfileForm
                age={age}
                setAge={setAge}
                sex={sex}
                setSex={setSex}
                weight={weight}
                setWeight={setWeight}
                height={height}
                setHeight={setHeight}
                activityLevel={activityLevel}
                setActivityLevel={setActivityLevel}
                goal={nutritionGoal}
                setGoal={setNutritionGoal}
                bmi={bmi}
                bmiClass={bmiClass}
                onCalculate={handleCalculateTargets}
                isCalculating={isCalculating}
            />
            
            {calculatedTargets && <NutritionTargetsDisplay targets={calculatedTargets} />}

            <div className="bg-slate-800/50 p-4 rounded-lg shadow-lg border border-slate-700 space-y-4">
                <h3 className="text-lg font-semibold text-amber-400">Workout Personalization</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label htmlFor="fitness-level" className="block mb-1.5 text-sm font-medium text-slate-300">Your Fitness Level</label>
                        <select
                            id="fitness-level"
                            value={fitnessLevel}
                            onChange={(e) => setFitnessLevel(e.target.value as FitnessLevel)}
                            className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5"
                        >
                            {fitnessLevels.map(level => <option key={level} value={level}>{level}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="goal" className="block mb-1.5 text-sm font-medium text-slate-300">Your Primary Goal</label>
                        <select
                            id="goal"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value as Goal)}
                            className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5"
                        >
                             {goals.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            
             <div className="bg-slate-800/50 p-4 rounded-lg shadow-lg border border-slate-700 space-y-4">
                <h3 className="text-lg font-semibold text-amber-400">Daily Nutrition Goals</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="calories" className="block mb-1 text-xs font-medium text-slate-300">Calories (kcal)</label>
                        <input id="calories" type="number" value={caloriesGoal} onChange={e => setCaloriesGoal(Number(e.target.value))} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2" />
                    </div>
                     <div>
                        <label htmlFor="protein" className="block mb-1 text-xs font-medium text-slate-300">Protein (g)</label>
                         <input id="protein" type="number" value={proteinGoal} onChange={e => setProteinGoal(Number(e.target.value))} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2" />
                    </div>
                     <div>
                        <label htmlFor="carbs" className="block mb-1 text-xs font-medium text-slate-300">Carbs (g)</label>
                         <input id="carbs" type="number" value={carbsGoal} onChange={e => setCarbsGoal(Number(e.target.value))} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2" />
                    </div>
                     <div>
                        <label htmlFor="fat" className="block mb-1 text-xs font-medium text-slate-300">Fat (g)</label>
                         <input id="fat" type="number" value={fatGoal} onChange={e => setFatGoal(Number(e.target.value))} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2" />
                    </div>
                </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg shadow-lg border border-slate-700 space-y-3">
                 <h3 className="text-lg font-semibold text-amber-400">Data Management</h3>
                 <p className="text-xs text-slate-400">
                    Your generated workout plans are stored locally for faster access.
                 </p>
                 <div>
                    <button
                        onClick={handleClearData}
                        className="w-full px-5 py-2 bg-red-700/90 text-white rounded-md hover:bg-red-800/90 transition-colors font-semibold text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-red-500"
                    >
                        Clear Cached App Data
                    </button>
                 </div>
            </div>
        </section>
    );
};