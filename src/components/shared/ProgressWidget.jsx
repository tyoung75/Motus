import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Flame, Utensils } from 'lucide-react';

export function ProgressWidget({ profile, program, meals, workouts, todaysMeals, todaysWorkouts }) {
  // Calculate workout adherence (last 7 days)
  const getWorkoutAdherence = () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentWorkouts = workouts?.filter(w => {
      const date = new Date(w.loggedAt || w.completedAt);
      return date >= weekAgo && date <= today;
    }) || [];

    const targetDays = program?.daysPerWeek || profile?.desiredTrainingDays || 4;
    const adherence = (recentWorkouts.length / targetDays) * 100;
    return { count: recentWorkouts.length, target: targetDays, percentage: Math.min(adherence, 100) };
  };

  // Calculate calorie adherence (today)
  const getCalorieStatus = () => {
    const targetCalories = profile?.macros?.calories || profile?.tdee || 2000;
    const consumed = todaysMeals?.reduce((sum, meal) => sum + (meal.calories || 0), 0) || 0;
    const difference = consumed - targetCalories;
    const percentOfTarget = (consumed / targetCalories) * 100;

    return { consumed, target: targetCalories, difference, percentOfTarget };
  };

  // Calculate weekly trend
  const getWeeklyTrend = () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeekWorkouts = workouts?.filter(w => {
      const date = new Date(w.loggedAt || w.completedAt);
      return date >= weekAgo;
    }).length || 0;

    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    const lastWeekWorkouts = workouts?.filter(w => {
      const date = new Date(w.loggedAt || w.completedAt);
      return date >= twoWeeksAgo && date < weekAgo;
    }).length || 0;

    if (thisWeekWorkouts > lastWeekWorkouts) return 'improving';
    if (thisWeekWorkouts < lastWeekWorkouts) return 'declining';
    return 'stable';
  };

  // Calculate how many workouts should be done by now this week
  const getExpectedWorkoutsByNow = () => {
    const targetDays = program?.daysPerWeek || profile?.desiredTrainingDays || 4;
    const today = new Date();
    const dayOfWeek = today.getDay() || 7; // 1=Mon, 7=Sun

    // Estimate how many workouts should be done by this day
    // Assuming workouts are spread evenly across the week
    const workoutsPerDay = targetDays / 7;
    return Math.floor(workoutsPerDay * dayOfWeek);
  };

  // Generate dynamic encouragement message
  const getEncouragementMessage = () => {
    const workoutStatus = getWorkoutAdherence();
    const calorieStatus = getCalorieStatus();
    const trend = getWeeklyTrend();
    const expectedByNow = getExpectedWorkoutsByNow();
    const workoutsBehind = expectedByNow - workoutStatus.count;

    // Only show warning if at least 2 workouts behind schedule
    if (workoutsBehind >= 2) {
      return {
        type: 'warning',
        icon: AlertTriangle,
        message: "You've missed some workouts this week. Let's get back on track! Your program will adjust to keep your goals realistic.",
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30'
      };
    }

    // Check for overeating
    if (calorieStatus.percentOfTarget > 120 && profile?.nutritionGoal === 'lose') {
      return {
        type: 'caution',
        icon: Utensils,
        message: "You're over your calorie target today. That's okay - one day won't derail you. Let's focus on getting back on track tomorrow!",
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30'
      };
    }

    // Great progress
    if (workoutStatus.percentage >= 100 && trend === 'improving') {
      return {
        type: 'success',
        icon: TrendingUp,
        message: "You're crushing it! At this pace, you might exceed your initial goal. Keep it up!",
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30'
      };
    }

    // On track
    if (workoutStatus.percentage >= 75) {
      return {
        type: 'success',
        icon: CheckCircle,
        message: "You're on track! Keep this consistency and you'll reach your goal on schedule.",
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30'
      };
    }

    // Needs attention
    if (workoutStatus.percentage >= 50) {
      return {
        type: 'info',
        icon: Target,
        message: "You're making progress! A few more workouts this week and you'll be fully on track.",
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30'
      };
    }

    // Default encouraging message
    return {
      type: 'neutral',
      icon: Flame,
      message: "Every workout counts! Your body adapts to consistency - let's build that habit together.",
      color: 'text-accent-primary',
      bgColor: 'bg-accent-primary/10',
      borderColor: 'border-accent-primary/30'
    };
  };

  const workoutStatus = getWorkoutAdherence();
  const calorieStatus = getCalorieStatus();
  const encouragement = getEncouragementMessage();
  const EncouragementIcon = encouragement.icon;

  // Calculate goal progress percentage
  const getGoalProgress = () => {
    if (profile?.programType === 'fatloss' && profile?.targetWeight) {
      const startWeight = parseFloat(profile.weight);
      const targetWeight = parseFloat(profile.targetWeight);
      const currentWeight = startWeight; // Would need weight tracking to update
      const totalToLose = startWeight - targetWeight;
      const lost = startWeight - currentWeight;
      return Math.min((lost / totalToLose) * 100, 100);
    }
    // For other goals, show program progress
    const totalWeeks = program?.mesocycleWeeks || 5;
    const currentWeek = program?.currentWeek || 1;
    return (currentWeek / totalWeeks) * 100;
  };

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dark-600">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-accent-primary" />
          Progress Tracker
        </h3>
      </div>

      {/* Encouragement Message */}
      <div className={`mx-4 mt-4 p-3 rounded-lg ${encouragement.bgColor} border ${encouragement.borderColor}`}>
        <div className="flex items-start gap-3">
          <EncouragementIcon className={`w-5 h-5 mt-0.5 ${encouragement.color}`} />
          <p className={`text-sm ${encouragement.color}`}>{encouragement.message}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 space-y-4">
        {/* Workout Adherence */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Workouts This Week</span>
            <span className="text-white font-medium">
              {workoutStatus.count}/{workoutStatus.target}
            </span>
          </div>
          <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                workoutStatus.percentage >= 75 ? 'bg-green-500' :
                workoutStatus.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${workoutStatus.percentage}%` }}
            />
          </div>
        </div>

        {/* Calorie Tracking */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Today's Calories</span>
            <span className={`font-medium ${
              Math.abs(calorieStatus.difference) <= 100 ? 'text-green-400' :
              calorieStatus.difference > 0 ? 'text-orange-400' : 'text-blue-400'
            }`}>
              {calorieStatus.consumed.toLocaleString()} / {calorieStatus.target.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                calorieStatus.percentOfTarget <= 105 ? 'bg-green-500' :
                calorieStatus.percentOfTarget <= 120 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(calorieStatus.percentOfTarget, 100)}%` }}
            />
          </div>
        </div>

        {/* Goal Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Goal Progress</span>
            <span className="text-white font-medium">
              {Math.round(getGoalProgress())}%
            </span>
          </div>
          <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-primary rounded-full transition-all duration-500"
              style={{ width: `${getGoalProgress()}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-dark-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{workouts?.length || 0}</p>
            <p className="text-xs text-gray-400">Total Workouts</p>
          </div>
          <div className="bg-dark-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{meals?.length || 0}</p>
            <p className="text-xs text-gray-400">Meals Logged</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressWidget;
