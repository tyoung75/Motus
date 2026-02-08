import React, { useState, useEffect } from 'react';
import { Calculator, Info, AlertTriangle } from 'lucide-react';

// Main strength lifts (Big 4)
const STRENGTH_LIFTS = [
  { id: 'squat', label: 'Back Squat', icon: '🏋️' },
  { id: 'bench', label: 'Bench Press', icon: '💪' },
  { id: 'deadlift', label: 'Deadlift', icon: '🔥' },
  { id: 'ohp', label: 'Overhead Press', icon: '⬆️' },
];

// Nutrition goal options
const NUTRITION_GOALS = [
  {
    id: 'recomp',
    label: 'Recomp',
    desc: 'Lose fat, build muscle (Recommended)',
    icon: '🔄',
    multiplier: 1.0,
    detail: 'Eat at maintenance with high protein. Gradual, sustainable progress.'
  },
  {
    id: 'gain',
    label: 'Gain Weight',
    desc: 'Calorie surplus for faster gains',
    icon: '📈',
    multiplier: 0.8, // 20% faster
    detail: 'Better recovery, faster strength gains. Best for building muscle.'
  },
  {
    id: 'maintain',
    label: 'Maintain',
    desc: 'Keep current weight',
    icon: '⚖️',
    multiplier: 1.0,
    detail: 'Stable energy levels, steady progress.'
  },
  {
    id: 'lose',
    label: 'Lose Weight',
    desc: 'Calorie deficit (slower progress)',
    icon: '📉',
    multiplier: 1.4, // 40% slower
    detail: 'Less recovery, reduced energy. Strength gains will be slower.'
  },
];

// Epley formula for 1RM estimation: weight × (1 + reps/30)
function calculate1RM(weight, reps) {
  if (!weight || !reps || reps < 1) return null;
  if (reps === 1) return weight; // Already a 1RM
  return Math.round(weight * (1 + reps / 30));
}

// Calculate recommended program duration based on goals, experience, and nutrition
function calculateRecommendedDuration(currentTotal, goalTotal, experienceLevel, nutritionGoal) {
  const totalGain = goalTotal - currentTotal;
  if (totalGain <= 0) return { weeks: 8, reason: 'maintenance', monthlyRate: 0 };

  // Base monthly gain rates based on research (lbs per month for total)
  const baseGainRates = {
    beginner: 30,      // ~10 lbs/month per lift on average
    intermediate: 15,  // ~5 lbs/month per lift
    advanced: 8,       // ~2-3 lbs/month per lift
    elite: 4,          // ~1 lb/month per lift
  };

  // Get nutrition multiplier
  const nutritionInfo = NUTRITION_GOALS.find(n => n.id === nutritionGoal) || NUTRITION_GOALS[0];
  const nutritionMultiplier = nutritionInfo.multiplier;

  const baseMonthlyRate = baseGainRates[experienceLevel] || baseGainRates.intermediate;
  // Nutrition affects the rate - gaining weight = faster, losing = slower
  const adjustedMonthlyRate = Math.round(baseMonthlyRate / nutritionMultiplier);

  const monthsNeeded = Math.ceil(totalGain / adjustedMonthlyRate);
  const weeksNeeded = Math.max(8, monthsNeeded * 4); // Minimum 8 weeks

  return {
    weeks: weeksNeeded,
    monthlyRate: adjustedMonthlyRate,
    reason: 'calculated',
    nutritionImpact: nutritionMultiplier !== 1.0
      ? (nutritionMultiplier < 1 ? 'faster' : 'slower')
      : 'normal',
  };
}

function getTodayString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function addWeeksToDate(startDate, weeks) {
  const date = startDate ? new Date(startDate) : new Date();
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().split('T')[0];
}

function getWeeksDifference(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2 - d1;
  return Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
}

export function StrengthGoalsForm({
  strengthGoals,
  strengthGoalDate,
  programStartDate,
  nutritionGoal,
  experienceLevel = 'intermediate',
  bodyFatPercent,
  onUpdateGoal,
  onUpdateDate,
  onUpdateStartDate,
  onUpdateNutrition,
}) {
  // Track which lifts are using the calculator vs direct 1RM input
  const [useCalculator, setUseCalculator] = useState({});
  const [showDateWarning, setShowDateWarning] = useState(false);

  // Initialize goals if not present
  const goals = strengthGoals && strengthGoals.length > 0
    ? strengthGoals
    : STRENGTH_LIFTS.map(lift => ({
        id: lift.id,
        label: lift.label,
        current1RM: '',
        target1RM: '',
        workingWeight: '',
        workingReps: '',
      }));

  // Calculate current and goal totals
  const currentTotal = goals.reduce((sum, g) => {
    const current = parseFloat(g.current1RM) || 0;
    return sum + current;
  }, 0);

  const goalTotal = goals.reduce((sum, g) => {
    const target = parseFloat(g.target1RM) || 0;
    return sum + target;
  }, 0);

  // Determine default nutrition goal based on body fat
  const defaultNutrition = () => {
    const bf = parseFloat(bodyFatPercent) || 15;
    // If <= 10% body fat, recommend gaining weight
    if (bf <= 10) return 'gain';
    // Otherwise default to recomp
    return 'recomp';
  };

  // Use provided nutrition goal or calculate default
  const effectiveNutrition = nutritionGoal || defaultNutrition();

  // Get recommended duration
  const recommendation = calculateRecommendedDuration(
    currentTotal,
    goalTotal,
    experienceLevel,
    effectiveNutrition
  );

  // Calculate the recommended goal date based on start date
  const startDate = programStartDate || getTodayString();
  const recommendedGoalDate = addWeeksToDate(startDate, recommendation.weeks);

  // Minimum allowed date (1 week before recommended)
  const minAllowedDate = addWeeksToDate(startDate, Math.max(1, recommendation.weeks - 1));

  // Auto-update goal date when start date or recommendation changes
  useEffect(() => {
    if (goalTotal > currentTotal && recommendation.weeks > 0) {
      const newRecommendedDate = addWeeksToDate(startDate, recommendation.weeks);
      // Only auto-update if no date set or if current date is before the new recommended
      if (!strengthGoalDate || strengthGoalDate < newRecommendedDate) {
        onUpdateDate(newRecommendedDate);
        setShowDateWarning(false);
      }
    }
  }, [startDate, recommendation.weeks, currentTotal, goalTotal]);

  // Handle goal date change with validation
  const handleGoalDateChange = (newDate) => {
    const recommendedWeeks = recommendation.weeks;
    const selectedWeeks = getWeeksDifference(startDate, newDate);

    // Check if trying to set earlier than allowed (more than 1 week sooner)
    if (selectedWeeks < recommendedWeeks - 1) {
      setShowDateWarning(true);
      // Still allow it but show warning
    } else {
      setShowDateWarning(false);
    }

    onUpdateDate(newDate);
  };

  // Handle calculator input change
  const handleCalculatorChange = (liftId, field, value) => {
    const goal = goals.find(g => g.id === liftId);
    if (!goal) return;

    const updatedGoal = { ...goal, [field]: value };

    // If both weight and reps are entered, calculate 1RM
    if (updatedGoal.workingWeight && updatedGoal.workingReps) {
      const estimated1RM = calculate1RM(
        parseFloat(updatedGoal.workingWeight),
        parseInt(updatedGoal.workingReps)
      );
      if (estimated1RM) {
        updatedGoal.current1RM = estimated1RM.toString();
      }
    }

    onUpdateGoal(liftId, field, value);
    if (updatedGoal.current1RM !== goal.current1RM) {
      onUpdateGoal(liftId, 'current1RM', updatedGoal.current1RM);
    }
  };

  // Get nutrition goal info
  const getNutritionInfo = () => {
    return NUTRITION_GOALS.find(n => n.id === effectiveNutrition) || NUTRITION_GOALS[0];
  };

  return (
    <div className="space-y-6">
      {/* Nutrition Goal - FIRST */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">🍎 Nutrition Strategy</h3>
        <p className="text-sm text-gray-400 mb-4">
          Your nutrition affects how fast you can safely progress. This impacts your program timeline.
        </p>

        {parseFloat(bodyFatPercent) <= 10 && (
          <div className="mb-4 p-3 bg-amber-900/20 border border-amber-600/30 rounded-lg">
            <p className="text-sm text-amber-300">
              <strong>Note:</strong> At ≤10% body fat, we recommend a calorie surplus for optimal
              strength gains and recovery.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {NUTRITION_GOALS.map((goal) => (
            <button
              key={goal.id}
              onClick={() => onUpdateNutrition(goal.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                effectiveNutrition === goal.id
                  ? 'bg-accent-primary/20 border-accent-primary'
                  : 'bg-dark-700 border-dark-500 hover:border-dark-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{goal.icon}</span>
                <span className="text-white font-medium">{goal.label}</span>
              </div>
              <p className="text-xs text-gray-400">{goal.desc}</p>
            </button>
          ))}
        </div>

        {/* Nutrition impact info */}
        <div className="mt-3 p-3 bg-dark-700 rounded-lg">
          <p className="text-sm text-gray-300">{getNutritionInfo().detail}</p>
          {effectiveNutrition === 'lose' && (
            <p className="text-xs text-amber-400 mt-2">
              ⚠️ Strength gains are significantly slower in a deficit. Consider recomp instead.
            </p>
          )}
        </div>
      </div>

      {/* Lift Baselines */}
      <div className="pt-4 border-t border-dark-600">
        <h3 className="text-lg font-semibold text-white mb-2">🏋️ Current Strength Baselines</h3>
        <p className="text-sm text-gray-400">
          Enter your current 1 rep max (1RM) for each lift. If you don't know your 1RM,
          click the calculator to estimate from your working weight and reps.
        </p>
      </div>

      {/* Lift inputs */}
      {goals.map((goal) => {
        const liftInfo = STRENGTH_LIFTS.find(l => l.id === goal.id);
        const showCalc = useCalculator[goal.id];

        return (
          <div key={goal.id} className="p-4 bg-dark-700 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium flex items-center gap-2">
                <span>{liftInfo?.icon}</span>
                {goal.label}
              </span>
              <button
                type="button"
                onClick={() => setUseCalculator(prev => ({ ...prev, [goal.id]: !prev[goal.id] }))}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                  showCalc
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'bg-dark-600 text-gray-400 hover:text-white'
                }`}
              >
                <Calculator className="w-3 h-3" />
                {showCalc ? 'Hide Calculator' : "Don't know 1RM?"}
              </button>
            </div>

            {/* Calculator mode */}
            {showCalc && (
              <div className="p-3 bg-dark-600 rounded-lg space-y-2">
                <p className="text-xs text-gray-400">
                  Enter the most weight you can lift for multiple reps:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      value={goal.workingWeight || ''}
                      onChange={(e) => handleCalculatorChange(goal.id, 'workingWeight', e.target.value)}
                      placeholder="Weight (lbs)"
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-white text-sm placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={goal.workingReps || ''}
                      onChange={(e) => handleCalculatorChange(goal.id, 'workingReps', e.target.value)}
                      placeholder="Reps"
                      min="1"
                      max="15"
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-white text-sm placeholder-gray-500"
                    />
                  </div>
                </div>
                {goal.workingWeight && goal.workingReps && (
                  <p className="text-xs text-accent-primary">
                    Estimated 1RM: <span className="font-bold">{calculate1RM(parseFloat(goal.workingWeight), parseInt(goal.workingReps))} lbs</span>
                  </p>
                )}
              </div>
            )}

            {/* Current and Target 1RM */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Current 1RM</label>
                <div className="relative">
                  <input
                    type="number"
                    value={goal.current1RM || ''}
                    onChange={(e) => onUpdateGoal(goal.id, 'current1RM', e.target.value)}
                    placeholder="e.g., 225"
                    className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white text-sm placeholder-gray-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">lbs</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Goal 1RM</label>
                <div className="relative">
                  <input
                    type="number"
                    value={goal.target1RM || ''}
                    onChange={(e) => onUpdateGoal(goal.id, 'target1RM', e.target.value)}
                    placeholder="e.g., 275"
                    className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white text-sm placeholder-gray-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">lbs</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Totals Summary */}
      {currentTotal > 0 && goalTotal > 0 && (
        <div className="p-4 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 rounded-lg border border-accent-primary/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Current Total</span>
            <span className="text-white font-bold">{currentTotal} lbs</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Goal Total</span>
            <span className="text-accent-primary font-bold">{goalTotal} lbs</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <span className="text-gray-300">Total Gain Needed</span>
            <span className="text-accent-secondary font-bold">+{goalTotal - currentTotal} lbs</span>
          </div>
        </div>
      )}

      {/* Program Duration & Timeline */}
      {goalTotal > currentTotal && (
        <div className="p-4 bg-dark-700 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-white font-medium mb-1">Estimated Program Duration</h4>
              <p className="text-sm text-gray-400 mb-3">
                Based on your goals, experience ({experienceLevel}), and nutrition strategy ({effectiveNutrition}),
                you can realistically gain about <span className="text-white">{recommendation.monthlyRate} lbs/month</span> across
                your main lifts.
              </p>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-accent-primary">{recommendation.weeks}</span>
                <span className="text-gray-400">weeks estimated</span>
              </div>
              {recommendation.nutritionImpact !== 'normal' && (
                <p className="text-xs text-gray-500">
                  {recommendation.nutritionImpact === 'faster'
                    ? '⚡ Calorie surplus enables faster recovery and progress'
                    : '🐢 Calorie deficit slows recovery - timeline adjusted accordingly'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Program Start Date removed - shown once in main Goal Details section */}

      {/* Estimated Goal Accomplishment Date */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Estimated 1RM Goal Accomplishment Date
        </label>
        <input
          type="date"
          value={strengthGoalDate || recommendedGoalDate}
          min={minAllowedDate}
          onChange={(e) => handleGoalDateChange(e.target.value)}
          className={`w-full px-4 py-3 bg-dark-700 border rounded-lg text-white ${
            showDateWarning ? 'border-amber-500' : 'border-dark-600'
          }`}
        />
        <p className="text-xs text-gray-500 mt-1">
          Based on your start date and estimated {recommendation.weeks}-week program
        </p>

        {/* Warning for pushing date too early */}
        {showDateWarning && (
          <div className="mt-3 p-4 bg-amber-900/20 border border-amber-600/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-amber-300 font-medium mb-1">⚠️ Accelerated Timeline Warning</h4>
                <p className="text-sm text-gray-300 mb-2">
                  Pushing your goals faster than recommended significantly increases injury risk
                  and could set you back even further.
                </p>
                <p className="text-sm text-gray-400">
                  <strong>We don't recommend expediting the program.</strong> It's already optimized
                  for maximum safe progress. If you're progressing faster than expected, the program
                  will automatically adjust to your performance.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StrengthGoalsForm;
