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

  // Calorie distribution
  const mealCalories = Math.round(targetCalories * 0.3); // 30% per main meal
  const snackCalories = Math.round(targetCalories * 0.1); // 10% per snack

  // Sample recipes database
  const sampleMeals = {
    breakfast: [
      { id: 'b1', title: 'Greek Yogurt Parfait', calories: 350, protein: 25, carbs: 40, fat: 12, readyInMinutes: 5, image: null },
      { id: 'b2', title: 'Avocado Toast with Eggs', calories: 420, protein: 22, carbs: 35, fat: 24, readyInMinutes: 15, image: null },
      { id: 'b3', title: 'Protein Oatmeal Bowl', calories: 380, protein: 28, carbs: 48, fat: 10, readyInMinutes: 10, image: null },
      { id: 'b4', title: 'Veggie Egg Scramble', calories: 340, protein: 24, carbs: 12, fat: 22, readyInMinutes: 12, image: null },
      { id: 'b5', title: 'Smoothie Bowl', calories: 360, protein: 20, carbs: 52, fat: 8, readyInMinutes: 8, image: null },
      { id: 'b6', title: 'Overnight Oats', calories: 390, protein: 18, carbs: 55, fat: 12, readyInMinutes: 5, image: null },
      { id: 'b7', title: 'Breakfast Burrito', calories: 450, protein: 28, carbs: 42, fat: 18, readyInMinutes: 15, image: null },
    ],
    lunch: [
      { id: 'l1', title: 'Grilled Chicken Salad', calories: 480, protein: 42, carbs: 22, fat: 24, readyInMinutes: 20, image: null },
      { id: 'l2', title: 'Quinoa Buddha Bowl', calories: 520, protein: 22, carbs: 65, fat: 18, readyInMinutes: 25, image: null },
      { id: 'l3', title: 'Turkey & Avocado Wrap', calories: 490, protein: 35, carbs: 42, fat: 20, readyInMinutes: 10, image: null },
      { id: 'l4', title: 'Salmon Poke Bowl', calories: 550, protein: 38, carbs: 48, fat: 22, readyInMinutes: 15, image: null },
      { id: 'l5', title: 'Mediterranean Plate', calories: 480, protein: 28, carbs: 45, fat: 22, readyInMinutes: 15, image: null },
      { id: 'l6', title: 'Asian Chicken Stir Fry', calories: 460, protein: 36, carbs: 38, fat: 18, readyInMinutes: 20, image: null },
      { id: 'l7', title: 'Black Bean Tacos', calories: 440, protein: 18, carbs: 55, fat: 16, readyInMinutes: 15, image: null },
    ],
    dinner: [
      { id: 'd1', title: 'Herb Crusted Salmon', calories: 580, protein: 45, carbs: 25, fat: 32, readyInMinutes: 30, image: null },
      { id: 'd2', title: 'Lean Beef Stir Fry', calories: 520, protein: 40, carbs: 35, fat: 24, readyInMinutes: 25, image: null },
      { id: 'd3', title: 'Grilled Chicken & Veggies', calories: 490, protein: 48, carbs: 28, fat: 20, readyInMinutes: 35, image: null },
      { id: 'd4', title: 'Shrimp Pasta Primavera', calories: 540, protein: 32, carbs: 58, fat: 18, readyInMinutes: 30, image: null },
      { id: 'd5', title: 'Turkey Meatballs & Zoodles', calories: 450, protein: 42, carbs: 22, fat: 22, readyInMinutes: 35, image: null },
      { id: 'd6', title: 'Baked Cod with Quinoa', calories: 480, protein: 38, carbs: 42, fat: 16, readyInMinutes: 30, image: null },
      { id: 'd7', title: 'Chicken Tikka Masala', calories: 560, protein: 40, carbs: 45, fat: 24, readyInMinutes: 40, image: null },
    ],
    snack: [
      { id: 's1', title: 'Protein Shake', calories: 180, protein: 25, carbs: 12, fat: 4, readyInMinutes: 2, image: null },
      { id: 's2', title: 'Apple & Almond Butter', calories: 220, protein: 6, carbs: 28, fat: 12, readyInMinutes: 2, image: null },
      { id: 's3', title: 'Greek Yogurt & Berries', calories: 160, protein: 15, carbs: 18, fat: 4, readyInMinutes: 2, image: null },
      { id: 's4', title: 'Trail Mix', calories: 200, protein: 6, carbs: 20, fat: 12, readyInMinutes: 1, image: null },
      { id: 's5', title: 'Cottage Cheese & Fruit', calories: 180, protein: 18, carbs: 16, fat: 5, readyInMinutes: 2, image: null },
      { id: 's6', title: 'Hummus & Veggies', calories: 150, protein: 6, carbs: 18, fat: 8, readyInMinutes: 3, image: null },
      { id: 's7', title: 'Protein Bar', calories: 210, protein: 20, carbs: 22, fat: 8, readyInMinutes: 1, image: null },
    ]
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

  days.forEach((day, dayIndex) => {
    const dayId = dayIds[dayIndex];
    const dayMeals = [];
    let dayCalories = 0;
    let dayProtein = 0;
    let dayCarbs = 0;
    let dayFat = 0;
    let mealIndex = 0;

    // Add main meals
    const mealTypes = mealsPerDay === 2 ? ['breakfast', 'dinner'] :
                      mealsPerDay === 3 ? ['breakfast', 'lunch', 'dinner'] :
                      ['breakfast', 'lunch', 'snack', 'dinner'];

    mealTypes.forEach((type, idx) => {
      // Check if this meal is excluded
      const isExcluded = preferences.excludedMeals?.[`${dayId}-${mealIndex}`];
      mealIndex++;

      if (!isExcluded) {
        const mealOptions = sampleMeals[type] || sampleMeals.lunch;
        const meal = mealOptions[dayIndex % mealOptions.length];
        dayMeals.push({ ...meal, type });
        dayCalories += meal.calories;
        dayProtein += meal.protein;
        dayCarbs += meal.carbs;
        dayFat += meal.fat;

        // Add recipe details if available
        if (recipeDetails[meal.id]) {
          recipes[meal.id] = { ...meal, ...recipeDetails[meal.id] };
        } else {
          recipes[meal.id] = {
            ...meal,
            ingredients: [
              { original: 'Ingredient 1' },
              { original: 'Ingredient 2' },
              { original: 'Ingredient 3' }
            ],
            instructions: ['Step 1: Prepare ingredients', 'Step 2: Cook', 'Step 3: Serve and enjoy']
          };
        }
      }
    });

    // Add snacks
    for (let i = 0; i < snacksPerDay; i++) {
      const isExcluded = preferences.excludedMeals?.[`${dayId}-${mealIndex}`];
      mealIndex++;

      if (!isExcluded) {
        const snack = sampleMeals.snack[(dayIndex + i) % sampleMeals.snack.length];
        dayMeals.push({ ...snack, type: 'snack' });
        dayCalories += snack.calories;
        dayProtein += snack.protein;
        dayCarbs += snack.carbs;
        dayFat += snack.fat;

        recipes[snack.id] = {
          ...snack,
          ingredients: [{ original: 'Quick snack - no prep needed' }],
          instructions: ['Enjoy!']
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
