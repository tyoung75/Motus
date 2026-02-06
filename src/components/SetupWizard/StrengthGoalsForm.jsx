import React from 'react';

// Simple, standalone component for strength goal inputs
// No hooks, no complex logic - just renders the form

const DEFAULT_EXERCISES = [
  { id: 'squat', label: 'Back Squat' },
  { id: 'bench', label: 'Bench Press' },
  { id: 'deadlift', label: 'Deadlift' },
  { id: 'ohp', label: 'Overhead Press' },
  { id: 'row', label: 'Barbell Row' },
];

function getTodayString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function StrengthGoalsForm({
  strengthGoals,
  strengthGoalDate,
  onUpdateGoal,
  onUpdateDate
}) {
  // Use provided goals or create defaults
  const goals = strengthGoals && strengthGoals.length > 0
    ? strengthGoals
    : DEFAULT_EXERCISES.map(ex => ({
        id: ex.id,
        label: ex.label,
        current: '',
        target: '',
      }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">🏋️ Strength Goals</h3>
      <p className="text-sm text-gray-400">
        Enter your current and target weights for main lifts (in lbs)
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Goal Date
        </label>
        <input
          type="date"
          value={strengthGoalDate || ''}
          min={getTodayString()}
          onChange={(e) => onUpdateDate(e.target.value)}
          className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white"
        />
        <p className="text-xs text-gray-500 mt-1">
          When do you want to hit these numbers? (Minimum 8-12 weeks recommended)
        </p>
      </div>

      {goals.map((exercise) => (
        <div key={exercise.id} className="p-3 bg-dark-700 rounded-lg">
          <span className="text-white font-medium block mb-2">
            {exercise.label}
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                value={exercise.current || ''}
                onChange={(e) => onUpdateGoal(exercise.id, 'current', e.target.value)}
                placeholder="Current 1RM"
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white text-sm placeholder-gray-500"
              />
              <span className="text-xs text-gray-500">Current</span>
            </div>
            <div>
              <input
                type="number"
                value={exercise.target || ''}
                onChange={(e) => onUpdateGoal(exercise.id, 'target', e.target.value)}
                placeholder="Target 1RM"
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white text-sm placeholder-gray-500"
              />
              <span className="text-xs text-gray-500">Target</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StrengthGoalsForm;
