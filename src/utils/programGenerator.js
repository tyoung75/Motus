// Comprehensive Program Generator
// Creates personalized workout programs scaled for athlete level and goal timeline

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

  // Get target date
  let goalDate = null;
  if (raceDate) goalDate = new Date(raceDate);
  else if (aestheticGoalDate) goalDate = new Date(aestheticGoalDate);
  else if (targetDate) goalDate = new Date(targetDate);

  if (goalDate) {
    const today = new Date();
    const weeksUntilGoal = Math.ceil((goalDate - today) / (1000 * 60 * 60 * 24 * 7));

    // Cap at reasonable ranges
    if (weeksUntilGoal > 52) return { totalWeeks: 52, weeksUntilGoal };
    if (weeksUntilGoal < 4) return { totalWeeks: 4, weeksUntilGoal };
    return { totalWeeks: weeksUntilGoal, weeksUntilGoal };
  }

  // Default program lengths by type
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
    // Marathon/Triathlon periodization with taper
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
    // Standard periodization with deloads every 4-5 weeks
    const cycleLength = 4; // 3 hard weeks + 1 deload
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

// ============ EXERCISE DATABASE ============

const STRENGTH_EXERCISES = {
  squat: { name: 'Back Squat', muscle: 'legs', type: 'compound', equipment: 'barbell' },
  frontSquat: { name: 'Front Squat', muscle: 'legs', type: 'compound', equipment: 'barbell' },
  deadlift: { name: 'Deadlift', muscle: 'posterior', type: 'compound', equipment: 'barbell' },
  romanianDeadlift: { name: 'Romanian Deadlift', muscle: 'posterior', type: 'compound', equipment: 'barbell' },
  benchPress: { name: 'Bench Press', muscle: 'chest', type: 'compound', equipment: 'barbell' },
  inclineBench: { name: 'Incline Bench Press', muscle: 'chest', type: 'compound', equipment: 'barbell' },
  overheadPress: { name: 'Overhead Press', muscle: 'shoulders', type: 'compound', equipment: 'barbell' },
  barbellRow: { name: 'Barbell Row', muscle: 'back', type: 'compound', equipment: 'barbell' },
  pullUp: { name: 'Pull-ups', muscle: 'back', type: 'compound', equipment: 'bodyweight' },
  chinUp: { name: 'Chin-ups', muscle: 'back', type: 'compound', equipment: 'bodyweight' },
  dip: { name: 'Weighted Dips', muscle: 'chest', type: 'compound', equipment: 'bodyweight' },
  latPulldown: { name: 'Lat Pulldown', muscle: 'back', type: 'isolation', equipment: 'cable' },
  cableRow: { name: 'Seated Cable Row', muscle: 'back', type: 'isolation', equipment: 'cable' },
  facePull: { name: 'Face Pulls', muscle: 'rear-delts', type: 'isolation', equipment: 'cable' },
  lateralRaise: { name: 'Lateral Raises', muscle: 'shoulders', type: 'isolation', equipment: 'dumbbell' },
  bicepCurl: { name: 'Barbell Curls', muscle: 'biceps', type: 'isolation', equipment: 'barbell' },
  hammerCurl: { name: 'Hammer Curls', muscle: 'biceps', type: 'isolation', equipment: 'dumbbell' },
  tricepPushdown: { name: 'Tricep Pushdowns', muscle: 'triceps', type: 'isolation', equipment: 'cable' },
  skullCrusher: { name: 'Skull Crushers', muscle: 'triceps', type: 'isolation', equipment: 'barbell' },
  legPress: { name: 'Leg Press', muscle: 'legs', type: 'compound', equipment: 'machine' },
  legCurl: { name: 'Leg Curls', muscle: 'hamstrings', type: 'isolation', equipment: 'machine' },
  legExtension: { name: 'Leg Extensions', muscle: 'quads', type: 'isolation', equipment: 'machine' },
  calfRaise: { name: 'Standing Calf Raises', muscle: 'calves', type: 'isolation', equipment: 'machine' },
  chestFly: { name: 'Cable Chest Fly', muscle: 'chest', type: 'isolation', equipment: 'cable' },
  rearDeltFly: { name: 'Rear Delt Fly', muscle: 'rear-delts', type: 'isolation', equipment: 'dumbbell' },
  hangingLegRaise: { name: 'Hanging Leg Raises', muscle: 'core', type: 'isolation', equipment: 'bodyweight' },
  cableCrunch: { name: 'Cable Crunches', muscle: 'core', type: 'isolation', equipment: 'cable' },
};

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

// ============ EXERCISE GENERATORS (SCALED FOR ATHLETE LEVEL) ============

function generateStrengthExercises(focus, phase, isDeload, athleteLevel) {
  const exercises = [];
  const { multiplier, level } = athleteLevel;

  // Scale volume and intensity based on athlete level
  const volumeBase = isDeload ? 0.5 : (phase === 'Build' ? 1.1 : 1.0);
  const volumeMultiplier = volumeBase * multiplier;

  // Advanced athletes work at higher RPE
  const rpeBase = isDeload ? 5 : (level === 'elite' ? 9 : level === 'advanced' ? 8.5 : level === 'intermediate' ? 8 : 7);

  // Rep ranges shift lower for advanced (more intensity-focused)
  const getRepRange = (baseReps) => {
    if (level === 'elite') return baseReps.replace(/(\d+)-(\d+)/, (_, min, max) => `${Math.max(1, parseInt(min)-2)}-${parseInt(max)-2}`);
    if (level === 'advanced') return baseReps.replace(/(\d+)-(\d+)/, (_, min, max) => `${Math.max(1, parseInt(min)-1)}-${parseInt(max)-1}`);
    return baseReps;
  };

  if (focus.includes('legs') || focus.includes('Squat')) {
    exercises.push({
      name: 'Back Squat',
      sets: Math.round(5 * volumeMultiplier),
      reps: phase === 'Peak' ? getRepRange('1-3') : phase === 'Build' ? getRepRange('3-5') : getRepRange('5-8'),
      rpe: rpeBase,
      rest: level === 'elite' ? '4-5 min' : '3-4 min',
      notes: level === 'elite' ? 'Competition depth, pause at bottom' : 'Control descent, drive through heels',
      progression: 'Add 5lbs when all reps completed at target RPE',
    });

    if (level === 'advanced' || level === 'elite') {
      exercises.push({
        name: 'Pause Squat',
        sets: Math.round(3 * volumeMultiplier),
        reps: '3-5',
        rpe: rpeBase - 1,
        rest: '3-4 min',
        notes: '2-3 second pause in the hole',
        progression: 'Increase pause duration before adding weight',
      });
    }
  }

  if (focus.includes('chest') || focus.includes('Bench')) {
    exercises.push({
      name: 'Bench Press',
      sets: Math.round(5 * volumeMultiplier),
      reps: phase === 'Peak' ? getRepRange('1-3') : phase === 'Build' ? getRepRange('3-5') : getRepRange('5-8'),
      rpe: rpeBase,
      rest: level === 'elite' ? '4-5 min' : '3-4 min',
      notes: level === 'elite' ? 'Competition pause, leg drive, tight arch' : 'Arch back, retract scapula',
      progression: 'Add 2.5lbs when all reps completed at target RPE',
    });

    if (level === 'advanced' || level === 'elite') {
      exercises.push({
        name: 'Close-Grip Bench',
        sets: Math.round(4 * volumeMultiplier),
        reps: '4-6',
        rpe: rpeBase - 1,
        rest: '3 min',
        notes: 'Tricep focus, elbows tucked',
        progression: 'Match your competition bench progress',
      });
    }
  }

  if (focus.includes('posterior') || focus.includes('Deadlift')) {
    exercises.push({
      name: 'Deadlift',
      sets: Math.round(4 * volumeMultiplier),
      reps: phase === 'Peak' ? getRepRange('1-2') : phase === 'Build' ? getRepRange('2-4') : getRepRange('4-6'),
      rpe: rpeBase,
      rest: level === 'elite' ? '5-6 min' : '4-5 min',
      notes: level === 'elite' ? 'Competition setup, maximal brace' : 'Brace core, hinge at hips',
      progression: 'Add 5-10lbs when all reps completed at target RPE',
    });

    if (level === 'advanced' || level === 'elite') {
      exercises.push({
        name: 'Deficit Deadlift',
        sets: Math.round(3 * volumeMultiplier),
        reps: '3-5',
        rpe: rpeBase - 1,
        rest: '4 min',
        notes: '2-3 inch deficit, focus on speed off floor',
        progression: 'Build to 85% of comp deadlift',
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
      progression: 'Add 2.5lbs when all reps completed',
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
      progression: 'Add 5lbs when form stays solid',
    });

    exercises.push({
      name: 'Weighted Pull-ups',
      sets: Math.round(4 * volumeMultiplier),
      reps: level === 'elite' ? '5-8' : '6-10',
      rpe: rpeBase - 1,
      rest: '2-3 min',
      notes: 'Add weight as needed, full ROM',
      progression: 'Add 2.5-5lbs when hitting top of rep range',
    });
  }

  // Accessories scaled for level
  if (focus.includes('triceps')) {
    exercises.push({
      name: level === 'elite' ? 'JM Press' : 'Tricep Pushdowns',
      sets: Math.round(3 * volumeMultiplier),
      reps: '8-12',
      rpe: 7,
      rest: '90s',
      notes: level === 'elite' ? 'Bench accessory, lockout strength' : 'Keep elbows pinned',
      progression: 'Increase weight when 12 reps feels easy',
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
      progression: 'Increase weight when 12 reps feels easy',
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
      progression: 'Add weight when hitting top of rep range',
    });
  }

  return exercises;
}

function generateAestheticExercises(focus, phase, isDeload, athleteLevel) {
  const exercises = [];
  const { multiplier, level } = athleteLevel;

  const volumeBase = isDeload ? 0.5 : (phase === 'Build' ? 1.15 : 1.0);
  const volumeMultiplier = volumeBase * multiplier;
  const rpeBase = isDeload ? 5 : (level === 'elite' ? 9 : level === 'advanced' ? 8.5 : 8);

  if (focus.includes('chest')) {
    exercises.push({
      name: 'Bench Press',
      sets: Math.round(4 * volumeMultiplier),
      reps: level === 'elite' ? '6-8' : '8-10',
      rpe: rpeBase,
      rest: '2-3 min',
      notes: 'Focus on chest contraction',
      progression: 'Add weight or reps each week',
    });
    exercises.push({
      name: 'Incline Dumbbell Press',
      sets: Math.round(4 * volumeMultiplier),
      reps: '8-12',
      rpe: rpeBase - 1,
      rest: '90s',
      notes: '30-45 degree incline, control the negative',
      progression: 'Increase weight when 12 reps feels easy',
    });
    exercises.push({
      name: 'Cable Chest Fly',
      sets: Math.round(3 * volumeMultiplier),
      reps: '12-15',
      rpe: 7,
      rest: '60s',
      notes: 'Squeeze hard at contraction',
      progression: 'Add 1 rep per session',
    });

    if (level === 'advanced' || level === 'elite') {
      exercises.push({
        name: 'Weighted Dips',
        sets: Math.round(3 * volumeMultiplier),
        reps: '8-12',
        rpe: 8,
        rest: '2 min',
        notes: 'Lean forward for chest emphasis',
        progression: 'Add 5lbs when hitting 12 reps',
      });
    }
  }

  if (focus.includes('back')) {
    exercises.push({
      name: 'Weighted Pull-ups',
      sets: Math.round(4 * volumeMultiplier),
      reps: level === 'elite' ? '6-8' : '6-10',
      rpe: rpeBase,
      rest: '2-3 min',
      notes: 'Full stretch at bottom, chin over bar',
      progression: 'Add weight when 10 reps is easy',
    });
    exercises.push({
      name: 'Barbell Row',
      sets: Math.round(4 * volumeMultiplier),
      reps: '6-10',
      rpe: rpeBase - 1,
      rest: '2 min',
      notes: 'Squeeze lats at top',
      progression: 'Add 5lbs when form is solid',
    });
    exercises.push({
      name: 'Lat Pulldown',
      sets: Math.round(3 * volumeMultiplier),
      reps: '10-12',
      rpe: 7,
      rest: '90s',
      notes: 'Drive elbows down, chest up',
      progression: 'Increase weight when 12 reps feels easy',
    });
    exercises.push({
      name: 'Seated Cable Row',
      sets: Math.round(3 * volumeMultiplier),
      reps: '10-12',
      rpe: 7,
      rest: '90s',
      notes: 'Pull to lower chest, squeeze',
      progression: 'Add weight when form is solid',
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
      progression: 'Add 2.5lbs when all reps completed',
    });
    exercises.push({
      name: 'Lateral Raises',
      sets: Math.round(4 * volumeMultiplier),
      reps: '12-15',
      rpe: 7,
      rest: '60s',
      notes: 'Lead with elbows, control the negative',
      progression: 'Add 1 rep then increase weight',
    });

    if (level === 'advanced' || level === 'elite') {
      exercises.push({
        name: 'Cable Lateral Raises',
        sets: 3,
        reps: '15-20',
        rpe: 8,
        rest: '45s',
        notes: 'Constant tension, squeeze at top',
        progression: 'Drop sets on final set',
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
      progression: 'Add 5lbs when all reps completed',
    });
    exercises.push({
      name: 'Romanian Deadlift',
      sets: Math.round(4 * volumeMultiplier),
      reps: '8-12',
      rpe: rpeBase - 1,
      rest: '2 min',
      notes: 'Feel the hamstring stretch',
      progression: 'Add 5lbs when form is solid',
    });
    exercises.push({
      name: 'Leg Press',
      sets: Math.round(3 * volumeMultiplier),
      reps: '10-15',
      rpe: 8,
      rest: '2 min',
      notes: 'Full range of motion',
      progression: 'Increase weight when 15 reps feels easy',
    });
    exercises.push({
      name: 'Leg Curls',
      sets: Math.round(3 * volumeMultiplier),
      reps: '12-15',
      rpe: 7,
      rest: '60s',
      notes: 'Squeeze at top, slow negative',
      progression: 'Add reps then weight',
    });
    exercises.push({
      name: 'Standing Calf Raises',
      sets: Math.round(4 * volumeMultiplier),
      reps: '12-15',
      rpe: 8,
      rest: '60s',
      notes: 'Full stretch at bottom, pause at top',
      progression: 'Add weight when 15 reps is easy',
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
      progression: 'Add weight when 12 reps is easy',
    });
    exercises.push({
      name: 'Hammer Curls',
      sets: Math.round(3 * volumeMultiplier),
      reps: '10-12',
      rpe: 7,
      rest: '60s',
      notes: 'Control throughout',
      progression: 'Add reps then weight',
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
      progression: 'Add weight when 12 reps is easy',
    });
    exercises.push({
      name: 'Overhead Tricep Extension',
      sets: Math.round(3 * volumeMultiplier),
      reps: '12-15',
      rpe: 7,
      rest: '60s',
      notes: 'Feel the stretch at bottom',
      progression: 'Add reps then weight',
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
      progression: 'Add reps before weight',
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
      progression: 'Add weight when hitting 15 reps',
    });
  }

  return exercises;
}

function generateEnduranceSession(type, phase, isDeload, weeklyMileage, athleteLevel) {
  const { multiplier, level } = athleteLevel;
  const baseMileage = (weeklyMileage || 20) * multiplier;

  // Advanced athletes get more volume and intensity
  const intensityMultiplier = isDeload ? 0.5 :
    (phase === 'Peak' || phase === 'Build 2') ? (1.15 * multiplier) :
    (phase === 'Build' || phase === 'Build 1') ? (1.1 * multiplier) :
    multiplier;

  switch (type) {
    case 'Easy Run':
      return {
        name: 'Easy Run',
        duration: Math.round(45 * intensityMultiplier),
        exercises: [{
          name: 'Easy Run',
          sets: 1,
          reps: `${Math.round(5 * intensityMultiplier)} miles`,
          rpe: 5,
          rest: 'N/A',
          notes: level === 'elite' ? 'Zone 2, maintain 65-70% max HR' : 'Conversational pace, Zone 2',
          progression: 'Add 0.5 miles every 2 weeks',
        }],
      };

    case 'Tempo Run':
      const tempoMinutes = level === 'elite' ? 30 : level === 'advanced' ? 25 : 20;
      return {
        name: 'Tempo Run',
        duration: Math.round(50 * intensityMultiplier),
        exercises: [
          {
            name: 'Warm-up Jog',
            sets: 1,
            reps: '15 min',
            rpe: 5,
            rest: 'N/A',
            notes: 'Include strides',
          },
          {
            name: 'Tempo Effort',
            sets: 1,
            reps: `${Math.round(tempoMinutes * intensityMultiplier)} min`,
            rpe: level === 'elite' ? 8 : 7,
            rest: 'N/A',
            notes: level === 'elite' ? 'Threshold pace, ~85% max HR' : 'Comfortably hard',
            progression: 'Add 2-3 min tempo every 2 weeks',
          },
          {
            name: 'Cool-down Jog',
            sets: 1,
            reps: '10 min',
            rpe: 4,
            rest: 'N/A',
            notes: 'Very easy pace',
          },
        ],
      };

    case 'Intervals':
      const intervals = level === 'elite' ? 10 : level === 'advanced' ? 8 : 6;
      return {
        name: 'Interval Training',
        duration: Math.round(55 * intensityMultiplier),
        exercises: [
          {
            name: 'Warm-up',
            sets: 1,
            reps: '15 min',
            rpe: 5,
            rest: 'N/A',
            notes: 'Include dynamic stretches and strides',
          },
          {
            name: level === 'elite' ? '800m Repeats' : '400m Repeats',
            sets: isDeload ? Math.floor(intervals / 2) : Math.round(intervals * (phase === 'Peak' ? 1.2 : 1)),
            reps: level === 'elite' ? '800m @ 5K pace' : '400m fast',
            rpe: 9,
            rest: level === 'elite' ? '2 min jog' : '90s jog',
            notes: 'Consistent pace each rep, negative split if possible',
            progression: 'Add 1 rep every 2 weeks or reduce rest',
          },
          {
            name: 'Cool-down',
            sets: 1,
            reps: '10 min',
            rpe: 4,
            rest: 'N/A',
            notes: 'Easy jog + stretching',
          },
        ],
      };

    case 'Long Run':
      const longRunMiles = level === 'elite' ? baseMileage * 0.35 : baseMileage * 0.3;
      return {
        name: 'Long Run',
        duration: Math.round(100 * intensityMultiplier),
        exercises: [{
          name: 'Long Run',
          sets: 1,
          reps: `${Math.round(longRunMiles * intensityMultiplier)} miles`,
          rpe: 6,
          rest: 'N/A',
          notes: level === 'elite'
            ? 'Practice race nutrition, last 3 miles at marathon pace'
            : 'Steady, comfortable pace - practice race nutrition',
          progression: 'Add 1 mile per week (max 10% increase)',
        }],
      };

    case 'Recovery Run':
      return {
        name: 'Recovery Run',
        duration: 30,
        exercises: [{
          name: 'Recovery Run',
          sets: 1,
          reps: '30 min',
          rpe: 4,
          rest: 'N/A',
          notes: 'Very easy, shake out legs',
          progression: 'Keep easy, dont increase',
        }],
      };

    default:
      return {
        name: type,
        duration: Math.round(45 * intensityMultiplier),
        exercises: [{
          name: type,
          sets: 1,
          reps: `${Math.round(45 * intensityMultiplier)} min`,
          rpe: 6,
          rest: 'N/A',
          notes: 'Moderate steady effort',
        }],
      };
  }
}

function generateFatLossSession(dayFocus, phase, isDeload, athleteLevel) {
  const exercises = [];
  const { multiplier, level } = athleteLevel;

  // HIIT scaled for athlete level
  exercises.push({
    name: level === 'elite' ? 'EMOM Circuit' : 'HIIT Circuit',
    sets: isDeload ? 2 : Math.round(4 * multiplier),
    reps: level === 'elite' ? '45s work / 15s rest' : '30s work / 30s rest',
    rpe: 9,
    rest: '2 min between rounds',
    notes: level === 'elite'
      ? 'Burpees, box jumps, KB swings, battle ropes'
      : 'Max effort during work intervals',
    progression: 'Add 1 round or reduce rest',
  });

  // Strength training for muscle preservation
  const strengthExercises = generateAestheticExercises(dayFocus, phase, isDeload, athleteLevel);
  exercises.push(...strengthExercises.slice(0, 4));

  // Finisher
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
      progression: 'Add 5 min or increase intensity',
    });
  }

  return exercises;
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
    vacations = [],
  } = formData;

  // Calculate athlete level
  const athleteLevel = calculateAthleteLevel(formData);

  // Calculate program length based on goal date
  const { totalWeeks, weeksUntilGoal } = calculateProgramLength(formData);

  // Generate periodization phases
  const phases = generatePeriodizationPhases(totalWeeks, programType, programSubtype);

  const workoutDays = distributeWorkoutDays(desiredTrainingDays);

  // Get appropriate split template
  let splitType = 'aesthetic';
  if (programType === 'strength') splitType = 'strength';

  const splitTemplate = SPLIT_TEMPLATES[Math.min(desiredTrainingDays, 6)]?.[splitType]
    || SPLIT_TEMPLATES[4][splitType];

  // Generate weekly schedule (for current week - Week 1)
  const weeklySchedule = [];
  const currentPhase = phases[0];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const isWorkoutDay = workoutDays.includes(dayIndex);
    const dayName = getDayName(dayIndex);

    if (!isWorkoutDay) {
      weeklySchedule.push({
        day: dayIndex + 1,
        dayName,
        name: 'Rest Day',
        isRestDay: true,
        isDeload: false,
        sessions: [],
      });
      continue;
    }

    const workoutIndex = workoutDays.indexOf(dayIndex);
    const template = splitTemplate[workoutIndex % splitTemplate.length];
    const sessions = [];
    const isDeload = currentPhase === 'Deload' || currentPhase === 'Taper';

    // Primary session
    if (programType === 'endurance') {
      const enduranceTemplates = programSubtype === 'triathlon'
        ? ENDURANCE_TEMPLATES.triathlon
        : ENDURANCE_TEMPLATES.running;
      const enduranceType = enduranceTemplates[desiredTrainingDays]?.[workoutIndex] || 'Easy Run';
      const enduranceSession = generateEnduranceSession(enduranceType, currentPhase, isDeload, currentWeeklyMileage, athleteLevel);

      sessions.push({
        time: 'AM',
        type: 'endurance',
        focus: enduranceType,
        duration: enduranceSession.duration,
        exercises: enduranceSession.exercises,
      });
    } else if (programType === 'strength') {
      const exercises = generateStrengthExercises(template.focus, currentPhase, isDeload, athleteLevel);
      sessions.push({
        time: 'ANY',
        type: 'strength',
        focus: template.name,
        duration: athleteLevel.level === 'elite' ? 90 : 75,
        exercises,
      });
    } else if (programType === 'aesthetic') {
      const exercises = generateAestheticExercises(template.focus, currentPhase, isDeload, athleteLevel);
      sessions.push({
        time: 'ANY',
        type: 'hypertrophy',
        focus: template.name,
        duration: athleteLevel.level === 'elite' ? 75 : 60,
        exercises,
      });
    } else if (programType === 'fatloss') {
      const exercises = generateFatLossSession(template.focus, currentPhase, isDeload, athleteLevel);
      sessions.push({
        time: 'ANY',
        type: 'metabolic',
        focus: template.name,
        duration: 50,
        exercises,
      });
    }

    // Secondary session for hybrid
    if (enableHybrid && secondaryProgramType && allowDoubleDays) {
      if (secondaryProgramType === 'endurance') {
        sessions.push({
          time: 'PM',
          type: 'endurance',
          focus: 'Easy Run',
          duration: 30,
          exercises: [{
            name: 'Easy Run',
            sets: 1,
            reps: '30 min',
            rpe: 5,
            rest: 'N/A',
            notes: 'Recovery pace',
          }],
        });
      } else {
        const secondaryTemplate = SPLIT_TEMPLATES[3]?.aesthetic?.[workoutIndex % 3];
        const exercises = generateAestheticExercises(
          secondaryTemplate?.focus || ['arms'],
          currentPhase,
          isDeload,
          athleteLevel
        ).slice(0, 3);
        sessions.push({
          time: 'PM',
          type: 'accessory',
          focus: 'Supplemental Work',
          duration: 30,
          exercises,
        });
      }
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

  // Create the program object
  const programName = getProgramName(programType, programSubtype, athleteLevel.level);

  return {
    name: programName,
    description: `${athleteLevel.level.charAt(0).toUpperCase() + athleteLevel.level.slice(1)}-level ${programType} program with ${totalWeeks}-week periodization.`,
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
    generatedAt: new Date().toISOString(),
    weeklySchedule,
    progressionRules: {
      strengthIncrease: athleteLevel.level === 'elite'
        ? 'Micro-load 1-2.5lbs when RPE allows, prioritize technical consistency'
        : 'Add 2.5-5lbs per week when all reps completed at target RPE',
      volumeIncrease: 'Add 1 set per exercise every 2-3 weeks during Build phase',
      deloadProtocol: `Every ${athleteLevel.level === 'elite' ? '3rd' : '4th'} week: 50% volume, maintain intensity at RPE 6-7`,
      enduranceProgression: 'Increase weekly volume by 10% during Build phase (max)',
    },
    dynamicAdjustments: {
      missedWorkouts: 'Program will auto-adjust if workouts are missed',
      nutritionTracking: 'Calorie targets adjust based on progress',
      goalTracking: 'Weekly check-ins to ensure you stay on track',
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
