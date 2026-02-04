import React from 'react';
import { Target, Flame, Calendar, TrendingUp, Dumbbell, Utensils, Clock } from 'lucide-react';

export function ProgressWidget({ profile, program, meals, workouts, todaysMeals, todaysWorkouts }) {
  // Calculate days until goal
  const getDaysUntilGoal = () => {
    let targetDate = null;

    if (profile?.raceDate) {
      targetDate = new Date(profile.raceDate);
    } else if (profile?.aestheticGoalDate) {
      targetDate = new Date(profile.aestheticGoalDate);
    } else if (profile?.targetDate) {
      targetDate = new Date(profile.targetDate);
    }

    if (targetDate) {
      const today = new Date();
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : null;
    }
    return null;
  };

  // Get goal-specific encouragement message
  const getGoalMessage = () => {
    const daysUntil = getDaysUntilGoal();
    const programType = profile?.programType || program?.primaryGoal;
    const subtype = profile?.programSubtype || program?.primarySubtype;
    const currentPhase = program?.currentPhase || 'Base';
    const currentWeek = program?.currentWeek || 1;
    const totalWeeks = program?.mesocycleWeeks || 5;

    // Goal-specific messages
    if (programType === 'endurance') {
      if (subtype === 'marathon' || subtype === 'running') {
        const distance = profile?.raceDistance || 'race';
        if (daysUntil) {
          return `Your ${distance} is ${daysUntil} days away! Every run gets you closer to the finish line. 🏃`;
        }
        return `Building your aerobic base. Consistency beats intensity at this stage!`;
      }
      if (subtype === 'triathlon') {
        if (daysUntil) {
          return `${daysUntil} days until race day! Swim, bike, run - you've got this! 🏊‍♂️🚴🏃`;
        }
        return `Training all three disciplines builds an unstoppable athlete.`;
      }
      return `Endurance is built one workout at a time. Keep moving forward!`;
    }

    if (programType === 'strength') {
      const liftGoals = profile?.strengthGoals?.filter(g => g.target) || [];
      if (liftGoals.length > 0) {
        return `${liftGoals.length} lift targets set. Progressive overload is your path to strength! 🏋️`;
      }
      return `${currentPhase} phase - building the foundation for serious strength gains.`;
    }

    if (programType === 'aesthetic') {
      const targetBF = profile?.targetBodyFat;
      if (targetBF) {
        return `Working toward ${targetBF}% body fat. Trust the process - gains take time! 💪`;
      }
      return `Sculpting takes patience. Your dedication will pay off!`;
    }

    if (programType === 'fatloss') {
      const targetWeight = profile?.targetWeight;
      if (targetWeight) {
        return `On track to ${targetWeight} ${profile?.weightUnit || 'lbs'}. Small daily wins add up! ⚖️`;
      }
      return `Fat loss is a marathon, not a sprint. Stay consistent!`;
    }

    // Default message based on phase
    const phaseMessages = {
      'Base': `Building your foundation in the ${currentPhase} phase. This sets you up for success!`,
      'Build': `${currentPhase} phase - time to push your limits and grow stronger!`,
      'Peak': `${currentPhase} phase - you're at your strongest. Time to perform!`,
      'Deload': `Recovery week - your body adapts and grows during rest. Embrace it!`,
    };

    return phaseMessages[currentPhase] || `Week ${currentWeek} of ${totalWeeks} - keep showing up!`;
  };

  // Get today's summary
  const getTodaySummary = () => {
    const today = new Date().getDay() || 7;
    const todaySchedule = program?.weeklySchedule?.find(d => d.day === today);
    const isRestDay = todaySchedule?.isRestDay;
    const sessions = todaySchedule?.sessions || [];
    const completedToday = todaysWorkouts?.length || 0;

    return {
      isRestDay,
      totalSessions: sessions.length,
      completedSessions: completedToday,
      sessionNames: sessions.map(s => s.focus).join(' + '),
    };
  };

  // Calculate weekly progress
  const getWeeklyProgress = () => {
    const targetDays = program?.daysPerWeek || profile?.desiredTrainingDays || 4;
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

    const weekWorkouts = workouts?.filter(w => {
      const date = new Date(w.loggedAt || w.completedAt);
      return date >= startOfWeek && date <= today;
    }) || [];

    return {
      completed: weekWorkouts.length,
      target: targetDays,
      percentage: Math.min((weekWorkouts.length / targetDays) * 100, 100),
    };
  };

  // Calculate nutrition today
  const getNutritionSummary = () => {
    const targetCalories = profile?.macros?.calories || profile?.tdee || 2000;
    const consumed = todaysMeals?.reduce((sum, meal) => sum + (meal.calories || 0), 0) || 0;
    const remaining = targetCalories - consumed;
    const percentOfTarget = (consumed / targetCalories) * 100;

    return {
      consumed,
      target: targetCalories,
      remaining: Math.max(remaining, 0),
      percentOfTarget,
      mealsLogged: todaysMeals?.length || 0,
    };
  };

  // Calculate program progress
  const getProgramProgress = () => {
    const currentWeek = program?.currentWeek || 1;
    const totalWeeks = program?.mesocycleWeeks || 5;
    return {
      currentWeek,
      totalWeeks,
      percentage: (currentWeek / totalWeeks) * 100,
      phase: program?.currentPhase || 'Base',
    };
  };

  const daysUntil = getDaysUntilGoal();
  const todaySummary = getTodaySummary();
  const weeklyProgress = getWeeklyProgress();
  const nutrition = getNutritionSummary();
  const programProgress = getProgramProgress();

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dark-600">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-accent-primary" />
          Daily Summary
        </h3>
      </div>

      {/* Goal Countdown & Encouragement */}
      <div className="mx-4 mt-4 p-4 rounded-lg bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/30">
        {daysUntil && (
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-accent-primary" />
            <span className="text-2xl font-bold text-white">{daysUntil}</span>
            <span className="text-gray-300">days to go</span>
          </div>
        )}
        <p className="text-sm text-gray-200">{getGoalMessage()}</p>
      </div>

      {/* Today's Workout Status */}
      <div className="mx-4 mt-4 p-3 rounded-lg bg-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-accent-secondary" />
            <span className="text-white font-medium">Today</span>
          </div>
          {todaySummary.isRestDay ? (
            <span className="text-gray-400">🧘 Rest Day</span>
          ) : (
            <span className="text-gray-300">
              {todaySummary.completedSessions}/{todaySummary.totalSessions} sessions
            </span>
          )}
        </div>
        {!todaySummary.isRestDay && todaySummary.sessionNames && (
          <p className="text-sm text-gray-400 mt-1 ml-7">{todaySummary.sessionNames}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="p-4 space-y-4">
        {/* Weekly Workouts */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              This Week
            </span>
            <span className="text-white font-medium">
              {weeklyProgress.completed}/{weeklyProgress.target} workouts
            </span>
          </div>
          <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-accent-primary"
              style={{ width: `${weeklyProgress.percentage}%` }}
            />
          </div>
        </div>

        {/* Today's Nutrition */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400 flex items-center gap-1">
              <Utensils className="w-4 h-4" />
              Calories Today
            </span>
            <span className={`font-medium ${
              nutrition.percentOfTarget > 100 ? 'text-orange-400' : 'text-green-400'
            }`}>
              {nutrition.consumed.toLocaleString()} / {nutrition.target.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                nutrition.percentOfTarget <= 100 ? 'bg-green-500' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(nutrition.percentOfTarget, 100)}%` }}
            />
          </div>
          {nutrition.remaining > 0 && (
            <p className="text-xs text-gray-500 mt-1">{nutrition.remaining} kcal remaining</p>
          )}
        </div>

        {/* Program Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400 flex items-center gap-1">
              <Flame className="w-4 h-4" />
              {programProgress.phase} Phase
            </span>
            <span className="text-white font-medium">
              Week {programProgress.currentWeek} of {programProgress.totalWeeks}
            </span>
          </div>
          <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-secondary rounded-full transition-all duration-500"
              style={{ width: `${programProgress.percentage}%` }}
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
