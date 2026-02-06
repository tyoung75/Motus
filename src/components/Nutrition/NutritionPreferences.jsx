import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronRight, Utensils, AlertCircle, Check, Calendar } from 'lucide-react';
import { saveNutritionPreferences, loadNutritionPreferences } from '../../lib/database';

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
  { id: 'dairy-free', label: 'Dairy-Free', icon: '🥛' },
  { id: 'keto', label: 'Keto', icon: '🥑' },
  { id: 'paleo', label: 'Paleo', icon: '🍖' },
  { id: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
  { id: 'halal', label: 'Halal', icon: '☪️' },
  { id: 'kosher', label: 'Kosher', icon: '✡️' }
];

const CUISINE_OPTIONS = [
  { id: 'american', label: 'American', icon: '🍔' },
  { id: 'mexican', label: 'Mexican', icon: '🌮' },
  { id: 'italian', label: 'Italian', icon: '🍝' },
  { id: 'chinese', label: 'Chinese', icon: '🥡' },
  { id: 'japanese', label: 'Japanese', icon: '🍣' },
  { id: 'indian', label: 'Indian', icon: '🍛' },
  { id: 'mediterranean', label: 'Mediterranean', icon: '🫒' },
  { id: 'thai', label: 'Thai', icon: '🍜' },
  { id: 'korean', label: 'Korean', icon: '🥘' }
];

const COMMON_DISLIKES = [
  'Mushrooms', 'Olives', 'Onions', 'Cilantro', 'Seafood',
  'Spicy food', 'Tofu', 'Eggs', 'Nuts', 'Avocado'
];

const DAYS_OF_WEEK = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' }
];

const MEAL_LABELS = ['Breakfast', 'Lunch', 'Dinner', 'Snack 1', 'Snack 2'];

export default function NutritionPreferences({ isOpen, onClose, onSave, profile }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    dietaryRestrictions: [],
    cuisinePreferences: [],
    dislikedFoods: [],
    customDislikes: '',
    mealsPerDay: 3,
    snacksPerDay: 1,
    cookingTime: 'moderate', // quick, moderate, elaborate
    budgetLevel: 'moderate', // budget, moderate, premium
    prepPreference: 'mix', // meal-prep, daily, mix
    excludedMeals: {} // e.g., { 'sat-dinner': true, 'sun-lunch': true }
  });

  useEffect(() => {
    if (isOpen) {
      loadExistingPreferences();
    }
  }, [isOpen]);

  const loadExistingPreferences = async () => {
    const { data } = await loadNutritionPreferences();
    if (data) {
      setPreferences(prev => ({
        ...prev,
        ...data
      }));
    }
  };

  const toggleArrayItem = (field, item) => {
    setPreferences(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  // Toggle a specific meal exclusion (e.g., 'sat-dinner')
  const toggleMealExclusion = (dayId, mealIndex) => {
    const key = `${dayId}-${mealIndex}`;
    setPreferences(prev => ({
      ...prev,
      excludedMeals: {
        ...prev.excludedMeals,
        [key]: !prev.excludedMeals[key]
      }
    }));
  };

  // Calculate how many meals are excluded
  const excludedMealCount = useMemo(() => {
    return Object.values(preferences.excludedMeals).filter(Boolean).length;
  }, [preferences.excludedMeals]);

  // Calculate adjusted calories based on excluded meals
  const baseCalories = profile?.macros?.calories || 2000;
  const baseProtein = profile?.macros?.protein || 150;

  // Total meals per week = (mealsPerDay + snacksPerDay) * 7
  const totalMealsPerWeek = (preferences.mealsPerDay + preferences.snacksPerDay) * 7;
  const plannedMealsPerWeek = totalMealsPerWeek - excludedMealCount;

  // Average calories per meal (rough estimate)
  const avgCaloriesPerMeal = baseCalories / (preferences.mealsPerDay + preferences.snacksPerDay);
  const dailyExcludedCals = Math.round((excludedMealCount / 7) * avgCaloriesPerMeal);
  const adjustedDailyCalories = baseCalories - dailyExcludedCals;

  const handleSave = async () => {
    setLoading(true);
    try {
      // Combine custom dislikes with selected ones
      const allDislikes = [
        ...preferences.dislikedFoods,
        ...preferences.customDislikes.split(',').map(s => s.trim()).filter(Boolean)
      ];

      const finalPreferences = {
        ...preferences,
        dislikedFoods: allDislikes,
        adjustedCalories: adjustedDailyCalories,
        excludedMealCount,
        plannedMealsPerWeek
      };

      await saveNutritionPreferences(finalPreferences);
      onSave?.(finalPreferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  // Get meal labels based on mealsPerDay + snacksPerDay
  const getMealLabels = () => {
    const labels = [];
    for (let i = 0; i < preferences.mealsPerDay; i++) {
      if (i === 0) labels.push('B'); // Breakfast
      else if (i === preferences.mealsPerDay - 1) labels.push('D'); // Dinner
      else labels.push('L'); // Lunch
    }
    for (let i = 0; i < preferences.snacksPerDay; i++) {
      labels.push('S'); // Snack
    }
    return labels;
  };

  const mealLabels = getMealLabels();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-dark-800 rounded-2xl shadow-2xl border border-dark-600 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-secondary/20 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-accent-secondary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Meal Plan Preferences</h2>
              <p className="text-xs text-gray-400">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-700 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-dark-700">
          <div
            className="h-full bg-accent-secondary transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 1 && (
            <div className="space-y-5">
              {/* Daily Targets Summary - Shows adjusted calories */}
              <div className="bg-dark-700 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-400">Planned Daily Targets</h3>
                  {excludedMealCount > 0 && (
                    <span className="text-xs text-amber-400">{excludedMealCount} meals skipped/week</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent-primary">{adjustedDailyCalories}</div>
                    <div className="text-xs text-gray-400">
                      {excludedMealCount > 0 ? `avg cal/day (was ${baseCalories})` : 'Calories'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent-secondary">{baseProtein}g</div>
                    <div className="text-xs text-gray-400">Protein</div>
                  </div>
                </div>
              </div>

              {/* Dietary Restrictions */}
              <div>
                <h3 className="text-sm font-medium text-white mb-2">Dietary Restrictions</h3>
                <div className="grid grid-cols-3 gap-2">
                  {DIETARY_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      onClick={() => toggleArrayItem('dietaryRestrictions', option.id)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        preferences.dietaryRestrictions.includes(option.id)
                          ? 'bg-accent-secondary/20 border-accent-secondary text-white'
                          : 'bg-dark-700 border-dark-600 text-gray-400 hover:border-dark-500'
                      }`}
                    >
                      <span className="text-base block">{option.icon}</span>
                      <span className="text-xs">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Meals & Snacks per day */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Meals/Day</h3>
                  <div className="flex gap-1">
                    {[2, 3, 4].map(num => (
                      <button
                        key={num}
                        onClick={() => setPreferences(p => ({ ...p, mealsPerDay: num, excludedMeals: {} }))}
                        className={`flex-1 py-2 rounded-lg border text-sm transition-all ${
                          preferences.mealsPerDay === num
                            ? 'bg-accent-primary/20 border-accent-primary text-white'
                            : 'bg-dark-700 border-dark-600 text-gray-400'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Snacks/Day</h3>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(num => (
                      <button
                        key={num}
                        onClick={() => setPreferences(p => ({ ...p, snacksPerDay: num, excludedMeals: {} }))}
                        className={`flex-1 py-2 rounded-lg border text-sm transition-all ${
                          preferences.snacksPerDay === num
                            ? 'bg-accent-secondary/20 border-accent-secondary text-white'
                            : 'bg-dark-700 border-dark-600 text-gray-400'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Meal Exclusion Grid - Skip specific meals */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-medium text-white">Skip Meals (eating out, etc.)</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">Tap to skip - checked meals won't be planned</p>

                <div className="bg-dark-700 rounded-xl p-3 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left text-gray-500 font-medium pb-2 pr-2"></th>
                        {DAYS_OF_WEEK.map(day => (
                          <th key={day.id} className="text-center text-gray-400 font-medium pb-2 px-1">
                            {day.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mealLabels.map((label, mealIdx) => (
                        <tr key={mealIdx}>
                          <td className="text-gray-400 pr-2 py-1 whitespace-nowrap">
                            {label === 'B' ? '🍳' : label === 'L' ? '🥗' : label === 'D' ? '🍽️' : '🍎'}
                          </td>
                          {DAYS_OF_WEEK.map(day => {
                            const isExcluded = preferences.excludedMeals[`${day.id}-${mealIdx}`];
                            return (
                              <td key={day.id} className="text-center px-1 py-1">
                                <button
                                  onClick={() => toggleMealExclusion(day.id, mealIdx)}
                                  className={`w-6 h-6 rounded border transition-all ${
                                    isExcluded
                                      ? 'bg-amber-500/30 border-amber-500 text-amber-400'
                                      : 'bg-dark-600 border-dark-500 text-transparent hover:border-dark-400'
                                  }`}
                                >
                                  {isExcluded && <Check className="w-4 h-4 mx-auto" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Cuisine Preferences */}
              <div>
                <h3 className="text-sm font-medium text-white mb-3">Favorite Cuisines</h3>
                <div className="grid grid-cols-3 gap-2">
                  {CUISINE_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      onClick={() => toggleArrayItem('cuisinePreferences', option.id)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        preferences.cuisinePreferences.includes(option.id)
                          ? 'bg-accent-secondary/20 border-accent-secondary text-white'
                          : 'bg-dark-700 border-dark-600 text-gray-400 hover:border-dark-500'
                      }`}
                    >
                      <span className="text-lg block mb-1">{option.icon}</span>
                      <span className="text-xs">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Disliked Foods */}
              <div>
                <h3 className="text-sm font-medium text-white mb-3">Foods You Dislike</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COMMON_DISLIKES.map(food => (
                    <button
                      key={food}
                      onClick={() => toggleArrayItem('dislikedFoods', food)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        preferences.dislikedFoods.includes(food)
                          ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                          : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                      }`}
                    >
                      {food}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Other foods (comma separated)"
                  value={preferences.customDislikes}
                  onChange={(e) => setPreferences(p => ({ ...p, customDislikes: e.target.value }))}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 text-sm"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {/* Cooking Time */}
              <div>
                <h3 className="text-sm font-medium text-white mb-3">Cooking Time Preference</h3>
                <div className="space-y-2">
                  {[
                    { id: 'quick', label: 'Quick & Easy', desc: '15-20 min meals', icon: '⚡' },
                    { id: 'moderate', label: 'Moderate', desc: '30-45 min meals', icon: '👨‍🍳' },
                    { id: 'elaborate', label: 'Elaborate', desc: '60+ min, gourmet', icon: '🎯' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => setPreferences(p => ({ ...p, cookingTime: option.id }))}
                      className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-all ${
                        preferences.cookingTime === option.id
                          ? 'bg-accent-primary/20 border-accent-primary'
                          : 'bg-dark-700 border-dark-600 hover:border-dark-500'
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <div className="text-left">
                        <div className="text-white font-medium">{option.label}</div>
                        <div className="text-xs text-gray-400">{option.desc}</div>
                      </div>
                      {preferences.cookingTime === option.id && (
                        <Check className="w-5 h-5 text-accent-primary ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prep Preference */}
              <div>
                <h3 className="text-sm font-medium text-white mb-3">Meal Prep Style</h3>
                <div className="space-y-2">
                  {[
                    { id: 'meal-prep', label: 'Meal Prep', desc: 'Cook once, eat all week', icon: '📦' },
                    { id: 'daily', label: 'Cook Daily', desc: 'Fresh meals every day', icon: '🍳' },
                    { id: 'mix', label: 'Mix of Both', desc: 'Some prep, some fresh', icon: '🔄' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => setPreferences(p => ({ ...p, prepPreference: option.id }))}
                      className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-all ${
                        preferences.prepPreference === option.id
                          ? 'bg-accent-secondary/20 border-accent-secondary'
                          : 'bg-dark-700 border-dark-600 hover:border-dark-500'
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <div className="text-left">
                        <div className="text-white font-medium">{option.label}</div>
                        <div className="text-xs text-gray-400">{option.desc}</div>
                      </div>
                      {preferences.prepPreference === option.id && (
                        <Check className="w-5 h-5 text-accent-secondary ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-600 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 px-4 bg-dark-700 text-white rounded-lg hover:bg-dark-600"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 py-3 px-4 bg-accent-primary text-dark-900 font-semibold rounded-lg hover:bg-accent-primary/90 flex items-center justify-center gap-2"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-accent-secondary text-dark-900 font-semibold rounded-lg hover:bg-accent-secondary/90 flex items-center justify-center gap-2"
            >
              {loading ? 'Saving...' : 'Generate Meal Plan'}
              <Utensils className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
