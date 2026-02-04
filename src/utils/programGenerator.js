// Comprehensive Program Generator
// Creates personalized workout programs based on user goals

// ============ EXERCISE DATABASE ============

const STRENGTH_EXERCISES = {
  // Compound movements
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
  dip: { name: 'Dips', muscle: 'chest', type: 'compound', equipment: 'bodyweight' },

  // Isolation movements
  latPulldown: { name: 'Lat Pulldown', muscle: 'back', type: 'isolation', equipment: 'cable' },
  cableRow: { name: 'Seated Cable Row', muscle: 'back', type: 'isolation', equipment: 'cable' },
  facePull: { name: 'Face Pulls', muscle: 'rear-delts', type: 'isolation', equipment: 'cable' },
  lateralRaise: { name: 'Lateral Raises', muscle: 'shoulders', type: 'isolation', equipment: 'dumbbell' },
  bicepCurl: { name: 'Bicep Curls', muscle: 'biceps', type: 'isolation', equipment: 'dumbbell' },
  hammerCurl: { name: 'Hammer Curls', muscle: 'biceps', type: 'isolation', equipment: 'dumbbell' },
  tricepPushdown: { name: 'Tricep Pushdowns', muscle: 'triceps', type: 'isolation', equipment: 'cable' },
  skullCrusher: { name: 'Skull Crushers', muscle: 'triceps', type: 'isolation', equipment: 'barbell' },
  legPress: { name: 'Leg Press', muscle: 'legs', type: 'compound', equipment: 'machine' },
  legCurl: { name: 'Leg Curls', muscle: 'hamstrings', type: 'isolation', equipment: 'machine' },
  legExtension: { name: 'Leg Extensions', muscle: 'quads', type: 'isolation', equipment: 'machine' },
  calfRaise: { name: 'Calf Raises', muscle: 'calves', type: 'isolation', equipment: 'machine' },
  chestFly: { name: 'Cable Chest Fly', muscle: 'chest', type: 'isolation', equipment: 'cable' },
  rearDeltFly: { name: 'Rear Delt Fly', muscle: 'rear-delts', type: 'isolation', equipment: 'dumbbell' },

  // Core
  plank: { name: 'Plank', muscle: 'core', type: 'isolation', equipment: 'bodyweight' },
  hangingLegRaise: { name: 'Hanging Leg Raises', muscle: 'core', type: 'isolation', equipment: 'bodyweight' },
  cableCrunch: { name: 'Cable Crunches', muscle: 'core', type: 'isolation', equipment: 'cable' },
};

const CARDIO_EXERCISES = {
  easyRun: { name: 'Easy Run', type: 'steady-state', intensity: 'low' },
  tempoRun: { name: 'Tempo Run', type: 'threshold', intensity: 'moderate' },
  intervalRun: { name: 'Interval Training', type: 'intervals', intensity: 'high' },
  longRun: { name: 'Long Run', type: 'endurance', intensity: 'low' },
  hillRepeats: { name: 'Hill Repeats', type: 'power', intensity: 'high' },
  recoveryRun: { name: 'Recovery Run', type: 'recovery', intensity: 'very-low' },
  cycling: { name: 'Cycling', type: 'steady-state', intensity: 'moderate' },
  swimming: { name: 'Swimming', type: 'steady-state', intensity: 'moderate' },
  rowing: { name: 'Rowing', type: 'steady-state', intensity: 'moderate' },
  stairclimber: { name: 'Stair Climber', type: 'steady-state', intensity: 'moderate' },
};

// ============ WORKOUT TEMPLATES ============

const SPLIT_TEMPLATES = {
  // 2-day split
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
  // 3-day split
  3: {
    strength: [
      { name: 'Squat Focus', focus: ['legs', 'core'] },
      { name: 'Bench Focus', focus: ['chest', 'shoulders', 'triceps'] },
      { name: 'Deadlift Focus', focus: ['posterior', 'back', 'biceps'] },
    ],
    aesthetic: [
      { name: 'Push', focus: ['chest', 'shoulders', 'triceps'] },
      { name: 'Pull', focus: ['back', 'biceps', 'rear-delts'] },
      { name: 'Legs', focus: ['legs', 'glutes', 'core'] },
    ],
  },
  // 4-day split
  4: {
    strength: [
      { name: 'Squat + Accessories', focus: ['legs', 'core'] },
      { name: 'Bench + Accessories', focus: ['chest', 'shoulders', 'triceps'] },
      { name: 'Deadlift + Accessories', focus: ['posterior', 'back'] },
      { name: 'OHP + Accessories', focus: ['shoulders', 'chest', 'arms'] },
    ],
    aesthetic: [
      { name: 'Upper Push', focus: ['chest', 'shoulders', 'triceps'] },
      { name: 'Lower', focus: ['legs', 'glutes'] },
      { name: 'Upper Pull', focus: ['back', 'biceps', 'rear-delts'] },
      { name: 'Arms + Shoulders', focus: ['shoulders', 'biceps', 'triceps'] },
    ],
  },
  // 5-day split
  5: {
    strength: [
      { name: 'Heavy Squat', focus: ['legs'] },
      { name: 'Heavy Bench', focus: ['chest', 'triceps'] },
      { name: 'Heavy Deadlift', focus: ['posterior', 'back'] },
      { name: 'Volume Upper', focus: ['shoulders', 'back', 'arms'] },
      { name: 'Volume Lower', focus: ['legs', 'core'] },
    ],
    aesthetic: [
      { name: 'Chest', focus: ['chest', 'triceps'] },
      { name: 'Back', focus: ['back', 'biceps'] },
      { name: 'Shoulders', focus: ['shoulders', 'rear-delts'] },
      { name: 'Legs', focus: ['legs', 'glutes'] },
      { name: 'Arms + Weak Points', focus: ['biceps', 'triceps', 'core'] },
    ],
  },
  // 6-day split
  6: {
    strength: [
      { name: 'Squat Heavy', focus: ['legs'] },
      { name: 'Bench Heavy', focus: ['chest', 'triceps'] },
      { name: 'Deadlift Heavy', focus: ['posterior', 'back'] },
      { name: 'Squat Volume', focus: ['legs', 'core'] },
      { name: 'Bench Volume', focus: ['chest', 'shoulders'] },
      { name: 'Back + Arms', focus: ['back', 'biceps', 'triceps'] },
    ],
    aesthetic: [
      { name: 'Push A', focus: ['chest', 'shoulders', 'triceps'] },
      { name: 'Pull A', focus: ['back', 'biceps'] },
      { name: 'Legs A', focus: ['legs', 'glutes'] },
      { name: 'Push B', focus: ['chest', 'shoulders', 'triceps'] },
      { name: 'Pull B', focus: ['back', 'rear-delts', 'biceps'] },
      { name: 'Legs B', focus: ['legs', 'core'] },
    ],
  },
};

// Endurance training templates
const ENDURANCE_TEMPLATES = {
  running: {
    2: ['Easy Run', 'Tempo Run'],
    3: ['Easy Run', 'Intervals', 'Long Run'],
    4: ['Easy Run', 'Tempo Run', 'Intervals', 'Long Run'],
    5: ['Easy Run', 'Tempo Run', 'Easy Run', 'Intervals', 'Long Run'],
    6: ['Easy Run', 'Tempo Run', 'Easy Run', 'Intervals', 'Easy Run', 'Long Run'],
  },
  triathlon: {
    3: ['Swim', 'Bike', 'Run'],
    4: ['Swim', 'Bike', 'Run', 'Brick Workout'],
    5: ['Swim', 'Bike', 'Run', 'Swim + Strength', 'Long Ride'],
    6: ['Swim AM', 'Bike', 'Run', 'Swim', 'Bike', 'Long Run'],
  },
};

// ============ GENERATOR FUNCTIONS ============

function getDayName(dayIndex) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayIndex];
}

function distributeWorkoutDays(daysPerWeek) {
  // Optimal spacing for workout days
  const distributions = {
    2: [0, 3], // Mon, Thu
    3: [0, 2, 4], // Mon, Wed, Fri
    4: [0, 1, 3, 4], // Mon, Tue, Thu, Fri
    5: [0, 1, 2, 4, 5], // Mon, Tue, Wed, Fri, Sat
    6: [0, 1, 2, 3, 4, 5], // Mon-Sat
    7: [0, 1, 2, 3, 4, 5, 6], // Every day
  };
  return distributions[daysPerWeek] || distributions[4];
}

function generateStrengthExercises(focus, phase, isDeload) {
  const exercises = [];
  const volumeMultiplier = isDeload ? 0.5 : 1;
  const rpeBase = isDeload ? 6 : phase === 'Peak' ? 9 : phase === 'Build' ? 8 : 7;

  // Main compound movement
  if (focus.includes('legs') || focus.includes('Squat')) {
    exercises.push({
      name: 'Back Squat',
      sets: Math.round(4 * volumeMultiplier),
      reps: phase === 'Peak' ? '3-5' : phase === 'Build' ? '5-6' : '6-8',
      rpe: rpeBase,
      rest: '3-4 min',
      notes: 'Control descent, drive through heels',
      progression: 'Add 5lbs when all reps completed at target RPE',
    });
  }

  if (focus.includes('chest') || focus.includes('Bench')) {
    exercises.push({
      name: 'Bench Press',
      sets: Math.round(4 * volumeMultiplier),
      reps: phase === 'Peak' ? '3-5' : phase === 'Build' ? '5-6' : '6-8',
      rpe: rpeBase,
      rest: '3-4 min',
      notes: 'Arch back, retract scapula',
      progression: 'Add 2.5lbs when all reps completed at target RPE',
    });
  }

  if (focus.includes('posterior') || focus.includes('Deadlift')) {
    exercises.push({
      name: 'Deadlift',
      sets: Math.round(3 * volumeMultiplier),
      reps: phase === 'Peak' ? '2-4' : phase === 'Build' ? '4-5' : '5-6',
      rpe: rpeBase,
      rest: '4-5 min',
      notes: 'Brace core, hinge at hips',
      progression: 'Add 5-10lbs when all reps completed at target RPE',
    });
  }

  if (focus.includes('shoulders') || focus.includes('OHP')) {
    exercises.push({
      name: 'Overhead Press',
      sets: Math.round(4 * volumeMultiplier),
      reps: phase === 'Peak' ? '4-6' : '6-8',
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
      reps: '6-8',
      rpe: rpeBase - 1,
      rest: '2-3 min',
      notes: 'Pull to lower chest, squeeze at top',
      progression: 'Add 5lbs when form stays solid',
    });
  }

  // Accessories
  if (focus.includes('triceps') && exercises.length < 5) {
    exercises.push({
      name: 'Tricep Pushdowns',
      sets: Math.round(3 * volumeMultiplier),
      reps: '10-12',
      rpe: 7,
      rest: '60-90s',
      notes: 'Keep elbows pinned',
      progression: 'Increase weight when 12 reps feels easy',
    });
  }

  if (focus.includes('biceps') && exercises.length < 5) {
    exercises.push({
      name: 'Bicep Curls',
      sets: Math.round(3 * volumeMultiplier),
      reps: '10-12',
      rpe: 7,
      rest: '60-90s',
      notes: 'Full range of motion',
      progression: 'Increase weight when 12 reps feels easy',
    });
  }

  if (focus.includes('core') && exercises.length < 6) {
    exercises.push({
      name: 'Hanging Leg Raises',
      sets: Math.round(3 * volumeMultiplier),
      reps: '10-15',
      rpe: 7,
      rest: '60s',
      notes: 'Control the movement, no swinging',
      progression: 'Add weight when 15 reps is easy',
    });
  }

  return exercises;
}

function generateAestheticExercises(focus, phase, isDeload) {
  const exercises = [];
  const volumeMultiplier = isDeload ? 0.5 : phase === 'Build' ? 1.2 : 1;
  const rpeBase = isDeload ? 6 : 8;

  if (focus.includes('chest')) {
    exercises.push({
      name: 'Bench Press',
      sets: Math.round(4 * volumeMultiplier),
      reps: '8-10',
      rpe: rpeBase,
      rest: '2-3 min',
      notes: 'Focus on chest squeeze at top',
      progression: 'Add weight or reps each week',
    });
    exercises.push({
      name: 'Incline Dumbbell Press',
      sets: Math.round(3 * volumeMultiplier),
      reps: '10-12',
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
  }

  if (focus.includes('back')) {
    exercises.push({
      name: 'Pull-ups',
      sets: Math.round(4 * volumeMultiplier),
      reps: '6-10',
      rpe: rpeBase,
      rest: '2-3 min',
      notes: 'Full stretch at bottom, chin over bar',
      progression: 'Add weight when 10 reps is easy',
    });
    exercises.push({
      name: 'Barbell Row',
      sets: Math.round(4 * volumeMultiplier),
      reps: '8-10',
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
  }

  if (focus.includes('shoulders')) {
    exercises.push({
      name: 'Overhead Press',
      sets: Math.round(4 * volumeMultiplier),
      reps: '8-10',
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
  }

  if (focus.includes('legs') || focus.includes('glutes')) {
    exercises.push({
      name: 'Back Squat',
      sets: Math.round(4 * volumeMultiplier),
      reps: '8-10',
      rpe: rpeBase,
      rest: '3 min',
      notes: 'Deep squat, drive through heels',
      progression: 'Add 5lbs when all reps completed',
    });
    exercises.push({
      name: 'Romanian Deadlift',
      sets: Math.round(3 * volumeMultiplier),
      reps: '10-12',
      rpe: rpeBase - 1,
      rest: '2 min',
      notes: 'Feel the hamstring stretch',
      progression: 'Add 5lbs when form is solid',
    });
    exercises.push({
      name: 'Leg Press',
      sets: Math.round(3 * volumeMultiplier),
      reps: '10-12',
      rpe: 8,
      rest: '2 min',
      notes: 'Full range of motion',
      progression: 'Increase weight when 12 reps feels easy',
    });
    exercises.push({
      name: 'Leg Curls',
      sets: Math.round(3 * volumeMultiplier),
      reps: '12-15',
      rpe: 7,
      rest: '60s',
      notes: 'Squeeze at top',
      progression: 'Add reps then weight',
    });
  }

  if (focus.includes('biceps')) {
    exercises.push({
      name: 'Barbell Curl',
      sets: Math.round(3 * volumeMultiplier),
      reps: '10-12',
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
      sets: Math.round(3 * volumeMultiplier),
      reps: '15-20',
      rpe: 7,
      rest: '60s',
      notes: 'External rotation at top',
      progression: 'Add reps before weight',
    });
  }

  if (focus.includes('core')) {
    exercises.push({
      name: 'Cable Crunches',
      sets: 3,
      reps: '15-20',
      rpe: 7,
      rest: '60s',
      notes: 'Curl spine, dont hip flex',
      progression: 'Add weight when 20 reps is easy',
    });
  }

  return exercises;
}

function generateEnduranceSession(type, phase, isDeload, weeklyMileage) {
  const baseMileage = weeklyMileage || 20;
  const intensityMultiplier = isDeload ? 0.5 : phase === 'Build' ? 1.1 : phase === 'Peak' ? 1.2 : 1;

  switch (type) {
    case 'Easy Run':
      return {
        name: 'Easy Run',
        duration: Math.round(40 * intensityMultiplier),
        exercises: [{
          name: 'Easy Run',
          sets: 1,
          reps: `${Math.round(4 * intensityMultiplier)} miles`,
          rpe: 5,
          rest: 'N/A',
          notes: 'Conversational pace, Zone 2',
          progression: 'Add 0.5 miles every 2 weeks',
        }],
      };
    case 'Tempo Run':
      return {
        name: 'Tempo Run',
        duration: Math.round(45 * intensityMultiplier),
        exercises: [
          {
            name: 'Warm-up Jog',
            sets: 1,
            reps: '10 min',
            rpe: 5,
            rest: 'N/A',
            notes: 'Easy pace',
          },
          {
            name: 'Tempo Effort',
            sets: 1,
            reps: `${Math.round(20 * intensityMultiplier)} min`,
            rpe: 7,
            rest: 'N/A',
            notes: 'Comfortably hard - can speak in short sentences',
            progression: 'Add 2 min tempo every 2 weeks',
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
      return {
        name: 'Interval Training',
        duration: Math.round(50 * intensityMultiplier),
        exercises: [
          {
            name: 'Warm-up',
            sets: 1,
            reps: '15 min',
            rpe: 5,
            rest: 'N/A',
            notes: 'Include dynamic stretches',
          },
          {
            name: '400m Repeats',
            sets: isDeload ? 4 : phase === 'Peak' ? 8 : 6,
            reps: '400m fast',
            rpe: 9,
            rest: '90s jog',
            notes: 'Consistent pace each rep',
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
      return {
        name: 'Long Run',
        duration: Math.round(90 * intensityMultiplier),
        exercises: [{
          name: 'Long Run',
          sets: 1,
          reps: `${Math.round(baseMileage * 0.3 * intensityMultiplier)} miles`,
          rpe: 6,
          rest: 'N/A',
          notes: 'Steady, comfortable pace - practice race nutrition',
          progression: 'Add 1 mile per week (max 10% increase)',
        }],
      };
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

function generateFatLossSession(dayFocus, phase, isDeload) {
  const exercises = [];

  // Always include some HIIT or metabolic work
  if (dayFocus.includes('hiit')) {
    exercises.push({
      name: 'HIIT Circuit',
      sets: isDeload ? 2 : 4,
      reps: '30s work / 30s rest',
      rpe: 9,
      rest: '2 min between rounds',
      notes: 'Max effort during work intervals',
      progression: 'Add 1 round or reduce rest',
    });
  }

  // Strength training for muscle preservation
  const strengthExercises = generateAestheticExercises(dayFocus, phase, isDeload);
  exercises.push(...strengthExercises.slice(0, 4));

  // Finisher
  if (!isDeload) {
    exercises.push({
      name: 'Incline Walk',
      sets: 1,
      reps: '15-20 min',
      rpe: 5,
      rest: 'N/A',
      notes: '10-12% incline, 3.0-3.5 mph',
      progression: 'Add 5 min or increase incline',
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
    strengthGoals,
    vacations = [],
  } = formData;

  const mesocycleWeeks = 5; // 5-week cycle with deload
  const phases = ['Base', 'Build', 'Build', 'Peak', 'Deload'];
  const workoutDays = distributeWorkoutDays(desiredTrainingDays);

  // Get appropriate split template
  let splitType = 'aesthetic';
  if (programType === 'strength') splitType = 'strength';

  const splitTemplate = SPLIT_TEMPLATES[Math.min(desiredTrainingDays, 6)]?.[splitType]
    || SPLIT_TEMPLATES[4][splitType];

  // Generate weekly schedule
  const weeklySchedule = [];

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

    // Primary session
    if (programType === 'endurance') {
      const enduranceType = ENDURANCE_TEMPLATES.running[desiredTrainingDays]?.[workoutIndex] || 'Easy Run';
      const enduranceSession = generateEnduranceSession(enduranceType, 'Base', false, currentWeeklyMileage);

      sessions.push({
        time: 'AM',
        type: 'endurance',
        focus: enduranceType,
        duration: enduranceSession.duration,
        exercises: enduranceSession.exercises,
      });
    } else if (programType === 'strength') {
      const exercises = generateStrengthExercises(template.focus, 'Base', false);
      sessions.push({
        time: 'ANY',
        type: 'strength',
        focus: template.name,
        duration: 60,
        exercises,
      });
    } else if (programType === 'aesthetic') {
      const exercises = generateAestheticExercises(template.focus, 'Base', false);
      sessions.push({
        time: 'ANY',
        type: 'hypertrophy',
        focus: template.name,
        duration: 60,
        exercises,
      });
    } else if (programType === 'fatloss') {
      const exercises = generateFatLossSession(template.focus, 'Base', false);
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
          'Base',
          false
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
      isDeload: false,
      sessions,
    });
  }

  // Calculate vacation weeks for deload alignment
  const vacationWeeks = [];
  if (vacations.length > 0) {
    vacations.forEach((v, i) => {
      if (v.startDate) {
        vacationWeeks.push(i + 1); // Simplified - would need real date calculation
      }
    });
  }

  // Create the program object
  const programName = getProgramName(programType, programSubtype);

  return {
    name: programName,
    description: `Personalized ${programType} program optimized for your goals with progressive overload and strategic deloads.`,
    mesocycleWeeks,
    currentWeek: 1,
    currentPhase: 'Base',
    phases,
    primaryGoal: programType,
    primarySubtype: programSubtype,
    secondaryGoal: secondaryProgramType || null,
    secondarySubtype: formData.secondarySubtype || null,
    isHybrid: enableHybrid || false,
    allowDoubleDays: allowDoubleDays || false,
    daysPerWeek: desiredTrainingDays,
    vacations,
    vacationWeeks,
    generatedAt: new Date().toISOString(),
    weeklySchedule,
    progressionRules: {
      strengthIncrease: 'Add 2.5-5lbs per week when all reps completed at target RPE',
      volumeIncrease: 'Add 1 set per exercise every 2 weeks during Build phase',
      deloadProtocol: 'Every 5th week: 50% volume, maintain intensity at RPE 6-7',
      enduranceProgression: 'Increase weekly volume by 10% during Build phase (max)',
    },
    dynamicAdjustments: {
      missedWorkouts: 'Program will auto-adjust if workouts are missed',
      nutritionTracking: 'Calorie targets adjust based on progress',
      goalTracking: 'Weekly check-ins to ensure you stay on track',
    },
  };
}

function getProgramName(programType, subtype) {
  const names = {
    endurance: {
      running: 'Runner\'s Foundation',
      marathon: 'Marathon Prep',
      cycling: 'Cycling Performance',
      swimming: 'Swim Strong',
      triathlon: 'Triathlon Builder',
    },
    strength: {
      powerlifting: 'Powerlifting Protocol',
      olympic: 'Olympic Lifting Program',
      strongman: 'Strongman Training',
    },
    aesthetic: {
      hypertrophy: 'Hypertrophy Builder',
      'lean-muscle': 'Lean Gains Program',
      recomp: 'Body Recomposition',
    },
    fatloss: {
      aggressive: 'Rapid Fat Loss',
      moderate: 'Sustainable Shred',
      slow: 'Gradual Cut',
    },
  };

  return names[programType]?.[subtype] || `${programType.charAt(0).toUpperCase() + programType.slice(1)} Program`;
}

export default generateProgram;
