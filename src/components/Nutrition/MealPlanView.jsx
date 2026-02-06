import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Flame, Dumbbell, RefreshCw, ShoppingCart, ChefHat, ExternalLink, Sparkles, Leaf } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

// Brief health benefits for meal types
const MEAL_BENEFITS = {
  breakfast: 'Kickstarts metabolism, stabilizes blood sugar for sustained energy.',
  lunch: 'Refuels glycogen stores, provides sustained afternoon energy.',
  dinner: 'Supports overnight muscle repair and recovery.',
  snack: 'Maintains blood sugar, prevents overeating at meals.'
};

export default function MealPlanView({ mealPlan, recipes, profile, onBack, onRegenerateMeal, onOpenShoppingList }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [showSummary, setShowSummary] = useState(true);

  if (!mealPlan) {
    return (
      <div className="min-h-screen bg-dark-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Meal Plan Yet</h2>
          <p className="text-gray-400">Generate a meal plan from your preferences</p>
        </div>
      </div>
    );
  }

  const currentDayName = DAYS[selectedDay].toLowerCase();
  const dayData = mealPlan.week?.[currentDayName] || { meals: [], nutrients: {} };
  const dayMeals = dayData.meals || [];
  const dayNutrients = dayData.nutrients || {};

  const targetCalories = profile?.macros?.calories || 2000;
  const targetProtein = profile?.macros?.protein || 150;
  // Calculate carb and fat targets from remaining calories
  const proteinCals = targetProtein * 4;
  const remainingCals = targetCalories - proteinCals;
  const targetCarbs = Math.round((remainingCals * 0.55) / 4); // 55% of remaining to carbs
  const targetFat = Math.round((remainingCals * 0.45) / 9); // 45% of remaining to fat

  const getMealByType = (type) => dayMeals.find(m => m.type === type);

  const getRecipeDetails = (mealId) => recipes?.[mealId] || null;

  return (
    <div className="min-h-screen bg-dark-900 pb-40">
      {/* Header */}
      <div className="bg-dark-800 border-b border-dark-700 sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-dark-700 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Weekly Meal Plan</h1>
              <p className="text-sm text-gray-400">Tailored to your goals</p>
            </div>
            <button
              onClick={onOpenShoppingList}
              className="p-2 bg-accent-secondary/20 rounded-lg"
            >
              <ShoppingCart className="w-5 h-5 text-accent-secondary" />
            </button>
          </div>

          {/* Day Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDay(d => Math.max(0, d - 1))}
              disabled={selectedDay === 0}
              className="p-1 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>

            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-1 min-w-max">
                {DAYS.map((day, idx) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(idx)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedDay === idx
                        ? 'bg-accent-primary text-dark-900'
                        : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedDay(d => Math.min(6, d + 1))}
              disabled={selectedDay === 6}
              className="p-1 disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Daily Summary */}
        <div className="px-4 pb-4">
          <div className="bg-dark-700 rounded-xl p-3 grid grid-cols-4 gap-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-accent-primary">
                <Flame className="w-4 h-4" />
                <span className="font-bold">{dayNutrients.calories || '—'}</span>
              </div>
              <p className="text-xs text-gray-400">/ {targetCalories}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-accent-success">
                <Dumbbell className="w-4 h-4" />
                <span className="font-bold">{dayNutrients.protein || '—'}g</span>
              </div>
              <p className="text-xs text-gray-400">/ {targetProtein}g</p>
            </div>
            <div className="text-center">
              <div className="font-bold text-accent-warning">{dayNutrients.carbohydrates || '—'}g</div>
              <p className="text-xs text-gray-400">/ {targetCarbs}g</p>
            </div>
            <div className="text-center">
              <div className="font-bold text-accent-secondary">{dayNutrients.fat || '—'}g</div>
              <p className="text-xs text-gray-400">/ {targetFat}g</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section - Why these meals */}
      {showSummary && (
        <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-xl border border-dark-600">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-primary" />
              <h3 className="text-sm font-medium text-white">Why This Plan</h3>
            </div>
            <button onClick={() => setShowSummary(false)} className="text-xs text-gray-500">Hide</button>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="text-accent-success font-medium">{targetProtein}g protein</span> supports muscle recovery.
            <span className="text-accent-warning font-medium"> {targetCarbs}g carbs</span> fuel your training.
            <span className="text-accent-secondary font-medium"> {targetFat}g fat</span> for hormones & absorption.
            Meals timed for energy when you need it most.
          </p>
        </div>
      )}

      {/* Meals */}
      <div className="p-4 space-y-4">
        {MEAL_TYPES.map(type => {
          const meal = getMealByType(type);
          const recipe = meal ? getRecipeDetails(meal.id) : null;
          const isExpanded = expandedMeal === meal?.id;

          if (!meal) return null;

          return (
            <div key={type} className="bg-dark-800 rounded-xl overflow-hidden border border-dark-700">
              {/* Meal Card */}
              <button
                onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}
                className="w-full p-4 flex gap-4 text-left"
              >
                <div className="w-20 h-20 rounded-lg bg-dark-700 overflow-hidden flex-shrink-0">
                  {meal.image ? (
                    <img src={meal.image} alt={meal.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-accent-primary uppercase tracking-wide">
                      {type}
                    </span>
                    <Leaf className="w-3 h-3 text-green-500" />
                  </div>
                  <h3 className="text-white font-medium mt-1 truncate">{meal.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{MEAL_BENEFITS[type]}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {meal.readyInMinutes || '—'} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      {meal.calories} cal
                    </span>
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-3.5 h-3.5" />
                      {meal.protein}g
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-dark-700 p-4 space-y-4">
                  {recipe?.ingredients && (
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Ingredients</h4>
                      <ul className="space-y-1">
                        {recipe.ingredients.map((ing, idx) => (
                          <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                            <span className="text-accent-primary">•</span>
                            {ing.original || `${ing.amount} ${ing.unit} ${ing.name}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recipe?.instructions && (
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Instructions</h4>
                      <ol className="space-y-2">
                        {recipe.instructions.map((step, idx) => (
                          <li key={idx} className="text-sm text-gray-400 flex gap-3">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-dark-700 text-xs flex items-center justify-center text-white">
                              {idx + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRegenerateMeal?.(currentDayName, type);
                      }}
                      className="flex-1 py-2 px-3 bg-dark-700 text-gray-300 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-dark-600"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Swap Meal
                    </button>
                    {recipe?.sourceUrl && (
                      <a
                        href={recipe.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="py-2 px-3 bg-dark-700 text-gray-300 rounded-lg text-sm flex items-center gap-2 hover:bg-dark-600"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Full Recipe
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Action */}
      <div className="fixed bottom-20 left-0 right-0 p-4">
        <button
          onClick={onOpenShoppingList}
          className="w-full py-4 bg-accent-secondary text-dark-900 font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg"
        >
          <ShoppingCart className="w-5 h-5" />
          View Shopping List
        </button>
      </div>
    </div>
  );
}
