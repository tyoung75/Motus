import React, { useState, useEffect, useCallback, useRef, Component } from 'react';
import { ChevronRight, ChevronLeft, User, Target, Dumbbell, Scale, Sparkles, Calendar, Plane, Plus, Trash2 } from 'lucide-react';
import { Button } from '../shared';
import { calculateBMR, calculateTDEE, calculateMacros } from '../../utils/calculations';
import { useAuth } from '../../context/AuthContext';
import { generateProgram as generateProgramLocal } from '../../utils/programGenerator';
import { StrengthGoalsForm } from './StrengthGoalsForm';
import { AdvancedMetricsModal } from '../Modals/AdvancedMetricsModal';

// Error Boundary to catch rendering errors
class SetupErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Setup Wizard Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
          <div className="bg-dark-800 rounded-xl p-6 max-w-md text-center">
            <h2 className="text-xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-gray-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-3 bg-accent-primary text-white rounded-lg font-medium"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Helper to get today's date in YYYY-MM-DD format for min date validation
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Standard program flow steps (name/email/phone already collected in SignUpModal)
const STEPS_STANDARD = [
  { id: 1, title: 'Program', icon: Target },
  { id: 2, title: 'Body Stats', icon: Scale },
  { id: 3, title: 'Goal Details', icon: Dumbbell },
  { id: 4, title: 'Time Off', icon: Plane },
  { id: 5, title: 'Generate', icon: Sparkles },
];

// 30 Day Lock In minimal flow steps
const STEPS_LOCKIN = [
  { id: 1, title: 'Program', icon: Target },
  { id: 2, title: 'Quick Setup', icon: Scale },
  { id: 3, title: 'Commitments', icon: Dumbbell },
  { id: 4, title: 'Generate', icon: Sparkles },
];

// MECE Program categories (Fat Loss removed - handled via nutrition goal)
const PROGRAM_TYPES = [
  {
    id: 'lockin',
    title: '30 Day Lock In',
    description: 'Build momentum with a simple, structured 30-day challenge',
    icon: '🔥',
    subtypes: [
      { id: 'lockin-standard', label: '30 Day Challenge' },
    ],
    isLockIn: true,
  },
  {
    id: 'endurance',
    title: 'Endurance',
    description: 'Cardiovascular training - running, cycling, swimming',
    icon: '🏃',
    subtypes: [
      { id: 'running', label: 'Running (Race Training)' },
      { id: 'cycling', label: 'Cycling' },
      { id: 'swimming', label: 'Swimming' },
      { id: 'triathlon', label: 'Triathlon' },
    ],
  },
  {
    id: 'strength',
    title: 'Strength',
    description: 'Build maximal strength and power',
    icon: '🏋️',
    subtypes: [
      { id: 'powerlifting', label: 'Powerlifting' },
      { id: 'olympic', label: 'Olympic Lifting' },
      { id: 'strongman', label: 'Strongman' },
    ],
  },
  {
    id: 'aesthetic',
    title: 'Aesthetic',
    description: 'Physique focused - muscle building and body composition',
    icon: '💪',
    subtypes: [
      { id: 'hypertrophy', label: 'Hypertrophy/Bodybuilding' },
      { id: 'lean-muscle', label: 'Lean Muscle Building' },
      { id: 'recomp', label: 'Body Recomposition' },
    ],
  },
];

// 30 Day Lock In commitment options
const LOCKIN_COMMITMENTS = {
  workout: { id: 'workout', label: '1hr Workout Daily', description: 'Non-negotiable daily commitment', required: true, default: true },
  steps: { id: 'steps', label: 'Daily Steps', options: ['10k', '15k'] },
  water: { id: 'water', label: '1 Gallon Water Daily', description: 'Stay hydrated every day' },
  protein: { id: 'protein', label: 'High Protein Diet', description: '1g protein per lb of ideal bodyweight + whole foods' },
};

// Lock In cardio options (3 days/week, 20-30 min)
const LOCKIN_CARDIO_OPTIONS = [
  { id: 'treadmill', label: 'Treadmill', icon: '🏃' },
  { id: 'stairmaster', label: 'Stair Master', icon: '🪜' },
  { id: 'elliptical', label: 'Elliptical', icon: '🔄' },
  { id: 'cycling', label: 'Cycling', icon: '🚴' },
];

// Lock In rest day activity options (1hr on day 7)
const LOCKIN_RESTDAY_OPTIONS = [
  { id: 'jog', label: '1hr Jog', icon: '🏃' },
  { id: 'walk', label: '1hr Walk', icon: '🚶' },
  { id: 'cycling-class', label: 'Cycling Class', icon: '🚴' },
  { id: 'yoga', label: 'Yoga', icon: '🧘' },
  { id: 'stretch', label: 'Stretching', icon: '🤸' },
];

// Race distances for endurance goals
const RACE_DISTANCES = [
  { id: '5k', label: '5K', miles: 3.1 },
  { id: '10k', label: '10K', miles: 6.2 },
  { id: 'half', label: 'Half Marathon', miles: 13.1 },
  { id: 'full', label: 'Full Marathon', miles: 26.2 },
  { id: 'ultra', label: 'Ultra Marathon', miles: null, requiresDistance: true },
];

// Baseline race distances (for calculating training paces)
const BASELINE_RACE_DISTANCES = [
  { id: '5k', label: '5K' },
  { id: '10k', label: '10K' },
  { id: 'half', label: 'Half Marathon' },
  { id: 'full', label: 'Full Marathon' },
];

// Triathlon distances
const TRIATHLON_DISTANCES = [
  { id: 'sprint', label: 'Sprint', description: '750m swim, 20km bike, 5km run' },
  { id: 'olympic', label: 'Olympic', description: '1.5km swim, 40km bike, 10km run' },
  { id: 'half-iron', label: 'Half Ironman (70.3)', description: '1.9km swim, 90km bike, 21.1km run' },
  { id: 'full-iron', label: 'Ironman', description: '3.8km swim, 180km bike, 42.2km run' },
];

// Default strength exercises - Big 4 lifts
const STRENGTH_EXERCISES = [
  { id: 'squat', label: 'Back Squat' },
  { id: 'bench', label: 'Bench Press' },
  { id: 'deadlift', label: 'Deadlift' },
  { id: 'ohp', label: 'Overhead Press' },
];

// Secondary cardio options for strength/aesthetic programs
const SECONDARY_CARDIO_OPTIONS = [
  { id: 'running', label: 'Running', icon: '🏃', description: '2-3 easy runs per week' },
  { id: 'cycling', label: 'Cycling', icon: '🚴', description: '2-3 bike sessions per week' },
  { id: 'swimming', label: 'Swimming', icon: '🏊', description: '2-3 swim sessions per week' },
];

// Generate test profile and program for dev testing
const generateTestData = () => {
  const testProfile = {
    name: 'Test User',
    age: 30,
    sex: 'male',
    weight: 180,
    weightUnit: 'lbs',
    heightFeet: 5,
    heightInches: 10,
    heightUnit: 'imperial',
    programType: 'endurance',
    programSubtype: 'running',
    desiredTrainingDays: 5,
    yearsTraining: 3,
    trainingHistory: 'consistent',
    raceDistance: 'half',
    raceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nutritionGoal: 'maintain',
    weightKg: 81.6,
    heightCm: 177.8,
    bmr: 1882,
    tdee: 3200,
    macros: { calories: 3200, protein: 180, carbs: 400, fat: 100 },
  };

  const testProgram = {
    name: 'Test Running Program',
    type: 'endurance',
    subtype: 'running',
    primaryGoal: 'endurance',
    currentWeek: 1,
    currentPhase: 'Base',
    mesocycleWeeks: 14,
    daysPerWeek: 5,
    programStartDate: new Date().toISOString().split('T')[0],
    weeklySchedule: [
      { day: 1, dayName: 'Monday', name: 'Easy Run', isRestDay: false, isDeload: false, sessions: [{ time: 'AM', type: 'endurance', focus: 'Easy Run', duration: 40, exercises: [{ name: 'Easy Run', sets: 1, reps: '40 min', pace: '9:30-10:00/mi', rpe: 5 }] }] },
      { day: 2, dayName: 'Tuesday', name: 'Intervals', isRestDay: false, isDeload: false, sessions: [{ time: 'AM', type: 'endurance', focus: 'Intervals', duration: 45, exercises: [{ name: 'Speed Work', sets: 6, reps: '400m', pace: '7:30/mi', rpe: 8 }] }] },
      { day: 3, dayName: 'Wednesday', name: 'Active Recovery', isRestDay: true, isDeload: false, sessions: [] },
      { day: 4, dayName: 'Thursday', name: 'Tempo Run', isRestDay: false, isDeload: false, sessions: [{ time: 'AM', type: 'endurance', focus: 'Tempo', duration: 50, exercises: [{ name: 'Tempo Run', sets: 1, reps: '4 mi', pace: '8:15/mi', rpe: 7 }] }] },
      { day: 5, dayName: 'Friday', name: 'Easy Run', isRestDay: false, isDeload: false, sessions: [{ time: 'AM', type: 'endurance', focus: 'Easy Run', duration: 35, exercises: [{ name: 'Recovery Run', sets: 1, reps: '30 min', pace: '10:00/mi', rpe: 4 }] }] },
      { day: 6, dayName: 'Saturday', name: 'Long Run', isRestDay: false, isDeload: false, sessions: [{ time: 'AM', type: 'endurance', focus: 'Long Run', duration: 90, exercises: [{ name: 'Long Run', sets: 1, reps: '10 mi', pace: '9:45/mi', rpe: 6 }] }] },
      { day: 7, dayName: 'Sunday', name: 'Active Recovery', isRestDay: true, isDeload: false, sessions: [] },
    ],
  };

  return { profile: testProfile, program: testProgram };
};

function SetupWizard({ onComplete }) {
  const { user, signInWithGoogle, isAuthenticated, isConfigured } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [strengthGoalError, setStrengthGoalError] = useState(null); // Error for unrealistic strength goals
  const [devTapCount, setDevTapCount] = useState(0); // For activating test mode
  const devTapTimeoutRef = useRef(null); // Ref to track timeout

  const [formData, setFormData] = useState({
    // Personal
    name: '',
    age: '',
    sex: 'male',

    // Body stats
    weight: '',
    weightUnit: 'lbs',
    heightFeet: '',
    heightInches: '',
    heightUnit: 'imperial',
    heightCm: '',
    bodyFatPercent: '',

    // Training history
    currentTrainingDays: 3,
    trainingHistory: 'some',
    yearsTraining: 1,

    // Primary Goal (moved desiredTrainingDays here)
    programType: '',
    programSubtype: '',
    desiredTrainingDays: 4,

    // Endurance goals
    raceDistance: '',
    ultraDistance: '', // Custom distance for ultra marathons (in miles)
    triathlonDistance: '',
    targetFinishTime: '',
    targetFinishHours: '',
    targetFinishMinutes: '',
    targetFinishSeconds: '',
    raceDate: '',
    currentWeeklyMileage: '',
    currentPace: '',

    // Baseline performance (reference point for training paces)
    baselineRaceDistance: '', // 5k, 10k, half, etc.
    baselineTimeHours: '',
    baselineTimeMinutes: '',
    baselineTimeSeconds: '',
    longestRecentRun: '', // miles

    // Strength goals - Big 4 lifts with 1RM calculator support
    strengthGoals: STRENGTH_EXERCISES.map(ex => ({
      id: ex.id,
      label: ex.label,
      current1RM: '',
      target1RM: '',
      workingWeight: '', // For 1RM calculator
      workingReps: '',   // For 1RM calculator
    })),
    strengthGoalDate: '', // Target date for strength goals

    // Secondary cardio for strength/aesthetic programs
    includeCardio: false,
    cardioType: '', // running, cycling, or swimming
    cardioDaysPerWeek: 2,

    // Aesthetic goals
    currentBodyFat: '',
    targetBodyFat: '',
    aestheticGoalDate: '',

    // Fat Loss
    targetWeight: '',
    targetDate: '',
    weeklyWeightChange: 0.5,

    // Hybrid/Secondary Goal
    enableHybrid: false,
    secondaryProgramType: '',
    secondarySubtype: '',
    allowDoubleDays: false,

    // 30 Day Lock In commitments
    lockInWorkout: true, // Non-negotiable, always true
    lockInSteps: '10k', // '10k' or '15k'
    lockInWater: true,
    lockInProtein: true,
    lockInCardioType: 'treadmill', // For 3x/week cardio
    lockInRestDayActivity: 'walk', // For day 7 recovery
    lockInIdealWeight: '', // For protein calculation

    // Training preferences
    sessionDuration: 60,
    equipment: 'full',
    programStartDate: '', // When the program should begin
    activityLevel: 'moderate', // For Lock In BMR calculation

    // Nutrition Goal - default to recomp (recommended for most)
    nutritionGoal: 'recomp',

    // Vacations
    vacations: [],

    // Advanced Metrics Modal
    showAdvancedMetrics: false,

    // DEXA Scan Data
    dexaBodyFat: '',
    dexaLeanMass: '',
    dexaFatMass: '',
    dexaBMD: '',
    dexaScanDate: '',

    // InBody Data
    inbodyBodyFat: '',
    inbodySMM: '',
    inbodyTBW: '',
    inbodyBMR: '',
    inbodyScore: '',
    inbodyDate: '',

    // RMR Test Data
    measuredRMR: '',
    measuredRQ: '',
    rmrFacility: '',
    rmrDate: '',
  });

  // Determine which step flow to use based on selected program
  const getSteps = () => {
    if (formData.programType === 'lockin') {
      return STEPS_LOCKIN;
    }
    return STEPS_STANDARD;
  };

  const STEPS = getSteps();
  const totalSteps = STEPS.length;

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Update strength goal
  const updateStrengthGoal = (exerciseId, field, value) => {
    const strengthGoals = formData.strengthGoals || [];
    const updated = strengthGoals.map((ex) =>
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    );
    updateFormData('strengthGoals', updated);
  };

  // Auto-populate name from SignUpModal data or Google account
  useEffect(() => {
    if (!formData.name) {
      // First try to get from SignUpModal data (localStorage)
      const signupData = localStorage.getItem('motus_user_signup');
      if (signupData) {
        try {
          const parsed = JSON.parse(signupData);
          if (parsed.name) {
            updateFormData('name', parsed.name);
            return;
          }
        } catch (e) {
          console.error('Error parsing signup data:', e);
        }
      }
      // Fallback to Google account data
      if (user) {
        updateFormData('name', user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      }
    }
  }, [user, formData.name]);

  const handleNext = () => {
    const steps = getSteps();
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const addVacation = () => {
    const newVacation = {
      id: Date.now(),
      name: '',
      startDate: '', // Empty - user must select
      endDate: '',   // Empty - calendar opens at start date position via min attr
    };
    updateFormData('vacations', [...formData.vacations, newVacation]);
  };

  const updateVacation = (id, field, value) => {
    const updated = formData.vacations.map((v) =>
      v.id === id ? { ...v, [field]: value } : v
    );
    updateFormData('vacations', updated);
  };

  const removeVacation = (id) => {
    updateFormData('vacations', formData.vacations.filter((v) => v.id !== id));
  };

  const getHeightCm = () => {
    if (formData.heightUnit === 'metric') {
      return parseFloat(formData.heightCm) || 0;
    }
    const feet = parseFloat(formData.heightFeet) || 0;
    const inches = parseFloat(formData.heightInches) || 0;
    return (feet * 12 + inches) * 2.54;
  };

  const handleGenerateProgram = async () => {
    setIsGenerating(true);

    // Defensive: ensure formData has all required fields
    const safeFormData = {
      ...formData,
      programType: formData.programType || 'strength',
      programSubtype: formData.programSubtype || 'powerlifting',
      desiredTrainingDays: parseInt(formData.desiredTrainingDays) || 4,
      strengthGoals: formData.strengthGoals || STRENGTH_EXERCISES.map(ex => ({
        id: ex.id,
        label: ex.label,
        current: '',
        target: '',
      })),
    };

    const weightKg = safeFormData.weightUnit === 'lbs'
      ? parseFloat(safeFormData.weight) * 0.453592
      : parseFloat(safeFormData.weight);

    const heightCm = getHeightCm();

    // Use measured RMR if available, otherwise calculate using Mifflin-St Jeor
    // Mifflin-St Jeor is considered the most accurate equation for estimating BMR
    // Source: Mifflin MD, et al. Am J Clin Nutr. 1990;51(2):241-247
    let bmr;
    let bmrSource = 'calculated';

    if (safeFormData.measuredRMR && parseFloat(safeFormData.measuredRMR) > 0) {
      // Use measured RMR (gold standard)
      bmr = parseFloat(safeFormData.measuredRMR);
      bmrSource = 'measured';
    } else if (safeFormData.inbodyBMR && parseFloat(safeFormData.inbodyBMR) > 0) {
      // Use InBody's BMR estimate (bioelectrical impedance)
      bmr = parseFloat(safeFormData.inbodyBMR);
      bmrSource = 'inbody';
    } else {
      // Calculate using Mifflin-St Jeor equation
      bmr = calculateBMR(weightKg, heightCm, parseInt(safeFormData.age) || 30, safeFormData.sex);
    }

    // Activity multiplier based on training days + daily activity level
    // Using refined Harris-Benedict activity factors
    const activityMultiplier = getActivityMultiplier(
      safeFormData.desiredTrainingDays,
      safeFormData.activityLevel
    );
    const tdee = Math.round(bmr * activityMultiplier);
    const macros = calculateSmartMacros(tdee, safeFormData, parseFloat(safeFormData.weight));

    const profileData = {
      ...safeFormData,
      weightKg,
      heightCm,
      bmr,
      bmrSource, // 'measured', 'inbody', or 'calculated'
      tdee,
      macros,
    };

    let program = null;

    try {
      console.log('Calling API with profile:', safeFormData.programType, safeFormData.programSubtype);
      const response = await fetch('/api/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: safeFormData,
          macros,
          bmr,
          tdee,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API error: ${response.status}`);
      }

      program = await response.json();
      console.log('API returned program:', program?.name);
    } catch (error) {
      console.error('Error calling API, using fallback:', error);
      program = generateFallbackProgram(safeFormData);
    }

    // Final validation before completing
    if (!program || typeof program !== 'object') {
      console.error('Invalid program after generation, creating minimal fallback');
      program = generateFallbackProgram(safeFormData);
    }

    // Ensure program has required fields
    program = {
      ...program,
      primaryGoal: program.primaryGoal || safeFormData.programType,
      primarySubtype: program.primarySubtype || safeFormData.programSubtype,
      daysPerWeek: program.daysPerWeek || safeFormData.desiredTrainingDays,
      weeklySchedule: program.weeklySchedule || [],
    };

    try {
      onComplete({
        profile: profileData,
        program,
      });
    } catch (completeError) {
      console.error('Error in onComplete:', completeError);
      setIsGenerating(false);
      alert('Error saving program. Please try again.');
    }
  };

  const canProceed = () => {
    const isLockIn = formData.programType === 'lockin';

    // Different validation for Lock In vs Standard flows
    if (isLockIn) {
      // Lock In flow: Program → Quick Setup → Commitments → Generate
      switch (currentStep) {
        case 1: // Program Selection
          return formData.programType === 'lockin';
        case 2: // Quick Setup (gender, weight, height, activity level)
          const hasWeight = formData.weight;
          const hasHeight = formData.heightUnit === 'metric'
            ? formData.heightCm
            : (formData.heightFeet && formData.heightInches);
          const hasGender = formData.sex;
          return hasWeight && hasHeight && hasGender;
        case 3: // Commitments (always valid - has defaults)
          return true;
        case 4: // Generate step
          return true;
        default:
          return true;
      }
    } else {
      // Standard flow: Program → Body Stats → Goal Details → Time Off → Generate
      switch (currentStep) {
        case 1: // Program Selection
          return formData.programType && formData.programSubtype && formData.desiredTrainingDays;
        case 2: // Body Stats (includes Gender)
          const hasWeight = formData.weight;
          const hasHeight = formData.heightUnit === 'metric'
            ? formData.heightCm
            : (formData.heightFeet && formData.heightInches);
          const hasAge = formData.age;
          const hasGender = formData.sex;
          return hasWeight && hasHeight && hasAge && hasGender;
        case 3: // Goal Details
          return validateGoalDetails();
        case 4: // Time Off
          return true;
        case 5: // Generate
          return true;
        default:
          return true;
      }
    }
  };

  // Pure validation function - NO state updates! Called during render.
  const validateGoalDetails = () => {
    // Lock In doesn't need goal details - skip validation
    if (formData.programType === 'lockin') {
      return true;
    }
    if (formData.programType === 'endurance') {
      if (formData.programSubtype === 'running') {
        return formData.raceDistance && formData.raceDate;
      }
      if (formData.programSubtype === 'triathlon') {
        return formData.triathlonDistance && formData.raceDate;
      }
      return true;
    }
    if (formData.programType === 'strength') {
      const strengthGoals = formData.strengthGoals || [];
      const hasAtLeastOneGoal = strengthGoals.some(g => g.current1RM && g.target1RM);
      if (!hasAtLeastOneGoal) {
        return false;
      }
      if (!formData.strengthGoalDate) {
        return false;
      }
      // Just check if form is complete - realistic check happens in effect
      return true;
    }
    if (formData.programType === 'aesthetic') {
      return formData.targetBodyFat;
    }
    if (formData.programType === 'fatloss') {
      return formData.targetWeight;
    }
    return true;
  };

  // Effect to validate strength goals and set error state (NOT during render)
  useEffect(() => {
    if (formData.programType !== 'strength') {
      setStrengthGoalError(null);
      return;
    }

    const strengthGoals = formData.strengthGoals || [];
    const hasAtLeastOneGoal = strengthGoals.some(g => g.current1RM && g.target1RM);

    if (!hasAtLeastOneGoal || !formData.strengthGoalDate) {
      setStrengthGoalError(null);
      return;
    }

    const today = new Date();
    const goalDate = new Date(formData.strengthGoalDate);
    const weeksUntilGoal = Math.max(1, Math.ceil((goalDate - today) / (1000 * 60 * 60 * 24 * 7)));

    // Check each lift for realistic progression
    const unrealisticLifts = [];
    strengthGoals.forEach(goal => {
      if (goal.current1RM && goal.target1RM) {
        const current = parseFloat(goal.current1RM);
        const target = parseFloat(goal.target1RM);
        const totalIncrease = target - current;
        const weeklyIncrease = totalIncrease / weeksUntilGoal;

        // >10lbs/week is unrealistic for any lift
        if (weeklyIncrease > 10) {
          unrealisticLifts.push({
            lift: goal.label,
            weeklyIncrease: weeklyIncrease.toFixed(1),
            totalIncrease,
            weeks: weeksUntilGoal,
          });
        }
      }
    });

    if (unrealisticLifts.length > 0) {
      const errorMsg = unrealisticLifts.map(l =>
        `${l.lift}: ${l.totalIncrease}lbs in ${l.weeks} weeks = ${l.weeklyIncrease}lbs/week`
      ).join('\n');
      setStrengthGoalError(
        `Your strength goals are not realistic. A maximum of ~10lbs/week 1RM increase is possible with optimal training.\n\n${errorMsg}\n\nPlease extend your goal date or reduce your targets.`
      );
    } else {
      setStrengthGoalError(null);
    }
  }, [formData.programType, formData.strengthGoals, formData.strengthGoalDate]);

  // Handle test mode activation (5 taps on logo OR Ctrl+Shift+T)
  const handleLogoTap = (e) => {
    e.preventDefault();
    // Clear any existing timeout
    if (devTapTimeoutRef.current) {
      clearTimeout(devTapTimeoutRef.current);
    }

    const newCount = devTapCount + 1;
    setDevTapCount(newCount);

    if (newCount >= 5) {
      setDevTapCount(0);
      activateTestMode();
    } else {
      // Reset tap count after 3 seconds of no taps
      devTapTimeoutRef.current = setTimeout(() => setDevTapCount(0), 3000);
    }
  };

  const activateTestMode = useCallback(() => {
    if (window.confirm('Enter test mode? This will create a mock profile for testing.')) {
      const testData = generateTestData();
      onComplete(testData);
    }
  }, [onComplete]);

  // Keyboard shortcut for test mode (Ctrl+Shift+T)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        activateTestMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activateTestMode]);

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Header - Bold brand presence */}
      <header className="px-6 pt-8 pb-4">
        <h1
          className="font-display text-3xl font-bold tracking-tight gradient-text cursor-pointer select-none"
          onClick={handleLogoTap}
          onTouchEnd={handleLogoTap}
        >
          MOTUS
        </h1>
        <p className="text-text-secondary text-sm mt-1">Build your personalized program</p>
        {devTapCount >= 3 && (
          <p className="text-accent-primary text-xs mt-1 animate-pulse">
            {5 - devTapCount} more taps for test mode...
          </p>
        )}
        {/* Dev hint - shows on desktop */}
        <p className="text-gray-600 text-xs mt-1 hidden sm:block">
          Tip: Press Ctrl+Shift+T for test mode
        </p>
      </header>

      {/* Step Indicator - Clean, minimal */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    transition-all duration-300
                    ${currentStep >= step.id
                      ? 'bg-accent-primary text-dark-900'
                      : currentStep === step.id - 1
                        ? 'bg-dark-700 text-text-secondary border border-dark-500'
                        : 'bg-dark-800 text-dark-400'
                    }
                  `}
                >
                  <step.icon className={`w-5 h-5 ${currentStep >= step.id ? 'stroke-[2.5]' : ''}`} />
                </div>
                <span className={`text-xs mt-1.5 hidden sm:block font-medium ${
                  currentStep >= step.id ? 'text-accent-primary' : 'text-dark-400'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-all duration-300 rounded-full ${
                    currentStep > step.id ? 'bg-accent-primary' : 'bg-dark-700'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-6 overflow-y-auto">
        {/* Render steps based on program type (Lock In vs Standard) */}
        {formData.programType === 'lockin' ? (
          // LOCK IN FLOW: 4 steps (Program → Quick Setup → Commitments → Generate)
          <>
            {currentStep === 1 && (
              <StepProgramSelection formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 2 && (
              <StepLockInQuickSetup formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 3 && (
              <StepLockInCommitments formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 4 && (
              <StepLockInGenerate
                formData={formData}
                isGenerating={isGenerating}
                onGenerate={handleGenerateProgram}
              />
            )}
          </>
        ) : (
          // STANDARD FLOW: 5 steps (Program → Body Stats → Goal Details → Time Off → Generate)
          <>
            {currentStep === 1 && (
              <StepProgramSelection formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 2 && (
              <StepBodyStats formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 3 && (
              <StepGoalDetails
                formData={formData}
                updateFormData={updateFormData}
                updateStrengthGoal={updateStrengthGoal}
                strengthGoalError={strengthGoalError}
              />
            )}
            {currentStep === 4 && (
              <StepVacations
                formData={formData}
                addVacation={addVacation}
                updateVacation={updateVacation}
                removeVacation={removeVacation}
              />
            )}
            {currentStep === 5 && (
              <StepGenerate
                formData={formData}
                isGenerating={isGenerating}
                onGenerate={handleGenerateProgram}
              />
            )}
          </>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="px-6 py-5 border-t border-dark-700 flex justify-between bg-dark-900/95 backdrop-blur-sm">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="min-w-[100px]"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </Button>
        {currentStep < getSteps().length ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="min-w-[100px]"
          >
            Next
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        ) : null}
      </div>

      {/* Advanced Metrics Modal */}
      <AdvancedMetricsModal
        isOpen={formData.showAdvancedMetrics}
        onClose={() => updateFormData('showAdvancedMetrics', false)}
        formData={formData}
        updateFormData={updateFormData}
      />
    </div>
  );
}

// Calculate TDEE multiplier based on exercise frequency and daily activity
// Uses refined Harris-Benedict activity factors with exercise adjustment
// Source: Harris JA, Benedict FG. Proc Natl Acad Sci USA. 1918;4(12):370-373
// Updated multipliers based on modern research from:
// - Ainsworth BE, et al. Med Sci Sports Exerc. 2011;43(8):1575-1581 (Compendium of Physical Activities)
function getActivityMultiplier(daysPerWeek, activityLevel = 'moderate') {
  // Base multiplier from daily activity level (NEAT - Non-Exercise Activity Thermogenesis)
  const baseMultipliers = {
    sedentary: 1.2,      // Little to no exercise, desk job
    light: 1.375,        // Light exercise 1-2 days/week, some walking
    moderate: 1.55,      // Moderate activity, on feet part of day
    active: 1.725,       // Very active lifestyle, physical job
  };

  // Exercise adjustment factor (accounts for planned training)
  // ~0.05 per training day is consistent with metabolic research
  const exerciseAdjustment = {
    0: 0,
    1: 0.05,
    2: 0.10,
    3: 0.15,
    4: 0.20,
    5: 0.25,
    6: 0.30,
    7: 0.35,
  };

  const base = baseMultipliers[activityLevel] || baseMultipliers.moderate;
  const exercise = exerciseAdjustment[Math.min(daysPerWeek || 0, 7)] || 0;

  // Cap at 2.0 to prevent unrealistic estimates
  return Math.min(base + exercise, 2.0);
}

function calculateSmartMacros(tdee, formData, weightLbs) {
  let calories, protein, carbs, fat;

  switch (formData.nutritionGoal) {
    case 'maintain':
      calories = tdee;
      protein = Math.round(weightLbs * 0.8);
      break;
    case 'recomp':
      calories = tdee;
      protein = Math.round(weightLbs * 1.0);
      break;
    case 'lose':
      const lossDeficit = formData.weeklyWeightChange * 500;
      calories = Math.round(tdee - lossDeficit);
      protein = Math.round(weightLbs * 1.0);
      break;
    case 'gain':
      const gainSurplus = formData.weeklyWeightChange * 500;
      calories = Math.round(tdee + gainSurplus);
      protein = Math.round(weightLbs * 0.9);
      break;
    default:
      calories = tdee;
      protein = Math.round(weightLbs * 0.8);
  }

  const proteinCals = protein * 4;
  const remainingCals = calories - proteinCals;
  fat = Math.round((remainingCals * 0.35) / 9);
  carbs = Math.round((remainingCals * 0.65) / 4);

  return { calories, protein, carbs, fat };
}

// Step 1: Program Selection (Detailed)
function StepProgramSelection({ formData, updateFormData }) {
  const [expandedProgram, setExpandedProgram] = useState(null);

  const PROGRAM_DETAILS = {
    lockin: {
      icon: '🔥',
      title: '30 Day Lock In',
      tagline: 'Build momentum in 30 days',
      description: 'A structured 30-day challenge designed to build habits and momentum. Simple, focused, no excuses.',
      whatToExpect: [
        '6 days/week weightlifting with double progressive overload',
        '3 days/week cardio (20-30 minutes)',
        'Day 7: Active recovery (1 hour)',
        'Daily commitments: workout, steps, water, protein',
      ],
      timeCommitment: '1-1.5 hours/day',
      bestFor: 'Anyone looking to build consistent habits and see quick results',
      hybrid: false,
    },
    endurance: {
      icon: '🏃',
      title: 'Endurance',
      tagline: 'Train for distance and speed',
      description: 'Periodized training for running, cycling, swimming, or triathlon. Built on proven race training methodology.',
      whatToExpect: [
        'Base → Build → Peak → Taper periodization',
        'Zone-based training (easy, tempo, threshold, intervals)',
        'Strategic long runs/rides with progressive distance',
        'Race-specific preparation and pacing',
      ],
      timeCommitment: '4-10 hours/week depending on race distance',
      bestFor: 'Runners, cyclists, swimmers, and triathletes training for events',
      hybrid: true,
      hybridNote: 'Can add Strength or Aesthetic as secondary goal',
    },
    strength: {
      icon: '🏋️',
      title: 'Strength',
      tagline: 'Build maximal strength and power',
      description: 'Focused strength training for powerlifting, Olympic lifting, or general strength. Periodized for peak performance.',
      whatToExpect: [
        'Progressive overload on compound lifts',
        'Periodized intensity (volume → intensity → peak)',
        'Accessory work for weak points',
        'Strategic deloads every 4-6 weeks',
      ],
      timeCommitment: '4-6 hours/week',
      bestFor: 'Those focused on getting stronger - powerlifters, Olympic lifters, strength enthusiasts',
      hybrid: false,
      hybridNote: 'Strength requires dedicated focus - hybrid not recommended',
    },
    aesthetic: {
      icon: '💪',
      title: 'Aesthetic',
      tagline: 'Sculpt your physique',
      description: 'Hypertrophy-focused training for muscle building, body recomposition, or physique competition.',
      whatToExpect: [
        'High-volume training with progressive overload',
        'Strategic exercise selection for balanced development',
        'Body recomposition nutrition strategy',
        'Periodized volume and intensity',
      ],
      timeCommitment: '5-7 hours/week',
      bestFor: 'Bodybuilders, physique competitors, anyone focused on muscle building',
      hybrid: false,
      hybridNote: 'Aesthetic goals require dedicated volume - hybrid not recommended',
    },
  };

  const handleSelectProgram = (programId) => {
    updateFormData('programType', programId);

    if (programId === 'lockin') {
      updateFormData('programSubtype', 'lockin-standard');
      updateFormData('desiredTrainingDays', 6);
      updateFormData('enableHybrid', false);
    } else {
      updateFormData('programSubtype', '');
      // Reset hybrid for non-endurance
      if (programId !== 'endurance') {
        updateFormData('enableHybrid', false);
        updateFormData('secondaryProgramType', '');
        updateFormData('secondarySubtype', '');
      }
    }

    // Auto-set nutrition goal for aesthetic
    if (programId === 'aesthetic') {
      updateFormData('nutritionGoal', 'recomp');
    }
  };

  const selectedProgram = PROGRAM_TYPES.find((p) => p.id === formData.programType);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Program</h2>
        <p className="text-gray-400">Select the program that matches your goals. Tap any card to learn more.</p>
      </div>

      {/* Program Cards */}
      <div className="space-y-4">
        {Object.entries(PROGRAM_DETAILS).map(([id, program]) => (
          <div
            key={id}
            className={`rounded-xl border transition-all cursor-pointer overflow-hidden ${
              formData.programType === id
                ? 'bg-accent-primary/10 border-accent-primary'
                : 'bg-dark-800 border-dark-600 hover:border-dark-400'
            }`}
          >
            {/* Card Header - Always visible */}
            <div
              className="p-4 flex items-start gap-4"
              onClick={() => {
                if (expandedProgram === id) {
                  handleSelectProgram(id);
                } else {
                  setExpandedProgram(id);
                }
              }}
            >
              <span className="text-4xl">{program.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{program.title}</h3>
                    <p className="text-sm text-gray-400">{program.tagline}</p>
                  </div>
                  {formData.programType === id && (
                    <div className="w-6 h-6 bg-accent-primary rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-dark-900" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedProgram === id ? 'rotate-90' : ''
                }`}
              />
            </div>

            {/* Expanded Details */}
            {expandedProgram === id && (
              <div className="px-4 pb-4 border-t border-dark-600 pt-4">
                <p className="text-gray-300 text-sm mb-4">{program.description}</p>

                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="text-white font-medium mb-1">What to Expect:</h4>
                    <ul className="text-gray-400 space-y-1">
                      {program.whatToExpect.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-accent-primary">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-4">
                    <div>
                      <span className="text-gray-500">Time:</span>
                      <span className="text-white ml-2">{program.timeCommitment}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500">Best for:</span>
                    <span className="text-gray-300 ml-2">{program.bestFor}</span>
                  </div>

                  {program.hybridNote && (
                    <p className="text-xs text-gray-500 italic">{program.hybridNote}</p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectProgram(id);
                  }}
                  className={`mt-4 w-full py-3 rounded-lg font-medium transition-all ${
                    formData.programType === id
                      ? 'bg-accent-primary text-dark-900'
                      : 'bg-dark-600 text-white hover:bg-dark-500'
                  }`}
                >
                  {formData.programType === id ? 'Selected' : 'Select This Program'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Subtype Selection (for non-Lock In programs) */}
      {selectedProgram && formData.programType !== 'lockin' && (
        <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Select your specific focus:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {selectedProgram.subtypes.map((subtype) => (
              <button
                key={subtype.id}
                onClick={() => updateFormData('programSubtype', subtype.id)}
                className={`px-4 py-3 rounded-lg border text-sm transition-all ${
                  formData.programSubtype === subtype.id
                    ? 'bg-accent-secondary/20 border-accent-secondary text-white'
                    : 'bg-dark-700 border-dark-500 text-gray-400 hover:border-gray-400'
                }`}
              >
                {subtype.label}
              </button>
            ))}
          </div>

          {/* Training Days Slider */}
          {formData.programSubtype && (
            <div className="mt-4 pt-4 border-t border-dark-600">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                How many days per week do you want to train?{' '}
                <span className="text-accent-primary font-bold">{formData.desiredTrainingDays} days</span>
              </label>
              <input
                type="range"
                min="2"
                max="7"
                step="1"
                value={formData.desiredTrainingDays}
                onChange={(e) => updateFormData('desiredTrainingDays', parseInt(e.target.value))}
                className="w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                {[2, 3, 4, 5, 6, 7].map(n => <span key={n}>{n}</span>)}
              </div>
            </div>
          )}

          {/* Hybrid Option for Endurance */}
          {formData.programType === 'endurance' && formData.programSubtype && formData.programSubtype !== 'triathlon' && (
            <div className="mt-4 pt-4 border-t border-dark-600">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-white font-medium">Enable Hybrid Training?</h4>
                  <p className="text-xs text-gray-400">Add strength or aesthetic as secondary goal</p>
                </div>
                <button
                  onClick={() => updateFormData('enableHybrid', !formData.enableHybrid)}
                  className={`w-14 h-8 rounded-full transition-all ${
                    formData.enableHybrid ? 'bg-accent-primary' : 'bg-dark-600'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white transition-all ${
                      formData.enableHybrid ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {formData.enableHybrid && (
                <div className="space-y-3">
                  <select
                    value={formData.secondaryProgramType}
                    onChange={(e) => {
                      updateFormData('secondaryProgramType', e.target.value);
                      updateFormData('secondarySubtype', '');
                    }}
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-500 rounded-lg text-white text-sm"
                  >
                    <option value="">Select secondary goal...</option>
                    <option value="strength">🏋️ Strength</option>
                    <option value="aesthetic">💪 Aesthetic</option>
                  </select>

                  {formData.secondaryProgramType && (
                    <select
                      value={formData.secondarySubtype}
                      onChange={(e) => updateFormData('secondarySubtype', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-700 border border-dark-500 rounded-lg text-white text-sm"
                    >
                      <option value="">Select focus...</option>
                      {PROGRAM_TYPES.find((p) => p.id === formData.secondaryProgramType)?.subtypes?.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Step 2 (Lock In): Quick Setup - Gender, Weight, Height, Activity Level
function StepLockInQuickSetup({ formData, updateFormData }) {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Quick Setup</h2>
        <p className="text-gray-400">Just a few details to calculate your nutrition targets.</p>
      </div>

      <div className="space-y-5">
        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
          <p className="text-xs text-gray-500 mb-2">Used for accurate metabolic calculations</p>
          <div className="flex gap-4">
            {['male', 'female'].map((sex) => (
              <button
                key={sex}
                onClick={() => updateFormData('sex', sex)}
                className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                  formData.sex === sex
                    ? 'bg-accent-primary border-accent-primary text-white'
                    : 'bg-dark-700 border-dark-500 text-gray-400 hover:border-gray-400'
                }`}
              >
                {sex.charAt(0).toUpperCase() + sex.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Weight</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => updateFormData('weight', e.target.value)}
              placeholder="Enter weight"
              className="flex-1 px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
            <select
              value={formData.weightUnit}
              onChange={(e) => updateFormData('weightUnit', e.target.value)}
              className="px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white"
            >
              <option value="lbs">lbs</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </div>

        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Height</label>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => updateFormData('heightUnit', 'imperial')}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm ${
                formData.heightUnit === 'imperial'
                  ? 'bg-accent-primary border-accent-primary text-white'
                  : 'bg-dark-700 border-dark-500 text-gray-400'
              }`}
            >
              ft / in
            </button>
            <button
              onClick={() => updateFormData('heightUnit', 'metric')}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm ${
                formData.heightUnit === 'metric'
                  ? 'bg-accent-primary border-accent-primary text-white'
                  : 'bg-dark-700 border-dark-500 text-gray-400'
              }`}
            >
              cm
            </button>
          </div>
          {formData.heightUnit === 'imperial' ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.heightFeet}
                onChange={(e) => updateFormData('heightFeet', e.target.value)}
                placeholder="Feet"
                min="3"
                max="8"
                className="flex-1 px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
              />
              <input
                type="number"
                value={formData.heightInches}
                onChange={(e) => updateFormData('heightInches', e.target.value)}
                placeholder="Inches"
                min="0"
                max="11"
                className="flex-1 px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
              />
            </div>
          ) : (
            <input
              type="number"
              value={formData.heightCm}
              onChange={(e) => updateFormData('heightCm', e.target.value)}
              placeholder="Height in cm"
              className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
            />
          )}
        </div>

        {/* Activity Level */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Activity Level (outside of workouts)
          </label>
          <div className="space-y-2">
            {[
              { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, minimal movement' },
              { id: 'light', label: 'Lightly Active', desc: 'Some walking, light activity' },
              { id: 'moderate', label: 'Moderately Active', desc: 'On feet most of day' },
              { id: 'active', label: 'Very Active', desc: 'Physical job, always moving' },
            ].map((level) => (
              <button
                key={level.id}
                onClick={() => updateFormData('activityLevel', level.id)}
                className={`w-full p-3 rounded-lg border text-left ${
                  formData.activityLevel === level.id
                    ? 'bg-accent-primary/20 border-accent-primary'
                    : 'bg-dark-700 border-dark-500'
                }`}
              >
                <span className="text-white font-medium">{level.label}</span>
                <p className="text-xs text-gray-400">{level.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BMR Preview */}
      {formData.weight && (formData.heightFeet || formData.heightCm) && (
        <div className="p-4 bg-dark-700 rounded-xl border border-dark-600">
          <p className="text-sm text-gray-400 mb-2">Estimated Daily Calories:</p>
          <p className="text-2xl font-bold text-accent-primary">
            {(() => {
              const weightKg = formData.weightUnit === 'lbs'
                ? parseFloat(formData.weight) * 0.453592
                : parseFloat(formData.weight);
              const heightCm = formData.heightUnit === 'metric'
                ? parseFloat(formData.heightCm)
                : ((parseFloat(formData.heightFeet) || 0) * 12 + (parseFloat(formData.heightInches) || 0)) * 2.54;
              const bmr = calculateBMR(weightKg, heightCm, 30, formData.sex || 'male');
              const multiplier = formData.activityLevel === 'sedentary' ? 1.2 :
                               formData.activityLevel === 'light' ? 1.375 :
                               formData.activityLevel === 'moderate' ? 1.55 :
                               formData.activityLevel === 'active' ? 1.725 : 1.55;
              return Math.round(bmr * multiplier).toLocaleString();
            })()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Based on Mifflin-St Jeor formula • Will be refined during your challenge
          </p>
        </div>
      )}
    </div>
  );
}

// Step 4 (Lock In): Commitments
function StepLockInCommitments({ formData, updateFormData }) {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">🔥 Your Commitments</h2>
        <p className="text-gray-400">Choose your daily commitments for the next 30 days.</p>
      </div>

      {/* Program Overview */}
      <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/30">
        <h3 className="text-lg font-bold text-white mb-2">30 Day Lock In Schedule</h3>
        <div className="text-sm text-gray-300 space-y-1">
          <p>• Days 1-6: Weightlifting (double progressive overload)</p>
          <p>• 3x/week: Cardio (20-30 min)</p>
          <p>• Day 7: Active recovery (1 hour)</p>
        </div>
      </div>

      {/* Daily Commitments */}
      <div className="space-y-3">
        {/* Workout - Always checked, non-negotiable */}
        <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg border border-accent-primary/50">
          <div className="flex items-center gap-3">
            <span className="text-xl">💪</span>
            <div>
              <p className="text-white font-medium">1hr Workout Daily</p>
              <p className="text-xs text-gray-400">Non-negotiable</p>
            </div>
          </div>
          <div className="w-6 h-6 bg-accent-primary rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-dark-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Steps */}
        <div className="p-3 bg-dark-700 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">👟</span>
            <p className="text-white font-medium">Daily Steps Goal</p>
          </div>
          <div className="flex gap-2">
            {['10k', '15k'].map((steps) => (
              <button
                key={steps}
                onClick={() => updateFormData('lockInSteps', steps)}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm transition-all ${
                  formData.lockInSteps === steps
                    ? 'bg-accent-primary/20 border-accent-primary text-white'
                    : 'bg-dark-600 border-dark-500 text-gray-400'
                }`}
              >
                {steps} steps
              </button>
            ))}
          </div>
        </div>

        {/* Water */}
        <button
          onClick={() => updateFormData('lockInWater', !formData.lockInWater)}
          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
            formData.lockInWater
              ? 'bg-dark-700 border-accent-primary/50'
              : 'bg-dark-800 border-dark-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">💧</span>
            <div className="text-left">
              <p className="text-white font-medium">1 Gallon Water Daily</p>
              <p className="text-xs text-gray-400">Stay hydrated</p>
            </div>
          </div>
          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
            formData.lockInWater ? 'bg-accent-primary border-accent-primary' : 'border-dark-500'
          }`}>
            {formData.lockInWater && (
              <svg className="w-4 h-4 text-dark-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </button>

        {/* High Protein */}
        <button
          onClick={() => updateFormData('lockInProtein', !formData.lockInProtein)}
          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
            formData.lockInProtein
              ? 'bg-dark-700 border-accent-primary/50'
              : 'bg-dark-800 border-dark-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🥩</span>
            <div className="text-left">
              <p className="text-white font-medium">High Protein + Whole Foods</p>
              <p className="text-xs text-gray-400">1g protein per lb of ideal bodyweight</p>
            </div>
          </div>
          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
            formData.lockInProtein ? 'bg-accent-primary border-accent-primary' : 'border-dark-500'
          }`}>
            {formData.lockInProtein && (
              <svg className="w-4 h-4 text-dark-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </button>
      </div>

      {/* Note about cardio and rest day choices */}
      <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
        <p className="text-sm text-gray-400">
          <span className="text-white font-medium">Cardio & Rest Day:</span> You'll choose your cardio type and rest day activity each day from the home screen. Cardio is 20-30 min, and Day 7 active recovery is 1 hour.
        </p>
      </div>
    </div>
  );
}

// Step 3 (Lock In): Commitments (updated step number)

// Step 4 (Lock In): Generate Program
function StepLockInGenerate({ formData, isGenerating, onGenerate }) {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Ready to Lock In</h2>
        <p className="text-gray-400">Your AI-powered 30 Day Challenge is ready to generate.</p>
      </div>

      <div className="bg-dark-800 rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-white">Your 30 Day Commitment</h3>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-accent-primary">✓</span>
            <span className="text-white">6 days/week weightlifting (double progressive overload)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-accent-primary">✓</span>
            <span className="text-white">1hr Workout Daily</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-accent-primary">✓</span>
            <span className="text-white">{formData.lockInSteps || '10k'} Steps Daily</span>
          </div>
          {formData.lockInWater && (
            <div className="flex items-center gap-2">
              <span className="text-accent-primary">✓</span>
              <span className="text-white">1 Gallon Water Daily</span>
            </div>
          )}
          {formData.lockInProtein && (
            <div className="flex items-center gap-2">
              <span className="text-accent-primary">✓</span>
              <span className="text-white">High Protein + Whole Foods</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-accent-primary">✓</span>
            <span className="text-white">Cardio 3x/week (20-30 min)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-accent-primary">✓</span>
            <span className="text-white">Day 7: Active Recovery (1 hour)</span>
          </div>
        </div>

        <hr className="border-dark-600" />

        <div>
          <span className="text-gray-400 text-sm">Program Features</span>
          <ul className="text-sm text-white mt-1 space-y-1">
            <li>✓ Double progressive overload built-in</li>
            <li>✓ Daily structure and accountability</li>
            <li>✓ Cardio and active recovery programmed</li>
            <li>✓ 30 days of focused habit building</li>
          </ul>
        </div>
      </div>

      <Button
        fullWidth
        size="lg"
        onClick={onGenerate}
        disabled={isGenerating}
        className={isGenerating ? 'animate-pulse' : ''}
      >
        {isGenerating ? (
          <>
            <span className="animate-spin mr-2">⚡</span>
            Generating Your Program...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Generate My Program
          </>
        )}
      </Button>
    </div>
  );
}

// Step 2 (Standard): Body Stats
function StepBodyStats({ formData, updateFormData }) {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Body Measurements</h2>
        <p className="text-gray-400">Help us understand your current fitness level.</p>
      </div>

      <div className="space-y-5">
        {/* Gender Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
          <p className="text-xs text-gray-500 mb-2">Used for accurate metabolic calculations</p>
          <div className="flex gap-4">
            {['male', 'female'].map((sex) => (
              <button
                key={sex}
                onClick={() => updateFormData('sex', sex)}
                className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                  formData.sex === sex
                    ? 'bg-accent-primary border-accent-primary text-white'
                    : 'bg-dark-700 border-dark-500 text-gray-400 hover:border-gray-400'
                }`}
              >
                {sex.charAt(0).toUpperCase() + sex.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Weight</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => updateFormData('weight', e.target.value)}
              placeholder="Enter weight"
              className="flex-1 px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
            <select
              value={formData.weightUnit}
              onChange={(e) => updateFormData('weightUnit', e.target.value)}
              className="px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white"
            >
              <option value="lbs">lbs</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Height</label>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => updateFormData('heightUnit', 'imperial')}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm ${
                formData.heightUnit === 'imperial'
                  ? 'bg-accent-primary border-accent-primary text-white'
                  : 'bg-dark-700 border-dark-500 text-gray-400'
              }`}
            >
              ft / in
            </button>
            <button
              onClick={() => updateFormData('heightUnit', 'metric')}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm ${
                formData.heightUnit === 'metric'
                  ? 'bg-accent-primary border-accent-primary text-white'
                  : 'bg-dark-700 border-dark-500 text-gray-400'
              }`}
            >
              cm
            </button>
          </div>
          {formData.heightUnit === 'imperial' ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.heightFeet}
                onChange={(e) => updateFormData('heightFeet', e.target.value)}
                placeholder="Feet"
                min="3"
                max="8"
                className="flex-1 px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
              />
              <input
                type="number"
                value={formData.heightInches}
                onChange={(e) => updateFormData('heightInches', e.target.value)}
                placeholder="Inches"
                min="0"
                max="11"
                className="flex-1 px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
              />
            </div>
          ) : (
            <input
              type="number"
              value={formData.heightCm}
              onChange={(e) => updateFormData('heightCm', e.target.value)}
              placeholder="Height in cm"
              className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => updateFormData('age', e.target.value)}
            placeholder="Enter your age"
            min="16"
            max="100"
            className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Body Fat % <span className="text-gray-500">(Optional)</span>
          </label>
          <input
            type="number"
            value={formData.bodyFatPercent}
            onChange={(e) => updateFormData('bodyFatPercent', e.target.value)}
            placeholder="e.g., 20"
            min="5"
            max="50"
            className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
          />
        </div>

        {/* Advanced Metrics Button */}
        <div className="p-4 bg-dark-700/50 rounded-xl border border-dark-600">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-white font-medium mb-1">Have Professional Data?</h4>
              <p className="text-xs text-gray-400">
                Enter DEXA scan, InBody, or RMR test results for more accurate calculations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateFormData('showAdvancedMetrics', true)}
              className="px-3 py-1.5 bg-accent-secondary/20 text-accent-secondary text-sm font-medium rounded-lg hover:bg-accent-secondary/30 transition-colors whitespace-nowrap"
            >
              + Advanced
            </button>
          </div>
          {/* Show summary if any advanced data is present */}
          {(formData.dexaBodyFat || formData.inbodyBodyFat || formData.measuredRMR) && (
            <div className="mt-3 pt-3 border-t border-dark-600">
              <p className="text-xs text-accent-primary">
                ✓ Advanced metrics on file
                {formData.measuredRMR && ` • RMR: ${formData.measuredRMR} kcal`}
                {(formData.dexaBodyFat || formData.inbodyBodyFat) && ` • BF: ${formData.dexaBodyFat || formData.inbodyBodyFat}%`}
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-dark-600">
          <h3 className="text-lg font-semibold text-white mb-4">Training History</h3>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              How many days per week have you been training? <span className="text-accent-primary font-bold">{formData.currentTrainingDays} days</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">Average over the last 30 days</p>
            <input
              type="range"
              min="0"
              max="7"
              step="1"
              value={formData.currentTrainingDays}
              onChange={(e) => updateFormData('currentTrainingDays', parseInt(e.target.value))}
              className="w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-accent-primary"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              {[0, 1, 2, 3, 4, 5, 6, 7].map(n => <span key={n}>{n}</span>)}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              How consistent has your training been?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'none', label: 'New to Training', desc: 'Just starting out' },
                { id: 'some', label: 'Some Experience', desc: 'On and off' },
                { id: 'consistent', label: 'Consistent', desc: 'Regular routine' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateFormData('trainingHistory', opt.id)}
                  className={`p-3 rounded-lg border text-center ${
                    formData.trainingHistory === opt.id
                      ? 'bg-accent-primary/20 border-accent-primary'
                      : 'bg-dark-700 border-dark-500'
                  }`}
                >
                  <span className="text-white text-sm font-medium block">{opt.label}</span>
                  <span className="text-xs text-gray-400">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Years of training experience: <span className="text-accent-primary font-bold">{formData.yearsTraining} {formData.yearsTraining === 1 ? 'year' : 'years'}</span>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={formData.yearsTraining}
              onChange={(e) => updateFormData('yearsTraining', parseInt(e.target.value))}
              className="w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-accent-primary"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>New</span>
              <span>5 yrs</span>
              <span>10+ yrs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/// Step 4 (Standard): Goal Details
function StepGoalDetails({ formData, updateFormData, updateStrengthGoal, strengthGoalError }) {
  // Simple null check
  const safeFormData = formData || {};
  const programType = safeFormData.programType || '';
  const programSubtype = safeFormData.programSubtype || '';

  // Determine experience level from training history
  const getExperienceLevel = () => {
    const years = parseInt(safeFormData.yearsTraining) || 0;
    if (years < 1) return 'beginner';
    if (years < 3) return 'intermediate';
    if (years < 6) return 'advanced';
    return 'elite';
  };

  // Lock In Program - Show summary/confirmation
  if (programType === 'lockin') {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">🔥 Your 30 Day Lock In</h2>
          <p className="text-gray-400">Review your commitments before we build your program.</p>
        </div>

        <div className="space-y-4">
          {/* Program Structure */}
          <div className="p-4 bg-dark-700 rounded-xl">
            <h3 className="text-white font-semibold mb-3">Your Weekly Schedule:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Days 1-6:</span>
                <span className="text-white">Weightlifting + Light Cardio</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Day 7:</span>
                <span className="text-white">Active Recovery (1 hour)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cardio (3x/week):</span>
                <span className="text-white">Your choice (20-30 min)</span>
              </div>
            </div>
          </div>

          {/* Daily Commitments */}
          <div className="p-4 bg-dark-700 rounded-xl">
            <h3 className="text-white font-semibold mb-3">Daily Commitments:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-accent-primary">✓</span>
                <span className="text-white">1hr Workout (Non-negotiable)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent-primary">✓</span>
                <span className="text-white">{safeFormData.lockInSteps} Steps Daily</span>
              </div>
              {safeFormData.lockInWater && (
                <div className="flex items-center gap-2">
                  <span className="text-accent-primary">✓</span>
                  <span className="text-white">1 Gallon Water</span>
                </div>
              )}
              {safeFormData.lockInProtein && (
                <div className="flex items-center gap-2">
                  <span className="text-accent-primary">✓</span>
                  <span className="text-white">
                    {safeFormData.lockInIdealWeight ? `${safeFormData.lockInIdealWeight}g Protein` : 'High Protein'} + Whole Foods
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Motivation */}
          <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/30">
            <p className="text-sm text-gray-300 text-center">
              <span className="text-2xl block mb-2">💪</span>
              30 days to build the habits that change everything.
              <span className="text-white font-medium"> No excuses. No shortcuts.</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render strength goals using dedicated component
  if (programType === 'strength') {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Goal Details</h2>
          <p className="text-gray-400">Help us tailor your program to your specific targets.</p>
        </div>

        <StrengthGoalsForm
          strengthGoals={safeFormData.strengthGoals}
          strengthGoalDate={safeFormData.strengthGoalDate}
          programStartDate={safeFormData.programStartDate}
          nutritionGoal={safeFormData.nutritionGoal}
          experienceLevel={getExperienceLevel()}
          bodyFatPercent={safeFormData.bodyFatPercent}
          onUpdateGoal={updateStrengthGoal}
          onUpdateDate={(value) => updateFormData('strengthGoalDate', value)}
          onUpdateStartDate={(value) => updateFormData('programStartDate', value)}
          onUpdateNutrition={(value) => updateFormData('nutritionGoal', value)}
        />

        {strengthGoalError && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-xl">
            <h4 className="text-red-400 font-semibold mb-2">Unrealistic Goals Detected</h4>
            <p className="text-sm text-gray-300 whitespace-pre-line">{strengthGoalError}</p>
          </div>
        )}

        {/* Secondary Cardio Option */}
        <div className="pt-6 border-t border-dark-600">
          <h3 className="text-lg font-semibold text-white mb-2">🫀 Add Cardio for Heart Health?</h3>
          <p className="text-sm text-gray-400 mb-4">
            Adding 2-3 days of easy cardio improves cardiovascular health and recovery without
            interfering with your strength gains.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => updateFormData('includeCardio', !safeFormData.includeCardio)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                safeFormData.includeCardio ? 'bg-accent-primary' : 'bg-dark-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  safeFormData.includeCardio ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
            <span className="text-white">Include cardio in my program</span>
          </div>

          {safeFormData.includeCardio && (
            <div className="space-y-4 p-4 bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cardio Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SECONDARY_CARDIO_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateFormData('cardioType', option.id)}
                      className={`p-3 rounded-lg border text-center ${
                        safeFormData.cardioType === option.id
                          ? 'bg-accent-primary/20 border-accent-primary'
                          : 'bg-dark-600 border-dark-500'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{option.icon}</span>
                      <span className="text-white text-sm">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Days per Week
                </label>
                <div className="flex gap-2">
                  {[2, 3].map((days) => (
                    <button
                      key={days}
                      onClick={() => updateFormData('cardioDaysPerWeek', days)}
                      className={`flex-1 py-2 rounded-lg border ${
                        safeFormData.cardioDaysPerWeek === days
                          ? 'bg-accent-primary/20 border-accent-primary text-white'
                          : 'bg-dark-600 border-dark-500 text-gray-400'
                      }`}
                    >
                      {days} days
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Cardio sessions will be scheduled on rest days or as double days (AM/PM splits)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render other goal types using the original renderGoalInputs
  const renderGoalInputs = () => {
    // Endurance goals
    if (programType === 'endurance') {
      // Marathon/Race
      if (programSubtype === 'marathon' || programSubtype === 'running') {
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">🏃 Race Details</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Race Distance</label>
              <div className="grid grid-cols-3 gap-2">
                {RACE_DISTANCES.map((dist) => (
                  <button
                    key={dist.id}
                    onClick={() => updateFormData('raceDistance', dist.id)}
                    className={`py-3 px-2 rounded-lg border text-sm ${
                      formData.raceDistance === dist.id
                        ? 'bg-accent-primary border-accent-primary text-white'
                        : 'bg-dark-700 border-dark-500 text-gray-400'
                    }`}
                  >
                    {dist.label}
                  </button>
                ))}
              </div>

              {/* Ultra Marathon custom distance input */}
              {formData.raceDistance === 'ultra' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ultra Distance (miles)
                  </label>
                  <input
                    type="number"
                    value={formData.ultraDistance || ''}
                    onChange={(e) => updateFormData('ultraDistance', e.target.value)}
                    placeholder="e.g., 50, 100"
                    min="30"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Common distances: 50K (31mi), 50mi, 100K (62mi), 100mi
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Race Date</label>
              <input
                type="date"
                value={formData.raceDate}
                min={getTodayString()}
                onChange={(e) => updateFormData('raceDate', e.target.value)}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target Finish Time</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="number"
                    value={formData.targetFinishHours}
                    onChange={(e) => updateFormData('targetFinishHours', e.target.value)}
                    placeholder="Hours"
                    min="0"
                    max="24"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
                  />
                  <span className="text-xs text-gray-500">Hours</span>
                </div>
                <div>
                  <input
                    type="number"
                    value={formData.targetFinishMinutes}
                    onChange={(e) => updateFormData('targetFinishMinutes', e.target.value)}
                    placeholder="Min"
                    min="0"
                    max="59"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
                  />
                  <span className="text-xs text-gray-500">Minutes</span>
                </div>
                <div>
                  <input
                    type="number"
                    value={formData.targetFinishSeconds}
                    onChange={(e) => updateFormData('targetFinishSeconds', e.target.value)}
                    placeholder="Sec"
                    min="0"
                    max="59"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
                  />
                  <span className="text-xs text-gray-500">Seconds</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Weekly Mileage
              </label>
              <input
                type="number"
                value={formData.currentWeeklyMileage}
                onChange={(e) => updateFormData('currentWeeklyMileage', e.target.value)}
                placeholder="e.g., 20"
                className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
              />
            </div>

            {/* Baseline Performance Section */}
            <div className="pt-4 border-t border-dark-600">
              <h4 className="text-md font-semibold text-white mb-2">📊 Current Fitness Baseline</h4>
              <p className="text-xs text-gray-400 mb-4">
                Enter a recent race or time trial so we can calculate your training paces accurately.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Reference Race Distance</label>
                <div className="grid grid-cols-2 gap-2">
                  {BASELINE_RACE_DISTANCES.map((dist) => (
                    <button
                      key={dist.id}
                      onClick={() => updateFormData('baselineRaceDistance', dist.id)}
                      className={`py-2 px-2 rounded-lg border text-sm ${
                        formData.baselineRaceDistance === dist.id
                          ? 'bg-accent-secondary border-accent-secondary text-white'
                          : 'bg-dark-700 border-dark-500 text-gray-400'
                      }`}
                    >
                      {dist.label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.baselineRaceDistance && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Best Recent {formData.baselineRaceDistance.toUpperCase()} Time
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <input
                        type="number"
                        value={formData.baselineTimeHours}
                        onChange={(e) => updateFormData('baselineTimeHours', e.target.value)}
                        placeholder="Hr"
                        min="0"
                        max="10"
                        className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white text-sm placeholder-gray-500"
                      />
                      <span className="text-xs text-gray-500">Hours</span>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={formData.baselineTimeMinutes}
                        onChange={(e) => updateFormData('baselineTimeMinutes', e.target.value)}
                        placeholder="Min"
                        min="0"
                        max="59"
                        className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white text-sm placeholder-gray-500"
                      />
                      <span className="text-xs text-gray-500">Min</span>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={formData.baselineTimeSeconds}
                        onChange={(e) => updateFormData('baselineTimeSeconds', e.target.value)}
                        placeholder="Sec"
                        min="0"
                        max="59"
                        className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white text-sm placeholder-gray-500"
                      />
                      <span className="text-xs text-gray-500">Sec</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Longest Run in Past Month (miles)
                </label>
                <input
                  type="number"
                  value={formData.longestRecentRun}
                  onChange={(e) => updateFormData('longestRecentRun', e.target.value)}
                  placeholder="e.g., 10"
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        );
      }

      // Triathlon
      if (programSubtype === 'triathlon') {
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">🏊 Triathlon Details</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Race Distance</label>
              <div className="space-y-2">
                {TRIATHLON_DISTANCES.map((dist) => (
                  <button
                    key={dist.id}
                    onClick={() => updateFormData('triathlonDistance', dist.id)}
                    className={`w-full p-3 rounded-lg border text-left ${
                      formData.triathlonDistance === dist.id
                        ? 'bg-accent-primary/20 border-accent-primary'
                        : 'bg-dark-700 border-dark-500'
                    }`}
                  >
                    <span className="text-white font-medium">{dist.label}</span>
                    <p className="text-xs text-gray-400 mt-1">{dist.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Race Date</label>
              <input
                type="date"
                value={formData.raceDate}
                min={getTodayString()}
                onChange={(e) => updateFormData('raceDate', e.target.value)}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target Finish Time</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="number"
                    value={formData.targetFinishHours}
                    onChange={(e) => updateFormData('targetFinishHours', e.target.value)}
                    placeholder="Hours"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
                  />
                  <span className="text-xs text-gray-500">Hours</span>
                </div>
                <div>
                  <input
                    type="number"
                    value={formData.targetFinishMinutes}
                    onChange={(e) => updateFormData('targetFinishMinutes', e.target.value)}
                    placeholder="Min"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
                  />
                  <span className="text-xs text-gray-500">Minutes</span>
                </div>
                <div>
                  <input
                    type="number"
                    value={formData.targetFinishSeconds}
                    onChange={(e) => updateFormData('targetFinishSeconds', e.target.value)}
                    placeholder="Sec"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
                  />
                  <span className="text-xs text-gray-500">Seconds</span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Other endurance (cycling, swimming)
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">🚴 Endurance Goals</h3>
          <p className="text-sm text-gray-400">Set your performance targets</p>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Event Date (Optional)
            </label>
            <input
              type="date"
              value={formData.raceDate}
              min={getTodayString()}
              onChange={(e) => updateFormData('raceDate', e.target.value)}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Weekly Training Volume Goal
            </label>
            <input
              type="text"
              value={formData.currentWeeklyMileage}
              onChange={(e) => updateFormData('currentWeeklyMileage', e.target.value)}
              placeholder="e.g., 100 miles, 10 hours"
              className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
            />
          </div>
        </div>
      );
    }

    // Aesthetic goals - body fat target (current BF% already collected in body stats)
    if (programType === 'aesthetic') {
      const currentBF = parseFloat(formData.bodyFatPercent) || 0;
      const targetBF = parseFloat(formData.targetBodyFat) || 0;
      const bfDifference = currentBF - targetBF;

      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">💪 Physique Goals</h3>
          <p className="text-sm text-gray-400">Set your body composition targets</p>

          {/* Show current BF from body stats if entered */}
          {formData.bodyFatPercent && (
            <div className="p-3 bg-dark-700/50 rounded-lg border border-dark-600">
              <p className="text-sm text-gray-400">
                Current Body Fat: <span className="text-white font-medium">{formData.bodyFatPercent}%</span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Body Fat %
            </label>
            <input
              type="number"
              value={formData.targetBodyFat}
              onChange={(e) => updateFormData('targetBodyFat', e.target.value)}
              placeholder="e.g., 12"
              min="5"
              max="50"
              className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Recommended: 10-15% for men, 18-24% for women for a lean physique
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Date (Optional)
            </label>
            <input
              type="date"
              value={formData.aestheticGoalDate}
              min={getTodayString()}
              onChange={(e) => updateFormData('aestheticGoalDate', e.target.value)}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white"
            />
          </div>

          {currentBF > 0 && targetBF > 0 && bfDifference > 0 && (
            <div className="p-4 bg-dark-700 rounded-lg">
              <p className="text-white">
                📊 You're looking to reduce body fat by{' '}
                <span className="text-accent-primary font-bold">
                  {bfDifference.toFixed(1)}%
                </span>
              </p>
            </div>
          )}

          {/* Program Start Date */}
          <div className="pt-4 border-t border-dark-600">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Program Start Date
            </label>
            <input
              type="date"
              value={formData.programStartDate || ''}
              min={getTodayString()}
              onChange={(e) => updateFormData('programStartDate', e.target.value)}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Leave blank to start today</p>
          </div>

          {/* Recomp Strategy Info */}
          <div className="p-4 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-lg border border-accent-primary/20">
            <h4 className="text-white font-medium mb-2">🔄 Recomp Strategy</h4>
            <p className="text-sm text-gray-300">
              Your nutrition is set to <span className="text-accent-primary font-medium">recomp</span> (body recomposition).
              This means eating at maintenance with high protein, slightly lower on rest days,
              and slightly higher on training days to maximize muscle gain while losing fat.
            </p>
          </div>

          {/* Secondary Cardio Option */}
          <div className="pt-4 border-t border-dark-600">
            <h4 className="text-white font-semibold mb-2">🫀 Add Cardio for Heart Health?</h4>
            <p className="text-sm text-gray-400 mb-4">
              Light cardio improves cardiovascular health and can help with fat loss without
              impacting your muscle-building goals.
            </p>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => updateFormData('includeCardio', !formData.includeCardio)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  formData.includeCardio ? 'bg-accent-primary' : 'bg-dark-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    formData.includeCardio ? 'left-6' : 'left-0.5'
                  }`}
                />
              </button>
              <span className="text-white">Include cardio in my program</span>
            </div>

            {formData.includeCardio && (
              <div className="space-y-4 p-4 bg-dark-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cardio Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SECONDARY_CARDIO_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => updateFormData('cardioType', option.id)}
                        className={`p-3 rounded-lg border text-center ${
                          formData.cardioType === option.id
                            ? 'bg-accent-primary/20 border-accent-primary'
                            : 'bg-dark-600 border-dark-500'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{option.icon}</span>
                        <span className="text-white text-sm">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Days per Week
                  </label>
                  <div className="flex gap-2">
                    {[2, 3].map((days) => (
                      <button
                        key={days}
                        onClick={() => updateFormData('cardioDaysPerWeek', days)}
                        className={`flex-1 py-2 rounded-lg border ${
                          formData.cardioDaysPerWeek === days
                            ? 'bg-accent-primary/20 border-accent-primary text-white'
                            : 'bg-dark-600 border-dark-500 text-gray-400'
                        }`}
                      >
                        {days} days
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Cardio sessions will be scheduled on rest days or as double days
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Fat Loss
    if (programType === 'fatloss') {
      const currentWeight = parseFloat(formData.weight) || 0;
      const targetWeight = parseFloat(formData.targetWeight) || currentWeight;
      const weightToLose = currentWeight - targetWeight;
      const weeksNeeded = weightToLose / formData.weeklyWeightChange;

      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">⚖️ Fat Loss Goals</h3>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Weight ({formData.weightUnit})
            </label>
            <input
              type="number"
              value={formData.targetWeight}
              onChange={(e) => updateFormData('targetWeight', e.target.value)}
              placeholder="Enter target weight"
              className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Weekly Weight Loss Rate: {formData.weeklyWeightChange} lbs/week
            </label>
            <input
              type="range"
              min="0.25"
              max="1"
              step="0.25"
              value={formData.weeklyWeightChange}
              onChange={(e) => updateFormData('weeklyWeightChange', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Slow (0.25)</span>
              <span>Moderate (0.5)</span>
              <span>Aggressive (1.0)</span>
            </div>
          </div>

          {weightToLose > 0 && (
            <div className="p-4 bg-dark-700 rounded-lg">
              <p className="text-white">
                📊 At this rate, you'll reach your goal in approximately{' '}
                <span className="text-accent-primary font-bold">{Math.ceil(weeksNeeded)} weeks</span>
              </p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Goal Details</h2>
        <p className="text-gray-400">Help us tailor your program to your specific targets.</p>
      </div>

      {renderGoalInputs()}

      {/* Strength Goal Error */}
      {strengthGoalError && programType === 'strength' && (
        <div className="mt-4 p-4 bg-accent-danger/10 border border-accent-danger/30 rounded-xl">
          <h4 className="text-accent-danger font-semibold mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Unrealistic Goals Detected
          </h4>
          <p className="text-sm text-text-secondary whitespace-pre-line">{strengthGoalError}</p>
          <p className="text-xs text-text-muted mt-3">
            MOTUS cannot produce a plan with unrealistic goals. Please adjust your targets or extend your timeline.
          </p>
        </div>
      )}

      {/* Program Start Date */}
      <div className="pt-6 border-t border-dark-600">
        <h3 className="text-lg font-semibold text-white mb-4">📅 Program Start Date</h3>
        <p className="text-sm text-text-secondary mb-3">
          When would you like to begin your program?
        </p>
        <input
          type="date"
          value={formData.programStartDate}
          min={getTodayString()}
          onChange={(e) => updateFormData('programStartDate', e.target.value)}
          className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white"
        />
        <p className="text-xs text-text-muted mt-2">
          Leave blank to start today
        </p>
      </div>

      {/* Nutrition Goal - Auto-set to recomp for aesthetic programs */}
      <div className="pt-6 border-t border-dark-600">
        <h3 className="text-lg font-semibold text-white mb-4">🍎 Nutrition Goal</h3>

        {/* Aesthetic programs: Lock to recomp with explanation */}
        {programType === 'aesthetic' ? (
          <div className="space-y-3">
            <div className="p-4 bg-accent-primary/20 border border-accent-primary rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white font-medium">Body Recomposition</span>
                <span className="px-2 py-0.5 text-xs bg-accent-primary/30 text-accent-primary rounded">Optimal for Aesthetics</span>
              </div>
              <p className="text-sm text-gray-300">
                Simultaneously lose fat while building/maintaining muscle through strategic nutrition timing and macros.
              </p>
            </div>
            <div className="p-3 bg-dark-700 rounded-lg">
              <p className="text-xs text-gray-400">
                <strong className="text-gray-300">Recomp Strategy:</strong> Eat at maintenance calories with high protein (1g/lb bodyweight).
                Slight deficit on rest days, slight surplus on training days. This approach maximizes muscle retention while losing fat.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'maintain', label: 'Maintain', desc: 'Keep current weight' },
              { id: 'recomp', label: 'Recomp', desc: 'Lose fat, keep muscle' },
              { id: 'lose', label: 'Lose Weight', desc: 'Calorie deficit' },
              { id: 'gain', label: 'Gain Weight', desc: 'Calorie surplus' },
            ].map((goal) => (
              <button
                key={goal.id}
                onClick={() => updateFormData('nutritionGoal', goal.id)}
                className={`p-3 rounded-lg border text-left ${
                  formData.nutritionGoal === goal.id
                    ? 'bg-accent-primary/20 border-accent-primary'
                    : 'bg-dark-700 border-dark-500'
                }`}
              >
                <span className="text-white font-medium">{goal.label}</span>
                <p className="text-xs text-gray-400">{goal.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Recomp explanation for non-aesthetic programs when recomp is selected */}
        {programType !== 'aesthetic' && formData.nutritionGoal === 'recomp' && (
          <div className="mt-3 p-3 bg-dark-700 rounded-lg">
            <p className="text-xs text-gray-400">
              <strong className="text-gray-300">Recomp Strategy:</strong> Eat at maintenance with high protein (1g/lb bodyweight).
              Slight deficit on rest days, slight surplus on training days.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Step 5: Vacations
function StepVacations({ formData, addVacation, updateVacation, removeVacation }) {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Vacations & Time Off</h2>
        <p className="text-gray-400">
          Add planned time off so we can align deload weeks and adjust your program.
        </p>
      </div>

      {formData.vacations.length > 0 && (
        <div className="space-y-3">
          {formData.vacations.map((vacation, idx) => (
            <div
              key={vacation.id}
              className="p-4 bg-dark-700 rounded-lg border border-dark-600"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Trip #{idx + 1}</span>
                <button
                  onClick={() => removeVacation(vacation.id)}
                  className="p-1 text-gray-500 hover:text-accent-danger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                value={vacation.name}
                onChange={(e) => updateVacation(vacation.id, 'name', e.target.value)}
                placeholder="Trip name"
                className="w-full px-3 py-2 mb-3 bg-dark-600 border border-dark-500 rounded-lg text-white text-sm placeholder-gray-500"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-text-muted">Start Date</label>
                  <input
                    type="date"
                    value={vacation.startDate}
                    min={getTodayString()}
                    onChange={(e) => updateVacation(vacation.id, 'startDate', e.target.value)}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted">End Date</label>
                  <input
                    type="date"
                    value={vacation.endDate}
                    min={vacation.startDate || getTodayString()}
                    onChange={(e) => updateVacation(vacation.id, 'endDate', e.target.value)}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={addVacation}
        className="w-full p-4 border-2 border-dashed border-dark-500 rounded-lg hover:border-accent-primary transition-colors flex items-center justify-center gap-2 text-gray-400 hover:text-white"
      >
        <Plus className="w-5 h-5" />
        Add Time Off
      </button>
    </div>
  );
}

// Step 6: Generate
function StepGenerate({ formData, isGenerating, onGenerate }) {
  const programType = PROGRAM_TYPES.find((p) => p.id === formData.programType);
  const subtype = programType?.subtypes.find((s) => s.id === formData.programSubtype);

  const getGoalSummary = () => {
    if (formData.programType === 'endurance' && formData.raceDate) {
      const raceDate = new Date(formData.raceDate);
      const today = new Date();
      const weeks = Math.ceil((raceDate - today) / (7 * 24 * 60 * 60 * 1000));
      const time = [formData.targetFinishHours, formData.targetFinishMinutes, formData.targetFinishSeconds]
        .filter(Boolean).join(':');
      return `${weeks} weeks to race day${time ? ` • Target: ${time}` : ''}`;
    }
    if (formData.programType === 'strength') {
      const goals = (formData.strengthGoals || []).filter(g => g.target1RM && g.current1RM);
      return `${goals.length} lift targets set`;
    }
    if (formData.programType === 'aesthetic' && formData.targetBodyFat) {
      return `Target: ${formData.targetBodyFat}% body fat`;
    }
    if (formData.programType === 'fatloss' && formData.targetWeight) {
      const weeks = Math.ceil((parseFloat(formData.weight) - parseFloat(formData.targetWeight)) / formData.weeklyWeightChange);
      return `~${weeks} weeks to ${formData.targetWeight} ${formData.weightUnit}`;
    }
    return 'Ongoing optimization';
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Ready to Generate</h2>
        <p className="text-gray-400">Your AI-powered program will be optimized for your goals.</p>
      </div>

      <div className="bg-dark-800 rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-white">Your Profile Summary</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Name</span>
            <p className="text-white font-medium">{formData.name}</p>
          </div>
          <div>
            <span className="text-gray-400">Stats</span>
            <p className="text-white font-medium">
              {formData.weight} {formData.weightUnit} • {formData.heightFeet}'{formData.heightInches}"
            </p>
          </div>
        </div>

        <hr className="border-dark-600" />

        <div>
          <span className="text-gray-400 text-sm">Primary Goal</span>
          <p className="text-white font-medium">
            {programType?.icon} {programType?.title}: {subtype?.label}
          </p>
        </div>

        <div>
          <span className="text-gray-400 text-sm">Goal</span>
          <p className="text-accent-primary font-medium">{getGoalSummary()}</p>
        </div>

        <div>
          <span className="text-gray-400 text-sm">Training Schedule</span>
          <p className="text-white font-medium">{formData.desiredTrainingDays} days/week</p>
        </div>

        {formData.enableHybrid && formData.secondaryProgramType && (
          <div>
            <span className="text-gray-400 text-sm">Secondary Goal</span>
            <p className="text-white font-medium">
              {PROGRAM_TYPES.find((p) => p.id === formData.secondaryProgramType)?.icon}{' '}
              {formData.secondarySubtype}
            </p>
          </div>
        )}

        <div>
          <span className="text-gray-400 text-sm">Program Features</span>
          <ul className="text-sm text-white mt-1 space-y-1">
            <li>✓ Auto-periodization (Base → Build → Peak)</li>
            <li>✓ Progressive overload built-in</li>
            <li>✓ Deload weeks every 5 weeks</li>
            <li>✓ Dynamic adjustments based on progress</li>
          </ul>
        </div>
      </div>

      <Button
        fullWidth
        size="lg"
        onClick={onGenerate}
        disabled={isGenerating}
        className={isGenerating ? 'animate-pulse' : ''}
      >
        {isGenerating ? (
          <>
            <span className="animate-spin mr-2">⚡</span>
            Generating Your Program...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Generate My Program
          </>
        )}
      </Button>
    </div>
  );
}

function generateFallbackProgram(formData) {
  // Use the comprehensive program generator with error handling
  try {
    console.log('Generating fallback program with formData:', formData);
    const program = generateProgramLocal(formData);
    if (!program || !program.weeklySchedule) {
      console.error('Fallback program generation returned invalid program:', program);
      throw new Error('Invalid program generated');
    }
    return program;
  } catch (error) {
    console.error('Error in generateFallbackProgram:', error);
    // Return a minimal valid program structure to prevent crashes
    return {
      name: `${formData.programType || 'Fitness'} Program`,
      description: 'Your personalized training program',
      mesocycleWeeks: 4,
      currentWeek: 1,
      currentPhase: 'Base',
      phases: ['Base', 'Build', 'Peak', 'Deload'],
      primaryGoal: formData.programType || 'strength',
      primarySubtype: formData.programSubtype || 'general',
      daysPerWeek: formData.desiredTrainingDays || 4,
      weeklySchedule: [
        { day: 1, dayName: 'Monday', name: 'Training Day 1', isRestDay: false, isDeload: false, sessions: [] },
        { day: 2, dayName: 'Tuesday', name: 'Training Day 2', isRestDay: false, isDeload: false, sessions: [] },
        { day: 3, dayName: 'Wednesday', name: 'Rest Day', isRestDay: true, isDeload: false, sessions: [] },
        { day: 4, dayName: 'Thursday', name: 'Training Day 3', isRestDay: false, isDeload: false, sessions: [] },
        { day: 5, dayName: 'Friday', name: 'Training Day 4', isRestDay: false, isDeload: false, sessions: [] },
        { day: 6, dayName: 'Saturday', name: 'Rest Day', isRestDay: true, isDeload: false, sessions: [] },
        { day: 7, dayName: 'Sunday', name: 'Rest Day', isRestDay: true, isDeload: false, sessions: [] },
      ],
      generatedAt: new Date().toISOString(),
      error: 'Program generation failed - using minimal template',
    };
  }
}

// Wrapped export with error boundary
function SetupWizardWithErrorBoundary(props) {
  return (
    <SetupErrorBoundary>
      <SetupWizard {...props} />
    </SetupErrorBoundary>
  );
}

export { SetupWizardWithErrorBoundary as SetupWizard };
export default SetupWizardWithErrorBoundary;
