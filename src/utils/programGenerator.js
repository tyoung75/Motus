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
  const { raceDate, aestheticGoalDate, targetDate, strengthGoalDate, programType, programSubtype } = formData;

  let goalDate = null;
  if (raceDate) goalDate = new Date(raceDate);
  else if (aestheticGoalDate) goalDate = new Date(aestheticGoalDate);
  else if (strengthGoalDate) goalDate = new Date(strengthGoalDate);
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
// Proper periodization: 4 weeks training + 1 week deload, repeating
// Phase cycle: Base (4wk) → Deload → Build (4wk) → Deload → Peak (2-4wk) → Taper (1-3wk)

function generatePeriodizationPhases(totalWeeks, programType, programSubtype) {
  const phases = [];

  // For endurance race training: need taper at the end
  const isRaceTraining = programType === 'endurance' &&
    ['running', 'marathon', 'triathlon', 'cycling'].includes(programSubtype);

  // Reserve taper weeks for race training (2-3 weeks)
  const taperWeeks = isRaceTraining ? Math.min(3, Math.floor(totalWeeks * 0.1) + 1) : 0;
  const trainingWeeks = totalWeeks - taperWeeks;

  // Each mesocycle: 4 weeks training + 1 week deload = 5 weeks
  const mesocycleLength = 5;
  let currentWeek = 0;

  while (currentWeek < trainingWeeks) {
    const mesocycleNumber = Math.floor(currentWeek / mesocycleLength);
    const weekInMesocycle = currentWeek % mesocycleLength;

    // Week 5 of each mesocycle is ALWAYS deload
    if (weekInMesocycle === 4) {
      phases.push('Deload');
    } else {
      // Determine which phase based on mesocycle number
      const totalMesocycles = Math.ceil(trainingWeeks / mesocycleLength);

      if (mesocycleNumber === 0) {
        // First mesocycle: Base
        phases.push('Base');
      } else if (mesocycleNumber >= totalMesocycles - 1 && currentWeek >= trainingWeeks - 4) {
        // Last full mesocycle before taper: Peak
        phases.push('Peak');
      } else {
        // Middle mesocycles: Build
        phases.push('Build');
      }
    }
    currentWeek++;
  }

  // Add taper weeks for race training
  for (let i = 0; i < taperWeeks; i++) {
    phases.push('Taper');
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
// Research-based approach:
// 1. Start at user's current mileage (or reasonable default based on goal)
// 2. Progress max 10% per week (safer than 5% for building)
// 3. Peak mileage based on goal race time and distance
// 4. Never start higher than 80% of target peak

function calculateTargetPeakMileage(raceDistance, goalPacePerMile, athleteLevel) {
  // Research-based peak mileage for different race goals
  // Based on Daniels' Running Formula and Pfitzinger methodology
  const { level } = athleteLevel;

  // Base peak mileage by race distance
  const basePeaks = {
    '5k': { min: 25, max: 40 },
    '10k': { min: 30, max: 50 },
    'half': { min: 35, max: 55 },
    'full': { min: 40, max: 70 },
    'ultra': { min: 50, max: 80 },
  };

  const peaks = basePeaks[raceDistance] || basePeaks['full'];

  // Adjust based on goal pace (faster goals need more mileage)
  // Sub-3hr marathon needs ~60-70 mi/wk peak
  // Sub-4hr marathon needs ~40-50 mi/wk peak
  let targetPeak = (peaks.min + peaks.max) / 2;

  if (goalPacePerMile) {
    const pace = parseFloat(goalPacePerMile) || 9;
    if (pace < 7) targetPeak = peaks.max;        // Elite pace
    else if (pace < 8) targetPeak = peaks.max * 0.9;
    else if (pace < 9) targetPeak = (peaks.min + peaks.max) / 2;
    else targetPeak = peaks.min * 1.1;
  }

  // Level adjustment
  if (level === 'elite') targetPeak *= 1.1;
  else if (level === 'advanced') targetPeak *= 1.0;
  else if (level === 'intermediate') targetPeak *= 0.9;
  else targetPeak *= 0.8;

  return Math.round(targetPeak);
}

function calculateWeeklyMileage(totalWeeks, peakMileage, currentWeek, phase, startingMileage = null, raceDistance = null, athleteLevel = null) {
  const maxWeeklyIncrease = 0.10; // 10% max per week (industry standard)

  // Calculate actual starting point
  let baseMileage = startingMileage;

  if (!baseMileage || baseMileage <= 0) {
    // No starting mileage provided - calculate a reasonable starting point
    // Start at 50-60% of peak to allow proper buildup
    baseMileage = Math.round(peakMileage * 0.5);
  }

  // Ensure starting mileage isn't too high relative to peak
  // Can't start at more than 80% of peak (need room to progress)
  baseMileage = Math.min(baseMileage, Math.round(peakMileage * 0.8));

  // Ensure minimum starting mileage based on race distance
  const minimums = { '5k': 10, '10k': 15, 'half': 20, 'full': 25, 'ultra': 30 };
  const minMileage = minimums[raceDistance] || 15;
  baseMileage = Math.max(baseMileage, minMileage);

  // Calculate weeks needed to reach peak from base at 10%/week
  const weeksToReachPeak = Math.ceil(Math.log(peakMileage / baseMileage) / Math.log(1 + maxWeeklyIncrease));

  // Phase-specific adjustments
  if (phase === 'Taper') {
    // During taper, progressively reduce: Week 1 = 75%, Week 2 = 50%, Week 3 = 40%
    const taperReduction = currentWeek === totalWeeks ? 0.40 :
                          currentWeek === totalWeeks - 1 ? 0.50 : 0.75;
    return Math.round(peakMileage * taperReduction);
  }

  if (phase === 'Deload') {
    // Deload week: 60-70% of what would be normal progression
    const normalMileage = Math.min(
      baseMileage * Math.pow(1 + maxWeeklyIncrease, currentWeek - 1),
      peakMileage
    );
    return Math.round(normalMileage * 0.65);
  }

  // Progressive increase
  // Calculate where we should be in the progression
  const progressionWeek = currentWeek;
  let weekMileage = baseMileage * Math.pow(1 + maxWeeklyIncrease, progressionWeek - 1);

  // Cap at peak mileage
  weekMileage = Math.min(weekMileage, peakMileage);

  return Math.round(weekMileage);
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
    // Triathlon-specific templates with double/triple days built in
    // Based on professional triathlon training methodology
    // MINIMUM 3 STRENGTH DAYS per week (injury prevention, not hypertrophy)
    // Double/triple days marked with + or /
    5: [
      'Swim + Strength',           // Mon: AM swim technique, PM injury prevention strength
      'Bike Intervals + Strength', // Tue: AM bike intervals, PM light strength (core/stability)
      'Run + Strength',            // Wed: AM easy/moderate run, PM strength (hip/glute focus)
      'Swim + Run',                // Thu: AM swim, PM easy run (double day)
      'Long Brick',                // Sat: Long bike + brick run off the bike
    ],
    6: [
      'Swim + Strength',           // Mon: AM swim, PM full strength session
      'Bike Intervals',            // Tue: Bike quality session
      'Run + Strength',            // Wed: AM run, PM strength (hip stability/core)
      'Swim + Easy Ride',          // Thu: AM swim, PM easy bike (active recovery)
      'Run Tempo + Strength',      // Fri: AM tempo run, PM light strength (prehab)
      'Long Brick',                // Sat: Long ride + brick run
    ],
    7: [
      'Swim + Strength',           // Mon: AM swim, PM full strength session
      'Bike Intervals',            // Tue: Quality bike
      'Run + Strength',            // Wed: AM easy run, PM strength
      'Swim AM / Run PM',          // Thu: Double swim/run
      'Bike + Strength',           // Fri: AM easy bike, PM light strength
      'Run Tempo',                 // Sat: Quality run session
      'Long Brick',                // Sun: Key long session
    ],
  },
};

// Triathlon-specific injury prevention strength exercises
// Focus: single-leg stability, hip strength, core, rotator cuff - NOT hypertrophy
function generateTriathlonStrengthExercises(phase, isDeload, athleteLevel, weekNumber, focus = 'full') {
  const exercises = [];
  const { multiplier, level } = athleteLevel;
  const volumeBase = isDeload ? 0.6 : 1.0;

  // Exercise library - will select based on focus
  const hipExercises = [
    {
      name: 'Single-Leg Romanian Deadlift',
      sets: Math.round(3 * volumeBase),
      reps: '8-10 each leg',
      rpe: 6,
      rest: '60s',
      notes: 'Focus on hip stability, not weight. Light dumbbells only.',
      progression: 'Master balance before adding weight. This is injury prevention.',
    },
    {
      name: 'Bulgarian Split Squat',
      sets: Math.round(3 * volumeBase),
      reps: '10-12 each leg',
      rpe: 6,
      rest: '60s',
      notes: 'Control descent, drive through front heel. Build single-leg strength.',
      progression: 'Add 5lbs every 2-3 weeks when form is solid.',
    },
    {
      name: 'Lateral Band Walks',
      sets: 3,
      reps: '15 each direction',
      rpe: 5,
      rest: '30s',
      notes: 'Keep tension on band throughout. Glute med activation.',
      progression: 'Use heavier band as it becomes easy.',
    },
    {
      name: 'Clamshells',
      sets: 3,
      reps: '15-20 each side',
      rpe: 5,
      rest: '30s',
      notes: 'External hip rotation. Critical for knee health in running.',
      progression: 'Add resistance band when bodyweight is easy.',
    },
  ];

  const coreExercises = [
    {
      name: 'Dead Bug',
      sets: 3,
      reps: '10 each side',
      rpe: 5,
      rest: '45s',
      notes: 'Keep lower back pressed to floor. Anti-extension strength.',
      progression: 'Slow the movement, add holds at end range.',
    },
    {
      name: 'Pallof Press',
      sets: 3,
      reps: '10 each side',
      rpe: 6,
      rest: '45s',
      notes: 'Anti-rotation core work. Essential for swim and run.',
      progression: 'Increase cable weight or add iso holds.',
    },
    {
      name: 'Side Plank',
      sets: 2,
      reps: '30-45s each side',
      rpe: 6,
      rest: '30s',
      notes: 'Hip elevated, straight line from head to feet.',
      progression: 'Add hip dips or raise top leg.',
    },
    {
      name: 'Bird Dog',
      sets: 3,
      reps: '8 each side with 3s hold',
      rpe: 5,
      rest: '45s',
      notes: 'Opposite arm/leg extension with neutral spine.',
      progression: 'Add resistance band around foot.',
    },
  ];

  const shoulderExercises = [
    {
      name: 'Band Pull-Aparts',
      sets: 3,
      reps: '15-20',
      rpe: 5,
      rest: '30s',
      notes: 'Squeeze shoulder blades together. Rotator cuff health.',
      progression: 'Essential for swim shoulder health - never skip.',
    },
    {
      name: 'External Rotation (Cable/Band)',
      sets: 2,
      reps: '15 each arm',
      rpe: 5,
      rest: '30s',
      notes: 'Elbow pinned to side, rotate out. Swim-specific prehab.',
      progression: 'Keep light - this is prehab, not strength training.',
    },
    {
      name: 'Face Pulls',
      sets: 3,
      reps: '15',
      rpe: 5,
      rest: '30s',
      notes: 'Pull to face, external rotate at end. Rear delt & rotator cuff.',
      progression: 'Keep light - focus on squeeze at end range.',
    },
  ];

  // Select exercises based on focus type
  switch (focus) {
    case 'hip':
      // Hip/glute focused - ideal after running
      exercises.push(...hipExercises);
      exercises.push(coreExercises[0]); // Add Dead Bug for core
      break;

    case 'core':
      // Core/stability focused - ideal after bike intervals
      exercises.push(...coreExercises);
      exercises.push(hipExercises[2]); // Add Lateral Band Walks
      break;

    case 'prehab':
      // Light prehab focused - ideal after tempo runs
      exercises.push(...shoulderExercises);
      exercises.push(coreExercises[0]); // Dead Bug
      exercises.push(hipExercises[2]); // Lateral Band Walks
      break;

    case 'full':
    default:
      // Full strength session - all exercises (swim + strength days)
      exercises.push(...hipExercises);
      exercises.push(...coreExercises.slice(0, 3)); // Skip Bird Dog for time
      exercises.push(...shoulderExercises.slice(0, 2)); // Main shoulder work
      // Add Bird Dog for advanced athletes
      if (level === 'advanced' || level === 'elite') {
        exercises.push(coreExercises[3]);
      }
      break;
  }

  return exercises;
}

// Generate triathlon-specific session (swim, bike, run, brick, etc.)
function generateTriathlonSession(sessionType, phase, isDeload, athleteLevel, paces, weekNumber, totalWeeks) {
  const { level } = athleteLevel;
  const phaseMultiplier = phase === 'Taper' ? 0.6 : phase === 'Peak' ? 1.1 : phase.includes('Build') ? 1.0 : 0.85;

  switch (sessionType) {
    case 'Swim + Run':
      return {
        name: 'Swim / Run Double',
        duration: 90,
        exercises: [
          {
            name: 'Swim - Technique Focus',
            sets: 1,
            reps: isDeload ? '1500m' : '2000-2500m',
            pace: 'CSS pace (threshold)',
            heartRateZone: 'Zone 2-3',
            rpe: 6,
            rest: 'N/A',
            notes: 'Focus on catch and pull technique. Include drill work.',
            progression: `Week ${weekNumber}: Build swim volume gradually.`,
          },
          {
            name: 'Run - Easy/Moderate',
            sets: 1,
            reps: isDeload ? '30 min' : '45-60 min',
            pace: paces?.easyPace || '9:00-9:30/mi',
            heartRateZone: 'Zone 2',
            rpe: 5,
            rest: 'N/A',
            notes: 'Easy effort. Recovery between sessions.',
            progression: 'Separate by 4-6 hours if possible.',
          },
        ],
      };

    case 'Swim AM / Run PM':
      return {
        name: 'AM Swim / PM Run',
        duration: 105,
        exercises: [
          {
            name: 'Morning Swim',
            sets: 1,
            reps: level === 'elite' ? '3000-3500m' : '2000-2500m',
            pace: 'Mixed: warm up + main set + cool down',
            heartRateZone: 'Zone 2-4',
            rpe: 7,
            rest: 'N/A',
            notes: 'Main set at CSS pace. Include 4x100 at race pace.',
            progression: `Week ${weekNumber}: Focus on stroke efficiency.`,
          },
          {
            name: 'Evening Run',
            sets: 1,
            reps: isDeload ? '40 min' : '50-60 min',
            pace: paces?.easyPace || '9:00/mi',
            heartRateZone: 'Zone 2',
            rpe: 5,
            rest: 'N/A',
            notes: 'Easy effort, focus on cadence and form.',
            progression: 'Build run fitness off swim fatigue.',
          },
        ],
      };

    case 'Bike Intervals':
    case 'Bike':
      return {
        name: 'Bike Intervals',
        duration: isDeload ? 60 : 75,
        exercises: [
          {
            name: 'Bike Interval Session',
            sets: isDeload ? 3 : (level === 'elite' ? 6 : 5),
            reps: '5 min @ FTP',
            pace: 'FTP (Functional Threshold Power)',
            heartRateZone: 'Zone 4',
            rpe: 8,
            rest: '2 min easy spin',
            notes: 'Maintain steady power throughout interval. Cadence 85-95.',
            progression: `Week ${weekNumber}: Add 1 interval every 2 weeks.`,
          },
        ],
      };

    case 'Swim + Strength':
      return {
        name: 'Swim + Injury Prevention',
        duration: 75,
        exercises: [
          {
            name: 'Technique Swim',
            sets: 1,
            reps: '1500-2000m',
            pace: 'Easy-moderate',
            heartRateZone: 'Zone 2',
            rpe: 5,
            rest: 'N/A',
            notes: 'Drill-focused: catch-up drill, fingertip drag, 6-kick switch.',
            progression: 'Quality over quantity on strength days.',
          },
          // Strength exercises added separately
        ],
        strengthSession: generateTriathlonStrengthExercises(phase, isDeload, athleteLevel, weekNumber),
      };

    case 'Run Tempo':
      return {
        name: 'Tempo Run',
        duration: 60,
        exercises: [
          {
            name: 'Warm-up',
            sets: 1,
            reps: '1.5 miles',
            pace: paces?.easyPace || '9:30/mi',
            heartRateZone: 'Zone 2',
            rpe: 4,
            rest: 'N/A',
            notes: 'Include strides at end of warm-up.',
          },
          {
            name: 'Tempo',
            sets: 1,
            reps: isDeload ? '15 min' : (level === 'elite' ? '30 min' : '20-25 min'),
            pace: paces?.tempoPace || '7:30/mi',
            heartRateZone: 'Zone 3-4',
            rpe: 7,
            rest: 'N/A',
            notes: 'Comfortably hard. Should be able to speak in short sentences.',
            progression: `Week ${weekNumber}: Extend tempo duration by 2-3 min/week.`,
          },
          {
            name: 'Cool-down',
            sets: 1,
            reps: '1 mile',
            pace: paces?.recoveryPace || '10:00/mi',
            heartRateZone: 'Zone 1',
            rpe: 3,
            rest: 'N/A',
            notes: 'Easy jog + stretching.',
          },
        ],
      };

    case 'Long Bike/Run Brick':
    case 'Long Brick':
    case 'Long Ride + Run Brick':
      const bikeHours = level === 'elite' ? 3 : level === 'advanced' ? 2.5 : 2;
      const runMiles = level === 'elite' ? 6 : level === 'advanced' ? 5 : 4;
      return {
        name: 'Long Brick Session',
        duration: bikeHours * 60 + 45,
        exercises: [
          {
            name: 'Long Ride',
            sets: 1,
            reps: `${isDeload ? bikeHours - 0.5 : bikeHours} hours`,
            pace: 'Aerobic (Zone 2)',
            heartRateZone: 'Zone 2',
            rpe: 5,
            rest: 'N/A',
            notes: 'Practice race nutrition: 60-90g carbs/hour. Last 20 min at race pace.',
            progression: `Week ${weekNumber}: Key session. Build bike endurance.`,
          },
          {
            name: 'Brick Run (off bike)',
            sets: 1,
            reps: `${isDeload ? runMiles - 1 : runMiles} miles`,
            pace: 'Start easy, settle into race pace',
            heartRateZone: 'Zone 2-3',
            rpe: 6,
            rest: 'N/A',
            notes: 'T2 practice. Quick transition, find your legs.',
            progression: 'Critical for race-day leg turnover.',
          },
        ],
      };

    case 'Swim + Easy Ride':
      return {
        name: 'Swim + Easy Ride',
        duration: 90,
        exercises: [
          {
            name: 'Swim - Aerobic',
            sets: 1,
            reps: '2000-2500m',
            pace: 'Easy-moderate',
            heartRateZone: 'Zone 2',
            rpe: 5,
            rest: 'N/A',
            notes: 'Continuous swim, focus on bilateral breathing.',
          },
          {
            name: 'Easy Spin',
            sets: 1,
            reps: '45-60 min',
            pace: 'Recovery',
            heartRateZone: 'Zone 1-2',
            rpe: 4,
            rest: 'N/A',
            notes: 'Active recovery. High cadence, low power.',
          },
        ],
      };

    case 'Easy Run':
      return {
        name: 'Easy Run',
        duration: 45,
        exercises: [
          {
            name: 'Easy Run',
            sets: 1,
            reps: isDeload ? '30 min' : '45 min',
            pace: paces?.easyPace || '9:00-9:30/mi',
            heartRateZone: 'Zone 2',
            rpe: 4,
            rest: 'N/A',
            notes: 'Truly easy. Recovery run.',
            progression: 'Keep easy days easy.',
          },
        ],
      };

    case 'Bike Intervals + Strength':
      return {
        name: 'Bike Intervals + Strength',
        duration: 90,
        exercises: [
          {
            name: 'Bike Interval Session',
            sets: isDeload ? 3 : (level === 'elite' ? 6 : 5),
            reps: '5 min @ FTP',
            pace: 'FTP (Functional Threshold Power)',
            heartRateZone: 'Zone 4',
            rpe: 8,
            rest: '2 min easy spin',
            notes: 'Quality intervals. Maintain power throughout.',
            progression: `Week ${weekNumber}: Key bike session.`,
          },
        ],
        strengthSession: generateTriathlonStrengthExercises(phase, isDeload, athleteLevel, weekNumber, 'core'),
      };

    case 'Run + Strength':
      return {
        name: 'Run + Strength',
        duration: 85,
        exercises: [
          {
            name: 'Easy-Moderate Run',
            sets: 1,
            reps: isDeload ? '35 min' : '45-50 min',
            pace: paces?.easyPace || '9:00/mi',
            heartRateZone: 'Zone 2',
            rpe: 5,
            rest: 'N/A',
            notes: 'Comfortable effort. Focus on form and cadence.',
            progression: `Week ${weekNumber}: Build aerobic base.`,
          },
        ],
        strengthSession: generateTriathlonStrengthExercises(phase, isDeload, athleteLevel, weekNumber, 'hip'),
      };

    case 'Bike + Strength':
      return {
        name: 'Bike + Strength',
        duration: 80,
        exercises: [
          {
            name: 'Easy Aerobic Ride',
            sets: 1,
            reps: isDeload ? '45 min' : '60 min',
            pace: 'Aerobic (Zone 2)',
            heartRateZone: 'Zone 2',
            rpe: 5,
            rest: 'N/A',
            notes: 'Easy spinning. Active recovery ride with strength after.',
            progression: 'Keep intensity low to allow for PM strength.',
          },
        ],
        strengthSession: generateTriathlonStrengthExercises(phase, isDeload, athleteLevel, weekNumber, 'full'),
      };

    case 'Run Tempo + Strength':
      return {
        name: 'Run Tempo + Strength',
        duration: 95,
        exercises: [
          {
            name: 'Warm-up',
            sets: 1,
            reps: '1 mile',
            pace: paces?.easyPace || '9:30/mi',
            heartRateZone: 'Zone 2',
            rpe: 4,
            rest: 'N/A',
            notes: 'Easy jog with strides.',
          },
          {
            name: 'Tempo',
            sets: 1,
            reps: isDeload ? '12 min' : (level === 'elite' ? '25 min' : '18-20 min'),
            pace: paces?.tempoPace || '7:30/mi',
            heartRateZone: 'Zone 3-4',
            rpe: 7,
            rest: 'N/A',
            notes: 'Comfortably hard. Shorter than standalone tempo to allow for strength.',
            progression: `Week ${weekNumber}: Quality over quantity.`,
          },
          {
            name: 'Cool-down',
            sets: 1,
            reps: '0.5 miles',
            pace: paces?.recoveryPace || '10:00/mi',
            heartRateZone: 'Zone 1',
            rpe: 3,
            rest: 'N/A',
            notes: 'Easy jog.',
          },
        ],
        strengthSession: generateTriathlonStrengthExercises(phase, isDeload, athleteLevel, weekNumber, 'prehab'),
      };

    default:
      return {
        name: sessionType,
        duration: 60,
        exercises: [{
          name: sessionType,
          sets: 1,
          reps: '60 min',
          rpe: 6,
          rest: 'N/A',
          notes: 'Moderate effort.',
        }],
      };
  }
}

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

// ============ POWERBUILDING/STRENGTH EXERCISE DATABASE ============
// Comprehensive exercise library with % of 1RM recommendations

const STRENGTH_EXERCISE_DB = {
  // Main compound lifts with % of 1RM by phase
  squat: {
    main: {
      name: 'Back Squat',
      percentages: {
        Base: { min: 70, max: 80, reps: '5-8', sets: 4 },
        Build: { min: 80, max: 87.5, reps: '3-5', sets: 5 },
        Peak: { min: 87.5, max: 95, reps: '1-3', sets: 5 },
        Deload: { min: 50, max: 60, reps: '5-8', sets: 3 },
      },
      rest: '3-4 min',
      notes: 'Break at hips, knees track over toes, drive through heels',
    },
    variations: [
      { name: 'Pause Squat', percent: 0.80, reps: '3-5', sets: 3, notes: '2-3 sec pause in hole' },
      { name: 'Front Squat', percent: 0.75, reps: '4-6', sets: 3, notes: 'Upright torso, elbows high' },
      { name: 'Box Squat', percent: 0.85, reps: '3-5', sets: 3, notes: 'Pause on box, explode up' },
    ],
    accessories: [
      { name: 'Leg Press', reps: '8-12', sets: 3, notes: 'Control descent, full ROM', isBodyweight: false },
      { name: 'Walking Lunges', reps: '10-12 each', sets: 3, notes: 'Long stride, upright torso', isBodyweight: true },
      { name: 'Leg Extensions', reps: '12-15', sets: 3, notes: 'Squeeze at top, slow negative', isBodyweight: false },
      { name: 'Leg Curls', reps: '10-12', sets: 3, notes: 'Squeeze hamstrings at top', isBodyweight: false },
      { name: 'Bulgarian Split Squat', reps: '8-10 each', sets: 3, notes: 'Vertical shin on front leg', isBodyweight: true },
      { name: 'Goblet Squat', reps: '10-12', sets: 3, notes: 'Elbows inside knees at bottom', isBodyweight: false },
    ],
  },
  bench: {
    main: {
      name: 'Bench Press',
      percentages: {
        Base: { min: 70, max: 80, reps: '5-8', sets: 4 },
        Build: { min: 80, max: 87.5, reps: '3-5', sets: 5 },
        Peak: { min: 87.5, max: 95, reps: '1-3', sets: 5 },
        Deload: { min: 50, max: 60, reps: '5-8', sets: 3 },
      },
      rest: '3-4 min',
      notes: 'Retract scapula, arch back, leg drive, control descent',
    },
    variations: [
      { name: 'Close-Grip Bench', percent: 0.85, reps: '4-6', sets: 3, notes: 'Elbows tucked, tricep focus' },
      { name: 'Paused Bench Press', percent: 0.80, reps: '3-5', sets: 3, notes: '2 sec pause on chest' },
      { name: 'Incline Bench Press', percent: 0.75, reps: '6-8', sets: 3, notes: '30-45 degree incline' },
      { name: 'Floor Press', percent: 0.85, reps: '4-6', sets: 3, notes: 'Pause at floor, lockout strength' },
    ],
    accessories: [
      { name: 'Dumbbell Bench Press', reps: '8-12', sets: 3, notes: 'Full ROM, squeeze at top', isBodyweight: false },
      { name: 'Dumbbell Fly', reps: '10-12', sets: 3, notes: 'Slight bend in elbows, stretch at bottom', isBodyweight: false },
      { name: 'Tricep Pushdowns', reps: '12-15', sets: 3, notes: 'Lock elbows, squeeze triceps', isBodyweight: false },
      { name: 'Skull Crushers', reps: '10-12', sets: 3, notes: 'Keep elbows pointed up', isBodyweight: false },
      { name: 'Dips', reps: '8-12', sets: 3, notes: 'Lean forward for chest, upright for triceps', isBodyweight: true },
      { name: 'Overhead Tricep Extension', reps: '10-12', sets: 3, notes: 'Full stretch at bottom', isBodyweight: false },
    ],
  },
  deadlift: {
    main: {
      name: 'Deadlift',
      percentages: {
        Base: { min: 70, max: 80, reps: '4-6', sets: 3 },
        Build: { min: 80, max: 87.5, reps: '2-4', sets: 4 },
        Peak: { min: 87.5, max: 95, reps: '1-3', sets: 4 },
        Deload: { min: 50, max: 60, reps: '4-6', sets: 2 },
      },
      rest: '4-5 min',
      notes: 'Brace core, chest up, hinge at hips, bar close to body',
    },
    variations: [
      { name: 'Deficit Deadlift', percent: 0.80, reps: '3-5', sets: 3, notes: '2-3 inch deficit, speed off floor' },
      { name: 'Romanian Deadlift', percent: 0.65, reps: '8-10', sets: 3, notes: 'Hamstring stretch, slight knee bend' },
      { name: 'Paused Deadlift', percent: 0.75, reps: '2-4', sets: 3, notes: '2 sec pause at knee height' },
      { name: 'Block Pull', percent: 0.90, reps: '2-4', sets: 3, notes: 'Lockout strength, above knee' },
    ],
    accessories: [
      { name: 'Barbell Row', reps: '6-10', sets: 4, notes: 'Pull to lower chest, squeeze lats', isBodyweight: false },
      { name: 'Good Mornings', reps: '8-10', sets: 3, notes: 'Hip hinge, hamstring stretch', isBodyweight: false },
      { name: 'Back Extensions', reps: '12-15', sets: 3, notes: 'Squeeze glutes at top', isBodyweight: true },
      { name: 'Pull-ups', reps: '6-10', sets: 4, notes: 'Full ROM, dead hang to chin over bar', isBodyweight: true },
      { name: 'Face Pulls', reps: '15-20', sets: 3, notes: 'External rotation, rear delt focus', isBodyweight: false },
      { name: 'Lat Pulldown', reps: '10-12', sets: 3, notes: 'Drive elbows down, squeeze lats', isBodyweight: false },
    ],
  },
  ohp: {
    main: {
      name: 'Overhead Press',
      percentages: {
        Base: { min: 70, max: 80, reps: '5-8', sets: 4 },
        Build: { min: 80, max: 87.5, reps: '3-5', sets: 4 },
        Peak: { min: 85, max: 92.5, reps: '2-4', sets: 4 },
        Deload: { min: 50, max: 60, reps: '6-8', sets: 3 },
      },
      rest: '2-3 min',
      notes: 'Squeeze glutes, brace core, press straight up, head through at top',
    },
    variations: [
      { name: 'Push Press', percent: 1.10, reps: '3-5', sets: 3, notes: 'Small dip, explosive drive' },
      { name: 'Z Press', percent: 0.70, reps: '6-8', sets: 3, notes: 'Seated on floor, no leg drive' },
      { name: 'Seated Dumbbell Press', percent: 0.80, reps: '8-10', sets: 3, notes: 'Neutral grip option' },
    ],
    accessories: [
      { name: 'Lateral Raises', reps: '12-15', sets: 3, notes: 'Lead with elbows, control descent', isBodyweight: false },
      { name: 'Rear Delt Fly', reps: '12-15', sets: 3, notes: 'Squeeze shoulder blades together', isBodyweight: false },
      { name: 'Upright Rows', reps: '10-12', sets: 3, notes: 'Elbows above wrists at top', isBodyweight: false },
      { name: 'Front Raises', reps: '10-12', sets: 3, notes: 'Thumbs up, raise to eye level', isBodyweight: false },
      { name: 'Arnold Press', reps: '8-12', sets: 3, notes: 'Rotate palms during press', isBodyweight: false },
    ],
  },
};

// Double progression tracking: reps first, then weight
function getDoubleProgression(baseReps, weekInCycle, phase) {
  // In a 4-week cycle:
  // Week 1: Base reps (e.g., 8-10)
  // Week 2: +1 rep (9-11)
  // Week 3: +2 reps (10-12)
  // Week 4: Deload or increase weight and reset to base reps
  if (phase === 'Deload') return baseReps;

  const [minRep, maxRep] = baseReps.split('-').map(Number);
  const repBonus = Math.min(weekInCycle - 1, 2); // Max +2 reps
  return `${minRep + repBonus}-${maxRep + repBonus}`;
}

// Calculate working weight from 1RM based on phase percentages
function calculateWorkingWeight(oneRM, phase, weekInCycle, exerciseData) {
  if (!oneRM) return null;

  const percentages = exerciseData.percentages[phase] || exerciseData.percentages.Base;
  const { min, max } = percentages;

  // Progress within phase: Week 1 = min%, Week 2-3 = middle%, Week 4 (or pre-deload) = max%
  let targetPercent;
  if (weekInCycle === 1) targetPercent = min;
  else if (weekInCycle === 4) targetPercent = max;
  else targetPercent = (min + max) / 2;

  const weight = Math.round((oneRM * targetPercent / 100) / 5) * 5; // Round to nearest 5
  return weight;
}

function generateStrengthExercises(focus, phase, isDeload, athleteLevel, weekNumber, strengthBaselines = []) {
  const exercises = [];
  const level = athleteLevel?.level || 'intermediate';
  const multiplier = athleteLevel?.multiplier || 1.0;

  // Week in current mesocycle (1-4)
  const weekInCycle = ((weekNumber - 1) % 4) + 1;
  const currentPhase = isDeload ? 'Deload' : phase;

  // Volume scaling
  const volumeMultiplier = isDeload ? 0.6 : (phase === 'Build' ? 1.1 : 1.0) * multiplier;

  // Helper to get baseline for a lift
  const getBaseline = (liftId) => {
    const baseline = strengthBaselines.find(b => b.id === liftId);
    return baseline ? {
      current1RM: parseFloat(baseline.current1RM) || parseFloat(baseline.workingWeight) || null,
      target1RM: parseFloat(baseline.target1RM) || null,
    } : null;
  };

  // ============ SQUAT DAY ============
  if (focus.includes('legs') || focus.includes('Squat')) {
    const baseline = getBaseline('squat');
    const exerciseData = STRENGTH_EXERCISE_DB.squat;
    const phaseConfig = exerciseData.main.percentages[currentPhase];
    const workingWeight = calculateWorkingWeight(baseline?.current1RM, currentPhase, weekInCycle, exerciseData.main);
    const percentUsed = workingWeight && baseline?.current1RM ? Math.round(workingWeight / baseline.current1RM * 100) : null;

    // Main lift
    exercises.push({
      name: exerciseData.main.name,
      sets: Math.round(phaseConfig.sets * volumeMultiplier),
      reps: getDoubleProgression(phaseConfig.reps, weekInCycle, currentPhase),
      rpe: isDeload ? 6 : (level === 'elite' ? 8.5 : 8),
      rest: exerciseData.main.rest,
      notes: exerciseData.main.notes,
      startingWeight: workingWeight ? `${workingWeight} lbs (${percentUsed}% of 1RM)` : 'Start light, find working weight',
      current1RM: baseline?.current1RM ? `${baseline.current1RM} lbs` : null,
      target1RM: baseline?.target1RM ? `${baseline.target1RM} lbs` : null,
      isMainLift: true,
      progression: `Double progression: Hit ${phaseConfig.reps.split('-')[1]} reps on all sets → add 5 lbs next session`,
    });

    // Variation (not on deload)
    if (!isDeload) {
      const variation = exerciseData.variations[phase === 'Peak' ? 2 : 0]; // Box squat for peak, pause squat otherwise
      const variationWeight = workingWeight ? Math.round(workingWeight * variation.percent / 5) * 5 : null;
      exercises.push({
        name: variation.name,
        sets: Math.round(variation.sets * volumeMultiplier),
        reps: variation.reps,
        rpe: 7,
        rest: '3 min',
        notes: variation.notes,
        startingWeight: variationWeight ? `${variationWeight} lbs (~${Math.round(variation.percent * 100)}% of working weight)` : null,
        isVariation: true,
        progression: 'Follow main lift progression',
      });
    }

    // Accessories (2-3 based on level)
    const numAccessories = isDeload ? 1 : (level === 'beginner' ? 2 : level === 'intermediate' ? 3 : 4);
    const accessoryOptions = exerciseData.accessories.slice(0, numAccessories);
    accessoryOptions.forEach(acc => {
      exercises.push({
        name: acc.name,
        sets: Math.round(acc.sets * volumeMultiplier),
        reps: getDoubleProgression(acc.reps, weekInCycle, currentPhase),
        rpe: 7,
        rest: '90s',
        notes: acc.notes,
        isAccessory: true,
        progression: `Double progression: ${acc.reps.split('-')[0]}→${acc.reps.split('-')[1]} reps, then add weight`,
      });
    });
  }

  // ============ BENCH DAY ============
  if (focus.includes('chest') || focus.includes('Bench')) {
    const baseline = getBaseline('bench');
    const exerciseData = STRENGTH_EXERCISE_DB.bench;
    const phaseConfig = exerciseData.main.percentages[currentPhase];
    const workingWeight = calculateWorkingWeight(baseline?.current1RM, currentPhase, weekInCycle, exerciseData.main);
    const percentUsed = workingWeight && baseline?.current1RM ? Math.round(workingWeight / baseline.current1RM * 100) : null;

    // Main lift
    exercises.push({
      name: exerciseData.main.name,
      sets: Math.round(phaseConfig.sets * volumeMultiplier),
      reps: getDoubleProgression(phaseConfig.reps, weekInCycle, currentPhase),
      rpe: isDeload ? 6 : (level === 'elite' ? 8.5 : 8),
      rest: exerciseData.main.rest,
      notes: exerciseData.main.notes,
      startingWeight: workingWeight ? `${workingWeight} lbs (${percentUsed}% of 1RM)` : 'Start light, find working weight',
      current1RM: baseline?.current1RM ? `${baseline.current1RM} lbs` : null,
      target1RM: baseline?.target1RM ? `${baseline.target1RM} lbs` : null,
      isMainLift: true,
      progression: `Double progression: Hit ${phaseConfig.reps.split('-')[1]} reps on all sets → add 2.5 lbs next session`,
    });

    // Variation
    if (!isDeload) {
      const variation = phase === 'Peak' ? exerciseData.variations[3] : exerciseData.variations[0]; // Floor press for peak
      const variationWeight = workingWeight ? Math.round(workingWeight * variation.percent / 5) * 5 : null;
      exercises.push({
        name: variation.name,
        sets: Math.round(variation.sets * volumeMultiplier),
        reps: variation.reps,
        rpe: 7,
        rest: '2-3 min',
        notes: variation.notes,
        startingWeight: variationWeight ? `${variationWeight} lbs` : null,
        isVariation: true,
        progression: 'Follow main lift progression',
      });
    }

    // Accessories
    const numAccessories = isDeload ? 1 : (level === 'beginner' ? 2 : level === 'intermediate' ? 3 : 4);
    const accessoryOptions = exerciseData.accessories.slice(0, numAccessories);
    accessoryOptions.forEach(acc => {
      exercises.push({
        name: acc.name,
        sets: Math.round(acc.sets * volumeMultiplier),
        reps: getDoubleProgression(acc.reps, weekInCycle, currentPhase),
        rpe: 7,
        rest: '90s',
        notes: acc.notes,
        isAccessory: true,
        progression: 'Double progression: Add reps first, then weight',
      });
    });
  }

  // ============ DEADLIFT DAY ============
  if (focus.includes('posterior') || focus.includes('Deadlift')) {
    const baseline = getBaseline('deadlift');
    const exerciseData = STRENGTH_EXERCISE_DB.deadlift;
    const phaseConfig = exerciseData.main.percentages[currentPhase];
    const workingWeight = calculateWorkingWeight(baseline?.current1RM, currentPhase, weekInCycle, exerciseData.main);
    const percentUsed = workingWeight && baseline?.current1RM ? Math.round(workingWeight / baseline.current1RM * 100) : null;

    // Main lift
    exercises.push({
      name: exerciseData.main.name,
      sets: Math.round(phaseConfig.sets * volumeMultiplier),
      reps: getDoubleProgression(phaseConfig.reps, weekInCycle, currentPhase),
      rpe: isDeload ? 6 : (level === 'elite' ? 8.5 : 8),
      rest: exerciseData.main.rest,
      notes: exerciseData.main.notes,
      startingWeight: workingWeight ? `${workingWeight} lbs (${percentUsed}% of 1RM)` : 'Start light, find working weight',
      current1RM: baseline?.current1RM ? `${baseline.current1RM} lbs` : null,
      target1RM: baseline?.target1RM ? `${baseline.target1RM} lbs` : null,
      isMainLift: true,
      progression: `Double progression: Hit ${phaseConfig.reps.split('-')[1]} reps on all sets → add 5-10 lbs next session`,
    });

    // Variation
    if (!isDeload) {
      const variation = phase === 'Peak' ? exerciseData.variations[3] : exerciseData.variations[0]; // Block pull for peak
      const variationWeight = workingWeight ? Math.round(workingWeight * variation.percent / 5) * 5 : null;
      exercises.push({
        name: variation.name,
        sets: Math.round(variation.sets * volumeMultiplier),
        reps: variation.reps,
        rpe: 7,
        rest: '3-4 min',
        notes: variation.notes,
        startingWeight: variationWeight ? `${variationWeight} lbs` : null,
        isVariation: true,
        progression: 'Follow main lift progression',
      });
    }

    // Accessories
    const numAccessories = isDeload ? 1 : (level === 'beginner' ? 2 : level === 'intermediate' ? 3 : 4);
    const accessoryOptions = exerciseData.accessories.slice(0, numAccessories);
    accessoryOptions.forEach(acc => {
      exercises.push({
        name: acc.name,
        sets: Math.round(acc.sets * volumeMultiplier),
        reps: getDoubleProgression(acc.reps, weekInCycle, currentPhase),
        rpe: 7,
        rest: '90s-2 min',
        notes: acc.notes,
        isAccessory: true,
        progression: 'Double progression: Add reps first, then weight',
      });
    });
  }

  // ============ OHP / SHOULDERS DAY ============
  if (focus.includes('shoulders') || focus.includes('OHP')) {
    const baseline = getBaseline('ohp');
    const exerciseData = STRENGTH_EXERCISE_DB.ohp;
    const phaseConfig = exerciseData.main.percentages[currentPhase];
    const workingWeight = calculateWorkingWeight(baseline?.current1RM, currentPhase, weekInCycle, exerciseData.main);
    const percentUsed = workingWeight && baseline?.current1RM ? Math.round(workingWeight / baseline.current1RM * 100) : null;

    // Main lift
    exercises.push({
      name: exerciseData.main.name,
      sets: Math.round(phaseConfig.sets * volumeMultiplier),
      reps: getDoubleProgression(phaseConfig.reps, weekInCycle, currentPhase),
      rpe: isDeload ? 6 : (level === 'elite' ? 8.5 : 8),
      rest: exerciseData.main.rest,
      notes: exerciseData.main.notes,
      startingWeight: workingWeight ? `${workingWeight} lbs (${percentUsed}% of 1RM)` : 'Start light, find working weight',
      current1RM: baseline?.current1RM ? `${baseline.current1RM} lbs` : null,
      target1RM: baseline?.target1RM ? `${baseline.target1RM} lbs` : null,
      isMainLift: true,
      progression: `Double progression: Hit ${phaseConfig.reps.split('-')[1]} reps → add 2.5 lbs`,
    });

    // Variation and accessories
    if (!isDeload) {
      const variation = exerciseData.variations[0]; // Push press
      exercises.push({
        name: variation.name,
        sets: Math.round(variation.sets * volumeMultiplier),
        reps: variation.reps,
        rpe: 7,
        rest: '2 min',
        notes: variation.notes,
        isVariation: true,
      });
    }

    const numAccessories = isDeload ? 1 : (level === 'beginner' ? 2 : 3);
    exerciseData.accessories.slice(0, numAccessories).forEach(acc => {
      exercises.push({
        name: acc.name,
        sets: Math.round(acc.sets * volumeMultiplier),
        reps: getDoubleProgression(acc.reps, weekInCycle, currentPhase),
        rpe: 7,
        rest: '60-90s',
        notes: acc.notes,
        isAccessory: true,
        progression: 'Double progression: Add reps first, then weight',
      });
    });
  }

  // ============ BACK (for non-deadlift back days) ============
  if (focus.includes('back') && !focus.includes('posterior') && !focus.includes('Deadlift')) {
    const exercises_back = [
      { name: 'Barbell Row', sets: 4, reps: '6-10', rpe: 8, rest: '2-3 min', notes: 'Pull to lower chest, squeeze lats' },
      { name: 'Weighted Pull-ups', sets: 4, reps: '6-10', rpe: 8, rest: '2-3 min', notes: 'Dead hang to chin over bar' },
      { name: 'Lat Pulldown', sets: 3, reps: '10-12', rpe: 7, rest: '90s', notes: 'Drive elbows down' },
      { name: 'Seated Cable Row', sets: 3, reps: '10-12', rpe: 7, rest: '90s', notes: 'Squeeze at contraction' },
    ];

    const numExercises = isDeload ? 2 : (level === 'beginner' ? 3 : 4);
    exercises_back.slice(0, numExercises).forEach(ex => {
      exercises.push({
        ...ex,
        sets: Math.round(ex.sets * volumeMultiplier),
        reps: getDoubleProgression(ex.reps, weekInCycle, currentPhase),
        isAccessory: true,
        progression: 'Double progression: Add reps first, then weight',
      });
    });
  }

  // ============ ARMS (for dedicated arm work) ============
  if (focus.includes('triceps') || focus.includes('arms')) {
    const tricepExercises = [
      { name: 'Close-Grip Bench Press', sets: 3, reps: '6-8', rpe: 7, rest: '2 min', notes: 'Elbows tucked' },
      { name: 'Tricep Pushdowns', sets: 3, reps: '10-12', rpe: 7, rest: '60s', notes: 'Lock elbows in place' },
      { name: 'Skull Crushers', sets: 3, reps: '10-12', rpe: 7, rest: '60s', notes: 'Lower to forehead' },
    ];
    const numTri = isDeload ? 1 : (level === 'beginner' ? 2 : 3);
    tricepExercises.slice(0, numTri).forEach(ex => {
      exercises.push({
        ...ex,
        sets: Math.round(ex.sets * volumeMultiplier),
        reps: getDoubleProgression(ex.reps, weekInCycle, currentPhase),
        isAccessory: true,
        progression: 'Double progression: 10→12 reps, then +5 lbs',
      });
    });
  }

  if (focus.includes('biceps') || focus.includes('arms')) {
    const bicepExercises = [
      { name: 'Barbell Curls', sets: 3, reps: '8-12', rpe: 7, rest: '60s', notes: 'No swinging' },
      { name: 'Incline Dumbbell Curls', sets: 3, reps: '10-12', rpe: 7, rest: '60s', notes: 'Full stretch at bottom' },
      { name: 'Hammer Curls', sets: 3, reps: '10-12', rpe: 7, rest: '60s', notes: 'Neutral grip' },
    ];
    const numBi = isDeload ? 1 : (level === 'beginner' ? 2 : 3);
    bicepExercises.slice(0, numBi).forEach(ex => {
      exercises.push({
        ...ex,
        sets: Math.round(ex.sets * volumeMultiplier),
        reps: getDoubleProgression(ex.reps, weekInCycle, currentPhase),
        isAccessory: true,
        progression: 'Double progression: 8→12 reps, then +5 lbs',
      });
    });
  }

  // ============ CORE ============
  if (focus.includes('core')) {
    const coreExercises = [
      { name: 'Hanging Leg Raises', sets: 3, reps: '10-15', rpe: 7, rest: '60s', notes: 'Control the movement' },
      { name: 'Ab Wheel Rollouts', sets: 3, reps: '8-12', rpe: 7, rest: '60s', notes: 'Full extension' },
      { name: 'Plank', sets: 3, reps: '45-60 sec', rpe: 6, rest: '45s', notes: 'Squeeze glutes, brace core' },
    ];
    const numCore = isDeload ? 1 : 2;
    coreExercises.slice(0, numCore).forEach(ex => {
      exercises.push({
        ...ex,
        sets: Math.round(ex.sets * volumeMultiplier),
        isAccessory: true,
        progression: 'Add reps or hold time, then add weight',
      });
    });
  }

  return exercises;
}

function generateAestheticExercises(focus, phase, isDeload, athleteLevel, weekNumber) {
  const exercises = [];
  // Defensive: ensure athleteLevel has required properties
  const level = athleteLevel?.level || 'intermediate';
  const multiplier = athleteLevel?.multiplier || 1.0;

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

function generateEnduranceSession(type, phase, isDeload, startingMileage, athleteLevel, paces, weekNumber, totalWeeks, maxLongRun = null, raceDistance = null) {
  const { multiplier, level } = athleteLevel;

  // Calculate target peak mileage based on goal
  // Extract goal pace from paces object
  const goalPaceStr = paces?.goalPace || '';
  const goalPaceMatch = goalPaceStr.match(/(\d+):(\d+)/);
  const goalPaceMinutes = goalPaceMatch
    ? parseFloat(goalPaceMatch[1]) + parseFloat(goalPaceMatch[2]) / 60
    : null;

  // Calculate research-based peak mileage
  const targetPeakMileage = calculateTargetPeakMileage(raceDistance, goalPaceMinutes, athleteLevel);

  // If user is already running higher than target peak, adjust peak up
  const userBasedPeak = startingMileage ? Math.round(startingMileage * 1.15) : targetPeakMileage;
  const peakWeeklyMileage = Math.max(targetPeakMileage, userBasedPeak);

  const currentWeekMileage = calculateWeeklyMileage(
    totalWeeks, peakWeeklyMileage, weekNumber, phase,
    startingMileage, raceDistance, athleteLevel
  );

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
  strengthGoals,
  raceDistance
) {
  // For endurance primary + strength secondary:
  // - Minimum 3 strength days per week, optional 4th
  // - Place strength on easy run days when possible
  // - Never schedule heavy lifting day before long run
  // - Add dedicated strength days to reach minimum 3

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
  // MINIMUM 3 STRENGTH DAYS PER WEEK (with optional 4th)
  const MIN_STRENGTH_DAYS = 3;
  const MAX_STRENGTH_DAYS = 4;

  const strengthDays = []; // Days where strength is added to endurance
  const strengthOnlyDays = []; // Days where we ONLY do strength

  // First pass: identify easy run days suitable for double sessions
  runDayInfo.forEach((day, idx) => {
    const isBeforeLongRun = longRunDayIndex !== -1 && idx === longRunDayIndex - 1;

    if (allowDoubleDays && !day.isHard && !isBeforeLongRun && !day.isLongRun) {
      strengthDays.push(idx);
    }
  });

  // Second pass: ensure we have at least 3 strength days
  // Add dedicated strength-only days if needed
  const dayDistributions = {
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 4],
    5: [0, 1, 2, 4, 5],
    6: [0, 1, 2, 3, 4, 5],
    7: [0, 1, 2, 3, 4, 5, 6],
  };
  const workoutDays = dayDistributions[desiredTrainingDays] || dayDistributions[4];

  // Find available days for strength-only sessions
  // Prioritize: not before long run, not directly after hard running
  const availableForStrengthOnly = [];
  for (let i = 0; i < 7; i++) {
    const isBeforeLongRun = longRunDayIndex !== -1 && workoutDays.indexOf(i) === longRunDayIndex - 1;
    const isRunDay = workoutDays.indexOf(i) !== -1 && workoutDays.indexOf(i) < runSchedule.length;
    if (!isRunDay && !isBeforeLongRun) {
      availableForStrengthOnly.push(i);
    }
  }

  // Calculate how many more strength days we need
  const currentStrengthDays = strengthDays.length;
  const neededStrengthDays = Math.max(0, MIN_STRENGTH_DAYS - currentStrengthDays);

  // Add strength-only days to reach minimum
  for (let i = 0; i < neededStrengthDays && i < availableForStrengthOnly.length; i++) {
    strengthOnlyDays.push(availableForStrengthOnly[i]);
  }

  // If we still don't have 3 strength days, add more double days on hard run days (lighter work)
  const totalStrengthDays = strengthDays.length + strengthOnlyDays.length;
  if (totalStrengthDays < MIN_STRENGTH_DAYS && allowDoubleDays) {
    // Add light accessory work on additional days
    runDayInfo.forEach((day, idx) => {
      if (strengthDays.length + strengthOnlyDays.length >= MIN_STRENGTH_DAYS) return;
      if (!strengthDays.includes(idx) && !day.isLongRun) {
        strengthDays.push(idx);
      }
    });
  }

  // Optional: add 4th day if user wants more volume (based on training days)
  if (desiredTrainingDays >= 5 && strengthDays.length + strengthOnlyDays.length === MIN_STRENGTH_DAYS) {
    // Check if there's room for a 4th strength day
    if (availableForStrengthOnly.length > strengthOnlyDays.length) {
      const nextAvailable = availableForStrengthOnly.find(d => !strengthOnlyDays.includes(d));
      if (nextAvailable !== undefined) {
        // This is the optional 4th day - don't add by default, but available
        // User can enable this via settings
      }
    }
  }

  // Build the actual schedule using the workoutDays calculated above
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
        athleteLevel, paces, currentWeek, totalWeeks, maxLongRun, raceDistance
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

// ============ 30 DAY LOCK IN PROGRAM ============

function generateLockInProgram(formData) {
  const { lockInSteps = '10k', lockInWater = true, lockInProtein = true } = formData;

  // Lock In is always 30 days (approximately 4.5 weeks, we round to 5 weeks of programming)
  const totalWeeks = 5;

  // Generate 12-week periodized phases: Base (4), Build (4), Peak (3), Deload (1)
  const phases = [];
  for (let i = 0; i < totalWeeks; i++) {
    if (i < 2) phases.push('Base');
    else if (i < 4) phases.push('Build');
    else phases.push('Peak');
  }

  // Full-body workout exercises for Lock In
  const LOCKIN_EXERCISES = {
    push: [
      { name: 'Bench Press', sets: 4, reps: '8-10', muscleGroup: 'chest' },
      { name: 'Overhead Press', sets: 3, reps: '8-10', muscleGroup: 'shoulders' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', muscleGroup: 'chest' },
      { name: 'Tricep Dips', sets: 3, reps: '10-15', muscleGroup: 'triceps' },
    ],
    pull: [
      { name: 'Barbell Rows', sets: 4, reps: '8-10', muscleGroup: 'back' },
      { name: 'Lat Pulldowns', sets: 3, reps: '10-12', muscleGroup: 'lats' },
      { name: 'Face Pulls', sets: 3, reps: '15-20', muscleGroup: 'rear delts' },
      { name: 'Barbell Curls', sets: 3, reps: '10-12', muscleGroup: 'biceps' },
    ],
    legs: [
      { name: 'Barbell Squats', sets: 4, reps: '8-10', muscleGroup: 'quads' },
      { name: 'Romanian Deadlifts', sets: 3, reps: '10-12', muscleGroup: 'hamstrings' },
      { name: 'Leg Press', sets: 3, reps: '12-15', muscleGroup: 'quads' },
      { name: 'Calf Raises', sets: 4, reps: '15-20', muscleGroup: 'calves' },
    ],
    fullBody: [
      { name: 'Deadlifts', sets: 4, reps: '5-6', muscleGroup: 'full body' },
      { name: 'Pull-ups', sets: 3, reps: '8-12', muscleGroup: 'back' },
      { name: 'Dumbbell Lunges', sets: 3, reps: '10 each', muscleGroup: 'legs' },
      { name: 'Plank', sets: 3, reps: '45-60s', muscleGroup: 'core' },
    ],
    upperBody: [
      { name: 'Bench Press', sets: 4, reps: '8-10', muscleGroup: 'chest' },
      { name: 'Barbell Rows', sets: 4, reps: '8-10', muscleGroup: 'back' },
      { name: 'Overhead Press', sets: 3, reps: '8-10', muscleGroup: 'shoulders' },
      { name: 'Chin-ups', sets: 3, reps: '8-12', muscleGroup: 'biceps' },
    ],
    lowerBody: [
      { name: 'Barbell Squats', sets: 4, reps: '8-10', muscleGroup: 'quads' },
      { name: 'Deadlifts', sets: 4, reps: '5-6', muscleGroup: 'posterior chain' },
      { name: 'Leg Curls', sets: 3, reps: '12-15', muscleGroup: 'hamstrings' },
      { name: 'Calf Raises', sets: 4, reps: '15-20', muscleGroup: 'calves' },
    ],
  };

  // Lock In weekly schedule (6 training days + 1 active recovery)
  const weeklySchedule = [
    {
      day: 1,
      dayName: 'Monday',
      name: 'Push Day',
      isRestDay: false,
      isDeload: false,
      isCardioDay: true,
      sessions: [{
        type: 'strength',
        focus: 'Push',
        duration: 60,
        exercises: LOCKIN_EXERCISES.push.map(ex => ({
          ...ex,
          id: `push-${ex.name.toLowerCase().replace(/\s+/g, '-')}`,
          notes: `Warm up with lighter weight first`,
        })),
      }],
    },
    {
      day: 2,
      dayName: 'Tuesday',
      name: 'Pull Day',
      isRestDay: false,
      isDeload: false,
      isCardioDay: false,
      sessions: [{
        type: 'strength',
        focus: 'Pull',
        duration: 60,
        exercises: LOCKIN_EXERCISES.pull.map(ex => ({
          ...ex,
          id: `pull-${ex.name.toLowerCase().replace(/\s+/g, '-')}`,
          notes: `Focus on mind-muscle connection`,
        })),
      }],
    },
    {
      day: 3,
      dayName: 'Wednesday',
      name: 'Legs + Cardio',
      isRestDay: false,
      isDeload: false,
      isCardioDay: true,
      sessions: [{
        type: 'strength',
        focus: 'Legs',
        duration: 60,
        exercises: LOCKIN_EXERCISES.legs.map(ex => ({
          ...ex,
          id: `legs-${ex.name.toLowerCase().replace(/\s+/g, '-')}`,
          notes: `Full range of motion`,
        })),
      }],
    },
    {
      day: 4,
      dayName: 'Thursday',
      name: 'Upper Body',
      isRestDay: false,
      isDeload: false,
      isCardioDay: false,
      sessions: [{
        type: 'strength',
        focus: 'Upper Body',
        duration: 60,
        exercises: LOCKIN_EXERCISES.upperBody.map(ex => ({
          ...ex,
          id: `upper-${ex.name.toLowerCase().replace(/\s+/g, '-')}`,
          notes: `Controlled tempo`,
        })),
      }],
    },
    {
      day: 5,
      dayName: 'Friday',
      name: 'Lower Body + Cardio',
      isRestDay: false,
      isDeload: false,
      isCardioDay: true,
      sessions: [{
        type: 'strength',
        focus: 'Lower Body',
        duration: 60,
        exercises: LOCKIN_EXERCISES.lowerBody.map(ex => ({
          ...ex,
          id: `lower-${ex.name.toLowerCase().replace(/\s+/g, '-')}`,
          notes: `Progressive overload focus`,
        })),
      }],
    },
    {
      day: 6,
      dayName: 'Saturday',
      name: 'Full Body',
      isRestDay: false,
      isDeload: false,
      isCardioDay: false,
      sessions: [{
        type: 'strength',
        focus: 'Full Body',
        duration: 60,
        exercises: LOCKIN_EXERCISES.fullBody.map(ex => ({
          ...ex,
          id: `full-${ex.name.toLowerCase().replace(/\s+/g, '-')}`,
          notes: `Compound movement focus`,
        })),
      }],
    },
    {
      day: 7,
      dayName: 'Sunday',
      name: 'Active Recovery',
      isRestDay: true,
      isDeload: false,
      isCardioDay: false,
      isActiveRecovery: true,
      sessions: [{
        type: 'recovery',
        focus: 'Active Recovery',
        duration: 60,
        description: '1 hour of light activity: walking, yoga, stretching, swimming, or mobility work',
        exercises: [
          { name: 'Light Walking or Hiking', duration: '20-30 min', id: 'recovery-walk' },
          { name: 'Dynamic Stretching', duration: '15-20 min', id: 'recovery-stretch' },
          { name: 'Foam Rolling', duration: '10-15 min', id: 'recovery-foam' },
        ],
      }],
    },
  ];

  return {
    name: '30 Day Lock In',
    description: 'Your 30-day transformation challenge with daily workouts, cardio, and recovery',
    totalWeeks,
    currentWeek: 1,
    currentPhase: 'Base',
    phases,
    primaryGoal: 'lockin',
    primarySubtype: 'lockin-standard',
    daysPerWeek: 7,
    weeklySchedule,
    // Lock In specific commitments
    commitments: {
      workout: true,
      steps: lockInSteps,
      water: lockInWater,
      protein: lockInProtein,
      cardio: { daysPerWeek: 3, duration: '20-30 min' },
      activeRecovery: { day: 7, duration: '1 hour' },
    },
    athleteLevel: calculateAthleteLevel(formData),
    generatedAt: new Date().toISOString(),
  };
}

// ============ MAIN GENERATOR ============

export function generateProgram(formData) {
  // Defensive: handle missing formData
  if (!formData) {
    console.error('generateProgram called with no formData');
    formData = {};
  }

  let {
    programType = 'strength',
    programSubtype = 'powerlifting',
    desiredTrainingDays = 4,
    enableHybrid = false,
    secondaryProgramType = '',
    allowDoubleDays = false,
    currentWeeklyMileage = 0,
    longestRecentRun = 0,
    vacations = [],
    targetFinishHours = '',
    targetFinishMinutes = '',
    targetFinishSeconds = '',
    raceDistance = '',
    // Baseline performance data
    baselineRaceDistance = '',
    baselineTimeHours = '',
    baselineTimeMinutes = '',
    baselineTimeSeconds = '',
    // Strength baselines
    strengthGoals = [],
    // Program start date
    programStartDate = '',
  } = formData;

  // Ensure desiredTrainingDays is a valid number
  desiredTrainingDays = parseInt(desiredTrainingDays) || 4;
  if (desiredTrainingDays < 2) desiredTrainingDays = 2;
  if (desiredTrainingDays > 7) desiredTrainingDays = 7;

  // 30 DAY LOCK IN SPECIAL HANDLING:
  // Fixed 30-day program with daily workouts, cardio 3x/week, Day 7 active recovery
  if (programType === 'lockin') {
    return generateLockInProgram(formData);
  }

  // TRIATHLON SPECIAL HANDLING:
  // - Automatically enable hybrid with strength focus
  // - Always enable double days
  // - Minimum 5 training days for triathlon
  const isTriathlon = programSubtype === 'triathlon';
  if (isTriathlon) {
    enableHybrid = true;
    secondaryProgramType = 'strength'; // Injury prevention strength
    allowDoubleDays = true;
    // Ensure minimum training days for triathlon
    if (desiredTrainingDays < 5) {
      desiredTrainingDays = 5;
    }
  }

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

  const currentPhase = phases[0] || 'Base';
  const currentWeek = 1;
  const isDeload = currentPhase === 'Deload' || currentPhase === 'Taper';

  // Use smart hybrid scheduling for endurance+strength combos
  let weeklySchedule = [];

  // TRIATHLON-SPECIFIC SCHEDULING
  if (isTriathlon) {
    const triSchedule = ENDURANCE_TEMPLATES.triathlon[desiredTrainingDays] ||
                       ENDURANCE_TEMPLATES.triathlon[5];
    const dayDistributions = {
      4: [0, 2, 4, 5],      // Mon, Wed, Fri, Sat
      5: [0, 1, 3, 4, 5],   // Mon, Tue, Thu, Fri, Sat
      6: [0, 1, 2, 4, 5, 6], // Mon-Wed, Fri-Sun
      7: [0, 1, 2, 3, 4, 5, 6],
    };
    const workoutDays = dayDistributions[desiredTrainingDays] || dayDistributions[5];

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const workoutDayIndex = workoutDays.indexOf(dayIndex);
      const isWorkoutDay = workoutDayIndex !== -1;
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

      const sessionType = triSchedule[workoutDayIndex] || 'Easy Run';
      const triSession = generateTriathlonSession(
        sessionType, currentPhase, isDeload, athleteLevel, paces, currentWeek, totalWeeks
      );

      const sessions = [];

      // PRIORITY 1: Sessions with Strength component (check BEFORE multi-sport)
      if (sessionType.includes('Strength')) {
        // Sessions: 'Swim + Strength', 'Bike Intervals + Strength', 'Run + Strength', 'Bike + Strength', 'Run Tempo + Strength'
        const strengthExercises = triSession.strengthSession || [];

        // Determine the cardio type from session name
        const isSwim = sessionType.toLowerCase().includes('swim');
        const isBike = sessionType.toLowerCase().includes('bike');
        const isRun = sessionType.toLowerCase().includes('run') || sessionType.toLowerCase().includes('tempo');

        // Get cardio exercises (non-strength)
        const cardioExercises = triSession.exercises.filter(e =>
          !e.name.toLowerCase().includes('strength') &&
          !e.name.toLowerCase().includes('prevention')
        );

        // AM: Cardio session
        if (cardioExercises.length > 0) {
          const cardioType = isSwim ? 'swim' : isBike ? 'bike' : 'run';
          const cardioFocus = isSwim ? 'Technique Swim' :
                             sessionType.includes('Intervals') ? 'Bike Intervals' :
                             sessionType.includes('Tempo') ? 'Tempo Run' :
                             isBike ? 'Easy Bike' : 'Easy-Moderate Run';
          sessions.push({
            time: 'AM',
            type: cardioType,
            focus: cardioFocus,
            duration: Math.round(triSession.duration * 0.55),
            exercises: cardioExercises,
          });
        }

        // PM: Strength session (INJURY PREVENTION - not hypertrophy)
        if (strengthExercises.length > 0) {
          const strengthFocus = sessionType.includes('Swim') ? 'Full Injury Prevention' :
                               sessionType.includes('Run + Strength') ? 'Hip & Glute Stability' :
                               sessionType.includes('Bike + Strength') ? 'Core & Stability' :
                               sessionType.includes('Tempo') ? 'Prehab & Mobility' :
                               'Core & Stability';
          sessions.push({
            time: 'PM',
            type: 'strength',
            focus: strengthFocus,
            duration: 35,
            exercises: strengthExercises,
            notes: 'Triathlon injury prevention: NOT hypertrophy. Focus on stability & resilience.',
          });
        }
      }
      // PRIORITY 2: Multi-sport double days (no strength)
      else if (sessionType.includes('/') || sessionType.includes('+')) {
        // Sessions: 'Swim + Run', 'Swim AM / Run PM', 'Swim + Easy Ride'
        if (triSession.exercises.length >= 2) {
          // Split into AM/PM sessions
          sessions.push({
            time: 'AM',
            type: triSession.exercises[0].name.toLowerCase().includes('swim') ? 'swim' :
                  triSession.exercises[0].name.toLowerCase().includes('bike') ? 'bike' : 'run',
            focus: triSession.exercises[0].name,
            duration: Math.round(triSession.duration * 0.5),
            exercises: [triSession.exercises[0]],
          });

          sessions.push({
            time: 'PM',
            type: triSession.exercises[1].name.toLowerCase().includes('swim') ? 'swim' :
                  triSession.exercises[1].name.toLowerCase().includes('bike') ? 'bike' : 'run',
            focus: triSession.exercises[1].name,
            duration: Math.round(triSession.duration * 0.5),
            exercises: [triSession.exercises[1]],
          });
        } else {
          sessions.push({
            time: 'ANY',
            type: 'triathlon',
            focus: sessionType,
            duration: triSession.duration,
            exercises: triSession.exercises,
          });
        }
      }
      // PRIORITY 3: Brick workouts
      else if (sessionType.includes('Brick')) {
        // Brick workout - keep as single session
        sessions.push({
          time: 'AM',
          type: 'brick',
          focus: 'Long Brick',
          duration: triSession.duration,
          exercises: triSession.exercises,
          notes: 'Key session: practice race transitions',
        });
      } else {
        // Single-sport session
        sessions.push({
          time: 'ANY',
          type: sessionType.toLowerCase().includes('swim') ? 'swim' :
                sessionType.toLowerCase().includes('bike') ? 'bike' : 'run',
          focus: sessionType,
          duration: triSession.duration,
          exercises: triSession.exercises,
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
  } else if (enableHybrid && programType === 'endurance' && (secondaryProgramType === 'strength' || secondaryProgramType === 'aesthetic')) {
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
      strengthGoals,
      raceDistance
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
      // Defensive: ensure we have a valid template
      const templateIndex = splitTemplate.length > 0 ? workoutIndex % splitTemplate.length : 0;
      const template = splitTemplate[templateIndex] || { name: 'Full Body', focus: ['legs', 'chest', 'back'] };
      const sessions = [];

      if (programType === 'endurance') {
        const enduranceTemplates = programSubtype === 'triathlon'
          ? ENDURANCE_TEMPLATES.triathlon
          : ENDURANCE_TEMPLATES.running;
        const enduranceType = enduranceTemplates[desiredTrainingDays]?.[workoutIndex] || 'Easy Run';
        const enduranceSession = generateEnduranceSession(
          enduranceType, currentPhase, isDeload, startingMileage,
          athleteLevel, paces, currentWeek, totalWeeks, maxLongRun, raceDistance
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
          duration: athleteLevel?.level === 'elite' ? 90 : 75,
          exercises,
        });
      } else if (programType === 'aesthetic') {
        const exercises = generateAestheticExercises(template.focus, currentPhase, isDeload, athleteLevel, currentWeek);
        sessions.push({
          time: 'ANY',
          type: 'hypertrophy',
          focus: template.name,
          duration: athleteLevel?.level === 'elite' ? 75 : 60,
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
        lifts: strengthGoals.filter(g => g.current1RM).map(g => ({
          exercise: g.label,
          current1RM: parseFloat(g.current1RM),
          target1RM: parseFloat(g.target1RM),
        })),
      } : null,
    },
    paces: programType === 'endurance' ? paces : null,
    generatedAt: new Date().toISOString(),
    startDate: programStartDate || new Date().toISOString().split('T')[0], // Default to today if not set
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
