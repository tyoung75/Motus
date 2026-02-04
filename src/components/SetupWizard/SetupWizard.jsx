import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, User, Target, Dumbbell, Scale, Sparkles, Calendar, Plane, Plus, Trash2 } from 'lucide-react';
import { Button } from '../shared';
import { calculateBMR, calculateTDEE, calculateMacros } from '../../utils/calculations';
import { useAuth } from '../../context/AuthContext';

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Body Stats', icon: Scale },
  { id: 3, title: 'Primary Goal', icon: Target },
  { id: 4, title: 'Goal Details', icon: Dumbbell },
  { id: 5, title: 'Time Off', icon: Plane },
  { id: 6, title: 'Generate', icon: Sparkles },
];

// Restructured program categories - Performance vs Aesthetic focused
const PROGRAM_TYPES = [
  {
    id: 'performance',
    title: 'Performance',
    description: 'Focus on athletic performance - speed, strength, endurance',
    icon: '🏆',
    category: 'performance',
    subtypes: [
      { id: 'running', label: 'Running' },
      { id: 'marathon', label: 'Marathon/Race Training' },
      { id: 'cycling', label: 'Cycling' },
      { id: 'swimming', label: 'Swimming' },
      { id: 'triathlon', label: 'Triathlon' },
      { id: 'powerlifting', label: 'Powerlifting' },
      { id: 'olympic', label: 'Olympic Lifting' },
    ],
  },
  {
    id: 'aesthetic',
    title: 'Aesthetic',
    description: 'Focus on physique - muscle building and body composition',
    icon: '💪',
    category: 'aesthetic',
    subtypes: [
      { id: 'hypertrophy', label: 'Hypertrophy/Bodybuilding' },
      { id: 'lean-muscle', label: 'Lean Muscle Building' },
      { id: 'toning', label: 'Muscle Toning' },
    ],
  },
  {
    id: 'fatloss',
    title: 'Fat Loss',
    description: 'Focused on losing fat while preserving muscle',
    icon: '⚖️',
    subtypes: [
      { id: 'aggressive', label: 'Aggressive (1lb/week)' },
      { id: 'moderate', label: 'Moderate (0.5lb/week)' },
      { id: 'slow', label: 'Slow & Steady (0.25lb/week)' },
    ],
  },
  {
    id: 'general',
    title: 'General Health',
    description: 'Overall fitness, wellness, and healthy lifestyle',
    icon: '❤️',
    subtypes: [
      { id: 'wellness', label: 'General Wellness' },
      { id: 'mobility', label: 'Mobility & Flexibility' },
      { id: 'functional', label: 'Functional Fitness' },
      { id: 'active', label: 'Stay Active' },
    ],
  },
];

// Race distances for endurance goals
const RACE_DISTANCES = [
  { id: '5k', label: '5K', miles: 3.1 },
  { id: '10k', label: '10K', miles: 6.2 },
  { id: 'half', label: 'Half Marathon', miles: 13.1 },
  { id: 'full', label: 'Full Marathon', miles: 26.2 },
  { id: 'ultra', label: 'Ultra Marathon', miles: 50 },
];

export function SetupWizard({ onComplete }) {
  const { user, signInWithGoogle, isAuthenticated, isConfigured } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    // Personal
    name: '',
    age: '',
    sex: 'male',

    // Body stats - updated height format
    weight: '',
    weightUnit: 'lbs',
    heightFeet: '',
    heightInches: '',
    heightUnit: 'imperial', // imperial (ft/in) or metric (cm)
    heightCm: '',
    bodyFatPercent: '',

    // Training history - NEW
    currentTrainingDays: 3, // How many days they currently train
    desiredTrainingDays: 4, // How many days they want to train
    trainingHistory: 'some', // none, some, consistent
    yearsTraining: 1,

    // Primary Goal
    programType: '',
    programSubtype: '',

    // Goal-specific details
    // Marathon/Race
    raceDistance: '',
    targetFinishTime: '',
    raceDate: '',
    currentWeeklyMileage: '',

    // Strength
    currentBench: '',
    targetBench: '',
    currentSquat: '',
    targetSquat: '',
    currentDeadlift: '',
    targetDeadlift: '',
    currentOHP: '',
    targetOHP: '',

    // Fat Loss
    targetWeight: '',
    targetDate: '',

    // General - multi-select
    focusAreas: [],

    // Hybrid/Secondary Goal
    enableHybrid: false,
    secondaryProgramType: '',
    secondarySubtype: '',
    allowDoubleDays: false,

    // Training preferences
    sessionDuration: 60,
    equipment: 'full',

    // Nutrition Goal
    nutritionGoal: 'maintain', // maintain, recomp, lose, gain
    weeklyWeightChange: 0.5, // lbs per week for lose/gain

    // Vacations
    vacations: [],
  });

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      startDate: '',
      endDate: '',
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

  // Convert height to cm for calculations
  const getHeightCm = () => {
    if (formData.heightUnit === 'metric') {
      return parseFloat(formData.heightCm) || 0;
    }
    const feet = parseFloat(formData.heightFeet) || 0;
    const inches = parseFloat(formData.heightInches) || 0;
    return (feet * 12 + inches) * 2.54;
  };

  const generateProgram = async () => {
    setIsGenerating(true);

    // Convert weight to kg for calculations
    const weightKg = formData.weightUnit === 'lbs'
      ? parseFloat(formData.weight) * 0.453592
      : parseFloat(formData.weight);

    const heightCm = getHeightCm();

    const bmr = calculateBMR(weightKg, heightCm, parseInt(formData.age), formData.sex);

    // Use desired training days for activity level
    const activityMultiplier = getActivityMultiplier(formData.desiredTrainingDays);
    const tdee = Math.round(bmr * activityMultiplier);

    // Calculate macros based on nutrition goal
    const macros = calculateSmartMacros(tdee, formData, parseFloat(formData.weight));

    try {
      const response = await fetch('/api/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: formData,
          macros,
          bmr,
          tdee,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate program');
      }

      const program = await response.json();

      onComplete({
        profile: {
          ...formData,
          weightKg,
          heightCm,
          bmr,
          tdee,
          macros,
        },
        program,
      });
    } catch (error) {
      console.error('Error generating program:', error);
      const fallbackProgram = generateFallbackProgram(formData);
      onComplete({
        profile: {
          ...formData,
          weightKg,
          heightCm,
          bmr,
          tdee,
          macros,
        },
        program: fallbackProgram,
      });
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
        return formData.programType && formData.programSubtype;
      case 4:
        return validateGoalDetails();
      case 5:
        return true; // Vacations are optional
      default:
        return true;
    }
  };

  const validateGoalDetails = () => {
    if (formData.programType === 'performance' && formData.programSubtype === 'marathon') {
      return formData.raceDistance && formData.raceDate;
    }
    if (formData.programType === 'performance' && formData.programSubtype === 'powerlifting') {
      return formData.currentSquat && formData.targetSquat;
    }
    if (formData.programType === 'fatloss') {
      return formData.targetWeight;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-dark-700">
        <h1 className="text-2xl font-bold gradient-text">MOTUS</h1>
        <p className="text-gray-400 text-sm">Setup your personalized training program</p>
      </header>

      {/* Progress */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${currentStep >= step.id
                      ? 'bg-accent-primary text-white'
                      : 'bg-dark-700 text-gray-500'
                    }
                  `}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${
                  currentStep >= step.id ? 'text-white' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                    currentStep > step.id ? 'bg-accent-primary' : 'bg-dark-700'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
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
          <StepGoalDetails formData={formData} updateFormData={updateFormData} />
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
            onGenerate={generateProgram}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 border-t border-dark-700 flex justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </Button>
        {currentStep < 6 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// Activity multiplier based on training days
function getActivityMultiplier(daysPerWeek) {
  if (daysPerWeek <= 1) return 1.2;
  if (daysPerWeek <= 2) return 1.375;
  if (daysPerWeek <= 3) return 1.55;
  if (daysPerWeek <= 5) return 1.725;
  return 1.9;
}

// Smart macro calculation based on nutrition goal
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

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    const { error } = await signInWithGoogle();
    if (error) {
      console.error('Sign in error:', error);
    }
    setIsSigningIn(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Let's get to know you</h2>
        <p className="text-gray-400">Tell us about yourself to personalize your experience.</p>
      </div>

      {/* Google Sign In */}
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

// Step 2: Body Stats - Updated with new fields
function StepBodyStats({ formData, updateFormData }) {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Body Measurements & Training</h2>
        <p className="text-gray-400">Help us understand where you are and where you want to be.</p>
      </div>

      <div className="space-y-5">
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

        {/* Height - Feet and Inches */}
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
              <div className="flex-1">
                <input
                  type="number"
                  value={formData.heightFeet}
                  onChange={(e) => updateFormData('heightFeet', e.target.value)}
                  placeholder="Feet"
                  min="3"
                  max="8"
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={formData.heightInches}
                  onChange={(e) => updateFormData('heightInches', e.target.value)}
                  placeholder="Inches"
                  min="0"
                  max="11"
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
            </div>
          ) : (
            <input
              type="number"
              value={formData.heightCm}
              onChange={(e) => updateFormData('heightCm', e.target.value)}
              placeholder="Height in cm"
              className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          )}
        </div>

        {/* Body Fat - Optional */}
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
            className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        {/* Training History Section */}
        <div className="pt-4 border-t border-dark-600">
          <h3 className="text-lg font-semibold text-white mb-4">Training History</h3>

          {/* Current Training Frequency - Slider */}
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
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
              <span>7</span>
            </div>
          </div>

          {/* Desired Training Frequency - Slider */}
          <div className="mb-5">
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
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
              <span>7</span>
            </div>
          </div>

          {/* Training Consistency */}
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

          {/* Years Training */}
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

// Step 3: Primary Goal - Restructured
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
            {program.category && (
              <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                program.category === 'performance'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-purple-500/20 text-purple-400'
              }`}>
                {program.category === 'performance' ? 'Performance Focus' : 'Aesthetic Focus'}
              </span>
            )}
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

      {/* Hybrid Training Option */}
      {formData.programSubtype && (
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
                    {PROGRAM_TYPES.find((p) => p.id === formData.secondaryProgramType)?.subtypes.map(
                      (s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      )
                    )}
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

// Step 4: Goal Details
function StepGoalDetails({ formData, updateFormData }) {
  const renderGoalInputs = () => {
    // Marathon/Race Training
    if (formData.programType === 'performance' && formData.programSubtype === 'marathon') {
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Race Date</label>
            <input
              type="date"
              value={formData.raceDate}
              onChange={(e) => updateFormData('raceDate', e.target.value)}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Finish Time (optional)
            </label>
            <input
              type="text"
              value={formData.targetFinishTime}
              onChange={(e) => updateFormData('targetFinishTime', e.target.value)}
              placeholder="e.g., 3:30:00"
              className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
            />
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
        </div>
      );
    }

    // Powerlifting/Strength Training
    if (formData.programType === 'performance' && formData.programSubtype === 'powerlifting') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">💪 Strength Goals</h3>
          <p className="text-sm text-gray-400">Enter your current and target weights for main lifts (in lbs)</p>

          {[
            { id: 'Squat', current: 'currentSquat', target: 'targetSquat' },
            { id: 'Bench', current: 'currentBench', target: 'targetBench' },
            { id: 'Deadlift', current: 'currentDeadlift', target: 'targetDeadlift' },
            { id: 'OHP', current: 'currentOHP', target: 'targetOHP' },
          ].map((lift) => (
            <div key={lift.id} className="grid grid-cols-3 gap-3 items-center">
              <span className="text-white font-medium">{lift.id}</span>
              <input
                type="number"
                value={formData[lift.current]}
                onChange={(e) => updateFormData(lift.current, e.target.value)}
                placeholder="Current"
                className="px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-white text-sm placeholder-gray-500"
              />
              <input
                type="number"
                value={formData[lift.target]}
                onChange={(e) => updateFormData(lift.target, e.target.value)}
                placeholder="Target"
                className="px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-white text-sm placeholder-gray-500"
              />
            </div>
          ))}
        </div>
      );
    }

    // Fat Loss
    if (formData.programType === 'fatloss') {
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

    // General Health - Multi-select focus areas
    if (formData.programType === 'general') {
      const focusOptions = [
        'Cardiovascular Health',
        'Flexibility',
        'Core Strength',
        'Balance',
        'Stress Relief',
        'Better Sleep',
        'Energy Levels',
      ];

      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">❤️ Focus Areas</h3>
          <p className="text-sm text-gray-400">Select all that apply to you:</p>

          <div className="grid grid-cols-2 gap-2">
            {focusOptions.map((area) => (
              <button
                key={area}
                onClick={() => {
                  const current = formData.focusAreas || [];
                  const updated = current.includes(area)
                    ? current.filter((a) => a !== area)
                    : [...current, area];
                  updateFormData('focusAreas', updated);
                }}
                className={`p-3 rounded-lg border text-sm text-left ${
                  formData.focusAreas?.includes(area)
                    ? 'bg-accent-primary/20 border-accent-primary text-white'
                    : 'bg-dark-700 border-dark-500 text-gray-400'
                }`}
              >
                {formData.focusAreas?.includes(area) ? '✓ ' : ''}{area}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Default/Other training preferences
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Training Preferences</h3>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Session Duration: {formData.sessionDuration} minutes
          </label>
          <input
            type="range"
            min="30"
            max="120"
            step="15"
            value={formData.sessionDuration}
            onChange={(e) => updateFormData('sessionDuration', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Equipment</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'full', label: 'Full Gym', icon: '🏋️' },
              { id: 'home', label: 'Home Gym', icon: '🏠' },
              { id: 'minimal', label: 'Minimal', icon: '💪' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => updateFormData('equipment', opt.id)}
                className={`py-3 rounded-lg border text-center ${
                  formData.equipment === opt.id
                    ? 'bg-accent-primary border-accent-primary text-white'
                    : 'bg-dark-700 border-dark-500 text-gray-400'
                }`}
              >
                <span className="text-xl block">{opt.icon}</span>
                <span className="text-xs">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Goal Details</h2>
        <p className="text-gray-400">Help us tailor your program.</p>
      </div>

      {renderGoalInputs()}

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

        {(formData.nutritionGoal === 'lose' || formData.nutritionGoal === 'gain') && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Weekly change: {formData.weeklyWeightChange} lbs/week
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
                placeholder="Trip name (e.g., Beach Vacation)"
                className="w-full px-3 py-2 mb-3 bg-dark-600 border border-dark-500 rounded-lg text-white text-sm placeholder-gray-500"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400">Start Date</label>
                  <input
                    type="date"
                    value={vacation.startDate}
                    onChange={(e) => updateVacation(vacation.id, 'startDate', e.target.value)}
                    className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">End Date</label>
                  <input
                    type="date"
                    value={vacation.endDate}
                    onChange={(e) => updateVacation(vacation.id, 'endDate', e.target.value)}
                    className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white text-sm"
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

      {formData.vacations.length > 0 && (
        <div className="p-4 bg-accent-primary/10 border border-accent-primary/30 rounded-lg">
          <p className="text-sm text-white">
            ✨ Your program will automatically schedule deload weeks around your time off
            when possible.
          </p>
        </div>
      )}
    </div>
  );
}

// Step 6: Generate - Updated messaging
function StepGenerate({ formData, isGenerating, onGenerate }) {
  const programType = PROGRAM_TYPES.find((p) => p.id === formData.programType);
  const subtype = programType?.subtypes.find((s) => s.id === formData.programSubtype);

  // Calculate estimated goal timeline
  const getGoalTimeline = () => {
    if (formData.programType === 'fatloss' && formData.targetWeight) {
      const weightToLose = parseFloat(formData.weight) - parseFloat(formData.targetWeight);
      const weeks = Math.ceil(weightToLose / formData.weeklyWeightChange);
      return `~${weeks} weeks to reach ${formData.targetWeight} ${formData.weightUnit}`;
    }
    if (formData.programType === 'performance' && formData.programSubtype === 'marathon' && formData.raceDate) {
      const raceDate = new Date(formData.raceDate);
      const today = new Date();
      const weeks = Math.ceil((raceDate - today) / (7 * 24 * 60 * 60 * 1000));
      return `${weeks} weeks until race day`;
    }
    return 'Ongoing optimization';
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Ready to Generate</h2>
        <p className="text-gray-400">
          Your AI-powered program will be optimized for your goal timeline.
        </p>
      </div>

      {/* Summary */}
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
          <span className="text-gray-400 text-sm">Timeline</span>
          <p className="text-accent-primary font-medium">{getGoalTimeline()}</p>
        </div>

        <div>
          <span className="text-gray-400 text-sm">Training Schedule</span>
          <p className="text-white font-medium">
            {formData.desiredTrainingDays} days/week (currently training {formData.currentTrainingDays} days)
          </p>
        </div>

        {formData.enableHybrid && formData.secondaryProgramType && (
          <div>
            <span className="text-gray-400 text-sm">Secondary Goal</span>
            <p className="text-white font-medium">
              {PROGRAM_TYPES.find((p) => p.id === formData.secondaryProgramType)?.icon}{' '}
              {formData.secondarySubtype}
              {formData.allowDoubleDays && ' (AM/PM splits)'}
            </p>
          </div>
        )}

        {formData.vacations.length > 0 && (
          <div>
            <span className="text-gray-400 text-sm">Time Off Planned</span>
            <p className="text-white font-medium">
              {formData.vacations.length} vacation(s) scheduled
            </p>
          </div>
        )}

        <div>
          <span className="text-gray-400 text-sm">Program Features</span>
          <ul className="text-sm text-white mt-1 space-y-1">
            <li>✓ Auto-periodization (Base → Build → Peak)</li>
            <li>✓ Progressive overload built-in</li>
            <li>✓ Deload weeks every 5 weeks</li>
            <li>✓ Dynamic adjustments based on your progress</li>
            {formData.vacations.length > 0 && <li>✓ Deloads aligned with vacations</li>}
          </ul>
        </div>
      </div>

      {/* Generate Button */}
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

      {isGenerating && (
        <p className="text-center text-sm text-gray-400">
          Creating your periodized program optimized for your goal...
        </p>
      )}
    </div>
  );
}

// Fallback program generator - Updated with 5 week deload
function generateFallbackProgram(formData) {
  return {
    name: `${formData.programType} Program`,
    description: 'Personalized training program optimized for your goals',
    mesocycleWeeks: 5, // Updated to 5 weeks
    currentWeek: 1,
    currentPhase: 'Base',
    phases: ['Base', 'Build', 'Build', 'Peak', 'Deload'], // 5 week cycle
    primaryGoal: formData.programType,
    primarySubtype: formData.programSubtype,
    secondaryGoal: formData.secondaryProgramType,
    secondarySubtype: formData.secondarySubtype,
    isHybrid: formData.enableHybrid,
    allowDoubleDays: formData.allowDoubleDays,
    daysPerWeek: formData.desiredTrainingDays,
    currentTrainingDays: formData.currentTrainingDays,
    vacations: formData.vacations,
    generatedAt: new Date().toISOString(),
    weeklySchedule: [],
    progressionRules: {
      strengthIncrease: 'Add 2.5lbs per week when all reps completed',
      volumeIncrease: 'Add 1 set per exercise every 2 weeks',
      deloadProtocol: 'Every 5th week: 50% volume, maintain intensity',
    },
    dynamicAdjustments: {
      missedWorkouts: 'Program will auto-adjust if workouts are missed',
      nutritionTracking: 'Calorie targets adjust based on progress',
      goalTracking: 'Weekly check-ins to ensure you stay on track',
    },
  };
}

export default SetupWizard;
