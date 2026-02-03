import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Circle, Zap } from 'lucide-react';
import { Card, CardBody, Button } from '../shared';

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function ProgramView({ program, completedWorkouts, onCompleteExercise, onBack }) {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 7);
  const [expandedSession, setExpandedSession] = useState(0);
  const daySchedule = program?.weeklySchedule?.find((d) => d.day === selectedDay);

  const isExerciseCompleted = (sessionIndex, exerciseIndex) => {
    return completedWorkouts.some((w) => w.day === selectedDay && w.sessionIndex === sessionIndex && w.completedExercises?.includes(exerciseIndex));
  };

  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      <header className="px-6 py-4 bg-dark-800 border-b border-dark-700">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-dark-700"><ChevronLeft className="w-6 h-6 text-white" /></button>
          <div>
            <h1 className="text-xl font-bold text-white">{program?.name || 'Your Program'}</h1>
            <p className="text-gray-400 text-sm">Week {program?.currentWeek} • {program?.currentPhase} Phase</p>
          </div>
        </div>
      </header>

      <div className="px-6 py-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const schedule = program?.weeklySchedule?.find((d) => d.day === day);
            const isRest = schedule?.isRestDay;
            const isSelected = selectedDay === day;
            const isToday = (new Date().getDay() || 7) === day;
            return (
              <button key={day} onClick={() => setSelectedDay(day)} className={`flex flex-col items-center px-4 py-2 rounded-xl min-w-[60px] transition-all ${isSelected ? 'bg-accent-primary text-white' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'} ${isRest && !isSelected ? 'opacity-50' : ''}`}>
                <span className="text-xs font-medium">{DAY_NAMES[day]}</span>
                <span className="text-lg font-bold mt-1">{isRest ? '🧘' : '💪'}</span>
                {isToday && <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary mt-1" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-4">
        {daySchedule?.isRestDay ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🧘</span>
            <h2 className="text-xl font-semibold text-white mb-2">Rest Day</h2>
            <p className="text-gray-400">Active recovery encouraged - light stretching or walking.</p>
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
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${session.time === 'AM' ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}>
                          <span className="text-2xl">{session.type === 'strength' ? '🏋️' : session.type === 'cardio' ? '🏃' : '⚡'}</span>
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded ${session.time === 'AM' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>{session.time}</span>
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
                              <span className="text-gray-400"><span className="text-white font-medium">{exercise.sets}</span> sets</span>
                              <span className="text-gray-400"><span className="text-white font-medium">{exercise.reps}</span> reps</span>
                              {exercise.rpe && <span className="text-gray-400">RPE <span className="text-accent-warning font-medium">{exercise.rpe}</span></span>}
                              {exercise.rest && <span className="text-gray-400">Rest <span className="text-white">{exercise.rest}</span></span>}
                            </div>
                            {exercise.notes && <p className="mt-2 text-sm text-gray-500 italic">💡 {exercise.notes}</p>}
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
