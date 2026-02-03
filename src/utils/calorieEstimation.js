// Calorie burn estimation based on workout type, duration, weight, and intensity

// MET (Metabolic Equivalent of Task) values for different activities
const MET_VALUES = {
  // Cardio/Endurance
  running_easy: 8.0,
  running_moderate: 10.0,
  running_hard: 12.5,
  running_sprint: 15.0,
  cycling_easy: 6.0,
  cycling_moderate: 8.0,
  cycling_hard: 12.0,
  swimming_easy: 6.0,
  swimming_moderate: 8.0,
  swimming_hard: 10.0,
  walking: 3.5,
  hiking: 6.0,
  elliptical: 5.0,
  rowing: 7.0,
  jump_rope: 11.0,
  stair_climbing: 9.0,

  // Strength Training
  strength_light: 3.0,
  strength_moderate: 5.0,
  strength_vigorous: 6.0,
  bodyweight: 4.0,
  hiit: 8.0,
  circuit_training: 8.0,
  crossfit: 8.0,

  // Other
  yoga: 2.5,
  pilates: 3.0,
  stretching: 2.0,
  rest: 1.0,
};

// Map workout types to MET categories
const WORKOUT_TYPE_TO_MET = {
  // Endurance subtypes
  marathon: 'running_moderate',
  running: 'running_moderate',
  cycling: 'cycling_moderate',
  swimming: 'swimming_moderate',
  triathlon: 'running_moderate',
  cardio: 'elliptical',

  // Weightlifting subtypes
  strength: 'strength_moderate',
  bodybuilding: 'strength_moderate',
  olympic: 'strength_vigorous',
  bodyweight: 'bodyweight',
  maintenance: 'strength_light',
  hiit: 'hiit',

  // General
  wellness: 'strength_light',
  mobility: 'yoga',
  functional: 'circuit_training',
  active: 'walking',
};

/**
 * Calculate calories burned during a workout
 * @param {number} weightLbs - Body weight in pounds
 * @param {string} workoutType - Type of workout
 * @param {number} durationMinutes - Duration in minutes
 * @param {number} rpe - Rate of Perceived Exertion (6-10)
 * @returns {number} Estimated calories burned
 */
export function calculateCaloriesBurned(weightLbs, workoutType, durationMinutes, rpe = 7) {
  const weightKg = weightLbs * 0.453592;

  // Get base MET value
  let metKey = WORKOUT_TYPE_TO_MET[workoutType] || 'strength_moderate';

  // Adjust MET based on RPE
  let metValue = MET_VALUES[metKey] || 5.0;

  // RPE adjustment factor (RPE 6 = 0.85x, RPE 10 = 1.15x)
  const rpeAdjustment = 0.85 + (rpe - 6) * 0.075;
  metValue *= rpeAdjustment;

  // Calories = MET × weight (kg) × duration (hours)
  const durationHours = durationMinutes / 60;
  const caloriesBurned = Math.round(metValue * weightKg * durationHours);

  return caloriesBurned;
}

/**
 * Calculate calories burned for a specific exercise
 * @param {number} weightLbs - Body weight in pounds
 * @param {string} exerciseName - Name of the exercise
 * @param {number} sets - Number of sets
 * @param {number} repsPerSet - Average reps per set
 * @param {number} restSeconds - Rest between sets
 * @returns {number} Estimated calories burned
 */
export function calculateExerciseCalories(weightLbs, exerciseName, sets, repsPerSet, restSeconds = 90) {
  const weightKg = weightLbs * 0.453592;

  // Estimate time per set (roughly 3 seconds per rep)
  const timePerSet = repsPerSet * 3;
  const totalWorkTime = (sets * timePerSet) / 60; // in minutes
  const totalRestTime = (sets * restSeconds) / 60; // in minutes

  // Work time uses higher MET, rest time uses lower MET
  const workMET = 5.0; // Moderate strength training
  const restMET = 1.5; // Standing rest

  const workCalories = (workMET * weightKg * (totalWorkTime / 60));
  const restCalories = (restMET * weightKg * (totalRestTime / 60));

  return Math.round(workCalories + restCalories);
}

/**
 * Estimate total daily calories burned including BMR
 * @param {number} bmr - Basal Metabolic Rate
 * @param {number} activityLevel - Activity multiplier
 * @param {number} workoutCalories - Additional workout calories
 * @returns {object} Breakdown of daily calorie burn
 */
export function estimateDailyCalories(bmr, activityLevel = 'moderate', workoutCalories = 0) {
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };

  const multiplier = activityMultipliers[activityLevel] || 1.55;

  // TDEE without workout (NEAT included in multiplier)
  const tdeeBase = Math.round(bmr * multiplier);

  // Add workout calories on top
  const totalDailyBurn = tdeeBase + workoutCalories;

  return {
    bmr: Math.round(bmr),
    neat: Math.round(tdeeBase - bmr), // Non-Exercise Activity Thermogenesis
    workoutCalories,
    totalDailyBurn,
    remaining: totalDailyBurn, // Will be updated as meals are logged
  };
}

/**
 * Estimate end-of-day calories based on current time and scheduled workouts
 * @param {number} bmr - Basal Metabolic Rate
 * @param {string} activityLevel - Activity level
 * @param {Array} completedWorkouts - Workouts already completed today
 * @param {Array} scheduledWorkouts - Workouts planned for rest of day
 * @returns {number} Estimated EOD calorie burn
 */
export function estimateEODCalories(bmr, activityLevel, completedWorkouts = [], scheduledWorkouts = [], weightLbs = 150) {
  const { totalDailyBurn } = estimateDailyCalories(bmr, activityLevel, 0);

  // Calculate completed workout calories
  const completedCalories = completedWorkouts.reduce((sum, workout) => {
    return sum + calculateCaloriesBurned(weightLbs, workout.type, workout.duration, workout.rpe || 7);
  }, 0);

  // Calculate scheduled workout calories
  const scheduledCalories = scheduledWorkouts.reduce((sum, workout) => {
    return sum + calculateCaloriesBurned(weightLbs, workout.type, workout.duration || 60, 7);
  }, 0);

  return totalDailyBurn + completedCalories + scheduledCalories;
}

/**
 * Get calorie burn rate per minute for a given workout type
 * @param {number} weightLbs - Body weight in pounds
 * @param {string} workoutType - Type of workout
 * @returns {number} Calories per minute
 */
export function getCaloriesPerMinute(weightLbs, workoutType) {
  const weightKg = weightLbs * 0.453592;
  const metKey = WORKOUT_TYPE_TO_MET[workoutType] || 'strength_moderate';
  const metValue = MET_VALUES[metKey] || 5.0;

  // Calories per minute = (MET × weight (kg) × 3.5) / 200
  return (metValue * weightKg * 3.5) / 200;
}

export default {
  calculateCaloriesBurned,
  calculateExerciseCalories,
  estimateDailyCalories,
  estimateEODCalories,
  getCaloriesPerMinute,
};
