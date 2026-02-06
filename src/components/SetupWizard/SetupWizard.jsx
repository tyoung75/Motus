import React, { useState, useEffect, useCallback, useRef, Component } from 'react';
import { ChevronRight, ChevronLeft, User, Target, Dumbbell, Scale, Sparkles, Calendar, Plane, Plus, Trash2 } from 'lucide-react';
import { Button } from '../shared';
import { calculateBMR, calculateTDEE, calculateMacros } from '../../utils/calculations';
import { useAuth } from '../../context/AuthContext';
import { generateProgram as generateProgramLocal } from '../../utils/programGenerator';
import { StrengthGoalsForm } from './StrengthGoalsForm';

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

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Body Stats', icon: Scale },
  { id: 3, title: 'Primary Goal', icon: Target },
  { id: 4, title: 'Goal Details', icon: Dumbbell },
  { id: 5, title: 'Time Off', icon: Plane },
  { id: 6, title: 'Generate', icon: Sparkles },
];

// MECE Program categories (Fat Loss removed - handled via nutrition goal)
const PROGRAM_TYPES = [
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

    // Training preferences
    sessionDuration: 60,
    equipment: 'full',
    programStartDate: '', // When the program should begin

    // Nutrition Goal
    nutritionGoal: 'maintain',

    // Vacations
    vacations: [],
  });

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

  // Auto-populate name from Google account
  useEffect(() => {
    if (user && !formData.name) {
      updateFormData('name', user.user_metadata?.full_name || user.email?.split('@')[0] || '');
    }
  }, [user]);

  const handleNext = () => {
    if (currentStep < 6) {
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
    const bmr = calculateBMR(weightKg, heightCm, parseInt(safeFormData.age), safeFormData.sex);
    const activityMultiplier = getActivityMultiplier(safeFormData.desiredTrainingDays);
    const tdee = Math.round(bmr * activityMultiplier);
    const macros = calculateSmartMacros(tdee, safeFormData, parseFloat(safeFormData.weight));

    const profileData = {
      ...safeFormData,
      weightKg,
      heightCm,
      bmr,
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
    switch (currentStep) {
      case 1:
        return formData.name && formData.age && formData.sex;
      case 2:
        const hasWeight = formData.weight;
        const hasHeight = formData.heightUnit === 'metric'
          ? formData.heightCm
          : (formData.heightFeet && formData.heightInches);
        return hasWeight && hasHeight;
      case 3:
        return formData.programType && formData.programSubtype && formData.desiredTrainingDays;
      case 4:
        return validateGoalDetails();
      case 5:
        return true;
      default:
        return true;
    }
  };

  // Pure validation function - NO state updates! Called during render.
  const validateGoalDetails = () => {
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
        {currentStep === 1 && (
          <StepPersonalInfo
            formData={formData}
            updateFormData={updateFormData}
            user={user}
            signInWithGoogle={signInWithGoogle}
            isAuthenticated={isAuthenticated}
            isConfigured={isConfigured}
          />
        )}
        {currentStep === 2 && (
          <StepBodyStats formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 3 && (
          <StepPrimaryGoal formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 4 && (
          <StepGoalDetails
            formData={formData}
            updateFormData={updateFormData}
            updateStrengthGoal={updateStrengthGoal}
            strengthGoalError={strengthGoalError}
          />
        )}
        {currentStep === 5 && (
          <StepVacations
            formData={formData}
            addVacation={addVacation}
            updateVacation={updateVacation}
            removeVacation={removeVacation}
          />
        )}
        {currentStep === 6 && (
          <StepGenerate
            formData={formData}
            isGenerating={isGenerating}
            onGenerate={handleGenerateProgram}
          />
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
        {currentStep < 6 ? (
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
    </div>
  );
}

function getActivityMultiplier(daysPerWeek) {
  if (daysPerWeek <= 1) return 1.2;
  if (daysPerWeek <= 2) return 1.375;
  if (daysPerWeek <= 3) return 1.55;
  if (daysPerWeek <= 5) return 1.725;
  return 1.9;
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

// Step 1: Personal Info
function StepPersonalInfo({ formData, updateFormData, user, signInWithGoogle, isAuthenticated, isConfigured }) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState(null);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setSignInError(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Sign in error:', error);
        setSignInError(error.message || 'Failed to sign in. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected sign in error:', err);
      setSignInError('An unexpected error occurred. Please try again.');
    }
    setIsSigningIn(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Let's get to know you</h2>
        <p className="text-gray-400">Tell us about yourself to personalize your experience.</p>
      </div>

      {isConfigured && (
        <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div className="flex-1">
                <p className="text-white font-medium">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Signed in • Data syncs across devices
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-400 mb-3">
                Sign in to sync your data across all your devices
              </p>
              {signInError && (
                <div className="mb-3 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-sm text-red-400">{signInError}</p>
                  <p className="text-xs text-red-500 mt-1">
                    Note: Google sign-in requires proper Supabase configuration. You can skip this and use the app offline.
                  </p>
                </div>
              )}
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {isSigningIn ? 'Signing in...' : 'Continue with Google'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
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
          <label className="block text-sm font-medium text-gray-300 mb-2">Sex</label>
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
      </div>
    </div>
  );
}

// Step 2: Body Stats
function StepBodyStats({ formData, updateFormData }) {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Body Measurements</h2>
        <p className="text-gray-400">Help us understand your current fitness level.</p>
      </div>

      <div className="space-y-5">
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

// Step 3: Primary Goal
function StepPrimaryGoal({ formData, updateFormData }) {
  const selectedProgram = PROGRAM_TYPES.find((p) => p.id === formData.programType);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">What's your primary goal?</h2>
        <p className="text-gray-400">Choose your main training focus.</p>
      </div>

      {/* Program Type Selection */}
      <div className="grid grid-cols-2 gap-4">
        {PROGRAM_TYPES.map((program) => (
          <button
            key={program.id}
            onClick={() => {
              updateFormData('programType', program.id);
              updateFormData('programSubtype', '');
              // Clear hybrid settings for strength and aesthetic (not supported)
              if (program.id === 'strength' || program.id === 'aesthetic') {
                updateFormData('enableHybrid', false);
                updateFormData('secondaryProgramType', '');
                updateFormData('secondarySubtype', '');
                updateFormData('allowDoubleDays', false);
              }
              // Auto-set nutrition goal to recomp for aesthetic programs
              if (program.id === 'aesthetic') {
                updateFormData('nutritionGoal', 'recomp');
              }
            }}
            className={`p-4 rounded-xl border text-left transition-all ${
              formData.programType === program.id
                ? 'bg-accent-primary/20 border-accent-primary'
                : 'bg-dark-700 border-dark-500 hover:border-gray-400'
            }`}
          >
            <span className="text-3xl mb-2 block">{program.icon}</span>
            <h3 className="text-lg font-semibold text-white">{program.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{program.description}</p>
          </button>
        ))}
      </div>

      {/* Subtype Selection */}
      {selectedProgram && (
        <div className="mt-6">
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
        </div>
      )}

      {/* Training Days - Moved here */}
      {formData.programSubtype && (
        <div className="mt-6 p-4 bg-dark-800 rounded-xl border border-dark-600">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            How many days per week do you want to workout? <span className="text-accent-primary font-bold">{formData.desiredTrainingDays} days</span>
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

      {/* Triathlon Auto-Hybrid Notice */}
      {formData.programSubtype === 'triathlon' && (
        <div className="mt-6 p-4 bg-accent-primary/10 rounded-xl border border-accent-primary/30">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏊</span>
            <div>
              <h3 className="text-accent-primary font-semibold mb-1">Triathlon Program Includes:</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>✓ Swim, Bike, Run periodization with brick workouts</li>
                <li>✓ Double & triple day sessions built in</li>
                <li>✓ Injury prevention strength work (not hypertrophy)</li>
                <li>✓ Race-specific taper and nutrition timing</li>
              </ul>
              <p className="text-xs text-gray-400 mt-2">
                Based on professional triathlon training methodology. Minimum 5 training days recommended.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hybrid Training Option - ONLY for endurance programs (not triathlon, strength, or aesthetic) */}
      {formData.programSubtype &&
       formData.programType === 'endurance' &&
       formData.programSubtype !== 'triathlon' && (
        <div className="mt-6 p-4 bg-dark-800 rounded-xl border border-dark-600">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-medium">Enable Hybrid Training?</h3>
              <p className="text-sm text-gray-400">Add a secondary goal to your program</p>
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
            <div className="space-y-4 pt-4 border-t border-dark-600">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Secondary Program Type
                </label>
                <select
                  value={formData.secondaryProgramType}
                  onChange={(e) => {
                    updateFormData('secondaryProgramType', e.target.value);
                    updateFormData('secondarySubtype', '');
                  }}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white"
                >
                  <option value="">Select...</option>
                  {PROGRAM_TYPES.filter((p) => p.id !== formData.programType).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {formData.secondaryProgramType && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Secondary Focus
                  </label>
                  <select
                    value={formData.secondarySubtype}
                    onChange={(e) => updateFormData('secondarySubtype', e.target.value)}
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white"
                  >
                    <option value="">Select...</option>
                    {PROGRAM_TYPES.find((p) => p.id === formData.secondaryProgramType)?.subtypes
                      ?.filter((s) => s.id !== 'triathlon') // Triathlon can ONLY be primary focus
                      ?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg">
                <input
                  type="checkbox"
                  id="doubleDays"
                  checked={formData.allowDoubleDays}
                  onChange={(e) => updateFormData('allowDoubleDays', e.target.checked)}
                  className="w-5 h-5 rounded border-dark-500 text-accent-primary focus:ring-accent-primary"
                />
                <label htmlFor="doubleDays" className="text-sm text-gray-300">
                  <span className="font-medium text-white">Allow double days</span>
                  <br />
                  <span className="text-gray-400">AM: Primary goal • PM: Secondary goal</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/// Step 4: Goal Details
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
          experienceLevel={getExperienceLevel()}
          onUpdateGoal={updateStrengthGoal}
          onUpdateDate={(value) => updateFormData('strengthGoalDate', value)}
          onUpdateStartDate={(value) => updateFormData('programStartDate', value)}
        />

        {strengthGoalError && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-xl">
            <h4 className="text-red-400 font-semibold mb-2">Unrealistic Goals Detected</h4>
            <p className="text-sm text-gray-300 whitespace-pre-line">{strengthGoalError}</p>
          </div>
        )}

        {/* Nutrition Goal */}
        <div className="pt-6 border-t border-dark-600">
          <h3 className="text-lg font-semibold text-white mb-4">🍎 Nutrition Goal</h3>
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
                  safeFormData.nutritionGoal === goal.id
                    ? 'bg-accent-primary/20 border-accent-primary'
                    : 'bg-dark-700 border-dark-500'
                }`}
              >
                <span className="text-white font-medium">{goal.label}</span>
                <p className="text-xs text-gray-400">{goal.desc}</p>
              </button>
            ))}
          </div>
        </div>

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
      const goals = (formData.strengthGoals || []).filter(g => g.target);
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
