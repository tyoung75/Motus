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
import { TabBar } from './components/shared/TabBar';
import { PaywallOverlay } from './components/Paywall';
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
const generateMockMealPlan = (preferences, profile) => {
  const targetCalories = preferences.adjustedCalories || profile?.macros?.calories || 2000;
  const targetProtein = profile?.macros?.protein || 150;
  const mealsPerDay = preferences.mealsPerDay || 3;
  const snacksPerDay = preferences.snacksPerDay || 1;

  // Calculate target macros
  const proteinCals = targetProtein * 4;
  const remainingCals = targetCalories - proteinCals;
  const targetCarbs = Math.round((remainingCals * 0.55) / 4);
  const targetFat = Math.round((remainingCals * 0.45) / 9);

  // Calorie distribution per meal type (percentages)
  const mealDistribution = {
    2: { breakfast: 0.40, dinner: 0.60 },
    3: { breakfast: 0.25, lunch: 0.35, dinner: 0.40 },
    4: { breakfast: 0.20, lunch: 0.30, snack: 0.15, dinner: 0.35 }
  };
  const snackCaloriePercent = snacksPerDay > 0 ? 0.10 / snacksPerDay : 0; // 10% total for snacks

  // Base meals (will be scaled to hit targets)
  const baseMeals = {
    breakfast: [
      { id: 'b1', title: 'Greek Yogurt Parfait', baseCal: 400, proteinRatio: 0.25, carbRatio: 0.50, fatRatio: 0.25, readyInMinutes: 5 },
      { id: 'b2', title: 'Avocado Toast with Eggs', baseCal: 450, proteinRatio: 0.22, carbRatio: 0.40, fatRatio: 0.38, readyInMinutes: 15 },
      { id: 'b3', title: 'Protein Oatmeal Bowl', baseCal: 420, proteinRatio: 0.28, carbRatio: 0.55, fatRatio: 0.17, readyInMinutes: 10 },
      { id: 'b4', title: 'Veggie Egg Scramble', baseCal: 380, proteinRatio: 0.30, carbRatio: 0.25, fatRatio: 0.45, readyInMinutes: 12 },
      { id: 'b5', title: 'Smoothie Bowl', baseCal: 400, proteinRatio: 0.20, carbRatio: 0.60, fatRatio: 0.20, readyInMinutes: 8 },
      { id: 'b6', title: 'Overnight Oats', baseCal: 420, proteinRatio: 0.18, carbRatio: 0.58, fatRatio: 0.24, readyInMinutes: 5 },
      { id: 'b7', title: 'Breakfast Burrito', baseCal: 500, proteinRatio: 0.25, carbRatio: 0.45, fatRatio: 0.30, readyInMinutes: 15 },
    ],
    lunch: [
      { id: 'l1', title: 'Grilled Chicken Salad', baseCal: 500, proteinRatio: 0.35, carbRatio: 0.25, fatRatio: 0.40, readyInMinutes: 20 },
      { id: 'l2', title: 'Quinoa Buddha Bowl', baseCal: 550, proteinRatio: 0.18, carbRatio: 0.55, fatRatio: 0.27, readyInMinutes: 25 },
      { id: 'l3', title: 'Turkey & Avocado Wrap', baseCal: 520, proteinRatio: 0.28, carbRatio: 0.40, fatRatio: 0.32, readyInMinutes: 10 },
      { id: 'l4', title: 'Salmon Poke Bowl', baseCal: 580, proteinRatio: 0.28, carbRatio: 0.42, fatRatio: 0.30, readyInMinutes: 15 },
      { id: 'l5', title: 'Mediterranean Plate', baseCal: 520, proteinRatio: 0.22, carbRatio: 0.45, fatRatio: 0.33, readyInMinutes: 15 },
      { id: 'l6', title: 'Asian Chicken Stir Fry', baseCal: 500, proteinRatio: 0.30, carbRatio: 0.40, fatRatio: 0.30, readyInMinutes: 20 },
      { id: 'l7', title: 'Black Bean Tacos', baseCal: 480, proteinRatio: 0.18, carbRatio: 0.55, fatRatio: 0.27, readyInMinutes: 15 },
    ],
    dinner: [
      { id: 'd1', title: 'Herb Crusted Salmon', baseCal: 620, proteinRatio: 0.32, carbRatio: 0.25, fatRatio: 0.43, readyInMinutes: 30 },
      { id: 'd2', title: 'Lean Beef Stir Fry', baseCal: 580, proteinRatio: 0.30, carbRatio: 0.35, fatRatio: 0.35, readyInMinutes: 25 },
      { id: 'd3', title: 'Grilled Chicken & Veggies', baseCal: 550, proteinRatio: 0.38, carbRatio: 0.30, fatRatio: 0.32, readyInMinutes: 35 },
      { id: 'd4', title: 'Shrimp Pasta Primavera', baseCal: 600, proteinRatio: 0.22, carbRatio: 0.50, fatRatio: 0.28, readyInMinutes: 30 },
      { id: 'd5', title: 'Turkey Meatballs & Zoodles', baseCal: 520, proteinRatio: 0.35, carbRatio: 0.25, fatRatio: 0.40, readyInMinutes: 35 },
      { id: 'd6', title: 'Baked Cod with Quinoa', baseCal: 540, proteinRatio: 0.32, carbRatio: 0.42, fatRatio: 0.26, readyInMinutes: 30 },
      { id: 'd7', title: 'Chicken Tikka Masala', baseCal: 620, proteinRatio: 0.28, carbRatio: 0.40, fatRatio: 0.32, readyInMinutes: 40 },
    ],
    snack: [
      { id: 's1', title: 'Protein Shake', baseCal: 200, proteinRatio: 0.50, carbRatio: 0.30, fatRatio: 0.20, readyInMinutes: 2 },
      { id: 's2', title: 'Apple & Almond Butter', baseCal: 250, proteinRatio: 0.12, carbRatio: 0.50, fatRatio: 0.38, readyInMinutes: 2 },
      { id: 's3', title: 'Greek Yogurt & Berries', baseCal: 180, proteinRatio: 0.35, carbRatio: 0.45, fatRatio: 0.20, readyInMinutes: 2 },
      { id: 's4', title: 'Trail Mix', baseCal: 220, proteinRatio: 0.12, carbRatio: 0.45, fatRatio: 0.43, readyInMinutes: 1 },
      { id: 's5', title: 'Cottage Cheese & Fruit', baseCal: 200, proteinRatio: 0.40, carbRatio: 0.40, fatRatio: 0.20, readyInMinutes: 2 },
      { id: 's6', title: 'Hummus & Veggies', baseCal: 170, proteinRatio: 0.15, carbRatio: 0.50, fatRatio: 0.35, readyInMinutes: 3 },
      { id: 's7', title: 'Protein Bar', baseCal: 230, proteinRatio: 0.35, carbRatio: 0.45, fatRatio: 0.20, readyInMinutes: 1 },
    ]
  };

  // Helper to scale meal to target calories
  const scaleMeal = (baseMeal, targetCals) => {
    const scale = targetCals / baseMeal.baseCal;
    return {
      ...baseMeal,
      calories: Math.round(targetCals),
      protein: Math.round((targetCals * baseMeal.proteinRatio) / 4),
      carbs: Math.round((targetCals * baseMeal.carbRatio) / 4),
      fat: Math.round((targetCals * baseMeal.fatRatio) / 9),
    };
  };

  // Sample recipe details
  const recipeDetails = {
    b1: { ingredients: [{ original: '1 cup Greek yogurt' }, { original: '1/2 cup granola' }, { original: '1/2 cup mixed berries' }, { original: '1 tbsp honey' }], instructions: ['Layer yogurt in a bowl', 'Add granola', 'Top with berries and honey'] },
    b2: { ingredients: [{ original: '2 slices whole grain bread' }, { original: '1 avocado' }, { original: '2 eggs' }, { original: 'Salt and pepper to taste' }], instructions: ['Toast bread', 'Mash avocado and spread on toast', 'Fry eggs to preference', 'Place eggs on toast, season'] },
    l1: { ingredients: [{ original: '6oz grilled chicken breast' }, { original: '4 cups mixed greens' }, { original: '1/2 cup cherry tomatoes' }, { original: '1/4 cup feta cheese' }, { original: '2 tbsp olive oil dressing' }], instructions: ['Grill chicken and slice', 'Arrange greens on plate', 'Top with chicken, tomatoes, feta', 'Drizzle with dressing'] },
    d1: { ingredients: [{ original: '6oz salmon fillet' }, { original: '2 tbsp herb mixture' }, { original: '1 cup roasted vegetables' }, { original: '1/2 cup quinoa' }], instructions: ['Preheat oven to 400°F', 'Coat salmon with herbs', 'Bake 15-18 minutes', 'Serve with vegetables and quinoa'] },
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayIds = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const mealPlan = { week: {} };
  const recipes = {};

  // Get distribution for this meal count
  const dist = mealDistribution[mealsPerDay] || mealDistribution[3];

  days.forEach((day, dayIndex) => {
    const dayId = dayIds[dayIndex];
    const dayMeals = [];
    let dayCalories = 0;
    let dayProtein = 0;
    let dayCarbs = 0;
    let dayFat = 0;
    let mealIndex = 0;

    // Calculate calories available for main meals (subtract snack calories)
    const snackTotalPercent = snacksPerDay * snackCaloriePercent;
    const mainMealCalories = targetCalories * (1 - snackTotalPercent);

    // Add main meals based on mealsPerDay
    const mealTypes = mealsPerDay === 2 ? ['breakfast', 'dinner'] :
                      mealsPerDay === 3 ? ['breakfast', 'lunch', 'dinner'] :
                      ['breakfast', 'lunch', 'snack', 'dinner'];

    mealTypes.forEach((type) => {
      // Check if this meal is excluded
      const isExcluded = preferences.excludedMeals?.[`${dayId}-${mealIndex}`];
      mealIndex++;

      if (!isExcluded && type !== 'snack') {
        const mealOptions = baseMeals[type] || baseMeals.lunch;
        const baseMeal = mealOptions[dayIndex % mealOptions.length];

        // Calculate target calories for this meal type
        const mealTargetCals = Math.round(mainMealCalories * (dist[type] || 0.33));
        const scaledMeal = scaleMeal(baseMeal, mealTargetCals);

        dayMeals.push({ ...scaledMeal, type, image: null });
        dayCalories += scaledMeal.calories;
        dayProtein += scaledMeal.protein;
        dayCarbs += scaledMeal.carbs;
        dayFat += scaledMeal.fat;

        // Add recipe details
        const mealWithRecipe = { ...scaledMeal, image: null };
        if (recipeDetails[baseMeal.id]) {
          recipes[baseMeal.id] = { ...mealWithRecipe, ...recipeDetails[baseMeal.id] };
        } else {
          recipes[baseMeal.id] = {
            ...mealWithRecipe,
            ingredients: [
              { original: 'Lean protein source' },
              { original: 'Complex carbohydrates' },
              { original: 'Healthy fats' },
              { original: 'Fresh vegetables' }
            ],
            instructions: ['Prep all ingredients', 'Cook protein to desired doneness', 'Combine and serve']
          };
        }
      }
    });

    // Add snacks
    for (let i = 0; i < snacksPerDay; i++) {
      const isExcluded = preferences.excludedMeals?.[`${dayId}-${mealIndex}`];
      mealIndex++;

      if (!isExcluded) {
        const baseMeal = baseMeals.snack[(dayIndex + i) % baseMeals.snack.length];
        const snackTargetCals = Math.round(targetCalories * snackCaloriePercent);
        const scaledSnack = scaleMeal(baseMeal, snackTargetCals);

        dayMeals.push({ ...scaledSnack, type: 'snack', image: null });
        dayCalories += scaledSnack.calories;
        dayProtein += scaledSnack.protein;
        dayCarbs += scaledSnack.carbs;
        dayFat += scaledSnack.fat;

        recipes[baseMeal.id] = {
          ...scaledSnack,
          image: null,
          ingredients: [{ original: 'Quick, nutritious snack' }],
          instructions: ['Enjoy between meals for sustained energy!']
        };
      }
    }

    mealPlan.week[day] = {
      meals: dayMeals,
      nutrients: {
        calories: dayCalories,
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
  useEffect(() => {
    if (!isLoading && !subscriptionLoading && isSetupComplete && !isSubscribed) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        setShowPaywall(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, subscriptionLoading, isSetupComplete, isSubscribed]);

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

    // Show paywall unless already subscribed
    if (!isSubscribed) {
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

  // Render landing page for new visitors
  if (showLanding && !isSetupComplete) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // Render setup wizard if not complete
  if (!isSetupComplete) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  // Render main app
  return (
    <div className="min-h-screen bg-dark-900">
      {/* Paywall Overlay - shown after setup if not subscribed */}
      <PaywallOverlay
        isVisible={showPaywall && !isSubscribed}
        onClose={() => setShowPaywall(false)}
        onSuccess={handleSubscriptionSuccess}
        program={program}
      />

      {/* Main Content - with blur effect if not subscribed */}
      <div className={!isSubscribed && isSetupComplete ? 'relative' : ''}>
        {/* Blur overlay for non-subscribers (dashboard still visible) */}
        {!isSubscribed && isSetupComplete && activeTab !== 'dashboard' && (
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
            isSubscribed={isSubscribed}
            onLogMeal={() => isSubscribed ? setShowMealModal(true) : setShowPaywall(true)}
            onLogWorkout={() => isSubscribed ? setShowWorkoutModal(true) : setShowPaywall(true)}
            onViewProgram={() => isSubscribed ? setActiveTab('program') : setShowPaywall(true)}
            onViewNutrition={() => isSubscribed ? setActiveTab('nutrition') : setShowPaywall(true)}
            onShowPaywall={() => setShowPaywall(true)}
            onCreateMealPlan={() => setShowNutritionPreferences(true)}
          />
        )}

        {activeTab === 'program' && isSubscribed && (
          <ProgramView
            program={program}
            completedWorkouts={completedExercises}
            onCompleteExercise={handleCompleteExercise}
            onCompleteSession={handleCompleteSession}
            onUpdateExerciseLog={handleUpdateExerciseLog}
            onBack={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'nutrition' && isSubscribed && (
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

        {activeTab === 'stats' && isSubscribed && (
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
            isSubscribed={isSubscribed}
            onResetSetup={handleResetSetup}
            onShowPaywall={() => setShowPaywall(true)}
          />
        )}
      </div>

      {/* Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onChange={(tab) => {
          if (!isSubscribed && tab !== 'dashboard' && tab !== 'profile') {
            setShowPaywall(true);
          } else {
            setActiveTab(tab);
          }
        }}
        isSubscribed={isSubscribed}
      />

      {/* Modals */}
      <LogMealModal
        isOpen={showMealModal}
        onClose={() => setShowMealModal(false)}
        onSave={handleLogMeal}
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
