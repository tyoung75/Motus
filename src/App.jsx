import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SetupWizard } from './components/SetupWizard/SetupWizard';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProgramView } from './components/Program/ProgramView';
import { NutritionView } from './components/Nutrition/NutritionView';
import { StatsView } from './components/Stats/StatsView';
import { ProfileView } from './components/Profile/ProfileView';
import { LogMealModal } from './components/Modals/LogMealModal';
import { LogWorkoutModal } from './components/Modals/LogWorkoutModal';
import { TabBar } from './components/shared/TabBar';
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
  const [isLoading, setIsLoading] = useState(true);

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
      }

      setIsLoading(false);
    };

    if (!authLoading) {
      loadData();
    }
  }, [isAuthenticated, authLoading]);

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
    setIsSetupComplete(true);
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
  if (authLoading || isLoading) {
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

  // Render setup wizard if not complete
  if (!isSetupComplete) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  // Render main app
  return (
    <div className="min-h-screen bg-dark-900">
      {/* Main Content */}
      {activeTab === 'dashboard' && (
        <Dashboard
          profile={profile}
          program={program}
          todaysMeals={todaysMeals}
          todaysWorkouts={todaysWorkouts}
          onLogMeal={() => setShowMealModal(true)}
          onLogWorkout={() => setShowWorkoutModal(true)}
          onViewProgram={() => setActiveTab('program')}
          onViewNutrition={() => setActiveTab('nutrition')}
        />
      )}

      {activeTab === 'program' && (
        <ProgramView
          program={program}
          completedWorkouts={completedExercises}
          onCompleteExercise={handleCompleteExercise}
          onBack={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'nutrition' && (
        <NutritionView
          profile={profile}
          meals={meals}
          workouts={workouts}
          onLogMeal={() => setShowMealModal(true)}
          onDeleteMeal={handleDeleteMeal}
          onBack={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'stats' && (
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
          onResetSetup={handleResetSetup}
        />
      )}

      {/* Tab Bar */}
      <TabBar activeTab={activeTab} onChange={setActiveTab} />

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
      <AppContent />
    </AuthProvider>
  );
}

export default App;
