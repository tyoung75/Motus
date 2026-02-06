import React, { useState } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Flame, Target, Info, Zap, ChefHat, Calendar, ShoppingCart, Loader2 } from 'lucide-react';
import { Card, CardBody, Button, ProgressBar } from '../shared';
import { estimateDailyCalories } from '../../utils/calorieEstimation';
import MealPlanView from './MealPlanView';
import ShoppingListView from './ShoppingListView';

export function NutritionView({
  profile,
  meals,
  workouts,
  mealPlan,
  recipes,
  isGeneratingMealPlan,
  onLogMeal,
  onDeleteMeal,
  onCreateMealPlan,
  onBack
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [activeView, setActiveView] = useState('tracking'); // 'tracking', 'mealplan', 'shopping'
  const { macros, bmr, tdee } = profile || {};

  const weightLbs = profile.weightUnit === 'kg'
    ? profile.weight / 0.453592
    : parseFloat(profile.weight);

  // Filter meals for selected date
  const dateStr = selectedDate.toISOString().split('T')[0];
  const dayMeals = meals.filter(
    (meal) => meal.loggedAt?.startsWith(dateStr) || meal.createdAt?.startsWith(dateStr)
  );

  // Filter workouts for selected date
  const dayWorkouts = workouts.filter(
    (workout) => workout.loggedAt?.startsWith(dateStr) || workout.completedAt?.startsWith(dateStr)
  );

  // Calculate totals
  const totals = dayMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0),
      fiber: acc.fiber + (meal.fiber || 0),
      sugar: acc.sugar + (meal.sugar || 0),
      sodium: acc.sodium + (meal.sodium || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
  );

  // Calculate calories burned from workouts
  const workoutCalories = dayWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 200), 0);

  // Estimate daily burn
  const dailyBurn = estimateDailyCalories(bmr || 1800, profile.activityLevel, workoutCalories);

  // Smart recommendations based on goal
  const recommendations = calculateRecommendations(profile, dailyBurn.totalDailyBurn);

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const isToday =
    selectedDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

  // Show MealPlanView
  if (activeView === 'mealplan' && mealPlan) {
    return (
      <MealPlanView
        mealPlan={mealPlan}
        recipes={recipes}
        profile={profile}
        onBack={() => setActiveView('tracking')}
        onOpenShoppingList={() => setActiveView('shopping')}
      />
    );
  }

  // Show ShoppingListView
  if (activeView === 'shopping' && mealPlan) {
    return (
      <ShoppingListView
        mealPlan={mealPlan}
        recipes={recipes}
        onBack={() => setActiveView('mealplan')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      {/* Header */}
      <header className="px-6 py-5 bg-dark-800 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 -ml-2 hover:bg-dark-700 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Flame className="w-6 h-6 text-accent-warning" />
                Nutrition
              </h1>
            </div>
          </div>
          <Button size="sm" onClick={onLogMeal}>
            <Plus className="w-4 h-4 mr-1" />
            Log Meal
          </Button>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveView('tracking')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeView === 'tracking'
                ? 'bg-accent-primary text-dark-900'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            <Target className="w-4 h-4" />
            Tracking
          </button>
          <button
            onClick={() => mealPlan ? setActiveView('mealplan') : onCreateMealPlan?.()}
            disabled={isGeneratingMealPlan}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeView === 'mealplan'
                ? 'bg-accent-secondary text-dark-900'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            {isGeneratingMealPlan ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ChefHat className="w-4 h-4" />
                {mealPlan ? 'Meal Plan' : 'Create Plan'}
              </>
            )}
          </button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="text-center">
            <p className="text-white font-medium">
              {isToday
                ? 'Today'
                : selectedDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
            </p>
          </div>
          <button
            onClick={() => navigateDate(1)}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            disabled={isToday}
          >
            <ChevronRight className={`w-5 h-5 ${isToday ? 'text-gray-600' : 'text-gray-400'}`} />
          </button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Energy Balance Card */}
        <Card>
          <CardBody>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <Zap className="w-5 h-5 text-accent-danger mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{dailyBurn.totalDailyBurn}</p>
                <p className="text-xs text-gray-400">Burned</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Net</p>
                <p className={`text-2xl font-bold ${
                  totals.calories - dailyBurn.totalDailyBurn < 0
                    ? 'text-accent-success'
                    : 'text-accent-warning'
                }`}>
                  {totals.calories - dailyBurn.totalDailyBurn > 0 ? '+' : ''}
                  {totals.calories - dailyBurn.totalDailyBurn}
                </p>
              </div>
              <div className="text-center">
                <Target className="w-5 h-5 text-accent-success mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{totals.calories}</p>
                <p className="text-xs text-gray-400">Consumed</p>
              </div>
            </div>

            <div className="h-px bg-dark-600 my-4" />

            {/* Burn Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-dark-700 rounded">
                <p className="text-gray-400">BMR</p>
                <p className="text-white font-medium">{dailyBurn.bmr}</p>
              </div>
              <div className="p-2 bg-dark-700 rounded">
                <p className="text-gray-400">Activity</p>
                <p className="text-white font-medium">{dailyBurn.neat}</p>
              </div>
              <div className="p-2 bg-dark-700 rounded">
                <p className="text-gray-400">Workouts</p>
                <p className="text-white font-medium">{workoutCalories}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Smart Recommendations */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-accent-primary" />
                Recommended Intake
              </h2>
              <span className="text-xs text-gray-400 px-2 py-1 bg-dark-700 rounded">
                {profile.nutritionGoal === 'maintain' && 'Maintain'}
                {profile.nutritionGoal === 'recomp' && 'Recomp'}
                {profile.nutritionGoal === 'lose' && 'Weight Loss'}
                {profile.nutritionGoal === 'gain' && 'Weight Gain'}
              </span>
            </div>

            <div className="p-4 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-lg mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{recommendations.calories}</p>
                <p className="text-sm text-gray-400">Recommended daily calories</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-dark-700 rounded-lg text-center">
                <p className="text-lg font-bold text-accent-success">{recommendations.protein}g</p>
                <p className="text-xs text-gray-400">Protein</p>
                <p className="text-xs text-gray-500">{recommendations.proteinPerLb}g/lb</p>
              </div>
              <div className="p-3 bg-dark-700 rounded-lg text-center">
                <p className="text-lg font-bold text-accent-warning">{recommendations.carbs}g</p>
                <p className="text-xs text-gray-400">Carbs</p>
              </div>
              <div className="p-3 bg-dark-700 rounded-lg text-center">
                <p className="text-lg font-bold text-accent-secondary">{recommendations.fat}g</p>
                <p className="text-xs text-gray-400">Fat</p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              Based on your {profile.nutritionGoal} goal and estimated {dailyBurn.totalDailyBurn} daily calorie burn
            </p>
          </CardBody>
        </Card>

        {/* Macronutrient Progress */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Today's Macros</h2>
              <button
                onClick={() => setShowDetailedView(!showDetailedView)}
                className="text-sm text-accent-primary"
              >
                {showDetailedView ? 'Simple View' : 'Detailed View'}
              </button>
            </div>

            <div className="space-y-4">
              <MacroProgress
                label="Protein"
                current={totals.protein}
                target={recommendations.protein}
                color="success"
                calories={totals.protein * 4}
              />
              <MacroProgress
                label="Carbohydrates"
                current={totals.carbs}
                target={recommendations.carbs}
                color="warning"
                calories={totals.carbs * 4}
              />
              <MacroProgress
                label="Fat"
                current={totals.fat}
                target={recommendations.fat}
                color="secondary"
                calories={totals.fat * 9}
              />
            </div>

            {/* Detailed Micronutrients */}
            {showDetailedView && (
              <div className="mt-6 pt-4 border-t border-dark-600">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Additional Nutrients</h3>
                <div className="grid grid-cols-2 gap-3">
                  <MicroNutrient label="Fiber" value={totals.fiber} target={30} unit="g" />
                  <MicroNutrient label="Sugar" value={totals.sugar} target={50} unit="g" warn />
                  <MicroNutrient label="Sodium" value={totals.sodium} target={2300} unit="mg" warn />
                  <MicroNutrient
                    label="Water"
                    value={Math.round(weightLbs * 0.5)}
                    target={Math.round(weightLbs * 0.67)}
                    unit="oz"
                  />
                </div>
              </div>
            )}

            {/* Macro Ratio Visualization */}
            <div className="mt-4 pt-4 border-t border-dark-600">
              <p className="text-xs text-gray-400 mb-2">Calorie Distribution</p>
              <div className="flex h-3 rounded-full overflow-hidden bg-dark-600">
                <div
                  className="bg-accent-success"
                  style={{
                    width: `${totals.calories > 0 ? ((totals.protein * 4) / totals.calories) * 100 : 0}%`,
                  }}
                />
                <div
                  className="bg-accent-warning"
                  style={{
                    width: `${totals.calories > 0 ? ((totals.carbs * 4) / totals.calories) * 100 : 0}%`,
                  }}
                />
                <div
                  className="bg-accent-secondary"
                  style={{
                    width: `${totals.calories > 0 ? ((totals.fat * 9) / totals.calories) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>P: {totals.calories > 0 ? Math.round(((totals.protein * 4) / totals.calories) * 100) : 0}%</span>
                <span>C: {totals.calories > 0 ? Math.round(((totals.carbs * 4) / totals.calories) * 100) : 0}%</span>
                <span>F: {totals.calories > 0 ? Math.round(((totals.fat * 9) / totals.calories) * 100) : 0}%</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Meals List */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            Meals ({dayMeals.length})
          </h2>

          {dayMeals.length > 0 ? (
            <div className="space-y-3">
              {dayMeals.map((meal) => (
                <Card key={meal.id}>
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{meal.name || 'Meal'}</h3>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-sm">
                          <span className="text-white font-medium">{meal.calories} kcal</span>
                          <span className="text-accent-success">P: {meal.protein}g</span>
                          <span className="text-accent-warning">C: {meal.carbs}g</span>
                          <span className="text-accent-secondary">F: {meal.fat}g</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(meal.loggedAt || meal.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      {meal.screenshot && (
                        <img
                          src={meal.screenshot}
                          alt="Meal"
                          className="w-14 h-14 object-cover rounded-lg ml-3"
                        />
                      )}

                      <button
                        onClick={() => onDeleteMeal && onDeleteMeal(meal.id)}
                        className="p-2 text-gray-500 hover:text-accent-danger ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardBody className="text-center py-8">
                <span className="text-4xl mb-2 block">🍽️</span>
                <p className="text-gray-400">No meals logged yet</p>
                <Button variant="secondary" size="sm" className="mt-4" onClick={onLogMeal}>
                  <Plus className="w-4 h-4 mr-1" />
                  Log Your First Meal
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Calculate smart recommendations based on goal
function calculateRecommendations(profile, estimatedBurn) {
  const weightLbs = profile.weightUnit === 'kg'
    ? profile.weight / 0.453592
    : parseFloat(profile.weight);

  let calories, protein, proteinPerLb;

  switch (profile.nutritionGoal) {
    case 'maintain':
      calories = estimatedBurn;
      proteinPerLb = 0.8;
      protein = Math.round(weightLbs * proteinPerLb);
      break;
    case 'recomp':
      calories = estimatedBurn;
      proteinPerLb = 1.0;
      protein = Math.round(weightLbs * proteinPerLb);
      break;
    case 'lose':
      const deficit = (profile.weeklyWeightChange || 0.5) * 500;
      calories = Math.round(estimatedBurn - deficit);
      proteinPerLb = 1.0; // Higher protein when cutting
      protein = Math.round(weightLbs * proteinPerLb);
      break;
    case 'gain':
      const surplus = (profile.weeklyWeightChange || 0.5) * 500;
      calories = Math.round(estimatedBurn + surplus);
      proteinPerLb = 0.9;
      protein = Math.round(weightLbs * proteinPerLb);
      break;
    default:
      calories = estimatedBurn;
      proteinPerLb = 0.8;
      protein = Math.round(weightLbs * proteinPerLb);
  }

  // Calculate fat and carbs from remaining calories
  const proteinCals = protein * 4;
  const remainingCals = calories - proteinCals;
  const fat = Math.round((remainingCals * 0.3) / 9);
  const carbs = Math.round((remainingCals * 0.7) / 4);

  return {
    calories,
    protein,
    proteinPerLb,
    carbs,
    fat,
  };
}

function MacroProgress({ label, current, target, color, calories }) {
  const percentage = Math.min((current / target) * 100, 100);
  const isOver = current > target;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <div className="text-right">
          <span className={`font-medium ${isOver ? 'text-accent-danger' : 'text-white'}`}>
            {current}g
          </span>
          <span className="text-gray-500"> / {target}g</span>
          <span className="text-gray-600 text-xs ml-2">({calories} kcal)</span>
        </div>
      </div>
      <ProgressBar value={current} max={target} color={isOver ? 'danger' : color} size="sm" />
    </div>
  );
}

function MicroNutrient({ label, value, target, unit, warn = false }) {
  const percentage = (value / target) * 100;
  const isOver = value > target;

  return (
    <div className="p-2 bg-dark-700 rounded">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className={`font-medium ${
          warn && isOver ? 'text-accent-danger' : 'text-white'
        }`}>
          {value}{unit}
        </span>
      </div>
      <div className="mt-1 h-1 bg-dark-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            warn && isOver ? 'bg-accent-danger' : 'bg-accent-primary'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default NutritionView;
