import React from 'react';
import { BarChart3, TrendingUp, Calendar, Flame, Dumbbell, Target } from 'lucide-react';
import { Card, CardBody, ProgressBar } from '../shared';

export function StatsView({ profile, program, meals, workouts }) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weeklyMeals = meals.filter((m) => new Date(m.loggedAt || m.createdAt) >= weekStart);
  const weeklyWorkouts = workouts.filter((w) => new Date(w.loggedAt || w.completedAt) >= weekStart);

  const avgCalories = weeklyMeals.length ? Math.round(weeklyMeals.reduce((sum, m) => sum + (m.calories || 0), 0) / Math.min(7, weeklyMeals.length)) : 0;
  const avgProtein = weeklyMeals.length ? Math.round(weeklyMeals.reduce((sum, m) => sum + (m.protein || 0), 0) / Math.min(7, weeklyMeals.length)) : 0;
  const targetWorkouts = profile.daysPerWeek || 4;
  const adherencePercent = Math.min(Math.round((weeklyWorkouts.length / targetWorkouts) * 100), 100);
  const weeklyVolume = weeklyWorkouts.reduce((total, w) => total + (w.exercises?.reduce((s, ex) => s + (parseInt(ex.sets) || 0), 0) || 0), 0);

  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      <header className="px-6 py-5 bg-dark-800 border-b border-dark-700">
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><BarChart3 className="w-6 h-6 text-accent-primary" />Stats & Progress</h1>
        <p className="text-gray-400 text-sm mt-1">This week's overview</p>
      </header>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card><CardBody className="text-center"><Dumbbell className="w-8 h-8 text-accent-primary mx-auto mb-2" /><div className="text-3xl font-bold text-white">{weeklyWorkouts.length}</div><p className="text-sm text-gray-400">Workouts</p><p className="text-xs text-gray-500 mt-1">of {targetWorkouts} planned</p></CardBody></Card>
          <Card><CardBody className="text-center"><Target className="w-8 h-8 text-accent-success mx-auto mb-2" /><div className="text-3xl font-bold text-white">{adherencePercent}%</div><p className="text-sm text-gray-400">Adherence</p></CardBody></Card>
        </div>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-accent-primary" />Training Progress</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between"><span className="text-gray-400">Program Week</span><span className="text-white font-medium">{program?.currentWeek || 1} of {program?.mesocycleWeeks || 4}</span></div>
              <ProgressBar value={program?.currentWeek || 1} max={program?.mesocycleWeeks || 4} color="primary" />
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-3 bg-dark-700 rounded-lg"><p className="text-2xl font-bold text-white">{weeklyVolume}</p><p className="text-xs text-gray-400">Weekly Sets</p></div>
                <div className="p-3 bg-dark-700 rounded-lg"><p className="text-2xl font-bold text-white">{weeklyWorkouts.length > 0 ? Math.round(weeklyWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) / weeklyWorkouts.length) : 0}</p><p className="text-xs text-gray-400">Avg Duration</p></div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Flame className="w-5 h-5 text-accent-warning" />Nutrition Averages</h2>
            <div className="space-y-4">
              <div><div className="flex justify-between mb-1"><span className="text-gray-400">Avg Daily Calories</span><span className="text-white">{avgCalories} / {profile.macros?.calories}</span></div><ProgressBar value={avgCalories} max={profile.macros?.calories || 2000} color={avgCalories > (profile.macros?.calories || 2000) ? 'danger' : 'warning'} size="sm" /></div>
              <div><div className="flex justify-between mb-1"><span className="text-gray-400">Avg Daily Protein</span><span className="text-white">{avgProtein}g / {profile.macros?.protein}g</span></div><ProgressBar value={avgProtein} max={profile.macros?.protein || 150} color="success" size="sm" /></div>
              <div className="pt-2 text-sm text-gray-500">Based on {weeklyMeals.length} logged meals</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-accent-secondary" />Mesocycle Progress</h2>
            <div className="flex gap-2">
              {program?.phases?.map((phase, idx) => {
                const isCurrent = phase === program.currentPhase;
                const isPast = program.phases.indexOf(program.currentPhase) > idx;
                return <div key={phase} className={`flex-1 p-3 rounded-lg text-center text-sm ${isCurrent ? 'bg-accent-primary text-white' : isPast ? 'bg-accent-success/20 text-accent-success' : 'bg-dark-700 text-gray-500'}`}>{phase}</div>;
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default StatsView;
