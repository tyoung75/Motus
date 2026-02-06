import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext';
import { LandingPage } from './components/Landing/LandingPage';
import { SetupWizard } from './components/SetupWizard/SetupWizard';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProgramView } from './components/Program/ProgramView';
import { NutritionView } from './components/Nutrition/NutritionView';
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

  // UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMealModal, setShowMealModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

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
            onLogMeal={() => setShowMealModal(true)}
            onDeleteMeal={handleDeleteMeal}
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
