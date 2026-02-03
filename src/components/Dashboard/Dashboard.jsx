import React from 'react';
import {
  Flame,
  Target,
  TrendingUp,
  Calendar,
  Utensils,
  Dumbbell,
  Plus,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { Card, CardBody, Button, ProgressBar, CircularProgress } from '../shared';
import {
  calculateCaloriesBurned,
  estimateDailyCalories,
  estimateEODCalories,
} from '../../utils/calorieEstimation';

export function Dashboard({
  profile,
  program,
  todaysMeals,
  todaysWorkouts,
  onLogMeal,
  onLogWorkout,
  onViewProgram,
  onViewNutrition,
}) {
  const { macros, bmr, tdee } = profile;
  const weightLbs = profile.weightUnit === 'kg'
    ? profile.weight / 0.453592
    : parseFloat(profile.weight);

  // Calculate today's nutrition totals
  const consumed = todaysMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Calculate calories burned from completed workouts
  const caloriesBurnedFromWorkouts = todaysWorkouts.reduce((sum, workout) => {
    return sum + calculateCaloriesBurned(
      weightLbs,
      workout.type || program?.primarySubtype || 'strength',
      workout.duration || 60,
      workout.overallRpe || 7
    );
  }, 0);

  // Get today's scheduled workouts that haven't been completed
  const today = new Date().getDay() || 7;
  const todaysSchedule = program?.weeklySchedule?.find((d) => d.day === today);
  const scheduledSessions = todaysSchedule?.sessions || [];
  const completedSessionTimes = todaysWorkouts.map((w) => w.sessionTime);
  const remainingWorkouts = scheduledSessions.filter(
    (s) => !completedSessionTimes.includes(s.time)
  );

  // Estimate EOD calories
  const estimatedEOD = estimateEODCalories(
    bmr || 1800,
    profile.activityLevel || 'moderate',
    todaysWorkouts.map((w) => ({
      type: w.type || program?.primarySubtype,
      duration: w.duration,
      rpe: w.overallRpe,
    })),
    remainingWorkouts.map((s) => ({
      type: s.type || program?.primarySubtype,
      duration: s.duration,
    })),
    weightLbs
  );

  // Daily burn breakdown
  const dailyBurn = estimateDailyCalories(bmr || 1800, profile.activityLevel, caloriesBurnedFromWorkouts);

  // Calculate remaining calories
  const netCalories = consumed.calories - estimatedEOD;
  const remainingCalories = macros.calories - consumed.calories;

  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      {/* Header */}
      <header className="px-6 py-5 bg-dark-800 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              Hey, {profile.name?.split(' ')[0] || 'Athlete'} 👋
            </h1>
            <p className="text-gray-400 text-sm">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="text-lg font-semibold text-white">
              Week {program?.currentWeek || 1}
            </span>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Calorie Balance Card - Clickable */}
        <Card hover onClick={onViewNutrition}>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-accent-warning" />
                Today's Energy Balance
              </h2>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            {/* Main Calorie Display */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Calories Burned */}
              <div className="text-center p-3 bg-dark-700 rounded-lg">
                <Zap className="w-5 h-5 text-accent-danger mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{dailyBurn.totalDailyBurn}</p>
                <p className="text-xs text-gray-400">Burned</p>
              </div>

              {/* Net Calories */}
              <div className="text-center p-3 bg-gradient-to-b from-accent-primary/20 to-dark-700 rounded-lg border border-accent-primary/30">
                <p className="text-xs text-gray-400 mb-1">Net</p>
                <p className={`text-3xl font-bold ${
                  netCalories < 0 ? 'text-accent-success' : 'text-accent-warning'
                }`}>
                  {netCalories > 0 ? '+' : ''}{netCalories}
                </p>
                <p className="text-xs text-gray-400">kcal</p>
              </div>

              {/* Calories Consumed */}
              <div className="text-center p-3 bg-dark-700 rounded-lg">
                <Utensils className="w-5 h-5 text-accent-success mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{consumed.calories}</p>
                <p className="text-xs text-gray-400">Consumed</p>
              </div>
            </div>

            {/* Estimated EOD */}
            <div className="p-3 bg-dark-700 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Est. EOD Burn</span>
                <span className="text-white font-medium">{estimatedEOD} kcal</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {remainingWorkouts.length > 0
                  ? `Includes ${remainingWorkouts.length} scheduled workout(s)`
                  : 'All workouts completed'}
              </p>
            </div>

            {/* Macro Summary */}
            <div className="space-y-2">
              <MacroBar
                label="Protein"
                current={consumed.protein}
                target={macros.protein}
                color="success"
                unit="g"
              />
              <MacroBar
                label="Carbs"
                current={consumed.carbs}
                target={macros.carbs}
                color="warning"
                unit="g"
              />
              <MacroBar
                label="Fat"
                current={consumed.fat}
                target={macros.fat}
                color="secondary"
                unit="g"
              />
            </div>

            <p className="text-xs text-center text-gray-500 mt-3">
              Tap for detailed nutrition breakdown →
            </p>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="secondary" onClick={onLogMeal} className="py-4">
            <Utensils className="w-5 h-5 mr-2" />
            Log Meal
          </Button>
          <Button variant="secondary" onClick={onLogWorkout} className="py-4">
            <Dumbbell className="w-5 h-5 mr-2" />
            Log Workout
          </Button>
        </div>

        {/* Today's Workout */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-accent-primary" />
                Today's Training
              </h2>
              <span className="text-sm text-gray-400">
                {caloriesBurnedFromWorkouts > 0 && `🔥 ${caloriesBurnedFromWorkouts} kcal`}
              </span>
            </div>

            {todaysSchedule && !todaysSchedule.isRestDay ? (
              <div className="space-y-3">
                {todaysSchedule.sessions?.map((session, idx) => {
                  const isCompleted = todaysWorkouts.some(
                    (w) => w.sessionTime === session.time
                  );
                  const estimatedBurn = calculateCaloriesBurned(
                    weightLbs,
                    session.type || program?.primarySubtype,
                    session.duration || 60,
                    7
                  );

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        isCompleted
                          ? 'bg-accent-success/10 border-accent-success/30'
                          : 'bg-dark-700 border-dark-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-xs rounded ${
                              session.time === 'AM'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {session.time}
                          </span>
                          <span className="font-medium text-white">{session.focus}</span>
                          {isCompleted && <span className="text-accent-success">✓</span>}
                        </div>
                        <span className="text-sm text-gray-400">~{estimatedBurn} kcal</span>
                      </div>

                      <div className="text-sm text-gray-400">
                        {session.duration} min • {session.exercises?.length || 0} exercises
                      </div>

                      {!isCompleted && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-3 w-full"
                          onClick={onViewProgram}
                        >
                          Start Workout
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">🧘</span>
                <p className="text-gray-400">Rest Day</p>
                <p className="text-sm text-gray-500">
                  Recovery is when gains happen!
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardBody className="text-center">
              <Target className="w-8 h-8 text-accent-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {program?.currentPhase || 'Base'}
              </div>
              <p className="text-sm text-gray-400">Current Phase</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <TrendingUp className="w-8 h-8 text-accent-success mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {todaysWorkouts.length}/{scheduledSessions.length || 0}
              </div>
              <p className="text-sm text-gray-400">Workouts Done</p>
            </CardBody>
          </Card>
        </div>

        {/* Program Info */}
        <Card hover onClick={onViewProgram}>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">{program?.name || 'Your Program'}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {program?.isHybrid && '🔥 Hybrid • '}
                  Week {program?.currentWeek || 1} of {program?.mesocycleWeeks || 4}
                </p>
              </div>
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>

            <div className="mt-4">
              <ProgressBar
                value={program?.currentWeek || 1}
                max={program?.mesocycleWeeks || 4}
                color="primary"
              />
            </div>

            {/* Vacation Alert */}
            {program?.vacations?.length > 0 && (
              <div className="mt-3 p-2 bg-accent-secondary/10 rounded-lg">
                <p className="text-xs text-accent-secondary">
                  ✈️ {program.vacations.length} vacation(s) scheduled - deloads aligned
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function MacroBar({ label, current, target, color, unit }) {
  const percentage = Math.min((current / target) * 100, 100);
  const isOver = current > target;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={isOver ? 'text-accent-danger' : 'text-white'}>
          {current}
          <span className="text-gray-500">/{target}{unit}</span>
        </span>
      </div>
      <ProgressBar value={current} max={target} color={isOver ? 'danger' : color} size="sm" />
    </div>
  );
}

export default Dashboard;
