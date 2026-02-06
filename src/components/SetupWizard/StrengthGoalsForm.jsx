import React, { useState } from 'react';
import { Calculator, Info } from 'lucide-react';

// Main strength lifts (Big 4)
const STRENGTH_LIFTS = [
  { id: 'squat', label: 'Back Squat', icon: '🏋️' },
  { id: 'bench', label: 'Bench Press', icon: '💪' },
  { id: 'deadlift', label: 'Deadlift', icon: '🔥' },
  { id: 'ohp', label: 'Overhead Press', icon: '⬆️' },
];

// Epley formula for 1RM estimation: weight × (1 + reps/30)
function calculate1RM(weight, reps) {
  if (!weight || !reps || reps < 1) return null;
  if (reps === 1) return weight; // Already a 1RM
  // Epley formula is most accurate for reps < 10
  return Math.round(weight * (1 + reps / 30));
}

// Calculate recommended program duration based on goals and experience
function calculateRecommendedDuration(currentTotal, goalTotal, experienceLevel) {
  const totalGain = goalTotal - currentTotal;
  if (totalGain <= 0) return { weeks: 8, reason: 'maintenance' };

  // Monthly gain rates based on research (lbs per month for total)
  const gainRates = {
    beginner: 30,      // ~10 lbs/month per lift on average
    intermediate: 15,  // ~5 lbs/month per lift
    advanced: 8,       // ~2-3 lbs/month per lift
    elite: 4,          // ~1 lb/month per lift
  };

  const monthlyRate = gainRates[experienceLevel] || gainRates.intermediate;
  const monthsNeeded = Math.ceil(totalGain / monthlyRate);
  const weeksNeeded = Math.max(8, monthsNeeded * 4); // Minimum 8 weeks

  return {
    weeks: weeksNeeded,
    monthlyRate,
    reason: 'calculated',
  };
}

function getTodayString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function addWeeksToDate(weeks) {
  const date = new Date();
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().split('T')[0];
}

export function StrengthGoalsForm({
  strengthGoals,
  strengthGoalDate,
  programStartDate,
  experienceLevel = 'intermediate',
  onUpdateGoal,
  onUpdateDate,
  onUpdateStartDate,
}) {
  // Track which lifts are using the calculator vs direct 1RM input
  const [useCalculator, setUseCalculator] = useState({});

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

  // Get recommended duration
  const recommendation = calculateRecommendedDuration(currentTotal, goalTotal, experienceLevel);

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

  return (
    <div className="space-y-6">
      <div>
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

      {/* Program Duration Recommendation */}
      {goalTotal > currentTotal && (
        <div className="p-4 bg-dark-700 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-white font-medium mb-1">Recommended Program Duration</h4>
              <p className="text-sm text-gray-400 mb-3">
                Based on your goals and training level ({experienceLevel}), research suggests
                you can realistically gain about <span className="text-white">{recommendation.monthlyRate} lbs/month</span> across
                your main lifts.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-accent-primary">{recommendation.weeks}</span>
                <span className="text-gray-400">weeks recommended</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                We'll set your goal date to {addWeeksToDate(recommendation.weeks)} by default.
                You can adjust below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Program Start Date
        </label>
        <input
          type="date"
          value={programStartDate || ''}
          min={getTodayString()}
          onChange={(e) => onUpdateStartDate(e.target.value)}
          className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white"
        />
        <p className="text-xs text-gray-500 mt-1">Leave blank to start today</p>
      </div>

      {/* Goal Date */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Goal Date
        </label>
        <input
          type="date"
          value={strengthGoalDate || (goalTotal > currentTotal ? addWeeksToDate(recommendation.weeks) : '')}
          min={programStartDate || getTodayString()}
          onChange={(e) => onUpdateDate(e.target.value)}
          className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white"
        />
        <p className="text-xs text-gray-500 mt-1">
          When do you want to hit these numbers?
        </p>
      </div>
    </div>
  );
}

export default StrengthGoalsForm;
