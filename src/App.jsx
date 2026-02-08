import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext';
import { LandingPage } from './components/Landing/LandingPage';
import { SetupWizard } from './components/SetupWizard/SetupWizard';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProgramView } from './components/Program/ProgramView';
import { NutritionView } from './components/Nutrition/NutritionView';
import NutritionPreferences from './components/Nutrition/NutritionPreferences';
import { StatsView } from './components/Stats/StatsView';
import { ProfileView } from './components/Profile/ProfileView';
import { LogMealModal } from './components/Modals/LogMealModal';
import { LogWorkoutModal } from './components/Modals/LogWorkoutModal';
import { SignUpModal } from './components/Modals/SignUpModal';
// Phone OTP auth commented out - Twilio setup pending
// import { PhoneAuthModal } from './components/Modals/PhoneAuthModal';
import { TabBar } from './components/shared/TabBar';
import { PaywallOverlay } from './components/Paywall';
import { PrivacyPolicy, TermsConditions } from './pages';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  loadProfile,
  loadProgram,
  loadMeals,
  loadWorkouts,
  saveProfile,
  saveProgram,
  saveMeals,
  saveWorkouts,
  syncLocalToCloud
} from './lib/database';

// Generate mock meal plan for testing without API calls
// FIXED: Excluded meals don't redistribute calories - they just reduce the day's total
const generateMockMealPlan = (preferences, profile) => {
  // Use FULL daily targets (not adjusted) - excluded meals just reduce that day's actual intake
  const targetCalories = profile?.macros?.calories || 2000;
  const targetProtein = profile?.macros?.protein || 150;
  const mealsPerDay = preferences.mealsPerDay || 3;
  const snacksPerDay = preferences.snacksPerDay || 1;

  // Calculate target macros for a FULL day (all meals)
  const proteinCals = targetProtein * 4;
  const remainingCals = targetCalories - proteinCals;
  const targetCarbs = Math.round((remainingCals * 0.55) / 4);
  const targetFat = Math.round((remainingCals * 0.45) / 9);

  // FIXED: Standard meal portions (as % of daily target) - these stay constant
  // Excluded meals just mean fewer meals that day, not bigger portions for remaining meals
  const getStandardMealPortions = () => {
    // Breakfast: 25%, Lunch: 30%, Dinner: 35%, Snacks: ~10% total
    if (mealsPerDay === 2) {
      return { breakfast: 0.40, dinner: 0.50, snack: 0.10 / snacksPerDay };
    } else {
      // Standard 3-meal distribution
      const snackPct = snacksPerDay > 0 ? 0.10 / snacksPerDay : 0;
      return { breakfast: 0.25, lunch: 0.30, dinner: 0.35, snack: snackPct };
    }
  };

  const standardPortions = getStandardMealPortions();

  // Meal templates with realistic ingredient bases
  const mealTemplates = {
    breakfast: [
      { id: 'b1', title: 'Greek Yogurt Parfait', baseIngredients: ['Greek yogurt', 'granola', 'mixed berries', 'honey'], readyInMinutes: 5 },
      { id: 'b2', title: 'Avocado Toast with Eggs', baseIngredients: ['whole grain bread', 'avocado', 'eggs', 'olive oil'], readyInMinutes: 15 },
      { id: 'b3', title: 'Protein Oatmeal Bowl', baseIngredients: ['oats', 'protein powder', 'almond milk', 'banana', 'almond butter'], readyInMinutes: 10 },
      { id: 'b4', title: 'Veggie Egg Scramble', baseIngredients: ['eggs', 'spinach', 'bell peppers', 'cheese', 'olive oil'], readyInMinutes: 12 },
      { id: 'b5', title: 'Smoothie Bowl', baseIngredients: ['protein powder', 'frozen berries', 'banana', 'almond milk', 'chia seeds'], readyInMinutes: 8 },
      { id: 'b6', title: 'Overnight Oats', baseIngredients: ['oats', 'Greek yogurt', 'milk', 'maple syrup', 'walnuts'], readyInMinutes: 5 },
      { id: 'b7', title: 'Breakfast Burrito', baseIngredients: ['eggs', 'black beans', 'cheese', 'whole wheat tortilla', 'salsa'], readyInMinutes: 15 },
    ],
    lunch: [
      { id: 'l1', title: 'Grilled Chicken Salad', baseIngredients: ['chicken breast', 'mixed greens', 'cherry tomatoes', 'feta cheese', 'olive oil'], readyInMinutes: 20 },
      { id: 'l2', title: 'Quinoa Buddha Bowl', baseIngredients: ['quinoa', 'chickpeas', 'roasted vegetables', 'tahini', 'avocado'], readyInMinutes: 25 },
      { id: 'l3', title: 'Turkey & Avocado Wrap', baseIngredients: ['turkey breast', 'avocado', 'whole wheat wrap', 'lettuce', 'tomato'], readyInMinutes: 10 },
      { id: 'l4', title: 'Salmon Poke Bowl', baseIngredients: ['salmon', 'sushi rice', 'edamame', 'cucumber', 'sesame oil'], readyInMinutes: 15 },
      { id: 'l5', title: 'Mediterranean Plate', baseIngredients: ['chicken', 'hummus', 'pita bread', 'cucumber', 'olives'], readyInMinutes: 15 },
      { id: 'l6', title: 'Asian Chicken Stir Fry', baseIngredients: ['chicken breast', 'brown rice', 'broccoli', 'soy sauce', 'sesame oil'], readyInMinutes: 20 },
      { id: 'l7', title: 'Black Bean Tacos', baseIngredients: ['black beans', 'corn tortillas', 'avocado', 'cheese', 'salsa'], readyInMinutes: 15 },
    ],
    dinner: [
      { id: 'd1', title: 'Herb Crusted Salmon', baseIngredients: ['salmon fillet', 'quinoa', 'asparagus', 'olive oil', 'lemon'], readyInMinutes: 30 },
      { id: 'd2', title: 'Lean Beef Stir Fry', baseIngredients: ['lean beef', 'brown rice', 'mixed vegetables', 'soy sauce', 'ginger'], readyInMinutes: 25 },
      { id: 'd3', title: 'Grilled Chicken & Veggies', baseIngredients: ['chicken breast', 'sweet potato', 'broccoli', 'olive oil', 'garlic'], readyInMinutes: 35 },
      { id: 'd4', title: 'Shrimp Pasta Primavera', baseIngredients: ['shrimp', 'whole wheat pasta', 'zucchini', 'tomatoes', 'parmesan'], readyInMinutes: 30 },
      { id: 'd5', title: 'Turkey Meatballs & Zoodles', baseIngredients: ['ground turkey', 'zucchini', 'marinara sauce', 'parmesan', 'olive oil'], readyInMinutes: 35 },
      { id: 'd6', title: 'Baked Cod with Quinoa', baseIngredients: ['cod fillet', 'quinoa', 'spinach', 'cherry tomatoes', 'olive oil'], readyInMinutes: 30 },
      { id: 'd7', title: 'Chicken Tikka Masala', baseIngredients: ['chicken breast', 'basmati rice', 'tikka sauce', 'Greek yogurt', 'naan'], readyInMinutes: 40 },
    ],
    snack: [
      { id: 's1', title: 'Protein Shake', baseIngredients: ['protein powder', 'almond milk', 'banana'], readyInMinutes: 2 },
      { id: 's2', title: 'Apple & Almond Butter', baseIngredients: ['apple', 'almond butter'], readyInMinutes: 2 },
      { id: 's3', title: 'Greek Yogurt & Berries', baseIngredients: ['Greek yogurt', 'mixed berries', 'honey'], readyInMinutes: 2 },
      { id: 's4', title: 'Trail Mix', baseIngredients: ['mixed nuts', 'dried fruit', 'dark chocolate chips'], readyInMinutes: 1 },
      { id: 's5', title: 'Cottage Cheese & Fruit', baseIngredients: ['cottage cheese', 'pineapple', 'walnuts'], readyInMinutes: 2 },
      { id: 's6', title: 'Hummus & Veggies', baseIngredients: ['hummus', 'carrots', 'celery', 'bell peppers'], readyInMinutes: 3 },
      { id: 's7', title: 'Protein Bar', baseIngredients: ['protein bar'], readyInMinutes: 1 },
    ]
  };

  // Create a meal with EXACT macros for target
  const createMealWithExactMacros = (template, calories, protein, carbs, fat) => {
    return {
      id: template.id,
      title: template.title,
      calories,
      protein,
      carbs,
      fat,
      readyInMinutes: template.readyInMinutes,
      image: null,
    };
  };

  // Generate ingredient list based on macros (scaled portions)
  const generateIngredients = (template, protein, carbs, fat) => {
    // Scale ingredient quantities to match macros
    const proteinOz = Math.round(protein / 7 * 10) / 10; // ~7g protein per oz of meat
    const carbCups = Math.round(carbs / 40 * 10) / 10; // ~40g carbs per cup of grains
    const fatTbsp = Math.round(fat / 14 * 10) / 10; // ~14g fat per tbsp oil

    return template.baseIngredients.map((ing, idx) => {
      // First ingredient is usually protein source
      if (idx === 0 && ['chicken', 'salmon', 'beef', 'turkey', 'shrimp', 'cod', 'eggs'].some(p => ing.includes(p))) {
        return { original: `${proteinOz}oz ${ing}`, name: ing, amount: proteinOz, unit: 'oz' };
      }
      // Second ingredient is often carb source
      if (idx === 1 && ['rice', 'quinoa', 'pasta', 'oats', 'bread', 'tortilla'].some(c => ing.includes(c))) {
        return { original: `${carbCups} cup ${ing}`, name: ing, amount: carbCups, unit: 'cup' };
      }
      // Fat sources
      if (['olive oil', 'avocado', 'almond butter', 'cheese'].some(f => ing.includes(f))) {
        return { original: `${fatTbsp} tbsp ${ing}`, name: ing, amount: fatTbsp, unit: 'tbsp' };
      }
      // Default portions for vegetables and other items
      return { original: `1 cup ${ing}`, name: ing, amount: 1, unit: 'cup' };
    });
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayIds = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const mealPlan = { week: {} };
  const recipes = {};

  days.forEach((day, dayIndex) => {
    const dayId = dayIds[dayIndex];
    const dayMeals = [];
    let mealIndex = 0;

    // Define meal types for this plan
    const mealTypes = mealsPerDay === 2 ? ['breakfast', 'dinner'] :
                      mealsPerDay === 3 ? ['breakfast', 'lunch', 'dinner'] :
                      ['breakfast', 'lunch', 'dinner'];

    // Running totals for the day (only included meals contribute)
    let dayCals = 0, dayProtein = 0, dayCarbs = 0, dayFat = 0;

    // Process each meal type with STANDARD portions (not redistributed)
    mealTypes.forEach((type) => {
      const isExcluded = preferences.excludedMeals?.[`${dayId}-${mealIndex}`];
      mealIndex++;

      // Skip excluded meals entirely - don't add to day totals
      if (isExcluded) return;

      // Use STANDARD portion for this meal type (same regardless of other exclusions)
      const portion = standardPortions[type];
      const mealCals = Math.round(targetCalories * portion);
      const mealProtein = Math.round(targetProtein * portion);
      const mealCarbs = Math.round(targetCarbs * portion);
      const mealFat = Math.round(targetFat * portion);

      // Add to day totals
      dayCals += mealCals;
      dayProtein += mealProtein;
      dayCarbs += mealCarbs;
      dayFat += mealFat;

      const template = mealTemplates[type][dayIndex % mealTemplates[type].length];
      const scaledMeal = createMealWithExactMacros(template, mealCals, mealProtein, mealCarbs, mealFat);
      scaledMeal.type = type;

      dayMeals.push(scaledMeal);

      // Generate recipe with scaled ingredients
      recipes[template.id] = {
        ...scaledMeal,
        ingredients: generateIngredients(template, mealProtein, mealCarbs, mealFat),
        instructions: ['Prep all ingredients to specified portions', 'Cook protein to desired doneness', 'Combine all components', 'Season to taste and serve']
      };
    });

    // Process snacks with STANDARD portions
    for (let i = 0; i < snacksPerDay; i++) {
      const isExcluded = preferences.excludedMeals?.[`${dayId}-${mealIndex}`];
      mealIndex++;

      // Skip excluded snacks - don't redistribute
      if (isExcluded) continue;

      const portion = standardPortions.snack;
      const snackCals = Math.round(targetCalories * portion);
      const snackProtein = Math.round(targetProtein * portion);
      const snackCarbs = Math.round(targetCarbs * portion);
      const snackFat = Math.round(targetFat * portion);

      // Add to day totals
      dayCals += snackCals;
      dayProtein += snackProtein;
      dayCarbs += snackCarbs;
      dayFat += snackFat;

      const template = mealTemplates.snack[(dayIndex + i) % mealTemplates.snack.length];
      const scaledSnack = createMealWithExactMacros(template, snackCals, snackProtein, snackCarbs, snackFat);
      scaledSnack.type = 'snack';

      dayMeals.push(scaledSnack);

      recipes[template.id] = {
        ...scaledSnack,
        ingredients: generateIngredients(template, snackProtein, snackCarbs, snackFat),
        instructions: ['Quick, nutritious snack - enjoy!']
      };
    }

    // Day nutrients = sum of ONLY included meals (excluded meals don't boost others)
    mealPlan.week[day] = {
      meals: dayMeals,
      nutrients: {
        calories: dayCals,
        protein: dayProtein,
        carbohydrates: dayCarbs,
        fat: dayFat
      }
    };
  });

  return { mealPlan, recipes };
};

function AppContent() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const {
    isSubscribed,
    loading: subscriptionLoading,
    initializeSubscription,
    activatePaidSubscription
  } = useSubscription();

  // Persisted state (localStorage as fallback)
  const [profile, setProfileLocal] = useLocalStorage('motus_profile', null);
  const [program, setProgramLocal] = useLocalStorage('motus_program', null);
  const [meals, setMealsLocal] = useLocalStorage('motus_meals', []);
  const [workouts, setWorkoutsLocal] = useLocalStorage('motus_workouts', []);
  const [completedExercises, setCompletedExercises] = useLocalStorage('motus_completed', []);
  const [mealPlan, setMealPlan] = useLocalStorage('motus_meal_plan', null);
  const [recipes, setRecipes] = useLocalStorage('motus_recipes', {});

  // UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMealModal, setShowMealModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showNutritionPreferences, setShowNutritionPreferences] = useState(false);
  const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState(false);

  // Lock In users get free access (they shared to unlock)
  const isLockInUser = profile?.programType === 'lockin';
  const hasAccess = isSubscribed || isLockInUser;

  // Legal & Auth pages
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);

  // Load data from cloud or localStorage on mount/auth change
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // If user just signed in, sync local data to cloud first
      if (isAuthenticated) {
        await syncLocalToCloud();
      }

      // Load data (from cloud if authenticated, localStorage otherwise)
      const [profileResult, programResult, mealsResult, workoutsResult] = await Promise.all([
        loadProfile(),
        loadProgram(),
        loadMeals(),
        loadWorkouts()
      ]);

      if (profileResult.data) setProfileLocal(profileResult.data);
      if (programResult.data) setProgramLocal(programResult.data);
      if (mealsResult.data) setMealsLocal(mealsResult.data);
      if (workoutsResult.data) setWorkoutsLocal(workoutsResult.data);

      if (profileResult.data && programResult.data) {
        setIsSetupComplete(true);
        setShowLanding(false);
      } else {
        // Check if user has started setup before (visited the app)
        const hasVisited = localStorage.getItem('motus_has_visited');
        if (hasVisited) {
          setShowLanding(false);
        }
      }

      setIsLoading(false);
    };

    if (!authLoading) {
      loadData();
    }
  }, [isAuthenticated, authLoading]);

  // Check for referral code in URL (for new users coming from referral link)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('motus_referral_code', refCode);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Show paywall for existing users who aren't subscribed (after loading completes)
  // EXCEPTION: Lock In users don't need to pay - they already shared to unlock
  useEffect(() => {
    const isLockInUser = profile?.programType === 'lockin';
    if (!isLoading && !subscriptionLoading && isSetupComplete && !isSubscribed && !isLockInUser) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        setShowPaywall(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, subscriptionLoading, isSetupComplete, isSubscribed, profile?.programType]);

  // Wrapper functions to save to both local and cloud
  const setProfile = async (data) => {
    setProfileLocal(data);
    await saveProfile(data);
  };

  const setProgram = async (data) => {
    setProgramLocal(data);
    await saveProgram(data);
  };

  const setMeals = async (data) => {
    setMealsLocal(data);
    await saveMeals(data);
  };

  const setWorkouts = async (data) => {
    setWorkoutsLocal(data);
    await saveWorkouts(data);
  };

  // Handle setup completion
  const handleSetupComplete = async (data) => {
    await setProfile(data.profile);
    await setProgram(data.program);

    // Initialize subscription for new users
    await initializeSubscription();

    // Check if this is a Lock In user (use data.profile since state may not have updated yet)
    const isLockIn = data.profile?.programType === 'lockin';

    // Show paywall unless already subscribed OR Lock In user (Lock In is free, no payment needed)
    if (!isSubscribed && !isLockIn) {
      setShowPaywall(true);
    }

    setIsSetupComplete(true);
  };

  // Handle successful subscription/referral
  const handleSubscriptionSuccess = async (stripeData) => {
    if (stripeData) {
      await activatePaidSubscription(stripeData);
    }
    setShowPaywall(false);
  };

  // Handle meal logging
  const handleLogMeal = async (meal) => {
    const newMeals = [...meals, { ...meal, id: Date.now() }];
    await setMeals(newMeals);
    setShowMealModal(false);
  };

  // Handle meal deletion
  const handleDeleteMeal = async (mealId) => {
    const newMeals = meals.filter((m) => m.id !== mealId);
    await setMeals(newMeals);
  };

  // Handle workout logging
  const handleLogWorkout = async (workout) => {
    const newWorkouts = [...workouts, { ...workout, id: Date.now() }];
    await setWorkouts(newWorkouts);
    setShowWorkoutModal(false);
  };

  // Handle exercise completion toggle
  const handleCompleteExercise = (day, sessionIndex, exerciseIndex) => {
    const existing = completedExercises.find(
      (c) => c.day === day && c.sessionIndex === sessionIndex
    );

    if (existing) {
      if (existing.completedExercises.includes(exerciseIndex)) {
        const updated = completedExercises.map((c) =>
          c.day === day && c.sessionIndex === sessionIndex
            ? {
                ...c,
                completedExercises: c.completedExercises.filter((e) => e !== exerciseIndex),
              }
            : c
        );
        setCompletedExercises(updated);
      } else {
        const updated = completedExercises.map((c) =>
          c.day === day && c.sessionIndex === sessionIndex
            ? { ...c, completedExercises: [...c.completedExercises, exerciseIndex] }
            : c
        );
        setCompletedExercises(updated);
      }
    } else {
      setCompletedExercises([
        ...completedExercises,
        { day, sessionIndex, completedExercises: [exerciseIndex] },
      ]);
    }
  };

  // Handle completing entire session at once
  const handleCompleteSession = (day, sessionIndex) => {
    const session = program?.weeklySchedule?.find((d) => d.day === day)?.sessions?.[sessionIndex];
    if (!session?.exercises) return;

    const exerciseIndices = session.exercises.map((_, idx) => idx);
    const existing = completedExercises.find(
      (c) => c.day === day && c.sessionIndex === sessionIndex
    );

    if (existing) {
      // Update existing entry with all exercises
      const updated = completedExercises.map((c) =>
        c.day === day && c.sessionIndex === sessionIndex
          ? { ...c, completedExercises: exerciseIndices }
          : c
      );
      setCompletedExercises(updated);
    } else {
      // Create new entry with all exercises
      setCompletedExercises([
        ...completedExercises,
        { day, sessionIndex, completedExercises: exerciseIndices, exerciseLogs: {} },
      ]);
    }
  };

  // Handle updating exercise log (actual weights/sets/reps)
  const handleUpdateExerciseLog = (day, sessionIndex, exerciseIndex, logData) => {
    const existing = completedExercises.find(
      (c) => c.day === day && c.sessionIndex === sessionIndex
    );

    if (existing) {
      const updated = completedExercises.map((c) =>
        c.day === day && c.sessionIndex === sessionIndex
          ? {
              ...c,
              exerciseLogs: {
                ...c.exerciseLogs,
                [exerciseIndex]: logData,
              },
              // Also mark as completed when logging
              completedExercises: c.completedExercises.includes(exerciseIndex)
                ? c.completedExercises
                : [...c.completedExercises, exerciseIndex],
            }
          : c
      );
      setCompletedExercises(updated);
    } else {
      setCompletedExercises([
        ...completedExercises,
        {
          day,
          sessionIndex,
          completedExercises: [exerciseIndex],
          exerciseLogs: { [exerciseIndex]: logData },
        },
      ]);
    }
  };

  // Handle reset
  const handleResetSetup = async () => {
    if (window.confirm('Are you sure you want to reset? All your data will be lost.')) {
      await setProfile(null);
      await setProgram(null);
      await setMeals([]);
      await setWorkouts([]);
      setCompletedExercises([]);
      setIsSetupComplete(false);
      setActiveTab('dashboard');
    }
  };

  // Loading state
  if (authLoading || isLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your data...</p>
        </div>
      </div>
    );
  }

  // Get today's data
  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = meals.filter(
    (m) => (m.loggedAt || m.createdAt)?.startsWith(today)
  );
  const todaysWorkouts = workouts.filter(
    (w) => (w.loggedAt || w.completedAt)?.startsWith(today)
  );

  // Handle starting the setup from landing page
  const handleGetStarted = () => {
    localStorage.setItem('motus_has_visited', 'true');
    setShowLanding(false);
  };

  // Render privacy policy page
  if (showPrivacy) {
    return <PrivacyPolicy onBack={() => setShowPrivacy(false)} />;
  }

  // Render terms & conditions page
  if (showTerms) {
    return <TermsConditions onBack={() => setShowTerms(false)} />;
  }

  // Render landing page for new visitors
  if (showLanding && !isSetupComplete) {
    return (
      <>
        <LandingPage
          onGetStarted={() => setShowPhoneAuth(true)}
          onShowPrivacy={() => setShowPrivacy(true)}
          onShowTerms={() => setShowTerms(true)}
        />
        <SignUpModal
          isOpen={showPhoneAuth}
          onClose={() => setShowPhoneAuth(false)}
          onSuccess={handleGetStarted}
          onShowPrivacy={() => { setShowPhoneAuth(false); setShowPrivacy(true); }}
          onShowTerms={() => { setShowPhoneAuth(false); setShowTerms(true); }}
        />
      </>
    );
  }

  // Render setup wizard if not complete
  if (!isSetupComplete) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  // Render main app
  return (
    <div className="min-h-screen bg-dark-900">
      {/* Paywall Overlay - shown after setup if not subscribed (Lock In users exempt) */}
      <PaywallOverlay
        isVisible={showPaywall && !hasAccess}
        onClose={() => setShowPaywall(false)}
        onSuccess={handleSubscriptionSuccess}
        program={program}
      />

      {/* Main Content - with blur effect if no access */}
      <div className={!hasAccess && isSetupComplete ? 'relative' : ''}>
        {/* Blur overlay for non-subscribers (dashboard still visible) */}
        {!hasAccess && isSetupComplete && activeTab !== 'dashboard' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-40 flex items-center justify-center">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-primary/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Premium Feature</h3>
              <p className="text-gray-400 mb-4">Subscribe to unlock this tab</p>
              <button
                onClick={() => setShowPaywall(true)}
                className="px-6 py-2 bg-accent-primary text-dark-900 font-medium rounded-lg hover:bg-accent-primary/90"
              >
                Unlock Now
              </button>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            profile={profile}
            program={program}
            meals={meals}
            workouts={workouts}
            todaysMeals={todaysMeals}
            todaysWorkouts={todaysWorkouts}
            isSubscribed={hasAccess}
            onLogMeal={() => hasAccess ? setShowMealModal(true) : setShowPaywall(true)}
            onLogWorkout={() => hasAccess ? setShowWorkoutModal(true) : setShowPaywall(true)}
            onViewProgram={() => hasAccess ? setActiveTab('program') : setShowPaywall(true)}
            onViewNutrition={() => hasAccess ? setActiveTab('nutrition') : setShowPaywall(true)}
            onShowPaywall={() => setShowPaywall(true)}
            onCreateMealPlan={() => setShowNutritionPreferences(true)}
          />
        )}

        {activeTab === 'program' && hasAccess && (
          <ProgramView
            program={program}
            completedWorkouts={completedExercises}
            onCompleteExercise={handleCompleteExercise}
            onCompleteSession={handleCompleteSession}
            onUpdateExerciseLog={handleUpdateExerciseLog}
            onBack={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'nutrition' && hasAccess && (
          <NutritionView
            profile={profile}
            meals={meals}
            workouts={workouts}
            mealPlan={mealPlan}
            recipes={recipes}
            isGeneratingMealPlan={isGeneratingMealPlan}
            onLogMeal={() => setShowMealModal(true)}
            onDeleteMeal={handleDeleteMeal}
            onCreateMealPlan={() => setShowNutritionPreferences(true)}
            onBack={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'stats' && hasAccess && (
          <StatsView
            profile={profile}
            program={program}
            meals={meals}
            workouts={workouts}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            profile={profile}
            program={program}
            isSubscribed={hasAccess}
            onResetSetup={handleResetSetup}
            onShowPaywall={() => setShowPaywall(true)}
          />
        )}
      </div>

      {/* Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onChange={(tab) => {
          if (!hasAccess && tab !== 'dashboard' && tab !== 'profile') {
            setShowPaywall(true);
          } else {
            setActiveTab(tab);
          }
        }}
        isSubscribed={hasAccess}
      />

      {/* Modals */}
      <LogMealModal
        isOpen={showMealModal}
        onClose={() => setShowMealModal(false)}
        onSave={handleLogMeal}
        mealPlan={mealPlan}
      />

      <LogWorkoutModal
        isOpen={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
        onSave={handleLogWorkout}
        program={program}
      />

      <NutritionPreferences
        isOpen={showNutritionPreferences}
        onClose={() => setShowNutritionPreferences(false)}
        onSave={async (prefs) => {
          console.log('Nutrition preferences saved:', prefs);
          setShowNutritionPreferences(false);
          setIsGeneratingMealPlan(true);

          try {
            // Generate mock meal plan (works in test mode without API calls)
            const mockMealPlan = generateMockMealPlan(prefs, profile);
            setMealPlan(mockMealPlan.mealPlan);
            setRecipes(mockMealPlan.recipes);
            setActiveTab('nutrition');
          } catch (error) {
            console.error('Error generating meal plan:', error);
          } finally {
            setIsGeneratingMealPlan(false);
          }
        }}
        profile={profile}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <AppContent />
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;
