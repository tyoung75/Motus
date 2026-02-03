import React from 'react';
import { Scale, Target, Calendar, Flame, RefreshCw } from 'lucide-react';
import { Card, CardBody, Button } from '../shared';

export function ProfileView({ profile, program, onResetSetup }) {
  const { macros } = profile;
  const goalLabels = { strength: '💪 Strength', bodybuilding: '🏋️ Bodybuilding', endurance: '🏃 Endurance', fatloss: '⚖️ Fat Loss', marathon: '🏃 Marathon', general: '💪 General' };

  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      <header className="px-6 py-8 bg-gradient-to-b from-accent-primary/20 to-dark-900">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-accent-primary rounded-full flex items-center justify-center">
            <span className="text-3xl">{profile.name ? profile.name.charAt(0).toUpperCase() : '👤'}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{profile.name || 'Athlete'}</h1>
            <p className="text-gray-400">{profile.experienceLevel?.charAt(0).toUpperCase() + profile.experienceLevel?.slice(1)} Level</p>
          </div>
        </div>
      </header>

      <div className="px-6 py-4 space-y-4">
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Scale className="w-5 h-5 text-accent-secondary" />Body Stats</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-dark-700 rounded-lg"><p className="text-2xl font-bold text-white">{profile.weight}</p><p className="text-xs text-gray-400">{profile.weightUnit || 'lbs'}</p></div>
              <div className="text-center p-3 bg-dark-700 rounded-lg"><p className="text-2xl font-bold text-white">{profile.height}</p><p className="text-xs text-gray-400">{profile.heightUnit || 'in'}</p></div>
              <div className="text-center p-3 bg-dark-700 rounded-lg"><p className="text-2xl font-bold text-white">{profile.age}</p><p className="text-xs text-gray-400">years</p></div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Flame className="w-5 h-5 text-accent-warning" />Daily Nutrition Targets</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-dark-700 rounded-lg"><p className="text-3xl font-bold text-white">{macros?.calories}</p><p className="text-sm text-gray-400">Calories</p></div>
              <div className="p-4 bg-dark-700 rounded-lg"><p className="text-3xl font-bold text-accent-success">{macros?.protein}g</p><p className="text-sm text-gray-400">Protein</p></div>
              <div className="p-4 bg-dark-700 rounded-lg"><p className="text-3xl font-bold text-accent-warning">{macros?.carbs}g</p><p className="text-sm text-gray-400">Carbs</p></div>
              <div className="p-4 bg-dark-700 rounded-lg"><p className="text-3xl font-bold text-accent-secondary">{macros?.fat}g</p><p className="text-sm text-gray-400">Fat</p></div>
            </div>
            <p className="text-xs text-gray-500 mt-3">TDEE: {profile.tdee} kcal/day • BMR: {profile.bmr} kcal/day</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-accent-primary" />Training Goals</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg"><span className="text-gray-400">Primary</span><span className="text-white font-medium">{goalLabels[profile.programSubtype] || profile.programType}</span></div>
              {profile.enableHybrid && profile.secondaryProgramType && (
                <div className="flex items-center justify-between p-3 bg-accent-primary/10 border border-accent-primary/30 rounded-lg"><span className="text-accent-primary">Hybrid</span><span className="text-white">🔥 {profile.allowDoubleDays ? 'AM/PM Splits' : 'Alternating'}</span></div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-accent-secondary" />Current Program</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-gray-400">Program</span><span className="text-white">{program?.name || 'Custom'}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-400">Week</span><span className="text-white">{program?.currentWeek} of {program?.mesocycleWeeks}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-400">Phase</span><span className="text-white">{program?.currentPhase}</span></div>
            </div>
          </CardBody>
        </Card>

        <div className="pt-4">
          <Button variant="secondary" fullWidth onClick={onResetSetup}><RefreshCw className="w-4 h-4 mr-2" />Reset & Start Over</Button>
        </div>
        <p className="text-center text-xs text-gray-600 pt-4">MOTUS v1.0 • Powered by Claude AI</p>
      </div>
    </div>
  );
}

export default ProfileView;
