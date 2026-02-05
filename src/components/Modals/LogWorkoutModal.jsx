import React, { useState, useRef } from 'react';
import { Camera, Plus, Trash2, Dumbbell, ChevronDown, Search } from 'lucide-react';
import { Modal, Button, Input } from '../shared';

// 150 common exercises in alphabetical order
const COMMON_EXERCISES = [
  "Ab Wheel Rollout",
  "Arnold Press",
  "Back Extension",
  "Band Pull Apart",
  "Barbell Bent Over Row",
  "Barbell Curl",
  "Barbell Hip Thrust",
  "Barbell Lunge",
  "Barbell Row",
  "Barbell Shrug",
  "Barbell Squat",
  "Battle Ropes",
  "Bench Dip",
  "Bench Press",
  "Bent Over Dumbbell Row",
  "Bicycle Crunch",
  "Bird Dog",
  "Box Jump",
  "Bulgarian Split Squat",
  "Burpee",
  "Cable Crossover",
  "Cable Crunch",
  "Cable Face Pull",
  "Cable Fly",
  "Cable Kickback",
  "Cable Lateral Raise",
  "Cable Pull Through",
  "Cable Row",
  "Cable Tricep Extension",
  "Cable Woodchop",
  "Calf Press",
  "Calf Raise",
  "Chest Dip",
  "Chest Fly",
  "Chin Up",
  "Clean",
  "Clean and Jerk",
  "Close Grip Bench Press",
  "Concentration Curl",
  "Crunch",
  "Dead Bug",
  "Deadlift",
  "Decline Bench Press",
  "Decline Crunch",
  "Deficit Deadlift",
  "Dip",
  "Dumbbell Bench Press",
  "Dumbbell Bulgarian Split Squat",
  "Dumbbell Curl",
  "Dumbbell Fly",
  "Dumbbell Front Raise",
  "Dumbbell Lateral Raise",
  "Dumbbell Lunge",
  "Dumbbell Overhead Press",
  "Dumbbell Pullover",
  "Dumbbell Romanian Deadlift",
  "Dumbbell Row",
  "Dumbbell Shrug",
  "Dumbbell Squat",
  "Dumbbell Step Up",
  "Dumbbell Tricep Extension",
  "EZ Bar Curl",
  "EZ Bar Skull Crusher",
  "Face Pull",
  "Farmer's Walk",
  "Floor Press",
  "Front Raise",
  "Front Squat",
  "Glute Bridge",
  "Goblet Squat",
  "Good Morning",
  "Hack Squat",
  "Hammer Curl",
  "Hanging Knee Raise",
  "Hanging Leg Raise",
  "High Pull",
  "Hip Abduction",
  "Hip Adduction",
  "Hip Thrust",
  "Incline Bench Press",
  "Incline Dumbbell Curl",
  "Incline Dumbbell Fly",
  "Incline Dumbbell Press",
  "Inverted Row",
  "Jump Rope",
  "Jump Squat",
  "Kettlebell Clean",
  "Kettlebell Snatch",
  "Kettlebell Swing",
  "Kettlebell Turkish Get Up",
  "Kneeling Cable Crunch",
  "Landmine Press",
  "Landmine Row",
  "Lat Pulldown",
  "Lateral Raise",
  "Leg Curl",
  "Leg Extension",
  "Leg Press",
  "Leg Raise",
  "Lunges",
  "Lying Leg Curl",
  "Lying Tricep Extension",
  "Machine Chest Press",
  "Machine Fly",
  "Machine Row",
  "Machine Shoulder Press",
  "Medicine Ball Slam",
  "Military Press",
  "Mountain Climber",
  "Muscle Up",
  "Overhead Press",
  "Overhead Squat",
  "Pallof Press",
  "Pause Squat",
  "Pec Deck",
  "Pendlay Row",
  "Pistol Squat",
  "Plank",
  "Power Clean",
  "Preacher Curl",
  "Press Up",
  "Pull Up",
  "Push Press",
  "Push Up",
  "Rack Pull",
  "Rear Delt Fly",
  "Reverse Crunch",
  "Reverse Fly",
  "Reverse Grip Lat Pulldown",
  "Reverse Lunge",
  "Romanian Deadlift",
  "Rope Climb",
  "Rope Tricep Pushdown",
  "Rowing Machine",
  "Russian Twist",
  "Seated Cable Row",
  "Seated Calf Raise",
  "Seated Dumbbell Press",
  "Seated Leg Curl",
  "Shoulder Press",
  "Side Bend",
  "Side Plank",
  "Single Arm Dumbbell Row",
  "Single Leg Deadlift",
  "Single Leg Squat",
  "Sissy Squat",
  "Sit Up",
  "Skull Crusher",
  "Sled Push",
  "Smith Machine Squat",
  "Snatch",
  "Spider Curl",
  "Split Squat",
  "Squat",
  "Standing Calf Raise",
  "Step Up",
  "Stiff Leg Deadlift",
  "Sumo Deadlift",
  "Sumo Squat",
  "Superman",
  "T-Bar Row",
  "Thruster",
  "Toe Touch",
  "Trap Bar Deadlift",
  "Tricep Dip",
  "Tricep Kickback",
  "Tricep Pushdown",
  "Upright Row",
  "V-Up",
  "Walking Lunge",
  "Wall Ball",
  "Wide Grip Lat Pulldown",
  "Wide Grip Pull Up",
  "Wrist Curl",
  "Zercher Squat",
  "Zottman Curl"
];

export function LogWorkoutModal({ isOpen, onClose, onSave, program }) {
  const [workoutType, setWorkoutType] = useState('strength');
  const [duration, setDuration] = useState('');
  const [sessionTime, setSessionTime] = useState('AM');
  const [exercises, setExercises] = useState([]);
  const [notes, setNotes] = useState('');
  const [rpe, setRpe] = useState('7');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setScreenshotPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const addExercise = () => {
    setExercises([...exercises, { id: Date.now(), name: '', sets: '', reps: '', weight: '' }]);
    setActiveDropdown(null);
    setSearchQuery('');
  };
  const updateExercise = (id, field, value) => {
    setExercises(exercises.map((ex) => ex.id === id ? { ...ex, [field]: value } : ex));
    if (field === 'name') {
      setActiveDropdown(null);
      setSearchQuery('');
    }
  };
  const removeExercise = (id) => setExercises(exercises.filter((ex) => ex.id !== id));

  // Filter exercises based on search query
  const getFilteredExercises = () => {
    if (!searchQuery) return COMMON_EXERCISES;
    return COMMON_EXERCISES.filter(ex =>
      ex.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleSave = () => {
    onSave({
      type: workoutType,
      duration: parseInt(duration) || 0,
      sessionTime,
      exercises: exercises.filter((ex) => ex.name),
      notes,
      screenshot: screenshotPreview,
      overallRpe: parseInt(rpe),
      day: new Date().getDay() || 7,
      loggedAt: new Date().toISOString(),
    });
    setWorkoutType('strength'); setDuration(''); setSessionTime('AM'); setExercises([]); setNotes(''); setRpe('7');
    setScreenshot(null); setScreenshotPreview(null); setActiveDropdown(null); setSearchQuery('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Workout" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">Type</label>
            <div className="flex gap-2">
              {['strength', 'cardio', 'hiit'].map((type) => (
                <button key={type} onClick={() => setWorkoutType(type)} className={`flex-1 py-2 px-3 rounded-lg border text-sm ${workoutType === type ? 'bg-accent-primary border-accent-primary text-white' : 'bg-dark-700 border-dark-500 text-gray-400'}`}>
                  {type === 'strength' ? '🏋️' : type === 'cardio' ? '🏃' : '⚡'} {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">Session</label>
            <div className="flex gap-2">
              {['AM', 'PM'].map((time) => (
                <button key={time} onClick={() => setSessionTime(time)} className={`flex-1 py-2 px-3 rounded-lg border text-sm ${sessionTime === time ? (time === 'AM' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-blue-500/20 border-blue-500 text-blue-400') : 'bg-dark-700 border-dark-500 text-gray-400'}`}>
                  {time === 'AM' ? '🌅' : '🌙'} {time}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Duration (min)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="60" />
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">RPE</label>
            <select value={rpe} onChange={(e) => setRpe(e.target.value)} className="w-full px-4 py-2.5 bg-dark-700 border border-dark-500 rounded-lg text-white">
              {[6, 7, 8, 9, 10].map((val) => <option key={val} value={val}>RPE {val}</option>)}
            </select>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-400">Exercises</label>
            <Button variant="ghost" size="sm" onClick={addExercise}><Plus className="w-4 h-4 mr-1" />Add</Button>
          </div>
          {exercises.length > 0 ? (
            <div className="space-y-3">
              {exercises.map((ex, idx) => (
                <div key={ex.id} className="p-3 bg-dark-700 rounded-lg border border-dark-600">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-500">#{idx + 1}</span>
                    {/* Searchable Exercise Dropdown */}
                    <div className="flex-1 relative">
                      <div
                        className="flex items-center justify-between px-3 py-1.5 bg-dark-600 border border-dark-500 rounded text-sm cursor-pointer hover:border-dark-400"
                        onClick={() => {
                          setActiveDropdown(activeDropdown === ex.id ? null : ex.id);
                          setSearchQuery(ex.name || '');
                        }}
                      >
                        <span className={ex.name ? 'text-white' : 'text-gray-500'}>
                          {ex.name || 'Select exercise...'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>

                      {/* Dropdown */}
                      {activeDropdown === ex.id && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-dark-700 border border-dark-500 rounded-lg shadow-xl max-h-60 overflow-hidden">
                          {/* Search Input */}
                          <div className="p-2 border-b border-dark-600">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Type to search..."
                                className="w-full pl-8 pr-3 py-1.5 bg-dark-600 border border-dark-500 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent-primary"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>

                          {/* Exercise List */}
                          <div className="max-h-48 overflow-y-auto">
                            {getFilteredExercises().length > 0 ? (
                              getFilteredExercises().map((exerciseName) => (
                                <button
                                  key={exerciseName}
                                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-dark-600 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateExercise(ex.id, 'name', exerciseName);
                                  }}
                                >
                                  {exerciseName}
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No matches. Use custom name: "{searchQuery}"
                                <button
                                  className="block w-full mt-2 px-3 py-1.5 bg-accent-primary/20 text-accent-primary rounded text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateExercise(ex.id, 'name', searchQuery);
                                  }}
                                >
                                  Use "{searchQuery}"
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <button onClick={() => removeExercise(ex.id)} className="p-1.5 text-gray-500 hover:text-accent-danger"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" value={ex.sets} onChange={(e) => updateExercise(ex.id, 'sets', e.target.value)} placeholder="Sets" className="px-3 py-1.5 bg-dark-600 border border-dark-500 rounded text-white text-sm placeholder-gray-500" />
                    <input type="text" value={ex.reps} onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)} placeholder="Reps" className="px-3 py-1.5 bg-dark-600 border border-dark-500 rounded text-white text-sm placeholder-gray-500" />
                    <input type="text" value={ex.weight} onChange={(e) => updateExercise(ex.id, 'weight', e.target.value)} placeholder="Weight" className="px-3 py-1.5 bg-dark-600 border border-dark-500 rounded text-white text-sm placeholder-gray-500" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center bg-dark-700 rounded-lg border border-dashed border-dark-500">
              <Dumbbell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Click "Add" to track exercises</p>
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-400 mb-2 block">Screenshot (Optional)</label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          {screenshotPreview ? (
            <div className="relative">
              <img src={screenshotPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
              <button onClick={() => setScreenshotPreview(null)} className="absolute top-2 right-2 p-2 bg-dark-900/80 rounded-lg"><Trash2 className="w-4 h-4 text-white" /></button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} className="w-full p-6 border-2 border-dashed border-dark-500 rounded-lg hover:border-accent-primary flex flex-col items-center gap-2">
              <Camera className="w-6 h-6 text-gray-400" /><span className="text-sm text-gray-400">Upload screenshot</span>
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} fullWidth>Cancel</Button>
          <Button onClick={handleSave} fullWidth><Plus className="w-4 h-4 mr-2" />Log Workout</Button>
        </div>
      </div>
    </Modal>
  );
}

export default LogWorkoutModal;
