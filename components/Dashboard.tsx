import React, { useState, useCallback, useEffect } from 'react';
// Fix: Use firebase.User type from compat library
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { useToast } from '../hooks/useToast';
import { fileToBase64 } from '../utils/helpers';
import * as geminiService from '../services/geminiService';
import * as firestoreService from '../services/firestoreService';
import { calculateNutritionTargets, type NutritionTargets } from '../utils/nutritionCalculator';
import { computeDeficits, getTopDeficits } from '../utils/deficitCalculator';
import { Loader } from './shared/Loader';
import { ErrorMessage } from './shared/ErrorMessage';
import { UploadIcon } from './shared/icons';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { DeficitAlert } from './DeficitAlert';
import { FoodRecommendations } from './FoodRecommendations';

interface DashboardProps {
    user: firebase.User | null;
    userProfile: firestoreService.UserProfile | null;
}

const ContributorProgress: React.FC<{ userProfile: firestoreService.UserProfile | null }> = ({ userProfile }) => {
    if (!userProfile) return null;

    const { points } = userProfile;
    let level = "Novice Contributor";
    let nextLevelPoints = 5;
    let progress = (points / nextLevelPoints) * 100;

    if (points >= 20) {
        level = "AI Trainer";
        nextLevelPoints = Infinity; // Max level
        progress = 100;
    } else if (points >= 10) {
        level = "Equipment Expert";
        nextLevelPoints = 20;
        progress = ((points - 10) / (nextLevelPoints - 10)) * 100;
    } else if (points >= 5) {
        level = "Equipment Spotter";
        nextLevelPoints = 10;
        progress = ((points - 5) / (nextLevelPoints - 5)) * 100;
    }

    return (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900/50 p-4 rounded-lg shadow-lg border border-slate-700">
            <h2 className="text-lg font-bold text-center mb-4 text-amber-400">Contributor Progress</h2>
            <div className="text-center space-y-2 flex flex-col items-center justify-center">
                <p className="text-4xl font-bold text-white">{points}</p>
                <p className="text-xs text-slate-400 -mt-2">Points Earned</p>
                <div className="pt-1">
                    <p className="text-md font-semibold text-amber-300">{level}</p>
                    {nextLevelPoints !== Infinity ? (
                        <>
                            <div className="w-full max-w-xs mx-auto bg-slate-700 rounded-full h-2 my-2">
                                <div
                                    className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-slate-500">{nextLevelPoints - points} points to next level</p>
                        </>
                    ) : (
                        <p className="text-xs text-green-400">You've reached the highest level!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const CalorieTracker: React.FC<{ calories: number; goal: number }> = ({ calories, goal }) => {
    const progress = goal > 0 ? Math.min((calories / goal) * 100, 100) : 0;
    const strokeDasharray = 2 * Math.PI * 46; // smaller radius
    const strokeDashoffset = strokeDasharray - (strokeDasharray * progress) / 100;

    return (
        <div className="relative w-36 h-36">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                    className="text-slate-700"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="46"
                    cx="50"
                    cy="50"
                />
                <circle
                    className="text-amber-500"
                    strokeWidth="8"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="46"
                    cx="50"
                    cy="50"
                    transform="rotate(-90 50 50)"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-white">{Math.round(calories)}</span>
                <span className="text-xs text-slate-400">/ {goal} kcal</span>
            </div>
        </div>
    );
};

const MacroBar: React.FC<{ label: string; value: number; goal: number; color: string }> = ({ label, value, goal, color }) => {
    const progress = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
    return (
        <div>
            <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-semibold text-slate-300">{label}</span>
                <span className="text-slate-400">{Math.round(value)}g / {goal}g</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div
                    className={`${color} h-1.5 rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ user, userProfile }) => {
    const { showToast } = useToast();
    const { caloriesGoal, proteinGoal, carbsGoal, fatGoal } = useUserPreferences();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [mealLogs, setMealLogs] = useState<firestoreService.MealLog[]>([]);
    const [dailyTotals, setDailyTotals] = useState<Partial<NutritionTargets>>({ 
        calories: 0, 
        protein_g: 0, 
        carbs_g: 0, 
        fat_g: 0,
        fiber_g: 0,
        vitamin_d_mcg: 0,
        vitamin_c_mg: 0,
        calcium_mg: 0,
        iron_mg: 0,
        magnesium_mg: 0,
        potassium_mg: 0,
        zinc_mg: 0,
        omega3_g: 0
    });

    const fetchMealLogs = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setLoadingMessage('Loading your dashboard...');
        try {
            const logs = await firestoreService.getTodaysMealLogs(user.uid);
            setMealLogs(logs);
        } catch (e: any) {
            setError('Could not load your meal logs. Please try refreshing.');
            showToast(e.message, 'error');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [user, showToast]);

    useEffect(() => {
        fetchMealLogs();
    }, [fetchMealLogs]);

    useEffect(() => {
        const totals = mealLogs.reduce((acc, log) => {
            acc.calories! += log.nutrition.calories;
            acc.protein_g! += log.nutrition.macronutrients.protein;
            acc.carbs_g! += log.nutrition.macronutrients.carbohydrates;
            acc.fat_g! += log.nutrition.macronutrients.fat;
            acc.fiber_g! += log.nutrition.fiber_g || 0;
            acc.vitamin_d_mcg! += log.nutrition.vitamin_d_mcg || 0;
            acc.vitamin_c_mg! += log.nutrition.vitamin_c_mg || 0;
            acc.calcium_mg! += log.nutrition.calcium_mg || 0;
            acc.iron_mg! += log.nutrition.iron_mg || 0;
            acc.magnesium_mg! += log.nutrition.magnesium_mg || 0;
            acc.potassium_mg! += log.nutrition.potassium_mg || 0;
            acc.zinc_mg! += log.nutrition.zinc_mg || 0;
            acc.omega3_g! += log.nutrition.omega3_g || 0;
            return acc;
        }, {
            calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0,
            vitamin_d_mcg: 0, vitamin_c_mg: 0, calcium_mg: 0, iron_mg: 0,
            magnesium_mg: 0, potassium_mg: 0, zinc_mg: 0, omega3_g: 0
        } as Partial<NutritionTargets>);
        setDailyTotals(totals);
    }, [mealLogs]);

    // Calculate targets and deficits
    const userTargets: NutritionTargets = {
        bmr: 0,
        tdee: 0,
        calories: caloriesGoal,
        protein_g: proteinGoal,
        carbs_g: carbsGoal,
        fat_g: fatGoal,
        fiber_g: 30,
        vitamin_d_mcg: 15,
        vitamin_c_mg: 90,
        calcium_mg: 1000,
        iron_mg: 8,
        magnesium_mg: 420,
        potassium_mg: 3400,
        zinc_mg: 11,
        omega3_g: 1.6,
        vitamin_a_mcg: 900,
        vitamin_e_mg: 15,
        vitamin_k_mcg: 120,
        thiamin_mg: 1.2,
        riboflavin_mg: 1.3,
        niacin_mg: 16,
        vitamin_b6_mg: 1.3,
        folate_mcg: 400,
        vitamin_b12_mcg: 2.4,
        phosphorus_mg: 700,
        sodium_mg: 2300,
        copper_mg: 0.9,
        manganese_mg: 2.3,
        selenium_mcg: 55,
        omega6_g: 17,
        water_l: 3.7
    };

    const topDeficits = getTopDeficits(dailyTotals, userTargets, 3);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;
        if (!file.type.startsWith('image/')) {
            showToast("Please select a valid image file.", "error");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            setLoadingMessage('Analyzing your meal...');
            const base64Image = await fileToBase64(file);
            const foodItems = await geminiService.analyzeFoodImage(base64Image, file.type);
            
            if (foodItems.length === 0) {
                throw new Error("Could not identify any food in the image. Please try a clearer photo.");
            }
            
            setLoadingMessage('Calculating nutrition...');
            const nutrition = await geminiService.getNutritionalAnalysis(foodItems);
            
            setLoadingMessage('Saving your log...');
            // Save only data, no image storage
            await firestoreService.saveMealLog(user.uid, { foodItems, nutrition });

            showToast(`Meal logged! ${Math.round(nutrition.calories)} calories added.`, "success");
            await fetchMealLogs();

        } catch (e: any) {
            console.error('Meal logging error:', e);
            const errorMessage = e.message || 'An unknown error occurred while logging your meal.';
            setError(`Failed to log meal: ${errorMessage}`);
            showToast(`Error: ${errorMessage}`, "error");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
            event.target.value = '';
        }
    };
    
    return (
        <section className="space-y-6">
             <header className="mb-2">
                <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
                <p className="text-sm text-slate-400">Welcome back, {userProfile?.displayName || user?.email}!</p>
            </header>

            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-purple-500/30 hover:border-purple-500/50 transition-all">
                <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">✨ Today's Nutrition</h2>
                <div className="flex items-center justify-between gap-4">
                    <CalorieTracker calories={dailyTotals.calories || 0} goal={caloriesGoal} />
                    <div className="w-full flex-1 space-y-3">
                        <MacroBar label="Protein" value={dailyTotals.protein_g || 0} goal={proteinGoal} color="bg-red-500" />
                        <MacroBar label="Carbs" value={dailyTotals.carbs_g || 0} goal={carbsGoal} color="bg-blue-500" />
                        <MacroBar label="Fat" value={dailyTotals.fat_g || 0} goal={fatGoal} color="bg-yellow-500" />
                    </div>
                </div>
            </div>

            {/* Smart Nutrition Coach - Deficit Alert */}
            <DeficitAlert deficits={topDeficits} />

            {/* Food Recommendations */}
            {topDeficits.length > 0 && (
                <FoodRecommendations 
                    deficits={topDeficits}
                    userPreferences={{ diet_type: 'omnivore' }}
                />
            )}

            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-cyan-500/30 hover:border-cyan-500/50 transition-all">
                <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">🍽️ Log Your Meal</h2>
                {isLoading && !loadingMessage.includes('dashboard') ? (
                    <div className="flex flex-col items-center justify-center w-full h-40">
                        <Loader text={loadingMessage} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Photo Upload Options */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Camera Option */}
                            <label 
                                htmlFor="meal-camera" 
                                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-400/50 hover:border-purple-400 hover:from-purple-500/30 hover:to-blue-500/30 transition-all duration-300 group h-36 shadow-xl hover:shadow-purple-500/50"
                            >
                                <svg className="w-12 h-12 mb-2 text-purple-400 group-hover:text-purple-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-base font-bold text-white group-hover:text-purple-200 transition-colors">📸 Take Photo</span>
                                <span className="text-xs text-purple-300/80 mt-1">Use camera</span>
                                <input 
                                    id="meal-camera" 
                                    type="file" 
                                    accept="image/*" 
                                    capture="user"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    disabled={isLoading}
                                />
                            </label>
                            
                            {/* Gallery Option */}
                            <label 
                                htmlFor="meal-gallery" 
                                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400/50 hover:border-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-300 group h-36 shadow-xl hover:shadow-cyan-500/50"
                            >
                                <UploadIcon className="w-12 h-12 mb-2 text-cyan-400 group-hover:text-cyan-300 transition-colors"/>
                                <span className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors">🖼️ Choose Photo</span>
                                <span className="text-xs text-cyan-300/80 mt-1">From gallery</span>
                                <input 
                                    id="meal-gallery" 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    disabled={isLoading}
                                />
                            </label>
                        </div>
                        <p className="text-xs text-center text-slate-500">AI will analyze and log nutrition automatically</p>
                    </div>
                )}
            </div>
            
            <ContributorProgress userProfile={userProfile} />

            {error && <ErrorMessage error={error} onRetry={() => setError(null)} />}

            {/* Meal Logs */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-green-500/30 hover:border-green-500/50 transition-all">
                <h2 className="text-xl font-bold text-center mb-4 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">📋 Today's Meals</h2>
                {isLoading && loadingMessage.includes('dashboard') ? <Loader text="Loading meal logs..."/> :
                mealLogs.length > 0 ? (
                    <div className="space-y-4">
                        {mealLogs.map(log => (
                            <div key={log.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-sm text-amber-400">🍽️ Meal Log</h3>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {log.createdAt?.toDate?.()?.toLocaleTimeString() || 'Recent'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-white">{Math.round(log.nutrition.calories)}</p>
                                            <p className="text-xs text-slate-400">calories</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold text-xs text-slate-300 mb-1">Identified Foods:</h4>
                                        <p className="text-sm text-slate-400">{log.foodItems.join(', ')}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className="bg-red-500/20 p-2 rounded text-center border border-red-500/30">
                                            <p className="font-bold text-white">{Math.round(log.nutrition.macronutrients.protein)}g</p>
                                            <p className="text-slate-400">Protein</p>
                                        </div>
                                        <div className="bg-blue-500/20 p-2 rounded text-center border border-blue-500/30">
                                            <p className="font-bold text-white">{Math.round(log.nutrition.macronutrients.carbohydrates)}g</p>
                                            <p className="text-slate-400">Carbs</p>
                                        </div>
                                        <div className="bg-yellow-500/20 p-2 rounded text-center border border-yellow-500/30">
                                            <p className="font-bold text-white">{Math.round(log.nutrition.macronutrients.fat)}g</p>
                                            <p className="text-slate-400">Fat</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    !isLoading && <p className="text-center text-slate-400 py-6 text-sm">You haven't logged any meals today.</p>
                )}
            </div>
        </section>
    );
};