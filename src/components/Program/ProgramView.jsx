import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Circle, Zap, Droplets, Moon, Utensils, Heart } from 'lucide-react';
import { Card, CardBody, Button } from '../shared';

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Active recovery recommendations based on program type
const getRecoveryRecommendations = (program) => {
  const primaryGoal = program?.primaryGoal || 'aesthetic';

  const baseRecommendations = [
    {
      icon: '🧘',
      title: 'Stretching & Mobility',
      description: '15-20 min of dynamic stretching or yoga',
      detail: 'Focus on areas worked yesterday',
    },
    {
      icon: '🚶',
      title: 'Light Walk',
      description: '20-30 min easy walk outdoors',
      detail: 'Promotes blood flow without stress',
    },
    {
      icon: '💧',
      title: 'Hydration',
      description: 'Drink 3-4L water with electrolytes',
      detail: 'Sodium, potassium, magnesium for recovery',
      priority: true,
    },
    {
      icon: '😴',
      title: 'Sleep',
      description: 'Get 8+ hours of quality sleep',
      detail: 'Most recovery happens during deep sleep',
      priority: true,
    },
    {
      icon: '🍽️',
      title: 'Nutrition',
      description: 'Eat at maintenance or slight surplus',
      detail: 'Prioritize protein (1g/lb) for repair',
      priority: true,
    },
  ];

  // Add program-specific recommendations
  if (primaryGoal === 'endurance') {
    return [
      ...baseRecommendations,
      {
        icon: '🧊',
        title: 'Cold Therapy',
        description: '10-15 min ice bath or cold shower',
        detail: 'Reduces inflammation from high mileage',
      },
      {
        icon: '🦵',
        title: 'Foam Rolling',
        description: '10 min on calves, quads, IT band',
        detail: 'Breaks up adhesions, improves mobility',
      },
      {
        icon: '🩹',
        title: 'Compression',
        description: 'Wear compression socks/sleeves',
        detail: 'Promotes circulation and reduces swelling',
      },
    ];
  }

  if (primaryGoal === 'strength') {
    return [
      ...baseRecommendations,
      {
        icon: '🔥',
        title: 'Sauna',
        description: '15-20 min at 170-190°F',
        detail: 'Increases blood flow, promotes recovery',
      },
      {
        icon: '💆',
        title: 'Self-Massage',
        description: 'Lacrosse ball on tight areas',
        detail: 'Target shoulders, hips, and back',
      },
      {
        icon: '🧊',
        title: 'Contrast Therapy',
        description: '3 min hot / 1 min cold, repeat 3x',
        detail: 'Flushes metabolic waste from muscles',
      },
    ];
  }

  if (primaryGoal === 'aesthetic') {
    return [
      ...baseRecommendations,
      {
        icon: '🔥',
        title: 'Sauna',
        description: '15-20 min for recovery',
        detail: 'Also supports fat loss through heat exposure',
      },
      {
        icon: '🧘',
        title: 'Yoga Flow',
        description: '20-30 min gentle yoga',
        detail: 'Mind-muscle connection, flexibility',
      },
    ];
  }

  if (primaryGoal === 'fatloss') {
    return [
      ...baseRecommendations,
      {
        icon: '🚶',
        title: 'LISS Cardio',
        description: '30-45 min walk or light bike',
        detail: 'Burns extra calories without cortisol spike',
      },
      {
        icon: '🧊',
        title: 'Cold Exposure',
        description: '2-5 min cold shower',
        detail: 'Activates brown fat, boosts metabolism',
      },
    ];
  }

  return baseRecommendations;
};

export function ProgramView({ program, completedWorkouts, onCompleteExercise, onBack }) {
  // Default to Monday (day 1) when viewing program, not today
  const [selectedDay, setSelectedDay] = useState(1);
  const [expandedSession, setExpandedSession] = useState(0);
  const daySchedule = program?.weeklySchedule?.find((d) => d.day === selectedDay);

  const isExerciseCompleted = (sessionIndex, exerciseIndex) => {
    return completedWorkouts.some((w) => w.day === selectedDay && w.sessionIndex === sessionIndex && w.completedExercises?.includes(exerciseIndex));
  };

  const recoveryRecommendations = getRecoveryRecommendations(program);

  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      <header className="px-6 py-4 bg-dark-800 border-b border-dark-700">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-dark-700"><ChevronLeft className="w-6 h-6 text-white" /></button>
          <div>
            <h1 className="text-xl font-bold text-white">{program?.name || 'Your Program'}</h1>
            <p className="text-gray-400 text-sm">Week {program?.currentWeek} of {program?.totalWeeks || program?.mesocycleWeeks} • {program?.currentPhase} Phase</p>
          </div>
        </div>
      </header>

      <div className="px-6 py-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const schedule = program?.weeklySchedule?.find((d) => d.day === day);
            const isRest = schedule?.isRestDay;
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-center px-4 py-2 rounded-xl min-w-[60px] transition-all ${
                  isSelected
                    ? 'bg-accent-primary text-white'
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                } ${isRest && !isSelected ? 'opacity-50' : ''}`}
              >
                <span className="text-xs font-medium">{DAY_NAMES[day]}</span>
                <span className="text-lg font-bold mt-1">{isRest ? '🧘' : '💪'}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-4">
        {daySchedule?.isRestDay ? (
          <div className="space-y-4">
            {/* Rest Day Header */}
            <div className="text-center py-6">
              <span className="text-5xl mb-3 block">🧘</span>
              <h2 className="text-xl font-semibold text-white mb-1">Active Recovery Day</h2>
              <p className="text-gray-400 text-sm">Recovery is when adaptation happens. Make the most of it.</p>
            </div>

            {/* Priority Items */}
            <div className="bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 rounded-xl p-4 border border-accent-primary/30">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-accent-primary" />
                Recovery Essentials
              </h3>
              <div className="space-y-3">
                {recoveryRecommendations.filter(r => r.priority).map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-xl">{rec.icon}</span>
                    <div>
                      <p className="text-white font-medium">{rec.title}</p>
                      <p className="text-sm text-gray-300">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Recommendations */}
            <div>
              <h3 className="text-white font-semibold mb-3">Recommended Activities</h3>
              <div className="grid gap-3">
                {recoveryRecommendations.filter(r => !r.priority).map((rec, idx) => (
                  <Card key={idx}>
                    <CardBody className="flex items-start gap-3">
                      <span className="text-2xl">{rec.icon}</span>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{rec.title}</h4>
                        <p className="text-sm text-gray-400">{rec.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{rec.detail}</p>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recovery Tips */}
            <div className="bg-dark-800 rounded-xl p-4 border border-dark-600">
              <h3 className="text-white font-semibold mb-2">💡 Pro Tips</h3>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Avoid intense exercise - save it for training days</li>
                <li>• Listen to your body - if you feel sore, prioritize sleep</li>
                <li>• Mental recovery matters too - take time to destress</li>
                <li>• Prep meals for the week to stay on track</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">{daySchedule?.name}</h2>
            {daySchedule?.sessions?.map((session, sessionIdx) => (
              <Card key={sessionIdx}>
                <button onClick={() => setExpandedSession(expandedSession === sessionIdx ? -1 : sessionIdx)} className="w-full">
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${session.time === 'AM' ? 'bg-yellow-500/20' : session.time === 'PM' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                          <span className="text-2xl">{session.type === 'strength' || session.type === 'hypertrophy' ? '🏋️' : session.type === 'endurance' ? '🏃' : '⚡'}</span>
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded ${session.time === 'AM' ? 'bg-yellow-500/20 text-yellow-400' : session.time === 'PM' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{session.time}</span>
                            <h3 className="font-semibold text-white">{session.focus}</h3>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{session.duration} min</span>
                            <span>{session.exercises?.length} exercises</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedSession === sessionIdx ? 'rotate-90' : ''}`} />
                    </div>
                  </CardBody>
                </button>
                {expandedSession === sessionIdx && (
                  <div className="px-5 pb-5 space-y-3">
                    <hr className="border-dark-600" />
                    {session.exercises?.map((exercise, exIdx) => (
                      <div key={exIdx} className={`p-4 rounded-lg border ${isExerciseCompleted(sessionIdx, exIdx) ? 'bg-accent-success/10 border-accent-success/30' : 'bg-dark-700 border-dark-600'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-white">{exercise.name}</h4>
                              {isExerciseCompleted(sessionIdx, exIdx) && <CheckCircle className="w-4 h-4 text-accent-success" />}
                            </div>
                            <div className="flex flex-wrap gap-3 mt-2 text-sm">
                              {exercise.sets && <span className="text-gray-400"><span className="text-white font-medium">{exercise.sets}</span> sets</span>}
                              {exercise.reps && <span className="text-gray-400"><span className="text-white font-medium">{exercise.reps}</span></span>}
                              {exercise.rpe && <span className="text-gray-400">RPE <span className="text-accent-warning font-medium">{exercise.rpe}</span></span>}
                              {exercise.pace && <span className="text-gray-400">Pace <span className="text-accent-primary font-medium">{exercise.pace}</span></span>}
                              {exercise.heartRateZone && <span className="text-gray-400">Zone <span className="text-red-400 font-medium">{exercise.heartRateZone}</span></span>}
                              {exercise.rest && <span className="text-gray-400">Rest <span className="text-white">{exercise.rest}</span></span>}
                            </div>
                            {exercise.notes && <p className="mt-2 text-sm text-gray-500 italic">💡 {exercise.notes}</p>}
                            {exercise.progression && (
                              <p className="mt-1 text-xs text-accent-secondary">📈 {exercise.progression}</p>
                            )}
                          </div>
                          <button onClick={() => onCompleteExercise(selectedDay, sessionIdx, exIdx)} className={`p-2 rounded-lg transition-colors ${isExerciseCompleted(sessionIdx, exIdx) ? 'text-accent-success' : 'text-gray-500 hover:text-white hover:bg-dark-600'}`}>
                            {isExerciseCompleted(sessionIdx, exIdx) ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <Button fullWidth variant="success" className="mt-4"><Zap className="w-4 h-4 mr-2" />Complete Session</Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProgramView;
