// Comprehensive Program Generator
// Creates personalized workout programs scaled for athlete level and goal timeline
// Tailored for top 10% athletes with realistic progression (max 5% volume increase/week)

// ============ ATHLETE LEVEL CALCULATION ============

function calculateAthleteLevel(formData) {
  const { trainingHistory, yearsTraining, currentTrainingDays } = formData;

  let score = 0;

  // Training history contribution (0-40 points)
  if (trainingHistory === 'consistent') score += 40;
  else if (trainingHistory === 'some') score += 20;
  else score += 5;

  // Years training contribution (0-35 points)
  const years = parseFloat(yearsTraining) || 0;
  score += Math.min(years * 3.5, 35);

  // Current training frequency contribution (0-25 points)
  const days = parseInt(currentTrainingDays) || 0;
  score += Math.min(days * 4, 25);

  // Score ranges: 0-30 = beginner, 31-60 = intermediate, 61-85 = advanced, 86+ = elite
  if (score >= 86) return { level: 'elite', score, multiplier: 1.4 };
  if (score >= 61) return { level: 'advanced', score, multiplier: 1.2 };
  if (score >= 31) return { level: 'intermediate', score, multiplier: 1.0 };
  return { level: 'beginner', score, multiplier: 0.8 };
}

// ============ PROGRAM LENGTH CALCULATION ============

function calculateProgramLength(formData) {
  const { raceDate, aestheticGoalDate, targetDate, programType, programSubtype } = formData;

  let goalDate = null;
  if (raceDate) goalDate = new Date(raceDate);
  else if (aestheticGoalDate) goalDate = new Date(aestheticGoalDate);
  else if (targetDate) goalDate = new Date(targetDate);

  if (goalDate) {
    const today = new Date();
    const weeksUntilGoal = Math.ceil((goalDate - today) / (1000 * 60 * 60 * 24 * 7));

    if (weeksUntilGoal > 52) return { totalWeeks: 52, weeksUntilGoal };
    if (weeksUntilGoal < 4) return { totalWeeks: 4, weeksUntilGoal };
    return { totalWeeks: weeksUntilGoal, weeksUntilGoal };
  }

  const defaults = {
    endurance: { marathon: 16, triathlon: 20, running: 12, cycling: 12, swimming: 12 },
    strength: { powerlifting: 12, olympic: 16, strongman: 12 },
    aesthetic: { hypertrophy: 12, 'lean-muscle': 16, recomp: 16 },
    fatloss: { aggressive: 8, moderate: 12, slow: 16 },
  };

  const totalWeeks = defaults[programType]?.[programSubtype] || 12;
  return { totalWeeks, weeksUntilGoal: null };
}

// ============ PERIODIZATION PHASES ============

function generatePeriodizationPhases(totalWeeks, programType, programSubtype) {
  const phases = [];

  if (programType === 'endurance' && (programSubtype === 'marathon' || programSubtype === 'triathlon')) {
    const baseWeeks = Math.floor(totalWeeks * 0.25);
    const build1Weeks = Math.floor(totalWeeks * 0.25);
    const build2Weeks = Math.floor(totalWeeks * 0.25);
    const peakWeeks = Math.floor(totalWeeks * 0.15);
    const taperWeeks = totalWeeks - baseWeeks - build1Weeks - build2Weeks - peakWeeks;

    for (let i = 0; i < baseWeeks; i++) phases.push('Base');
    for (let i = 0; i < build1Weeks; i++) phases.push('Build 1');
    for (let i = 0; i < build2Weeks; i++) phases.push('Build 2');
    for (let i = 0; i < peakWeeks; i++) phases.push('Peak');
    for (let i = 0; i < taperWeeks; i++) phases.push('Taper');
  } else {
    const cycleLength = 4;
    let currentWeek = 0;

    while (currentWeek < totalWeeks) {
      const cycleNumber = Math.floor(currentWeek / cycleLength);
      const weekInCycle = currentWeek % cycleLength;

      if (weekInCycle === 3) {
        phases.push('Deload');
      } else if (cycleNumber === 0) {
        phases.push('Base');
      } else if (currentWeek >= totalWeeks - 2) {
        phases.push('Peak');
      } else {
        phases.push('Build');
      }
      currentWeek++;
    }
  }

  return phases;
}

// ============ RUNNING PACE CALCULATOR ============

// Race equivalency factors (Riegel formula approximation)
// Used to convert baseline race time to equivalent performance at other distances
const RACE_EQUIVALENCY = {
  '5k': { factor: 1.0, miles: 3.1 },
  '10k': { factor: 2.09, miles: 6.2 },
  'half': { factor: 4.65, miles: 13.1 },
  'full': { factor: 9.8, miles: 26.2 },
  'ultra': { factor: 22, miles: 50 },
};

function parseTimeToMinutes(timeString) {
  if (!timeString) return 0;
  const parts = timeString.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + parts[2] / 60;
  } else if (parts.length === 2) {
    return parts[0] + parts[1] / 60; // mm:ss format
  }
  return 0;
}

function calculateEquivalentPace(baselineTime, baselineDistance, targetDistance) {
  // Use Riegel formula: T2 = T1 * (D2/D1)^1.06
  const baseMiles = RACE_EQUIVALENCY[baselineDistance]?.miles || 6.2;
  const targetMiles = RACE_EQUIVALENCY[targetDistance]?.miles || 26.2;

  const baseMinutes = parseTimeToMinutes(baselineTime);
  if (baseMinutes <= 0) return null;

  // Calculate equivalent time at target distance
  const equivalentMinutes = baseMinutes * Math.pow(targetMiles / baseMiles, 1.06);

  return equivalentMinutes / targetMiles; // pace in min/mile
}

function calculatePaces(targetFinishTime, raceDistance, baselineTime = null, baselineDistance = null) {
  const distances = {
    '5k': 3.1,
    '10k': 6.2,
    'half': 13.1,
    'full': 26.2,
    'ultra': 50,
  };

  const targetMiles = distances[raceDistance] || 26.2;
  let goalPace = null;
  let currentFitnessPace = null;

  // First, calculate current fitness from baseline (if provided)
  if (baselineTime && baselineDistance) {
    currentFitnessPace = calculateEquivalentPace(baselineTime, baselineDistance, raceDistance);
  }

  // Parse target time
  const targetMinutes = parseTimeToMinutes(targetFinishTime);
  if (targetMinutes > 0) {
    goalPace = targetMinutes / targetMiles;
  }

  // Use current fitness as starting point, goal pace as target
  // If no goal pace provided, use current fitness as both
  const referencePace = currentFitnessPace || goalPace;

  if (!referencePace) {
    // Default paces for top 10% athletes (sub-3:30 marathon capability)
    return {
      goalPace: '8:00/mi',
      currentPace: null,
      easyPace: '9:30-10:00/mi',
      tempoPace: '7:00-7:30/mi',
      intervalPace: '6:30-7:00/mi',
      longRunPace: '8:30-9:00/mi',
      recoveryPace: '10:00-10:30/mi',
    };
  }

  // Training paces based on current fitness level
  // Easy: +1:30-2:00 per mile from current race pace
  // Tempo: +0:15-0.30 from current race pace (threshold)
  // Interval: -0.30-0:45 from current race pace (VO2max)
  // Long: +1:00-1:30 per mile from current race pace

  return {
    goalPace: goalPace ? formatPace(goalPace) : formatPace(referencePace),
    currentPace: currentFitnessPace ? formatPace(currentFitnessPace) : null,
    easyPace: formatPace(referencePace + 1.5) + ' - ' + formatPace(referencePace + 2),
    tempoPace: formatPace(referencePace + 0.25) + ' - ' + formatPace(referencePace + 0.5),
    intervalPace: formatPace(referencePace - 0.5) + ' - ' + formatPace(referencePace - 0.25),
    longRunPace: formatPace(referencePace + 1) + ' - ' + formatPace(referencePace + 1.5),
    recoveryPace: formatPace(referencePace + 2) + ' - ' + formatPace(referencePace + 2.5),
  };
}

function formatPace(decimalMinutes) {
  const mins = Math.floor(decimalMinutes);
  const secs = Math.round((decimalMinutes - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}/mi`;
}

// ============ MILEAGE PROGRESSION CALCULATOR ============
// Max 5% increase per week, starting from user's current mileage

function calculateWeeklyMileage(totalWeeks, peakMileage, currentWeek, phase, startingMileage = null) {
  const maxWeeklyIncrease = 0.05; // 5% max per week

  // Use provided starting mileage or calculate from peak
  let baseMileage = startingMileage;
  if (!baseMileage || baseMileage <= 0) {
    // Fallback: work backward from peak using max 5% increases
    const weeksToBuildup = Math.floor(totalWeeks * 0.85);
    baseMileage = peakMileage / Math.pow(1 + maxWeeklyIncrease, weeksToBuildup);
  }

  // Ensure starting mileage is realistic (at least 10 miles/week for runners)
  baseMileage = Math.max(baseMileage, 10);

  // Apply phase-specific adjustments
  if (phase === 'Taper') {
    // Taper is based on where you ARE, not where you started
    const currentMileageBeforeTaper = Math.min(
      baseMileage * Math.pow(1 + maxWeeklyIncrease, currentWeek - 3),
      peakMileage
    );
    return Math.round(currentMileageBeforeTaper * 0.6); // 40% reduction for taper
  }

  if (phase === 'Deload') {
    // Deload week: reduce by 30% from current progression
    const normalMileage = baseMileage * Math.pow(1 + maxWeeklyIncrease, currentWeek - 1);
    return Math.round(Math.min(normalMileage, peakMileage) * 0.7);
  }

  // Progressive increase (max 5% per week from actual starting point)
  const weekMileage = baseMileage * Math.pow(1 + maxWeeklyIncrease, currentWeek - 1);
  return Math.min(Math.round(weekMileage), peakMileage);
}

function calculateLongRunCap(longestRecentRun, weekNumber, athleteLevel) {
  // Cap long run based on what the user has actually done recently
  // First few weeks: don't exceed longest recent run by more than 10%
  // Then progressively increase

  const recentMax = parseFloat(longestRecentRun) || 10;
  const { level } = athleteLevel;

  // Maximum long run for race type
  const absoluteMax = level === 'elite' ? 22 : level === 'advanced' ? 20 : 18;

  // Week 1-2: stay at or below recent longest
  if (weekNumber <= 2) {
    return Math.min(recentMax, absoluteMax);
  }

  // After that, can increase by ~1 mile every 2 weeks
  const additionalMiles = Math.floor((weekNumber - 2) / 2);
  return Math.min(recentMax + additionalMiles, absoluteMax);
}

// ============ WORKOUT TEMPLATES ============

const SPLIT_TEMPLATES = {
  2: {
    strength: [
      { name: 'Full Body A', focus: ['legs', 'chest', 'back'] },
      { name: 'Full Body B', focus: ['legs', 'shoulders', 'back'] },
    ],
    aesthetic: [
      { name: 'Upper Body', focus: ['chest', 'back', 'shoulders', 'arms'] },
      { name: 'Lower Body', focus: ['legs', 'glutes', 'core'] },
    ],
  },
  3: {
    strength: [
      { name: 'Squat Day', focus: ['legs', 'core'] },
      { name: 'Bench Day', focus: ['chest', 'shoulders', 'triceps'] },
      { name: 'Deadlift Day', focus: ['posterior', 'back', 'biceps'] },
    ],
    aesthetic: [
      { name: 'Push', focus: ['chest', 'shoulders', 'triceps'] },
      { name: 'Pull', focus: ['back', 'biceps', 'rear-delts'] },
      { name: 'Legs', focus: ['legs', 'glutes', 'core'] },
    ],
  },
  4: {
    strength: [
      { name: 'Heavy Squat', focus: ['legs', 'core'] },
      { name: 'Heavy Bench', focus: ['chest', 'shoulders', 'triceps'] },
      { name: 'Heavy Deadlift', focus: ['posterior', 'back'] },
      { name: 'Volume Upper', focus: ['shoulders', 'chest', 'arms'] },
    ],
    aesthetic: [
      { name: 'Upper Push', focus: ['chest', 'shoulders', 'triceps'] },
      { name: 'Lower', focus: ['legs', 'glutes'] },
      { name: 'Upper Pull', focus: ['back', 'biceps', 'rear-delts'] },
      { name: 'Arms + Shoulders', focus: ['shoulders', 'biceps', 'triceps'] },
    ],
  },
  5: {
    strength: [
      { name: 'Competition Squat', focus: ['legs'] },
      { name: 'Competition Bench', focus: ['chest', 'triceps'] },
      { name: 'Competition Deadlift', focus: ['posterior', 'back'] },
      { name: 'Volume Squat', focus: ['legs', 'core'] },
      { name: 'Volume Bench', focus: ['shoulders', 'chest', 'arms'] },
    ],
    aesthetic: [
      { name: 'Chest + Triceps', focus: ['chest', 'triceps'] },
      { name: 'Back + Biceps', focus: ['back', 'biceps'] },
      { name: 'Shoulders + Rear Delts', focus: ['shoulders', 'rear-delts'] },
      { name: 'Legs', focus: ['legs', 'glutes'] },
      { name: 'Arms + Weak Points', focus: ['biceps', 'triceps', 'core'] },
    ],
  },
  6: {
    strength: [
      { name: 'Heavy Squat', focus: ['legs'] },
      { name: 'Heavy Bench', focus: ['chest', 'triceps'] },
      { name: 'Heavy Deadlift', focus: ['posterior', 'back'] },
      { name: 'Speed Squat', focus: ['legs', 'core'] },
      { name: 'Speed Bench', focus: ['chest', 'shoulders'] },
      { name: 'Back + Arms', focus: ['back', 'biceps', 'triceps'] },
    ],
    aesthetic: [
      { name: 'Push A (Heavy)', focus: ['chest', 'shoulders', 'triceps'] },
      { name: 'Pull A (Heavy)', focus: ['back', 'biceps'] },
      { name: 'Legs A (Quad Focus)', focus: ['legs', 'glutes'] },
      { name: 'Push B (Volume)', focus: ['chest', 'shoulders', 'triceps'] },
      { name: 'Pull B (Volume)', focus: ['back', 'rear-delts', 'biceps'] },
      { name: 'Legs B (Posterior)', focus: ['legs', 'core'] },
    ],
  },
};

const ENDURANCE_TEMPLATES = {
  running: {
    2: ['Easy Run', 'Long Run'],
    3: ['Easy Run', 'Tempo Run', 'Long Run'],
    4: ['Easy Run', 'Tempo Run', 'Intervals', 'Long Run'],
    5: ['Easy Run', 'Tempo Run', 'Recovery Run', 'Intervals', 'Long Run'],
    6: ['Easy Run', 'Tempo Run', 'Easy Run', 'Intervals', 'Recovery Run', 'Long Run'],
  },
  triathlon: {
    3: ['Swim', 'Bike', 'Run'],
    4: ['Swim', 'Bike', 'Run', 'Brick'],
    5: ['Swim', 'Bike', 'Run', 'Swim + Strength', 'Long Ride'],
    6: ['Swim AM', 'Bike', 'Run', 'Swim', 'Bike', 'Long Run'],
  },
};

// ============ HELPER FUNCTIONS ============

function getDayName(dayIndex) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayIndex];
}

function distributeWorkoutDays(daysPerWeek) {
  const distributions = {
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 4],
    5: [0, 1, 2, 4, 5],
    6: [0, 1, 2, 3, 4, 5],
    7: [0, 1, 2, 3, 4, 5, 6],
  };
  return distributions[daysPerWeek] || distributions[4];
}

// ============ EXERCISE GENERATORS ============

function generateStrengthExercises(focus, phase, isDeload, athleteLevel, weekNumber, strengthBaselines = []) {
  const exercises = [];
  const { multiplier, level } = athleteLevel;

  const volumeBase = isDeload ? 0.5 : (phase === 'Build' ? 1.1 : 1.0);
  const volumeMultiplier = volumeBase * multiplier;
  const rpeBase = isDeload ? 5 : (level === 'elite' ? 9 : level === 'advanced' ? 8.5 : level === 'intermediate' ? 8 : 7);

  // Progressive overload tracking
  const weekProgression = Math.floor((weekNumber - 1) / 4); // Progress every 4 weeks

  const getRepRange = (baseReps) => {
    if (level === 'elite') return baseReps.replace(/(\d+)-(\d+)/, (_, min, max) => `${Math.max(1, parseInt(min)-2)}-${parseInt(max)-2}`);
    if (level === 'advanced') return baseReps.replace(/(\d+)-(\d+)/, (_, min, max) => `${Math.max(1, parseInt(min)-1)}-${parseInt(max)-1}`);
    return baseReps;
  };

  // Helper to get baseline for a lift
  const getBaseline = (exerciseName) => {
    const mapping = {
      'Back Squat': 'squat',
      'Bench Press': 'bench',
      'Deadlift': 'deadlift',
      'Overhead Press': 'ohp',
      'Barbell Row': 'row',
    };
    const id = mapping[exerciseName];
    return strengthBaselines.find(b => b.id === id);
  };

  // Calculate working weight from 1RM
  const getWorkingWeight = (oneRM, reps, rpeTarget) => {
    if (!oneRM) return null;
    // Epley formula inverse + RPE adjustment
    const repMax = parseFloat(oneRM);
    const repsInRange = parseInt(reps.split('-')[1]) || parseInt(reps);
    const percentOf1RM = 1 / (1 + 0.0333 * repsInRange);
    const rpeAdjust = (10 - rpeTarget) * 0.03; // ~3% per RPE below 10
    return Math.round((repMax * percentOf1RM * (1 - rpeAdjust)) / 5) * 5; // Round to nearest 5
  };

  if (focus.includes('legs') || focus.includes('Squat')) {
    const baseline = getBaseline('Back Squat');
    const reps = phase === 'Peak' ? getRepRange('1-3') : phase === 'Build' ? getRepRange('3-5') : getRepRange('5-8');
    const workingWeight = getWorkingWeight(baseline?.current, reps, rpeBase);

    exercises.push({
      name: 'Back Squat',
      sets: Math.round(5 * volumeMultiplier),
      reps,
      rpe: rpeBase,
      rest: level === 'elite' ? '4-5 min' : '3-4 min',
      notes: level === 'elite' ? 'Competition depth, pause at bottom' : 'Control descent, drive through heels',
      startingWeight: workingWeight ? `~${workingWeight}lbs` : null,
      current1RM: baseline?.current ? `${baseline.current}lbs` : null,
      target1RM: baseline?.target ? `${baseline.target}lbs` : null,
      progression: baseline?.current
        ? `Week ${weekNumber}: Start ~${workingWeight}lbs (${Math.round(workingWeight / baseline.current * 100)}% of 1RM). Target: ${baseline.target}lbs. Add 5lbs when all reps hit at RPE ${rpeBase}`
        : `Week ${weekNumber}: +${weekProgression * 5}lbs from starting weight. Add 5lbs when all reps hit at RPE ${rpeBase}`,
    });

    if (level === 'advanced' || level === 'elite') {
      exercises.push({
        name: 'Pause Squat',
        sets: Math.round(3 * volumeMultiplier),
        reps: '3-5',
        rpe: rpeBase - 1,
        rest: '3-4 min',
        notes: '2-3 second pause in the hole',
        progression: `Accessory: increase when main squat increases`,
      });
    }
  }

  if (focus.includes('chest') || focus.includes('Bench')) {
    const baseline = getBaseline('Bench Press');
    const reps = phase === 'Peak' ? getRepRange('1-3') : phase === 'Build' ? getRepRange('3-5') : getRepRange('5-8');
    const workingWeight = getWorkingWeight(baseline?.current, reps, rpeBase);

    exercises.push({
      name: 'Bench Press',
      sets: Math.round(5 * volumeMultiplier),
      reps,
      rpe: rpeBase,
      rest: level === 'elite' ? '4-5 min' : '3-4 min',
      notes: level === 'elite' ? 'Competition pause, leg drive, tight arch' : 'Arch back, retract scapula',
      startingWeight: workingWeight ? `~${workingWeight}lbs` : null,
      current1RM: baseline?.current ? `${baseline.current}lbs` : null,
      target1RM: baseline?.target ? `${baseline.target}lbs` : null,
      progression: baseline?.current
        ? `Week ${weekNumber}: Start ~${workingWeight}lbs (${Math.round(workingWeight / baseline.current * 100)}% of 1RM). Target: ${baseline.target}lbs. Add 2.5lbs when all reps hit at RPE ${rpeBase}`
        : `Week ${weekNumber}: +${weekProgression * 2.5}lbs from starting weight. Add 2.5lbs when all reps hit at RPE ${rpeBase}`,
    });

    if (level === 'advanced' || level === 'elite') {
      exercises.push({
        name: 'Close-Grip Bench',
        sets: Math.round(4 * volumeMultiplier),
        reps: '4-6',
        rpe: rpeBase - 1,
        rest: '3 min',
        notes: 'Tricep focus, elbows tucked',
        progression: `Keep ~70% of competition bench`,
      });
    }
  }

  if (focus.includes('posterior') || focus.includes('Deadlift')) {
    const baseline = getBaseline('Deadlift');
    const reps = phase === 'Peak' ? getRepRange('1-2') : phase === 'Build' ? getRepRange('2-4') : getRepRange('4-6');
    const workingWeight = getWorkingWeight(baseline?.current, reps, rpeBase);

    exercises.push({
      name: 'Deadlift',
      sets: Math.round(4 * volumeMultiplier),
      reps,
      rpe: rpeBase,
      rest: level === 'elite' ? '5-6 min' : '4-5 min',
      notes: level === 'elite' ? 'Competition setup, maximal brace' : 'Brace core, hinge at hips',
      startingWeight: workingWeight ? `~${workingWeight}lbs` : null,
      current1RM: baseline?.current ? `${baseline.current}lbs` : null,
      target1RM: baseline?.target ? `${baseline.target}lbs` : null,
      progression: baseline?.current
        ? `Week ${weekNumber}: Start ~${workingWeight}lbs (${Math.round(workingWeight / baseline.current * 100)}% of 1RM). Target: ${baseline.target}lbs. Add 5-10lbs when all reps hit at RPE ${rpeBase}`
        : `Week ${weekNumber}: +${weekProgression * 10}lbs from starting weight. Add 5-10lbs when all reps hit at RPE ${rpeBase}`,
    });

    if (level === 'advanced' || level === 'elite') {
      exercises.push({
        name: 'Deficit Deadlift',
        sets: Math.round(3 * volumeMultiplier),
        reps: '3-5',
        rpe: rpeBase - 1,
        rest: '4 min',
        notes: '2-3 inch deficit, focus on speed off floor',
        progression: `Keep at 80-85% of comp deadlift`,
      });
    }
  }

  if (focus.includes('shoulders') || focus.includes('OHP')) {
    exercises.push({
      name: 'Overhead Press',
      sets: Math.round(4 * volumeMultiplier),
      reps: phase === 'Peak' ? getRepRange('3-5') : getRepRange('5-8'),
      rpe: rpeBase,
      rest: '2-3 min',
      notes: 'Squeeze glutes, press straight up',
      progression: `Week ${weekNumber}: +${weekProgression * 2.5}lbs. Add 2.5lbs when all reps complete`,
    });
  }

  if (focus.includes('back')) {
    exercises.push({
      name: 'Barbell Row',
      sets: Math.round(4 * volumeMultiplier),
      reps: level === 'elite' ? '4-6' : '6-8',
      rpe: rpeBase - 1,
      rest: '2-3 min',
      notes: level === 'elite' ? 'Explosive pull, controlled negative' : 'Pull to lower chest, squeeze at top',
      progression: `Add 5lbs every 2 weeks when form stays solid`,
    });

    exercises.push({
      name: 'Weighted Pull-ups',
      sets: Math.round(4 * volumeMultiplier),
      reps: level === 'elite' ? '5-8' : '6-10',
      rpe: rpeBase - 1,
      rest: '2-3 min',
      notes: 'Add weight as needed, full ROM',
      progression: `Add 2.5-5lbs when hitting top of rep range`,
    });
  }

  if (focus.includes('triceps')) {
    exercises.push({
      name: level === 'elite' ? 'JM Press' : 'Tricep Pushdowns',
      sets: Math.round(3 * volumeMultiplier),
      reps: '8-12',
      rpe: 7,
      rest: '90s',
      notes: level === 'elite' ? 'Bench accessory, lockout strength' : 'Keep elbows pinned',
      progression: `Add reps first (8→12), then add 5lbs and reset to 8 reps`,
    });
  }

  if (focus.includes('biceps')) {
    exercises.push({
      name: 'Barbell Curls',
      sets: Math.round(3 * volumeMultiplier),
      reps: '8-12',
      rpe: 7,
      rest: '90s',
      notes: 'Full range of motion, no swinging',
      progression: `Add reps first (8→12), then add 5lbs and reset to 8 reps`,
    });
  }

  if (focus.includes('core')) {
    exercises.push({
      name: 'Hanging Leg Raises',
      sets: Math.round(3 * volumeMultiplier),
      reps: level === 'elite' ? '12-15' : '10-12',
      rpe: 7,
      rest: '60s',
      notes: 'Control the movement, no swinging',
      progression: `Add weight (hold DB) when hitting 15 reps`,
    });
  }

  return exercises;
}

function generateAestheticExercises(focus, phase, isDeload, athleteLevel, weekNumber) {
  const exercises = [];
  const { multiplier, level } = athleteLevel;

  const volumeBase = isDeload ? 0.5 : (phase === 'Build' ? 1.15 : 1.0);
  const volumeMultiplier = volumeBase * multiplier;
  const rpeBase = isDeload ? 5 : (level === 'elite' ? 9 : level === 'advanced' ? 8.5 : 8);

  // Progressive overload: add reps each week, then weight
  const weekInCycle = ((weekNumber - 1) % 4) + 1;
  const repBonus = weekInCycle - 1; // 0, 1, 2, 0 (deload resets)

  if (focus.includes('chest')) {
    exercises.push({
      name: 'Bench Press',
      sets: Math.round(4 * volumeMultiplier),
      reps: `${8 + repBonus}-${10 + repBonus}`,
      rpe: rpeBase,
      rest: '2-3 min',
      notes: 'Focus on chest contraction',
      progression: `Week ${weekInCycle}/4: ${repBonus === 0 ? 'Base reps' : `+${repBonus} reps from base`}. Add 5lbs at week 4 if all reps hit`,
    });
    exercises.push({
      name: 'Incline Dumbbell Press',
      sets: Math.round(4 * volumeMultiplier),
      reps: `${8 + repBonus}-${12 + repBonus}`,
      rpe: rpeBase - 1,
      rest: '90s',
      notes: '30-45 degree incline, control the negative',
      progression: `Progressive overload: reps → weight → reps`,
    });
    exercises.push({
      name: 'Cable Chest Fly',
      sets: Math.round(3 * volumeMultiplier),
      reps: '12-15',
      rpe: 7,
      rest: '60s',
      notes: 'Squeeze hard at contraction',
      progression: `Isolation: focus on mind-muscle connection over weight`,
    });

    if (level === 'advanced' || level === 'elite') {
      exercises.push({
        name: 'Weighted Dips',
        sets: Math.round(3 * volumeMultiplier),
        reps: '8-12',
        rpe: 8,
        rest: '2 min',
        notes: 'Lean forward for chest emphasis',
        progression: `Add 5lbs when hitting 12 reps`,
      });
    }
  }

  if (focus.includes('back')) {
    exercises.push({
      name: 'Weighted Pull-ups',
      sets: Math.round(4 * volumeMultiplier),
      reps: `${6 + Math.floor(repBonus/2)}-${10 + Math.floor(repBonus/2)}`,
      rpe: rpeBase,
      rest: '2-3 min',
      notes: 'Full stretch at bottom, chin over bar',
      progression: `Add 2.5lbs when hitting top of rep range consistently`,
    });
    exercises.push({
      name: 'Barbell Row',
      sets: Math.round(4 * volumeMultiplier),
      reps: `${6 + repBonus}-${10 + repBonus}`,
      rpe: rpeBase - 1,
      rest: '2 min',
      notes: 'Squeeze lats at top',
      progression: `Add 5lbs when form stays solid at top reps`,
    });
    exercises.push({
      name: 'Lat Pulldown',
      sets: Math.round(3 * volumeMultiplier),
      reps: '10-12',
      rpe: 7,
      rest: '90s',
      notes: 'Drive elbows down, chest up',
      progression: `Focus on stretch and contraction over weight`,
    });
    exercises.push({
      name: 'Seated Cable Row',
      sets: Math.round(3 * volumeMultiplier),
      reps: '10-12',
      rpe: 7,
      rest: '90s',
      notes: 'Pull to lower chest, squeeze',
      progression: `Add weight when form is solid`,
    });
  }

  if (focus.includes('shoulders')) {
    exercises.push({
      name: 'Overhead Press',
      sets: Math.round(4 * volumeMultiplier),
      reps: level === 'elite' ? '5-8' : '8-10',
      rpe: rpeBase,
      rest: '2-3 min',
      notes: 'Strict form, no leg drive',
      progression: `Add 2.5lbs when all reps completed`,
    });
    exercises.push({
      name: 'Lateral Raises',
      sets: Math.round(4 * volumeMultiplier),
      reps: '12-15',
      rpe: 7,
      rest: '60s',
      notes: 'Lead with elbows, control the negative',
      progression: `Add 1 rep per week, then increase weight`,
    });

    if (level === 'advanced' || level === 'elite') {
      exercises.push({
        name: 'Cable Lateral Raises',
        sets: 3,
        reps: '15-20',
        rpe: 8,
        rest: '45s',
        notes: 'Constant tension, squeeze at top',
        progression: `Drop sets on final set for extra stimulus`,
      });
    }
  }

  if (focus.includes('legs') || focus.includes('glutes')) {
    exercises.push({
      name: 'Back Squat',
      sets: Math.round(4 * volumeMultiplier),
      reps: level === 'elite' ? '5-8' : '8-10',
      rpe: rpeBase,
      rest: '3 min',
      notes: 'ATG depth if mobility allows',
      progression: `Add 5lbs when all reps completed at target RPE`,
    });
    exercises.push({
      name: 'Romanian Deadlift',
      sets: Math.round(4 * volumeMultiplier),
      reps: '8-12',
      rpe: rpeBase - 1,
      rest: '2 min',
      notes: 'Feel the hamstring stretch',
      progression: `Add 5lbs when form is solid at 12 reps`,
    });
    exercises.push({
      name: 'Leg Press',
      sets: Math.round(3 * volumeMultiplier),
      reps: '10-15',
      rpe: 8,
      rest: '2 min',
      notes: 'Full range of motion',
      progression: `Volume work: push the reps before weight`,
    });
    exercises.push({
      name: 'Leg Curls',
      sets: Math.round(3 * volumeMultiplier),
      reps: '12-15',
      rpe: 7,
      rest: '60s',
      notes: 'Squeeze at top, slow negative',
      progression: `Focus on contraction quality`,
    });
    exercises.push({
      name: 'Standing Calf Raises',
      sets: Math.round(4 * volumeMultiplier),
      reps: '12-15',
      rpe: 8,
      rest: '60s',
      notes: 'Full stretch at bottom, pause at top',
      progression: `Calves respond to frequency - hit 3x/week if lagging`,
    });
  }

  if (focus.includes('biceps')) {
    exercises.push({
      name: 'Barbell Curls',
      sets: Math.round(3 * volumeMultiplier),
      reps: '8-12',
      rpe: 8,
      rest: '90s',
      notes: 'No swinging, squeeze at top',
      progression: `Add reps first, then weight`,
    });
    exercises.push({
      name: 'Hammer Curls',
      sets: Math.round(3 * volumeMultiplier),
      reps: '10-12',
      rpe: 7,
      rest: '60s',
      notes: 'Control throughout',
      progression: `Brachialis focus - great for arm thickness`,
    });
  }

  if (focus.includes('triceps')) {
    exercises.push({
      name: 'Tricep Pushdowns',
      sets: Math.round(3 * volumeMultiplier),
      reps: '10-12',
      rpe: 8,
      rest: '90s',
      notes: 'Lock out at bottom',
      progression: `Add weight when 12 reps is easy`,
    });
    exercises.push({
      name: 'Overhead Tricep Extension',
      sets: Math.round(3 * volumeMultiplier),
      reps: '12-15',
      rpe: 7,
      rest: '60s',
      notes: 'Feel the stretch at bottom',
      progression: `Long head focus - crucial for tricep size`,
    });
  }

  if (focus.includes('rear-delts')) {
    exercises.push({
      name: 'Face Pulls',
      sets: Math.round(4 * volumeMultiplier),
      reps: '15-20',
      rpe: 7,
      rest: '60s',
      notes: 'External rotation at top',
      progression: `Health exercise: keep light, focus on form`,
    });
  }

  if (focus.includes('core')) {
    exercises.push({
      name: 'Hanging Leg Raises',
      sets: 3,
      reps: '12-15',
      rpe: 8,
      rest: '60s',
      notes: 'Control the movement',
      progression: `Add weight (hold DB) when hitting 15 reps`,
    });
  }

  return exercises;
}

function generateEnduranceSession(type, phase, isDeload, startingMileage, athleteLevel, paces, weekNumber, totalWeeks, maxLongRun = null) {
  const { multiplier, level } = athleteLevel;

  // Calculate this week's mileage based on progressive 5% max increase from starting point
  const peakWeeklyMileage = level === 'elite' ? 60 : level === 'advanced' ? 50 : 40;
  const currentWeekMileage = calculateWeeklyMileage(totalWeeks, peakWeeklyMileage, weekNumber, phase, startingMileage);

  // Calculate long run cap based on what user has actually done
  const longRunCap = calculateLongRunCap(maxLongRun, weekNumber, athleteLevel);

  // Phase-specific adjustments
  const phaseMultiplier = phase === 'Taper' ? 0.6 : phase === 'Peak' ? 1.1 : phase.includes('Build') ? 1.0 : 0.85;

  switch (type) {
    case 'Easy Run': {
      const miles = Math.round(currentWeekMileage * 0.2 * phaseMultiplier * 10) / 10;
      return {
        name: 'Easy Run',
        duration: Math.round(miles * 10), // ~10 min/mile for easy
        exercises: [{
          name: 'Easy Run',
          sets: 1,
          reps: `${miles} miles`,
          pace: paces.easyPace,
          heartRateZone: 'Zone 2 (65-75% max HR)',
          rpe: 4,
          rest: 'N/A',
          notes: 'Should be able to hold a conversation. If breathing hard, slow down.',
          progression: `Week ${weekNumber}: ${miles} mi. Max 5% increase per week.`,
        }],
      };
    }

    case 'Tempo Run': {
      const warmupMiles = 1.5;
      const tempoMiles = Math.round(currentWeekMileage * 0.15 * phaseMultiplier * 10) / 10;
      const cooldownMiles = 1;
      return {
        name: 'Tempo Run',
        duration: Math.round((warmupMiles + tempoMiles + cooldownMiles) * 9),
        exercises: [
          {
            name: 'Warm-up',
            sets: 1,
            reps: `${warmupMiles} miles`,
            pace: paces.easyPace,
            heartRateZone: 'Zone 2',
            rpe: 4,
            rest: 'N/A',
            notes: 'Include 4x100m strides at end',
          },
          {
            name: 'Tempo',
            sets: 1,
            reps: `${tempoMiles} miles`,
            pace: paces.tempoPace,
            heartRateZone: 'Zone 3-4 (80-88% max HR)',
            rpe: 7,
            rest: 'N/A',
            notes: 'Comfortably hard - can speak in short sentences only',
            progression: `Week ${weekNumber}: ${tempoMiles} mi tempo. Lactate threshold training.`,
          },
          {
            name: 'Cool-down',
            sets: 1,
            reps: `${cooldownMiles} miles`,
            pace: paces.recoveryPace,
            heartRateZone: 'Zone 1-2',
            rpe: 3,
            rest: 'N/A',
            notes: 'Very easy, let HR come down',
          },
        ],
      };
    }

    case 'Intervals': {
      const intervalCount = level === 'elite' ? 8 : level === 'advanced' ? 6 : 5;
      const intervalDistance = level === 'elite' ? '800m' : '400m';
      const adjustedCount = isDeload ? Math.floor(intervalCount / 2) :
                           phase === 'Peak' ? intervalCount + 2 : intervalCount;
      return {
        name: 'Interval Training',
        duration: 55,
        exercises: [
          {
            name: 'Warm-up',
            sets: 1,
            reps: '1.5 miles',
            pace: paces.easyPace,
            heartRateZone: 'Zone 2',
            rpe: 4,
            rest: 'N/A',
            notes: 'Include dynamic stretches and 4x100m strides',
          },
          {
            name: `${intervalDistance} Repeats`,
            sets: adjustedCount,
            reps: intervalDistance,
            pace: paces.intervalPace,
            heartRateZone: 'Zone 4-5 (88-95% max HR)',
            rpe: 9,
            rest: level === 'elite' ? '2:00 jog' : '1:30 jog',
            notes: `Consistent pace each rep. Target ${paces.intervalPace}`,
            progression: `Week ${weekNumber}: ${adjustedCount}x${intervalDistance}. Add 1 rep every 2-3 weeks.`,
          },
          {
            name: 'Cool-down',
            sets: 1,
            reps: '1 mile',
            pace: paces.recoveryPace,
            heartRateZone: 'Zone 1',
            rpe: 3,
            rest: 'N/A',
            notes: 'Easy jog + static stretching',
          },
        ],
      };
    }

    case 'Long Run': {
      const longRunMiles = Math.round(currentWeekMileage * 0.30 * phaseMultiplier * 10) / 10;
      const absoluteMaxLongRun = level === 'elite' ? 22 : level === 'advanced' ? 20 : 18;
      // Use the smaller of: calculated mileage, progression-based cap, absolute max
      const cappedMiles = Math.min(longRunMiles, longRunCap, absoluteMaxLongRun);
      return {
        name: 'Long Run',
        duration: Math.round(cappedMiles * 9.5),
        exercises: [{
          name: 'Long Run',
          sets: 1,
          reps: `${cappedMiles} miles`,
          pace: paces.longRunPace,
          heartRateZone: 'Zone 2 (start) → Zone 3 (finish)',
          rpe: 6,
          rest: 'N/A',
          notes: phase === 'Peak'
            ? `Practice race nutrition. Last 3mi at ${paces.goalPace} (goal pace)`
            : 'Practice race nutrition. Keep even effort throughout.',
          progression: `Week ${weekNumber}: ${cappedMiles} mi. Current cap: ${longRunCap}mi (increases ~1mi/2wks). Peak: ${absoluteMaxLongRun}mi.`,
        }],
      };
    }

    case 'Recovery Run': {
      return {
        name: 'Recovery Run',
        duration: 30,
        exercises: [{
          name: 'Recovery Run',
          sets: 1,
          reps: '3-4 miles',
          pace: paces.recoveryPace,
          heartRateZone: 'Zone 1 (60-65% max HR)',
          rpe: 3,
          rest: 'N/A',
          notes: 'Truly easy. This should feel almost too slow. Promotes recovery.',
          progression: 'Keep consistent - dont increase recovery run distance',
        }],
      };
    }

    default:
      return {
        name: type,
        duration: 45,
        exercises: [{
          name: type,
          sets: 1,
          reps: '45 min',
          rpe: 6,
          rest: 'N/A',
          notes: 'Moderate steady effort',
        }],
      };
  }
}

function generateFatLossSession(dayFocus, phase, isDeload, athleteLevel, weekNumber) {
  const exercises = [];
  const { multiplier, level } = athleteLevel;

  exercises.push({
    name: level === 'elite' ? 'EMOM Circuit' : 'HIIT Circuit',
    sets: isDeload ? 2 : Math.round(4 * multiplier),
    reps: level === 'elite' ? '45s work / 15s rest' : '30s work / 30s rest',
    rpe: 9,
    rest: '2 min between rounds',
    notes: level === 'elite'
      ? 'Burpees, box jumps, KB swings, battle ropes'
      : 'Max effort during work intervals',
    progression: `Week ${weekNumber}: Add 1 round every 2 weeks`,
  });

  const strengthExercises = generateAestheticExercises(dayFocus, phase, isDeload, athleteLevel, weekNumber);
  exercises.push(...strengthExercises.slice(0, 4));

  if (!isDeload) {
    exercises.push({
      name: level === 'elite' ? 'Assault Bike' : 'Incline Walk',
      sets: 1,
      reps: level === 'elite' ? '10 min intervals' : '15-20 min',
      rpe: level === 'elite' ? 8 : 5,
      rest: 'N/A',
      notes: level === 'elite'
        ? '30s sprint / 30s recovery'
        : '10-12% incline, 3.0-3.5 mph',
      progression: `Add 5 min per week or increase intensity`,
    });
  }

  return exercises;
}

// ============ SMART HYBRID SCHEDULING ============
// For hybrid programs, intelligently place secondary workouts to maximize recovery

function isHardRunningDay(runType) {
  // Hard running days that need recovery
  const hardDays = ['Tempo Run', 'Intervals', 'Long Run', 'Interval Training'];
  return hardDays.includes(runType);
}

function isEasyRunningDay(runType) {
  // Easy days where adding strength is acceptable
  const easyDays = ['Easy Run', 'Recovery Run'];
  return easyDays.includes(runType);
}

function createSmartHybridSchedule(
  desiredTrainingDays,
  primaryType,
  secondaryType,
  allowDoubleDays,
  enduranceTemplates,
  paces,
  athleteLevel,
  currentPhase,
  isDeload,
  currentWeek,
  totalWeeks,
  startingMileage,
  maxLongRun,
  strengthGoals
) {
  // For endurance primary + strength secondary:
  // - Place strength on easy run days
  // - Never schedule heavy lifting day before long run
  // - On hard run days (tempo, intervals), no strength
  // - Allow dedicated strength days if days permit

  const schedule = [];
  const runSchedule = enduranceTemplates[desiredTrainingDays] || enduranceTemplates[4];

  // Identify which run days are hard vs easy
  const runDayInfo = runSchedule.map((runType, idx) => ({
    runType,
    isHard: isHardRunningDay(runType),
    isLongRun: runType === 'Long Run',
    dayIndex: idx,
  }));

  // Find the long run day (usually last workout day)
  const longRunDayIndex = runDayInfo.findIndex(d => d.isLongRun);

  // Determine which days get strength work
  // Rule: strength on easy days, not day before long run
  const strengthDays = [];
  const strengthOnlyDays = []; // Days where we ONLY do strength

  runDayInfo.forEach((day, idx) => {
    const isBeforeLongRun = longRunDayIndex !== -1 && idx === longRunDayIndex - 1;

    if (allowDoubleDays && day.isHard === false && !isBeforeLongRun) {
      // Easy run day - can add strength
      strengthDays.push(idx);
    } else if (!day.isHard && !isBeforeLongRun) {
      // Even without double days, mark as potential
      strengthDays.push(idx);
    }
  });

  // If we have 6 training days and running is 5, we have 1 strength-only day
  // Place strength-only day NOT the day before long run
  if (desiredTrainingDays >= 5 && runSchedule.length <= 5) {
    // Find a day that's not right before long run for strength-only
    for (let i = 0; i < 7; i++) {
      const isBeforeLongRun = longRunDayIndex !== -1 &&
        i === (longRunDayIndex > 0 ? longRunDayIndex - 1 : 6);
      if (!runDayInfo.find(d => d.dayIndex === i) && !isBeforeLongRun) {
        strengthOnlyDays.push(i);
        break;
      }
    }
  }

  // Build the actual schedule
  // Standard day distribution
  const dayDistributions = {
    2: [0, 3],     // Mon, Thu
    3: [0, 2, 4],  // Mon, Wed, Fri
    4: [0, 1, 3, 4], // Mon, Tue, Thu, Fri
    5: [0, 1, 2, 4, 5], // Mon-Wed, Fri-Sat
    6: [0, 1, 2, 3, 4, 5], // Mon-Sat
    7: [0, 1, 2, 3, 4, 5, 6],
  };

  const workoutDays = dayDistributions[desiredTrainingDays] || dayDistributions[4];

  // Create optimized schedule
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const workoutDayIndex = workoutDays.indexOf(dayIndex);
    const isWorkoutDay = workoutDayIndex !== -1;
    const dayName = getDayName(dayIndex);

    if (!isWorkoutDay) {
      schedule.push({
        day: dayIndex + 1,
        dayName,
        name: 'Active Recovery',
        isRestDay: true,
        isDeload: false,
        sessions: [],
      });
      continue;
    }

    const sessions = [];

    // Check if this is a run day
    const runInfo = workoutDayIndex < runSchedule.length ? runSchedule[workoutDayIndex] : null;

    if (runInfo) {
      // This is a run day
      const enduranceSession = generateEnduranceSession(
        runInfo, currentPhase, isDeload, startingMileage,
        athleteLevel, paces, currentWeek, totalWeeks, maxLongRun
      );

      sessions.push({
        time: 'AM',
        type: 'endurance',
        focus: runInfo,
        duration: enduranceSession.duration,
        exercises: enduranceSession.exercises,
      });

      // Add strength if this is an easy day and double days allowed
      const isHard = isHardRunningDay(runInfo);
      const isBeforeLongRun = longRunDayIndex !== -1 && workoutDayIndex === longRunDayIndex - 1;

      if (allowDoubleDays && !isHard && !isBeforeLongRun && secondaryType === 'strength') {
        // Add PM strength session - lighter accessory work
        const strengthFocus = workoutDayIndex % 2 === 0 ? ['chest', 'shoulders', 'triceps'] : ['back', 'biceps', 'core'];
        const strengthExercises = generateAestheticExercises(
          strengthFocus,
          currentPhase,
          true, // Always lighter on double days
          athleteLevel,
          currentWeek
        ).slice(0, 4); // Keep it shorter

        sessions.push({
          time: 'PM',
          type: 'strength',
          focus: 'Supplemental Strength',
          duration: 35,
          exercises: strengthExercises,
          notes: 'Keep intensity moderate - recovery is priority',
        });
      }
    } else if (strengthOnlyDays.includes(dayIndex)) {
      // Strength-only day
      const strengthFocus = ['legs', 'core', 'posterior'];
      const strengthExercises = generateStrengthExercises(
        strengthFocus,
        currentPhase,
        isDeload,
        athleteLevel,
        currentWeek,
        strengthGoals
      );

      sessions.push({
        time: 'ANY',
        type: 'strength',
        focus: 'Full Body Strength',
        duration: athleteLevel.level === 'elite' ? 75 : 60,
        exercises: strengthExercises,
        notes: 'Primary strength day - can push intensity',
      });
    }

    schedule.push({
      day: dayIndex + 1,
      dayName,
      name: sessions.map(s => s.focus).join(' / ') || 'Active Recovery',
      isRestDay: sessions.length === 0,
      isDeload,
      sessions,
    });
  }

  return schedule;
}

// ============ MAIN GENERATOR ============

export function generateProgram(formData) {
  const {
    programType,
    programSubtype,
    desiredTrainingDays,
    enableHybrid,
    secondaryProgramType,
    allowDoubleDays,
    currentWeeklyMileage,
    longestRecentRun,
    vacations = [],
    targetFinishHours,
    targetFinishMinutes,
    targetFinishSeconds,
    raceDistance,
    // Baseline performance data
    baselineRaceDistance,
    baselineTimeHours,
    baselineTimeMinutes,
    baselineTimeSeconds,
    // Strength baselines
    strengthGoals = [],
  } = formData;

  const athleteLevel = calculateAthleteLevel(formData);
  const { totalWeeks, weeksUntilGoal } = calculateProgramLength(formData);
  const phases = generatePeriodizationPhases(totalWeeks, programType, programSubtype);
  const workoutDays = distributeWorkoutDays(desiredTrainingDays);

  // Calculate paces for endurance programs using baseline + target
  const targetTime = [targetFinishHours, targetFinishMinutes, targetFinishSeconds]
    .filter(Boolean).join(':');
  const baselineTime = [baselineTimeHours, baselineTimeMinutes, baselineTimeSeconds]
    .filter(Boolean).join(':');

  const paces = calculatePaces(targetTime, raceDistance, baselineTime, baselineRaceDistance);

  // Starting mileage from user input
  const startingMileage = parseFloat(currentWeeklyMileage) || null;
  const maxLongRun = parseFloat(longestRecentRun) || null;

  let splitType = 'aesthetic';
  if (programType === 'strength') splitType = 'strength';

  const splitTemplate = SPLIT_TEMPLATES[Math.min(desiredTrainingDays, 6)]?.[splitType]
    || SPLIT_TEMPLATES[4][splitType];

  const currentPhase = phases[0];
  const currentWeek = 1;
  const isDeload = currentPhase === 'Deload' || currentPhase === 'Taper';

  // Use smart hybrid scheduling for endurance+strength combos
  let weeklySchedule = [];

  if (enableHybrid && programType === 'endurance' && (secondaryProgramType === 'strength' || secondaryProgramType === 'aesthetic')) {
    // Smart scheduling: place strength optimally around running
    const enduranceTemplates = programSubtype === 'triathlon'
      ? ENDURANCE_TEMPLATES.triathlon
      : ENDURANCE_TEMPLATES.running;

    weeklySchedule = createSmartHybridSchedule(
      desiredTrainingDays,
      programType,
      secondaryProgramType,
      allowDoubleDays,
      enduranceTemplates,
      paces,
      athleteLevel,
      currentPhase,
      isDeload,
      currentWeek,
      totalWeeks,
      startingMileage,
      maxLongRun,
      strengthGoals
    );
  } else {
    // Standard scheduling for non-hybrid or other combinations
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const isWorkoutDay = workoutDays.includes(dayIndex);
      const dayName = getDayName(dayIndex);

      if (!isWorkoutDay) {
        weeklySchedule.push({
          day: dayIndex + 1,
          dayName,
          name: 'Active Recovery',
          isRestDay: true,
          isDeload: false,
          sessions: [],
        });
        continue;
      }

      const workoutIndex = workoutDays.indexOf(dayIndex);
      const template = splitTemplate[workoutIndex % splitTemplate.length];
      const sessions = [];

      if (programType === 'endurance') {
        const enduranceTemplates = programSubtype === 'triathlon'
          ? ENDURANCE_TEMPLATES.triathlon
          : ENDURANCE_TEMPLATES.running;
        const enduranceType = enduranceTemplates[desiredTrainingDays]?.[workoutIndex] || 'Easy Run';
        const enduranceSession = generateEnduranceSession(
          enduranceType, currentPhase, isDeload, startingMileage,
          athleteLevel, paces, currentWeek, totalWeeks, maxLongRun
        );

        sessions.push({
          time: 'AM',
          type: 'endurance',
          focus: enduranceType,
          duration: enduranceSession.duration,
          exercises: enduranceSession.exercises,
        });
      } else if (programType === 'strength') {
        const exercises = generateStrengthExercises(template.focus, currentPhase, isDeload, athleteLevel, currentWeek, strengthGoals);
        sessions.push({
          time: 'ANY',
          type: 'strength',
          focus: template.name,
          duration: athleteLevel.level === 'elite' ? 90 : 75,
          exercises,
        });
      } else if (programType === 'aesthetic') {
        const exercises = generateAestheticExercises(template.focus, currentPhase, isDeload, athleteLevel, currentWeek);
        sessions.push({
          time: 'ANY',
          type: 'hypertrophy',
          focus: template.name,
          duration: athleteLevel.level === 'elite' ? 75 : 60,
          exercises,
        });
      } else if (programType === 'fatloss') {
        const exercises = generateFatLossSession(template.focus, currentPhase, isDeload, athleteLevel, currentWeek);
        sessions.push({
          time: 'ANY',
          type: 'metabolic',
          focus: template.name,
          duration: 50,
          exercises,
        });
      }

      // Handle hybrid for non-endurance primary (strength primary + endurance secondary)
      if (enableHybrid && secondaryProgramType === 'endurance' && allowDoubleDays) {
        sessions.push({
          time: 'PM',
          type: 'endurance',
          focus: 'Easy Run',
          duration: 30,
          exercises: [{
            name: 'Easy Run',
            sets: 1,
            reps: '30 min',
            pace: paces?.recoveryPace || '10:00-10:30/mi',
            heartRateZone: 'Zone 1-2',
            rpe: 4,
            rest: 'N/A',
            notes: 'Recovery pace only - prioritize strength recovery',
          }],
        });
      }

      weeklySchedule.push({
        day: dayIndex + 1,
        dayName,
        name: sessions.map(s => s.focus).join(' / '),
        isRestDay: false,
        isDeload,
        sessions,
      });
    }
  }

  const programName = getProgramName(programType, programSubtype, athleteLevel.level);

  return {
    name: programName,
    description: `${athleteLevel.level.charAt(0).toUpperCase() + athleteLevel.level.slice(1)}-level ${programType} program with ${totalWeeks}-week periodization. Max 5% weekly volume increase.`,
    mesocycleWeeks: totalWeeks,
    totalWeeks,
    currentWeek: 1,
    currentPhase: phases[0],
    phases,
    athleteLevel: athleteLevel.level,
    athleteScore: athleteLevel.score,
    primaryGoal: programType,
    primarySubtype: programSubtype,
    secondaryGoal: secondaryProgramType || null,
    secondarySubtype: formData.secondarySubtype || null,
    isHybrid: enableHybrid || false,
    allowDoubleDays: allowDoubleDays || false,
    daysPerWeek: desiredTrainingDays,
    vacations,
    weeksUntilGoal,
    // Baseline data
    baseline: {
      endurance: programType === 'endurance' ? {
        currentMileage: startingMileage,
        longestRecentRun: maxLongRun,
        referenceRace: baselineRaceDistance ? {
          distance: baselineRaceDistance,
          time: baselineTime,
        } : null,
      } : null,
      strength: programType === 'strength' ? {
        lifts: strengthGoals.filter(g => g.current).map(g => ({
          exercise: g.label,
          current1RM: parseFloat(g.current),
          target1RM: parseFloat(g.target),
        })),
      } : null,
    },
    paces: programType === 'endurance' ? paces : null,
    generatedAt: new Date().toISOString(),
    weeklySchedule,
    progressionRules: {
      strengthIncrease: athleteLevel.level === 'elite'
        ? 'Micro-load 1-2.5lbs when RPE allows. Prioritize technical consistency.'
        : 'Add 2.5-5lbs per week when all reps completed at target RPE.',
      volumeIncrease: 'Add 1 set per exercise every 2-3 weeks during Build phase.',
      mileageIncrease: 'Max 5% weekly mileage increase. Never more.',
      deloadProtocol: `Every ${athleteLevel.level === 'elite' ? '3rd' : '4th'} week: 50% volume, maintain intensity at RPE 6-7.`,
    },
    dynamicAdjustments: {
      missedWorkouts: 'Program will auto-adjust if workouts are missed.',
      nutritionTracking: 'Calorie targets adjust based on progress.',
      goalTracking: 'Weekly check-ins to ensure you stay on track.',
    },
  };
}

function getProgramName(programType, subtype, level) {
  const levelPrefix = level === 'elite' ? 'Elite ' : level === 'advanced' ? 'Advanced ' : '';

  const names = {
    endurance: {
      running: `${levelPrefix}Running Program`,
      marathon: `${levelPrefix}Marathon Prep`,
      cycling: `${levelPrefix}Cycling Performance`,
      swimming: `${levelPrefix}Swim Program`,
      triathlon: `${levelPrefix}Triathlon Builder`,
    },
    strength: {
      powerlifting: `${levelPrefix}Powerlifting Protocol`,
      olympic: `${levelPrefix}Olympic Lifting`,
      strongman: `${levelPrefix}Strongman Training`,
    },
    aesthetic: {
      hypertrophy: `${levelPrefix}Hypertrophy Program`,
      'lean-muscle': `${levelPrefix}Lean Gains`,
      recomp: `${levelPrefix}Body Recomposition`,
    },
    fatloss: {
      aggressive: `${levelPrefix}Rapid Fat Loss`,
      moderate: `${levelPrefix}Sustainable Shred`,
      slow: `${levelPrefix}Gradual Cut`,
    },
  };

  return names[programType]?.[subtype] || `${levelPrefix}${programType.charAt(0).toUpperCase() + programType.slice(1)} Program`;
}

export default generateProgram;
