import React from 'react';
import {
  Flame,
  Target,
  TrendingUp,
  Calendar,
  Utensils,
  Dumbbell,
  Zap,
  ChevronRight,
  Play,
  Sparkles,
  Clock,
  Apple,
} from 'lucide-react';
import { Card, CardBody, Button, ProgressBar, ProgressWidget, ProgramOverview } from '../shared';
import {
  calculateCaloriesBurned,
  estimateDailyCalories,
  estimateEODCalories,
} from '../../utils/calorieEstimation';

export function Dashboard({
  profile,
  program,
  meals,
  workouts,
  todaysMeals,
  todaysWorkouts,
  isSubscribed = true,
  onLogMeal,
  onLogWorkout,
  onViewProgram,
  onViewNutrition,
  onShowPaywall,
  onCreateMealPlan,
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

  // Check if program has started yet
  const programStartDate = program?.startDate ? new Date(program.startDate) : null;
  if (programStartDate) programStartDate.setHours(0, 0, 0, 0);
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const isProgramStarted = !programStartDate || programStartDate <= todayDate;
  const isTodayStartDate = programStartDate && programStartDate.getTime() === todayDate.getTime();

  // Calculate days until program starts
  const daysUntilStart = programStartDate
    ? Math.ceil((programStartDate - todayDate) / (1000 * 60 * 60 * 24))
    : 0;

  // Get goal information for celebration message
  const getGoalMessage = () => {
    if (!program) return null;
    const { primaryGoal, primarySubtype, paces, baseline } = program;

    if (primaryGoal === 'endurance') {
      if (paces?.goalPace) {
        return `Your goal: ${paces.goalPace} pace for ${primarySubtype}`;
      }
      return `Building your ${primarySubtype} endurance`;
    }
    if (primaryGoal === 'strength' && baseline?.strength?.lifts?.length > 0) {
      const mainLift = baseline.strength.lifts[0];
      return `Your goal: ${mainLift.exercise} from ${mainLift.current1RM}lbs → ${mainLift.target1RM}lbs`;
    }
    if (primaryGoal === 'aesthetic') {
      return `Building lean muscle with ${program.daysPerWeek} training days/week`;
    }
    return `${program.totalWeeks} weeks of structured training ahead`;
  };

  // Get today's scheduled workouts that haven't been completed
  const today = new Date().getDay() || 7;
  const todaysSchedule = isProgramStarted
    ? program?.weeklySchedule?.find((d) => d.day === today)
    : null;
  const scheduledSessions = todaysSchedule?.sessions || [];
  const completedSessionTimes = todaysWorkouts.map((w) => w.sessionTime);
  const remainingWorkouts = scheduledSessions.filter(
    (s) => !completedSessionTimes.includes(s.time)
  );

  // Check if there's actually a workout scheduled today
  const hasScheduledWorkout = isProgramStarted && todaysSchedule && !todaysSchedule.isRestDay;
  const isRestOrNoWorkout = !hasScheduledWorkout;

  // Estimate EOD calories - only include workout burn if there's actually a workout scheduled
  const estimatedEOD = estimateEODCalories(
    bmr || 1800,
    profile.activityLevel || 'moderate',
    todaysWorkouts.map((w) => ({
      type: w.type || program?.primarySubtype,
      duration: w.duration,
      rpe: w.overallRpe,
    })),
    hasScheduledWorkout ? remainingWorkouts.map((s) => ({
      type: s.type || program?.primarySubtype,
      duration: s.duration,
    })) : [], // Don't include scheduled burn if no workout today
    weightLbs
  );

  // Daily burn breakdown - only include workout burn if there's actually a workout
  const dailyBurn = estimateDailyCalories(bmr || 1800, profile.activityLevel, hasScheduledWorkout ? caloriesBurnedFromWorkouts : 0);

  // Calculate estimated workout burn for display
  const scheduledWorkoutBurn = hasScheduledWorkout
    ? remainingWorkouts.reduce((sum, s) => sum + calculateCaloriesBurned(weightLbs, s.type || program?.primarySubtype, s.duration || 60, 7), 0)
    : 0;

  // Calculate remaining calories
  const netCalories = consumed.calories - estimatedEOD;

  // Check for test mode
  const isTestMode = typeof window !== 'undefined' && localStorage.getItem('motus_test_no_api') === 'true';

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      {/* Test mode indicator */}
      {isTestMode && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-center">
          <span className="text-amber-400 text-xs font-medium">
            ⚠️ TEST MODE — API calls bypassed •{' '}
            <button
              onClick={() => {
                localStorage.removeItem('motus_test_no_api');
                window.location.reload();
              }}
              className="underline hover:text-amber-300"
            >
              Disable
            </button>
          </span>
        </div>
      )}
      {/* Header - Clean, confident */}
      <header className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm font-medium uppercase tracking-wider mb-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {profile.name?.split(' ')[0] || 'Athlete'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-text-muted uppercase tracking-wider">Week</p>
              <p className="text-xl font-display font-bold text-accent-primary">
                {program?.currentWeek || 1}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 space-y-5">
        {/* Meal Plan CTA - Only show when subscribed */}
        {isSubscribed && (
          <Card
            hover
            onClick={onCreateMealPlan}
            className="bg-gradient-to-r from-accent-success/10 to-accent-primary/10 border-accent-success/30"
          >
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-success/20 flex items-center justify-center">
                  <Apple className="w-5 h-5 text-accent-success" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                    Create Your Meal Plan
                    <Sparkles className="w-3 h-3 text-accent-primary" />
                  </h3>
                  <p className="text-xs text-gray-400">
                    Personalized recipes and shopping list
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
            </CardBody>
          </Card>
        )}

        {/* Energy Balance Card */}
        <Card hover onClick={onViewNutrition} className="overflow-hidden">
          <CardBody className="p-0">
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-dark-600">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-accent-primary" />
                Today's Nutrition
              </h2>
              <ChevronRight className="w-4 h-4 text-dark-400" />
            </div>

            {/* Main stats - simplified */}
            <div className="grid grid-cols-3 divide-x divide-dark-600">
              {/* Target */}
              <div className="p-3 text-center">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Target</p>
                <p className="font-display text-xl font-bold text-white">{macros?.calories || tdee}</p>
              </div>

              {/* Consumed */}
              <div className="p-3 text-center">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Eaten</p>
                <p className="font-display text-xl font-bold text-accent-success">{consumed.calories}</p>
              </div>

              {/* Remaining */}
              <div className="p-3 text-center bg-dark-700/50">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Left</p>
                <p className={`font-display text-xl font-bold ${
                  (macros?.calories || tdee) - consumed.calories > 0 ? 'text-accent-primary' : 'text-accent-danger'
                }`}>
                  {(macros?.calories || tdee) - consumed.calories}
                </p>
              </div>
            </div>

            {/* Macro bars */}
            <div className="px-4 py-3 space-y-2 border-t border-dark-600">
              <MacroBar label="Protein" current={consumed.protein} target={macros.protein} color="primary" />
              <MacroBar label="Carbs" current={consumed.carbs} target={macros.carbs} color="warning" />
              <MacroBar label="Fat" current={consumed.fat} target={macros.fat} color="secondary" />
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onLogMeal} className="py-4">
            <Utensils className="w-5 h-5 mr-2" />
            Log Meal
          </Button>
          <Button variant="secondary" onClick={onLogWorkout} className="py-4">
            <Dumbbell className="w-5 h-5 mr-2" />
            Log Workout
          </Button>
        </div>

        {/* Today's Training */}
        <Card>
          <CardBody className="p-0">
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-600">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-accent-primary" />
                Today's Training
              </h2>
              {caloriesBurnedFromWorkouts > 0 && (
                <span className="text-sm text-text-muted">
                  <Flame className="w-4 h-4 inline mr-1 text-accent-danger" />
                  {caloriesBurnedFromWorkouts} kcal
                </span>
              )}
            </div>

            <div className="p-5">
              {isTodayStartDate ? (
                /* Day 1 Celebration */
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-accent-primary/30 to-accent-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-accent-primary animate-pulse">
                      <span className="text-5xl">🎉</span>
                    </div>
                    <h3 className="font-display text-2xl font-bold text-accent-primary mb-2">
                      Today is the Day!
                    </h3>
                    <p className="text-white font-semibold mb-3">
                      Week 1 of your {program?.totalWeeks}-week journey begins now
                    </p>
                    <p className="text-sm text-text-secondary max-w-xs mx-auto">
                      {getGoalMessage()}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-accent-success/10 to-accent-primary/10 rounded-xl p-4 border border-accent-success/30">
                    <p className="text-center text-sm text-text-secondary">
                      <span className="text-accent-success font-semibold">Stay the course</span> and this program will get you to your goal.
                      Trust the process, show up every day, and the results will follow.
                    </p>
                  </div>

                  {todaysSchedule && !todaysSchedule.isRestDay && (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={onViewProgram}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Your First Workout
                    </Button>
                  )}
                </div>
              ) : !isProgramStarted && programStartDate ? (
                /* Pre-program countdown view */
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-accent-primary/30">
                      <span className="text-4xl">🚀</span>
                    </div>
                    <p className="font-display text-3xl font-bold text-accent-primary mb-1">
                      {daysUntilStart} {daysUntilStart === 1 ? 'Day' : 'Days'}
                    </p>
                    <p className="text-sm text-text-muted mb-2">until your program begins</p>
                    <p className="text-white font-semibold">
                      Starting {programStartDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-xl p-4 border border-accent-primary/20">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent-primary" />
                      Prepare for Success
                    </h4>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-3">
                        <span className="text-lg">🛒</span>
                        <div>
                          <p className="text-white font-medium">Stock up on nutrition</p>
                          <p className="text-text-muted">Prepare your meals and snacks for week 1</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-lg">😴</span>
                        <div>
                          <p className="text-white font-medium">Get quality sleep</p>
                          <p className="text-text-muted">Aim for 8+ hours to start fresh</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-lg">📱</span>
                        <div>
                          <p className="text-white font-medium">Review your program</p>
                          <p className="text-text-muted">Familiarize yourself with week 1 workouts</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-lg">🎯</span>
                        <div>
                          <p className="text-white font-medium">Set your intentions</p>
                          <p className="text-text-muted">Visualize your goals and commit fully</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={onViewProgram}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Preview Your Program
                  </Button>
                </div>
              ) : todaysSchedule && !todaysSchedule.isRestDay ? (
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
                        className={`p-4 rounded-xl border transition-all ${
                          isCompleted
                            ? 'bg-accent-success/5 border-accent-success/20'
                            : 'bg-dark-700 border-dark-600 hover:border-dark-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded ${
                                session.time === 'AM'
                                  ? 'bg-accent-primary/10 text-accent-primary'
                                  : 'bg-blue-500/10 text-blue-400'
                              }`}
                            >
                              {session.time}
                            </span>
                            <span className="font-medium text-white">{session.focus}</span>
                            {isCompleted && (
                              <span className="text-accent-success text-sm">✓ Done</span>
                            )}
                          </div>
                          <span className="text-sm text-text-muted">~{estimatedBurn} kcal</span>
                        </div>

                        <p className="text-sm text-text-secondary mb-3">
                          {session.duration} min • {session.exercises?.length || 0} exercises
                        </p>

                        {!isCompleted && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full"
                            onClick={onViewProgram}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Workout
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🧘</span>
                  </div>
                  <p className="font-semibold text-white mb-1">Rest Day</p>
                  <p className="text-sm text-text-muted">
                    Recovery is when gains happen
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Lock In Daily Commitments */}
        {program?.primaryGoal === 'lockin' && (
          <LockInCommitments
            program={program}
            profile={profile}
            todaysWorkouts={todaysWorkouts}
          />
        )}

        {/* Program Overview */}
        <ProgramOverview profile={profile} program={program} />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardBody className="text-center py-5">
              <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-accent-primary" />
              </div>
              <p className="font-display text-xl font-bold text-white">
                {program?.currentPhase || 'Base'}
              </p>
              <p className="text-xs text-text-muted uppercase tracking-wider mt-1">Phase</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center py-5">
              <div className="w-12 h-12 bg-accent-success/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-accent-success" />
              </div>
              <p className="font-display text-xl font-bold text-white">
                {todaysWorkouts.length}/{scheduledSessions.length || 0}
              </p>
              <p className="text-xs text-text-muted uppercase tracking-wider mt-1">Complete</p>
            </CardBody>
          </Card>
        </div>

        {/* Progress Widget */}
        <ProgressWidget
          profile={profile}
          program={program}
          meals={meals}
          workouts={workouts}
          todaysMeals={todaysMeals}
          todaysWorkouts={todaysWorkouts}
        />

        {/* Program Card */}
        <Card hover onClick={onViewProgram}>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-accent-primary uppercase tracking-wider font-semibold mb-1">
                  {program?.isHybrid && 'Hybrid • '}{program?.athleteLevel || 'Intermediate'}
                </p>
                <h3 className="font-semibold text-white text-lg">
                  {program?.name || 'Your Program'}
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  Week {program?.currentWeek || 1} of {program?.mesocycleWeeks || 4}
                </p>
              </div>
              <div className="w-10 h-10 bg-dark-700 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-text-secondary" />
              </div>
            </div>

            <div className="mt-4">
              <ProgressBar
                value={program?.currentWeek || 1}
                max={program?.mesocycleWeeks || 4}
                color="primary"
                size="sm"
              />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// Lock In Daily Commitments Tracker
function LockInCommitments({ program, profile, todaysWorkouts }) {
  // Get commitments from program or default
  const commitments = program?.commitments || {
    workout: true,
    steps: '10k',
    water: true,
    protein: true,
  };

  // Check localStorage for today's completed commitments
  const today = new Date().toISOString().split('T')[0];
  const storageKey = `motus_lockin_${today}`;

  const [completedCommitments, setCompletedCommitments] = React.useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Calculate streak from localStorage
  const [streak, setStreak] = React.useState(0);

  React.useEffect(() => {
    // Calculate streak by checking previous days
    let currentStreak = 0;
    const checkDate = new Date();

    for (let i = 0; i < 30; i++) {
      const dateKey = `motus_lockin_${checkDate.toISOString().split('T')[0]}`;
      const dayData = localStorage.getItem(dateKey);

      if (dayData) {
        try {
          const parsed = JSON.parse(dayData);
          // Check if all commitments were completed
          const allComplete = Object.keys(commitments).every(
            key => !commitments[key] || parsed[key]
          );
          if (allComplete) {
            currentStreak++;
          } else {
            break;
          }
        } catch {
          break;
        }
      } else if (i > 0) {
        // No data for a previous day means streak is broken
        break;
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    setStreak(currentStreak);
  }, [completedCommitments]);

  const toggleCommitment = (key) => {
    const newCompleted = {
      ...completedCommitments,
      [key]: !completedCommitments[key],
    };
    setCompletedCommitments(newCompleted);
    localStorage.setItem(storageKey, JSON.stringify(newCompleted));
  };

  // Check if workout was completed today
  const workoutCompleted = todaysWorkouts.length > 0 || completedCommitments.workout;

  const commitmentItems = [
    {
      key: 'workout',
      label: '1hr Workout',
      icon: '🏋️',
      completed: workoutCompleted,
      auto: todaysWorkouts.length > 0, // Auto-checked from workout logs
    },
    {
      key: 'steps',
      label: `${commitments.steps || '10k'} Steps`,
      icon: '🚶',
      completed: completedCommitments.steps,
    },
    commitments.water && {
      key: 'water',
      label: '1 Gallon Water',
      icon: '💧',
      completed: completedCommitments.water,
    },
    commitments.protein && {
      key: 'protein',
      label: 'High Protein',
      icon: '🥩',
      completed: completedCommitments.protein,
    },
  ].filter(Boolean);

  const allComplete = commitmentItems.every(item => item.completed);

  return (
    <Card className={allComplete ? 'border-accent-success/50 bg-accent-success/5' : ''}>
      <CardBody className="p-0">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-600">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <span className="text-xl">🔥</span>
            30 Day Lock In
          </h2>
          {streak > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-accent-primary/20 rounded-full">
              <Flame className="w-4 h-4 text-accent-primary" />
              <span className="text-sm font-bold text-accent-primary">{streak} day streak!</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          {commitmentItems.map((item) => (
            <button
              key={item.key}
              onClick={() => !item.auto && toggleCommitment(item.key)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                item.completed
                  ? 'bg-accent-success/10 border border-accent-success/30'
                  : 'bg-dark-700 border border-dark-600 hover:border-dark-500'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                item.completed
                  ? 'bg-accent-success border-accent-success'
                  : 'border-dark-500'
              }`}>
                {item.completed && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-xl">{item.icon}</span>
              <span className={`flex-1 text-left font-medium ${
                item.completed ? 'text-accent-success' : 'text-white'
              }`}>
                {item.label}
              </span>
              {item.auto && (
                <span className="text-xs text-gray-500 italic">Auto</span>
              )}
            </button>
          ))}

          {allComplete && (
            <div className="mt-4 p-4 bg-gradient-to-r from-accent-success/20 to-accent-primary/20 rounded-xl border border-accent-success/30 text-center">
              <span className="text-3xl mb-2 block">🎉</span>
              <p className="font-semibold text-white">All commitments complete!</p>
              <p className="text-sm text-gray-400">Keep the streak going tomorrow!</p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function MacroBar({ label, current, target, color }) {
  const percentage = Math.min((current / target) * 100, 100);
  const isOver = current > target;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-muted uppercase tracking-wide w-16">{label}</span>
      <div className="flex-1">
        <ProgressBar value={current} max={target} color={isOver ? 'danger' : color} size="xs" />
      </div>
      <span className={`text-sm tabular-nums ${isOver ? 'text-accent-danger' : 'text-white'}`}>
        {current}<span className="text-text-muted">/{target}g</span>
      </span>
    </div>
  );
}

export default Dashboard;
