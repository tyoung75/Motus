import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Circle, Zap, Droplets, Moon, Utensils, Heart, Calendar, TrendingUp, AlertCircle, Edit3, X, Save } from 'lucide-react';
import { Card, CardBody, Button } from '../shared';

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Generate a week's schedule based on week number and phase
const generateWeekSchedule = (baseSchedule, weekNumber, totalWeeks, phases, program) => {
  if (!baseSchedule || weekNumber === 1) return baseSchedule;

  const phase = phases?.[weekNumber - 1] || 'Base';
  const prevPhase = phases?.[weekNumber - 2] || 'Base';
  const isDeload = phase === 'Deload' || phase === 'Taper';
  const wasDeload = prevPhase === 'Deload' || prevPhase === 'Taper';

  // Adjust schedule based on week number and phase
  return baseSchedule.map(day => {
    if (day.isRestDay) return { ...day };

    const adjustedSessions = day.sessions?.map(session => {
      const adjustedExercises = session.exercises?.map(exercise => {
        let adjustedExercise = { ...exercise };

        // Adjust volume/intensity based on phase
        if (isDeload) {
          if (exercise.sets && typeof exercise.sets === 'number') {
            adjustedExercise.sets = Math.max(2, Math.floor(exercise.sets * 0.6));
          }
          if (exercise.rpe) {
            adjustedExercise.rpe = Math.max(5, exercise.rpe - 2);
          }
        } else if (phase === 'Peak') {
          if (exercise.rpe) {
            adjustedExercise.rpe = Math.min(10, exercise.rpe + 0.5);
          }
        } else if (phase.includes('Build')) {
          // Progressive increase from base
          const buildMultiplier = phase === 'Build 2' ? 1.15 : 1.08;
          if (exercise.sets && typeof exercise.sets === 'number') {
            adjustedExercise.sets = Math.round(exercise.sets * buildMultiplier);
          }
        }

        // Update progression text
        adjustedExercise.progression = exercise.progression?.replace(
          /Week \d+/g,
          `Week ${weekNumber}`
        );

        return adjustedExercise;
      });

      return {
        ...session,
        exercises: adjustedExercises,
      };
    });

    return {
      ...day,
      sessions: adjustedSessions,
      isDeload,
    };
  });
};

// Calculate weekly summary and what's different
const getWeeklySummary = (weekNumber, totalWeeks, phases, program) => {
  const phase = phases?.[weekNumber - 1] || 'Base';
  const prevPhase = weekNumber > 1 ? phases?.[weekNumber - 2] : null;
  const isPhaseChange = prevPhase && prevPhase !== phase;
  const isDeload = phase === 'Deload' || phase === 'Taper';

  const changes = [];

  if (isPhaseChange) {
    changes.push({
      type: 'phase',
      icon: '🔄',
      text: `New phase: ${prevPhase} → ${phase}`,
    });
  }

  if (isDeload) {
    changes.push({
      type: 'deload',
      icon: '📉',
      text: 'Reduced volume (60%) - focus on recovery',
    });
  } else if (phase === 'Peak') {
    changes.push({
      type: 'peak',
      icon: '⚡',
      text: 'Peak intensity - race simulation workouts',
    });
  } else if (phase.includes('Build') && weekNumber > 1) {
    changes.push({
      type: 'progression',
      icon: '📈',
      text: 'Volume increases ~5% from last week',
    });
  }

  if (program?.primaryGoal === 'endurance') {
    // Calculate mileage for this week
    const startMileage = program?.baseline?.endurance?.currentMileage || 20;
    const peakMileage = program?.athleteLevel === 'elite' ? 60 : 50;
    let weekMileage;

    if (isDeload) {
      weekMileage = Math.round(startMileage * Math.pow(1.05, weekNumber - 2) * 0.7);
    } else if (phase === 'Taper') {
      weekMileage = Math.round(peakMileage * 0.6);
    } else {
      weekMileage = Math.min(Math.round(startMileage * Math.pow(1.05, weekNumber - 1)), peakMileage);
    }

    changes.push({
      type: 'mileage',
      icon: '🏃',
      text: `Target mileage: ~${weekMileage} miles`,
    });
  }

  // Add week-specific goals
  const weekGoals = {
    1: 'Establish baseline, focus on form',
    2: 'Build consistency, dial in paces',
    3: 'First small volume increase',
    4: 'Recovery week - let adaptations settle',
  };

  if (weekNumber <= 4 && weekGoals[weekNumber]) {
    changes.push({
      type: 'goal',
      icon: '🎯',
      text: weekGoals[weekNumber],
    });
  }

  return {
    weekNumber,
    totalWeeks,
    phase,
    changes,
    isDeload,
  };
};

// Active recovery recommendations based on program type
const getRecoveryRecommendations = (program) => {
  const primaryGoal = program?.primaryGoal || 'aesthetic';

  const baseRecommendations = [
    {
      icon: '🧘',
      title: 'Stretching & Mobility',
      description: '15-20 min of dynamic stretching or yoga',
      detail: 'Focus on areas worked yesterday',
    },
    {
      icon: '🚶',
      title: 'Light Walk',
      description: '20-30 min easy walk outdoors',
      detail: 'Promotes blood flow without stress',
    },
    {
      icon: '💧',
      title: 'Hydration',
      description: 'Drink 3-4L water with electrolytes',
      detail: 'Sodium, potassium, magnesium for recovery',
      priority: true,
    },
    {
      icon: '😴',
      title: 'Sleep',
      description: 'Get 8+ hours of quality sleep',
      detail: 'Most recovery happens during deep sleep',
      priority: true,
    },
    {
      icon: '🍽️',
      title: 'Nutrition',
      description: 'Eat at maintenance or slight surplus',
      detail: 'Prioritize protein (1g/lb) for repair',
      priority: true,
    },
  ];

  // Add program-specific recommendations
  if (primaryGoal === 'endurance') {
    return [
      ...baseRecommendations,
      {
        icon: '🧊',
        title: 'Cold Therapy',
        description: '10-15 min ice bath or cold shower',
        detail: 'Reduces inflammation from high mileage',
      },
      {
        icon: '🦵',
        title: 'Foam Rolling',
        description: '10 min on calves, quads, IT band',
        detail: 'Breaks up adhesions, improves mobility',
      },
      {
        icon: '🩹',
        title: 'Compression',
        description: 'Wear compression socks/sleeves',
        detail: 'Promotes circulation and reduces swelling',
      },
    ];
  }

  if (primaryGoal === 'strength') {
    return [
      ...baseRecommendations,
      {
        icon: '🔥',
        title: 'Sauna',
        description: '15-20 min at 170-190°F',
        detail: 'Increases blood flow, promotes recovery',
      },
      {
        icon: '💆',
        title: 'Self-Massage',
        description: 'Lacrosse ball on tight areas',
        detail: 'Target shoulders, hips, and back',
      },
      {
        icon: '🧊',
        title: 'Contrast Therapy',
        description: '3 min hot / 1 min cold, repeat 3x',
        detail: 'Flushes metabolic waste from muscles',
      },
    ];
  }

  if (primaryGoal === 'aesthetic') {
    return [
      ...baseRecommendations,
      {
        icon: '🔥',
        title: 'Sauna',
        description: '15-20 min for recovery',
        detail: 'Also supports fat loss through heat exposure',
      },
      {
        icon: '🧘',
        title: 'Yoga Flow',
        description: '20-30 min gentle yoga',
        detail: 'Mind-muscle connection, flexibility',
      },
    ];
  }

  if (primaryGoal === 'fatloss') {
    return [
      ...baseRecommendations,
      {
        icon: '🚶',
        title: 'LISS Cardio',
        description: '30-45 min walk or light bike',
        detail: 'Burns extra calories without cortisol spike',
      },
      {
        icon: '🧊',
        title: 'Cold Exposure',
        description: '2-5 min cold shower',
        detail: 'Activates brown fat, boosts metabolism',
      },
    ];
  }

  return baseRecommendations;
};

export function ProgramView({ program, completedWorkouts, onCompleteExercise, onCompleteSession, onUpdateExerciseLog, onBack }) {
  // Default to Monday (day 1) when viewing program, not today
  const [selectedDay, setSelectedDay] = useState(1);
  const [expandedSession, setExpandedSession] = useState(0);
  const [viewingWeek, setViewingWeek] = useState(program?.currentWeek || 1);
  const [editingExercise, setEditingExercise] = useState(null); // {sessionIdx, exIdx}
  const [editValues, setEditValues] = useState({ sets: '', reps: '', weight: '', notes: '' });

  const totalWeeks = program?.totalWeeks || program?.mesocycleWeeks || 12;
  const phases = program?.phases || [];

  // Calculate actual dates for the week based on program start date
  const programStartDate = program?.startDate ? new Date(program.startDate) : new Date();
  const startDayOfWeek = programStartDate.getDay() || 7; // 1=Mon, 7=Sun

  // Get the first day of the viewing week
  const getWeekStartDate = (weekNum) => {
    const startDate = new Date(programStartDate);
    startDate.setDate(startDate.getDate() + (weekNum - 1) * 7);
    return startDate;
  };

  // Get the date for a specific day in the viewing week (day: 1-7, where 1=Mon)
  const getDateForDay = (day) => {
    const weekStart = getWeekStartDate(viewingWeek);
    // Adjust for the actual start day - if program starts on Thu (day 4), day 1 of program is Thu
    const daysFromWeekStart = day - 1;
    const targetDate = new Date(weekStart);
    targetDate.setDate(targetDate.getDate() + daysFromWeekStart);
    return targetDate;
  };

  // Format date as "Jan 5"
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get week date range string
  const getWeekDateRange = () => {
    const weekStart = getWeekStartDate(viewingWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${formatDate(weekStart)} – ${formatDate(weekEnd)}`;
  };

  // Generate schedule for the currently viewed week
  const weeklySchedule = useMemo(() => {
    if (viewingWeek === 1 || viewingWeek === program?.currentWeek) {
      return program?.weeklySchedule;
    }
    return generateWeekSchedule(
      program?.weeklySchedule,
      viewingWeek,
      totalWeeks,
      phases,
      program
    );
  }, [viewingWeek, program?.weeklySchedule, totalWeeks, phases]);

  const daySchedule = weeklySchedule?.find((d) => d.day === selectedDay);

  // Get weekly summary
  const weeklySummary = useMemo(() => {
    return getWeeklySummary(viewingWeek, totalWeeks, phases, program);
  }, [viewingWeek, totalWeeks, phases, program]);

  const isExerciseCompleted = (sessionIndex, exerciseIndex) => {
    // Only show completion status for current week
    if (viewingWeek !== program?.currentWeek) return false;
    return completedWorkouts.some((w) => w.day === selectedDay && w.sessionIndex === sessionIndex && w.completedExercises?.includes(exerciseIndex));
  };

  // Get logged data for an exercise (actual weights/sets/reps used)
  const getExerciseLog = (sessionIndex, exerciseIndex) => {
    const workout = completedWorkouts.find((w) => w.day === selectedDay && w.sessionIndex === sessionIndex);
    return workout?.exerciseLogs?.[exerciseIndex] || null;
  };

  // Check if all exercises in a session are completed
  const isSessionCompleted = (sessionIndex) => {
    const session = daySchedule?.sessions?.[sessionIndex];
    if (!session?.exercises) return false;
    return session.exercises.every((_, exIdx) => isExerciseCompleted(sessionIndex, exIdx));
  };

  // Handle starting edit mode for an exercise
  const startEditingExercise = (sessionIdx, exIdx, exercise) => {
    const log = getExerciseLog(sessionIdx, exIdx);
    setEditingExercise({ sessionIdx, exIdx });
    setEditValues({
      sets: log?.sets || exercise.sets || '',
      reps: log?.reps || exercise.reps || '',
      weight: log?.weight || exercise.startingWeight || '',
      notes: log?.notes || '',
    });
  };

  // Handle saving exercise edits
  const saveExerciseEdit = () => {
    if (editingExercise && onUpdateExerciseLog) {
      onUpdateExerciseLog(selectedDay, editingExercise.sessionIdx, editingExercise.exIdx, editValues);
    }
    setEditingExercise(null);
    setEditValues({ sets: '', reps: '', weight: '', notes: '' });
  };

  // Handle completing entire session
  const handleCompleteSession = (sessionIdx) => {
    if (onCompleteSession) {
      onCompleteSession(selectedDay, sessionIdx);
    }
  };

  const canGoBack = viewingWeek > 1;
  const canGoForward = viewingWeek < totalWeeks;
  const isViewingFuture = viewingWeek > (program?.currentWeek || 1);
  const isViewingPast = viewingWeek < (program?.currentWeek || 1);

  const recoveryRecommendations = getRecoveryRecommendations(program);

  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      <header className="px-6 py-4 bg-dark-800 border-b border-dark-700">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-dark-700"><ChevronLeft className="w-6 h-6 text-white" /></button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{program?.name || 'Your Program'}</h1>
            <p className="text-gray-400 text-sm">{program?.currentPhase} Phase</p>
          </div>
        </div>
      </header>

      {/* Week Navigation */}
      <div className="px-6 py-3 bg-dark-800/50 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <button
            onClick={() => canGoBack && setViewingWeek(v => v - 1)}
            disabled={!canGoBack}
            className={`p-2 rounded-lg ${canGoBack ? 'hover:bg-dark-700 text-white' : 'text-gray-600 cursor-not-allowed'}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-accent-primary" />
            <div className="text-center">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">Week {viewingWeek}</span>
                <span className="text-gray-400 text-sm"> of {totalWeeks}</span>
                {viewingWeek === program?.currentWeek && (
                  <span className="px-2 py-0.5 text-xs bg-accent-primary rounded-full text-white">Current</span>
                )}
                {isViewingFuture && (
                  <span className="px-2 py-0.5 text-xs bg-accent-secondary/50 rounded-full text-accent-secondary">Preview</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{getWeekDateRange()}</p>
            </div>
          </div>

          <button
            onClick={() => canGoForward && setViewingWeek(v => v + 1)}
            disabled={!canGoForward}
            className={`p-2 rounded-lg ${canGoForward ? 'hover:bg-dark-700 text-white' : 'text-gray-600 cursor-not-allowed'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick week jump - color coded by phase */}
        <div className="flex gap-1 mt-2 overflow-x-auto pb-1 scrollbar-thin">
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(week => {
            const weekPhase = phases[week - 1] || 'Base';
            const phaseColors = {
              'Base': { bg: 'bg-blue-500/20', text: 'text-blue-400', selected: 'bg-blue-500' },
              'Build': { bg: 'bg-orange-500/20', text: 'text-orange-400', selected: 'bg-orange-500' },
              'Build 1': { bg: 'bg-orange-500/20', text: 'text-orange-400', selected: 'bg-orange-500' },
              'Build 2': { bg: 'bg-red-500/20', text: 'text-red-400', selected: 'bg-red-500' },
              'Peak': { bg: 'bg-purple-500/20', text: 'text-purple-400', selected: 'bg-purple-500' },
              'Taper': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', selected: 'bg-cyan-500' },
              'Deload': { bg: 'bg-green-500/20', text: 'text-green-400', selected: 'bg-green-500' },
            };
            const colors = phaseColors[weekPhase] || phaseColors['Base'];
            const isSelected = week === viewingWeek;
            const isCurrent = week === program?.currentWeek;
            const isPast = week < (program?.currentWeek || 1);

            return (
              <button
                key={week}
                onClick={() => setViewingWeek(week)}
                className={`px-2 py-1 text-xs rounded-lg min-w-[28px] transition-all ${
                  isSelected
                    ? `${colors.selected} text-white font-medium`
                    : isCurrent
                      ? `${colors.bg} ${colors.text} ring-1 ring-current`
                      : isPast
                        ? 'bg-dark-600/50 text-gray-500'
                        : `${colors.bg} ${colors.text} hover:opacity-80`
                }`}
                title={`Week ${week}: ${weekPhase}`}
              >
                {week}
              </button>
            );
          })}
        </div>

        {/* Phase Legend */}
        <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Base</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span>Build</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>Deload</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span>Peak</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500"></span>Taper</span>
        </div>
      </div>

      {/* Weekly Summary */}
      {weeklySummary.changes.length > 0 && (
        <div className="px-6 py-3 bg-dark-800/30 border-b border-dark-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-accent-secondary" />
            <span className="text-sm font-medium text-white">Week {viewingWeek} Focus</span>
            <span className="px-2 py-0.5 text-xs bg-dark-600 rounded-full text-gray-300">
              {weeklySummary.phase}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {weeklySummary.changes.map((change, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${
                  change.type === 'deload'
                    ? 'bg-green-500/20 text-green-400'
                    : change.type === 'peak'
                      ? 'bg-red-500/20 text-red-400'
                      : change.type === 'phase'
                        ? 'bg-accent-primary/20 text-accent-primary'
                        : 'bg-dark-600 text-gray-300'
                }`}
              >
                <span>{change.icon}</span>
                <span>{change.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Future Week Warning */}
      {isViewingFuture && (
        <div className="mx-6 mt-3 p-3 bg-accent-secondary/10 border border-accent-secondary/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-accent-secondary mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <span className="text-accent-secondary font-medium">Preview Mode:</span>
            <span className="text-gray-400 ml-1">This is a projected schedule. Actual workouts may adjust based on your progress.</span>
          </div>
        </div>
      )}

      <div className="px-6 py-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const schedule = weeklySchedule?.find((d) => d.day === day);
            const isRest = schedule?.isRestDay;
            const isSelected = selectedDay === day;
            const isDeloadDay = schedule?.isDeload;
            const dayDate = getDateForDay(day);
            const isToday = dayDate.toDateString() === new Date().toDateString();
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[64px] transition-all ${
                  isSelected
                    ? 'bg-accent-primary text-white'
                    : isToday
                      ? 'bg-accent-primary/20 text-accent-primary ring-1 ring-accent-primary/50'
                      : isDeloadDay
                        ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                } ${isRest && !isSelected && !isToday ? 'opacity-50' : ''}`}
              >
                <span className="text-xs font-medium">{DAY_NAMES[day]}</span>
                <span className={`text-[10px] ${isSelected ? 'text-white/80' : isToday ? 'text-accent-primary/80' : 'text-gray-500'}`}>
                  {dayDate.getDate()}
                </span>
                <span className="text-lg font-bold mt-0.5">
                  {isRest ? '🧘' : isDeloadDay ? '🔄' : '💪'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-4">
        {daySchedule?.isRestDay ? (
          <div className="space-y-4">
            {/* Rest Day Header */}
            <div className="text-center py-6">
              <span className="text-5xl mb-3 block">🧘</span>
              <h2 className="text-xl font-semibold text-white mb-1">Active Recovery Day</h2>
              <p className="text-gray-400 text-sm">Recovery is when adaptation happens. Make the most of it.</p>
            </div>

            {/* Priority Items */}
            <div className="bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 rounded-xl p-4 border border-accent-primary/30">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-accent-primary" />
                Recovery Essentials
              </h3>
              <div className="space-y-3">
                {recoveryRecommendations.filter(r => r.priority).map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-xl">{rec.icon}</span>
                    <div>
                      <p className="text-white font-medium">{rec.title}</p>
                      <p className="text-sm text-gray-300">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Recommendations */}
            <div>
              <h3 className="text-white font-semibold mb-3">Recommended Activities</h3>
              <div className="grid gap-3">
                {recoveryRecommendations.filter(r => !r.priority).map((rec, idx) => (
                  <Card key={idx}>
                    <CardBody className="flex items-start gap-3">
                      <span className="text-2xl">{rec.icon}</span>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{rec.title}</h4>
                        <p className="text-sm text-gray-400">{rec.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{rec.detail}</p>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recovery Tips */}
            <div className="bg-dark-800 rounded-xl p-4 border border-dark-600">
              <h3 className="text-white font-semibold mb-2">💡 Pro Tips</h3>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Avoid intense exercise - save it for training days</li>
                <li>• Listen to your body - if you feel sore, prioritize sleep</li>
                <li>• Mental recovery matters too - take time to destress</li>
                <li>• Prep meals for the week to stay on track</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">{daySchedule?.name}</h2>
            {daySchedule?.sessions?.map((session, sessionIdx) => (
              <Card key={sessionIdx}>
                <button onClick={() => setExpandedSession(expandedSession === sessionIdx ? -1 : sessionIdx)} className="w-full">
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${session.time === 'AM' ? 'bg-yellow-500/20' : session.time === 'PM' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                          <span className="text-2xl">{session.type === 'strength' || session.type === 'hypertrophy' ? '🏋️' : session.type === 'endurance' ? '🏃' : '⚡'}</span>
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded ${session.time === 'AM' ? 'bg-yellow-500/20 text-yellow-400' : session.time === 'PM' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{session.time}</span>
                            <h3 className="font-semibold text-white">{session.focus}</h3>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{session.duration} min</span>
                            <span>{session.exercises?.length} exercises</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedSession === sessionIdx ? 'rotate-90' : ''}`} />
                    </div>
                  </CardBody>
                </button>
                {expandedSession === sessionIdx && (
                  <div className="px-5 pb-5 space-y-3">
                    <hr className="border-dark-600" />
                    {session.exercises?.map((exercise, exIdx) => {
                      const isCompleted = isExerciseCompleted(sessionIdx, exIdx);
                      const exerciseLog = getExerciseLog(sessionIdx, exIdx);
                      const isEditing = editingExercise?.sessionIdx === sessionIdx && editingExercise?.exIdx === exIdx;

                      return (
                        <div key={exIdx} className={`p-4 rounded-lg border ${isCompleted ? 'bg-accent-success/10 border-accent-success/30' : 'bg-dark-700 border-dark-600'}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium text-white">{exercise.name}</h4>
                                {isCompleted && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-accent-success/20 rounded-full">
                                    <CheckCircle className="w-3 h-3 text-accent-success" />
                                    <span className="text-xs text-accent-success font-medium">Done</span>
                                  </span>
                                )}
                              </div>

                              {/* Edit Mode */}
                              {isEditing ? (
                                <div className="mt-3 space-y-3">
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="text-xs text-gray-500 mb-1 block">Sets</label>
                                      <input
                                        type="text"
                                        value={editValues.sets}
                                        onChange={(e) => setEditValues({ ...editValues, sets: e.target.value })}
                                        placeholder={exercise.sets || 'Sets'}
                                        className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded text-white text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-500 mb-1 block">Reps</label>
                                      <input
                                        type="text"
                                        value={editValues.reps}
                                        onChange={(e) => setEditValues({ ...editValues, reps: e.target.value })}
                                        placeholder={exercise.reps || 'Reps'}
                                        className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded text-white text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-500 mb-1 block">Weight</label>
                                      <input
                                        type="text"
                                        value={editValues.weight}
                                        onChange={(e) => setEditValues({ ...editValues, weight: e.target.value })}
                                        placeholder={exercise.startingWeight || 'Weight'}
                                        className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded text-white text-sm"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Notes (optional)</label>
                                    <input
                                      type="text"
                                      value={editValues.notes}
                                      onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                                      placeholder="How did it feel? Any adjustments?"
                                      className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded text-white text-sm"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={saveExerciseEdit}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-accent-success text-white rounded-lg text-sm font-medium hover:bg-accent-success/80"
                                    >
                                      <Save className="w-4 h-4" />
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingExercise(null)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-dark-600 text-gray-400 rounded-lg text-sm hover:bg-dark-500"
                                    >
                                      <X className="w-4 h-4" />
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Logged values (if different from planned) */}
                                  {exerciseLog && (
                                    <div className="mt-2 p-2 bg-accent-primary/10 rounded-lg border border-accent-primary/20">
                                      <span className="text-xs text-accent-primary font-medium">Logged: </span>
                                      <span className="text-sm text-white">
                                        {exerciseLog.sets && `${exerciseLog.sets} sets`}
                                        {exerciseLog.reps && ` × ${exerciseLog.reps}`}
                                        {exerciseLog.weight && ` @ ${exerciseLog.weight}`}
                                      </span>
                                      {exerciseLog.notes && (
                                        <p className="text-xs text-gray-400 mt-1">"{exerciseLog.notes}"</p>
                                      )}
                                    </div>
                                  )}

                                  {/* Planned values */}
                                  <div className="flex flex-wrap gap-3 mt-2 text-sm">
                                    {exercise.sets && <span className="text-gray-400"><span className="text-white font-medium">{exercise.sets}</span> sets</span>}
                                    {exercise.reps && <span className="text-gray-400"><span className="text-white font-medium">{exercise.reps}</span></span>}
                                    {exercise.startingWeight && <span className="text-gray-400">Target <span className="text-accent-primary font-medium">{exercise.startingWeight}</span></span>}
                                    {exercise.rpe && <span className="text-gray-400">RPE <span className="text-accent-warning font-medium">{exercise.rpe}</span></span>}
                                    {exercise.pace && <span className="text-gray-400">Pace <span className="text-accent-primary font-medium">{exercise.pace}</span></span>}
                                    {exercise.heartRateZone && <span className="text-gray-400">Zone <span className="text-red-400 font-medium">{exercise.heartRateZone}</span></span>}
                                    {exercise.rest && <span className="text-gray-400">Rest <span className="text-white">{exercise.rest}</span></span>}
                                  </div>
                                  {(exercise.current1RM || exercise.target1RM) && (
                                    <div className="flex gap-4 mt-2 text-xs">
                                      {exercise.current1RM && <span className="text-gray-500">Current 1RM: <span className="text-gray-300">{exercise.current1RM}</span></span>}
                                      {exercise.target1RM && <span className="text-gray-500">Target 1RM: <span className="text-accent-secondary">{exercise.target1RM}</span></span>}
                                    </div>
                                  )}
                                  {exercise.notes && <p className="mt-2 text-sm text-gray-500 italic">💡 {exercise.notes}</p>}
                                  {exercise.progression && (
                                    <p className="mt-1 text-xs text-accent-secondary">📈 {exercise.progression}</p>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-1">
                              {/* Edit button */}
                              {!isEditing && viewingWeek === program?.currentWeek && (
                                <button
                                  onClick={() => startEditingExercise(sessionIdx, exIdx, exercise)}
                                  className="p-2 rounded-lg text-gray-500 hover:text-accent-primary hover:bg-dark-600 transition-colors"
                                  title="Log actual performance"
                                >
                                  <Edit3 className="w-5 h-5" />
                                </button>
                              )}

                              {/* Complete toggle */}
                              {!isEditing && (
                                <button
                                  onClick={() => onCompleteExercise(selectedDay, sessionIdx, exIdx)}
                                  className={`p-2 rounded-lg transition-colors ${isCompleted ? 'text-accent-success' : 'text-gray-500 hover:text-white hover:bg-dark-600'}`}
                                  title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                                >
                                  {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {isSessionCompleted(sessionIdx) ? (
                                      <div className="mt-4 p-3 bg-accent-success/20 rounded-lg border border-accent-success/30 text-center">
                                        <CheckCircle className="w-5 h-5 text-accent-success inline mr-2" />
                                        <span className="text-accent-success font-medium">Session Complete!</span>
                                      </div>
                                    ) : (
                                      <Button
                                        fullWidth
                                        variant="success"
                                        className="mt-4"
                                        onClick={() => handleCompleteSession(sessionIdx)}
                                      >
                                        <Zap className="w-4 h-4 mr-2" />
                                        Complete All Exercises
                                      </Button>
                                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProgramView;
