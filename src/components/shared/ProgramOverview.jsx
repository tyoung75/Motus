import React, { useState } from 'react';
import {
  Target, Calendar, TrendingUp, Dumbbell, ChevronDown, ChevronUp,
  Zap, Clock, AlertTriangle, CheckCircle, BarChart2
} from 'lucide-react';

export function ProgramOverview({ profile, program }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!program) return null;

  const {
    name,
    description,
    totalWeeks,
    currentWeek,
    currentPhase,
    phases,
    athleteLevel,
    daysPerWeek,
    paces,
    baseline,
    progressionRules,
    primaryGoal,
    weeksUntilGoal,
  } = program;

  // Calculate phase breakdown - show phases in order as they occur
  // Groups consecutive weeks of the same phase together
  const getPhaseBreakdown = () => {
    if (!phases || phases.length === 0) return [];

    const breakdown = [];
    let currentPhaseBlock = null;

    phases.forEach((phase, idx) => {
      const weekNum = idx + 1;

      if (!currentPhaseBlock || currentPhaseBlock.name !== phase) {
        // Start a new phase block
        if (currentPhaseBlock) {
          breakdown.push(currentPhaseBlock);
        }
        currentPhaseBlock = {
          name: phase,
          startWeek: weekNum,
          endWeek: weekNum,
          weeks: 1,
        };
      } else {
        // Continue the current phase block
        currentPhaseBlock.endWeek = weekNum;
        currentPhaseBlock.weeks++;
      }
    });

    // Don't forget the last block
    if (currentPhaseBlock) {
      breakdown.push(currentPhaseBlock);
    }

    return breakdown;
  };

  // Get phase focus description
  const getPhaseFocus = (phaseName) => {
    const focuses = {
      'Base': {
        focus: 'Building aerobic foundation & movement patterns',
        intensity: 'Low-Moderate',
        icon: '🏃',
      },
      'Build 1': {
        focus: 'Increasing volume & introducing intensity',
        intensity: 'Moderate',
        icon: '📈',
      },
      'Build 2': {
        focus: 'Peak volume & race-specific workouts',
        intensity: 'Moderate-High',
        icon: '🔥',
      },
      'Build': {
        focus: 'Progressive overload & strength gains',
        intensity: 'Moderate-High',
        icon: '💪',
      },
      'Peak': {
        focus: 'Sharpening fitness & race simulation',
        intensity: 'High',
        icon: '⚡',
      },
      'Taper': {
        focus: 'Reducing volume, maintaining intensity',
        intensity: 'Low (recovery)',
        icon: '🎯',
      },
      'Deload': {
        focus: 'Active recovery & adaptation',
        intensity: 'Low',
        icon: '🧘',
      },
    };
    return focuses[phaseName] || { focus: 'Training adaptation', intensity: 'Moderate', icon: '💪' };
  };

  // Calculate mileage progression for endurance programs
  const getMileageProgression = () => {
    if (primaryGoal !== 'endurance' || !baseline?.endurance) return null;

    const startingMileage = baseline.endurance.currentMileage || 20;
    const peakMileage = athleteLevel === 'elite' ? 60 : athleteLevel === 'advanced' ? 50 : 40;

    // Calculate key milestones
    const weekMilestones = [];
    let currentMileage = startingMileage;
    for (let week = 1; week <= totalWeeks; week++) {
      if (week === 1 || week === Math.floor(totalWeeks * 0.25) ||
          week === Math.floor(totalWeeks * 0.5) || week === Math.floor(totalWeeks * 0.75) ||
          week === totalWeeks - 2 || week === totalWeeks) {
        weekMilestones.push({ week, mileage: Math.round(currentMileage) });
      }
      currentMileage = Math.min(currentMileage * 1.05, peakMileage);
    }

    return {
      starting: startingMileage,
      peak: peakMileage,
      milestones: weekMilestones,
    };
  };

  // Get starting volume info
  const getStartingVolume = () => {
    const schedule = program.weeklySchedule || [];
    const workoutDays = schedule.filter(d => !d.isRestDay);
    const totalExercises = workoutDays.reduce((sum, day) => {
      return sum + (day.sessions?.reduce((s, session) => s + (session.exercises?.length || 0), 0) || 0);
    }, 0);

    return {
      workoutDays: workoutDays.length,
      totalExercises,
      avgExercisesPerDay: Math.round(totalExercises / Math.max(workoutDays.length, 1)),
    };
  };

  const phaseBreakdown = getPhaseBreakdown();
  const mileageProgression = getMileageProgression();
  const startingVolume = getStartingVolume();

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
      {/* Header - Clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 border-b border-dark-600 flex items-center justify-between hover:bg-dark-700 transition-colors"
      >
        <h3 className="text-white font-semibold flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-accent-primary" />
          Program Overview
        </h3>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-5">
          {/* Program Name & Summary */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/30">
            <h4 className="text-lg font-bold text-white mb-1">{name}</h4>
            <p className="text-sm text-gray-300">{description}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-xs">
              <span className="px-2 py-1 bg-dark-700 rounded-full text-gray-300">
                {totalWeeks} weeks
              </span>
              <span className="px-2 py-1 bg-dark-700 rounded-full text-gray-300">
                {daysPerWeek} days/week
              </span>
              <span className="px-2 py-1 bg-accent-primary/30 rounded-full text-accent-primary">
                {athleteLevel} level
              </span>
              {weeksUntilGoal && (
                <span className="px-2 py-1 bg-accent-secondary/30 rounded-full text-accent-secondary">
                  {weeksUntilGoal} weeks to race
                </span>
              )}
            </div>
          </div>

          {/* Phase Breakdown */}
          <div>
            <h5 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Training Phases
            </h5>
            <div className="space-y-2">
              {phaseBreakdown.map((phase, idx) => {
                const phaseInfo = getPhaseFocus(phase.name);
                const isCurrentPhase = phase.name === currentPhase;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      isCurrentPhase
                        ? 'bg-accent-primary/20 border-accent-primary/50'
                        : 'bg-dark-700 border-dark-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>{phaseInfo.icon}</span>
                        <span className="font-medium text-white">{phase.name}</span>
                        {isCurrentPhase && (
                          <span className="text-xs px-2 py-0.5 bg-accent-primary rounded-full text-white">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        Weeks {phase.startWeek}-{phase.endWeek} ({phase.weeks}w)
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{phaseInfo.focus}</p>
                    <p className="text-xs text-gray-500 mt-1">Intensity: {phaseInfo.intensity}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mileage Progression (for endurance) */}
          {mileageProgression && (
            <div>
              <h5 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Weekly Mileage Progression
              </h5>
              <div className="p-3 bg-dark-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">Start</span>
                  <span className="text-gray-400 text-sm">Peak</span>
                </div>
                <div className="relative h-8 bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full"
                    style={{ width: `${(mileageProgression.starting / mileageProgression.peak) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <span className="text-xs font-medium text-white">{mileageProgression.starting} mi</span>
                    <span className="text-xs font-medium text-white">{mileageProgression.peak} mi</span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {mileageProgression.milestones.slice(0, 3).map((m, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="text-gray-500">Wk {m.week}</span>
                      <p className="text-white font-medium">{m.mileage} mi</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Training Paces (for endurance) */}
          {paces && (
            <div>
              <h5 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Your Training Paces
              </h5>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Easy', pace: paces.easyPace, zone: 'Zone 2' },
                  { label: 'Tempo', pace: paces.tempoPace, zone: 'Zone 3-4' },
                  { label: 'Interval', pace: paces.intervalPace, zone: 'Zone 4-5' },
                  { label: 'Long Run', pace: paces.longRunPace, zone: 'Zone 2' },
                ].map((p, idx) => (
                  <div key={idx} className="p-2 bg-dark-700 rounded-lg">
                    <span className="text-xs text-gray-400">{p.label}</span>
                    <p className="text-sm font-medium text-white">{p.pace}</p>
                    <span className="text-xs text-gray-500">{p.zone}</span>
                  </div>
                ))}
              </div>
              {paces.currentPace && paces.goalPace !== paces.currentPace && (
                <p className="text-xs text-gray-400 mt-2">
                  Current: {paces.currentPace} → Goal: {paces.goalPace}
                </p>
              )}
            </div>
          )}

          {/* Strength Baselines (for strength programs) */}
          {baseline?.strength?.lifts?.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                Your Lift Targets
              </h5>
              <div className="space-y-2">
                {baseline.strength.lifts.map((lift, idx) => (
                  <div key={idx} className="p-2 bg-dark-700 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-white">{lift.exercise}</span>
                    <div className="text-right">
                      <span className="text-sm text-gray-400">{lift.current1RM}lbs</span>
                      <span className="text-gray-500 mx-1">→</span>
                      <span className="text-sm text-accent-secondary font-medium">{lift.target1RM}lbs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Starting Volume */}
          <div>
            <h5 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Weekly Structure
            </h5>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-dark-700 rounded-lg text-center">
                <p className="text-2xl font-bold text-white">{startingVolume.workoutDays}</p>
                <p className="text-xs text-gray-400">Workout Days</p>
              </div>
              <div className="p-3 bg-dark-700 rounded-lg text-center">
                <p className="text-2xl font-bold text-white">{startingVolume.totalExercises}</p>
                <p className="text-xs text-gray-400">Exercises/Week</p>
              </div>
              <div className="p-3 bg-dark-700 rounded-lg text-center">
                <p className="text-2xl font-bold text-white">{7 - startingVolume.workoutDays}</p>
                <p className="text-xs text-gray-400">Rest Days</p>
              </div>
            </div>
          </div>

          {/* Program Principles */}
          <div>
            <h5 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Program Principles
            </h5>
            <div className="space-y-2">
              {progressionRules && (
                <>
                  {progressionRules.mileageIncrease && (
                    <div className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-accent-warning mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{progressionRules.mileageIncrease}</span>
                    </div>
                  )}
                  {progressionRules.strengthIncrease && (
                    <div className="flex items-start gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-accent-success mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{progressionRules.strengthIncrease}</span>
                    </div>
                  )}
                  {progressionRules.deloadProtocol && (
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-accent-primary mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{progressionRules.deloadProtocol}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex items-start gap-2 text-sm">
                <Target className="w-4 h-4 text-accent-secondary mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  RPE-based intensity to auto-regulate based on daily readiness
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgramOverview;
