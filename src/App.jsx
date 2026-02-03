import React, { useState, useEffect } from 'react';
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

function App() {
  // Persisted state
  const [profile, setProfile] = useLocalStorage('motus_profile', null);
  const [program, setProgram] = useLocalStorage('motus_program', null);
  const [meals, setMeals] = useLocalStorage('motus_meals', []);
  const [workouts, setWorkouts] = useLocalStorage('motus_workouts', []);
  const [completedExercises, setCompletedExercises] = useLocalStorage('motus_completed', []);

  // UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMealModal, setShowMealModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Check if setup is complete on mount
  useEffect(() => {
    if (profile && program) {
      setIsSetupComplete(true);
    }
  }, [profile, program]);

  // Handle setup completion
  const handleSetupComplete = (data) => {
    setProfile(data.profile);
    setProgram(data.program);
    setIsSetupComplete(true);
  };

  // Handle meal logging
  const handleLogMeal = (meal) => {
    setMeals([...meals, { ...meal, id: Date.now() }]);
    setShowMealModal(false);
  };

  // Handle meal deletion
  const handleDeleteMeal = (mealId) => {
    setMeals(meals.filter((m) => m.id !== mealId));
  };

  // Handle workout logging
  const handleLogWorkout = (workout) => {
    setWorkouts([...workouts, { ...workout, id: Date.now() }]);
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
  const handleResetSetup = () => {
    if (window.confirm('Are you sure you want to reset? All your data will be lost.')) {
      setProfile(null);
      setProgram(null);
      setMeals([]);
      setWorkouts([]);
      setCompletedExercises([]);
      setIsSetupComplete(false);
      setActiveTab('dashboard');
    }
  };

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

export default App;
