import React, { useState, useRef } from 'react';
import { Camera, Plus, Trash2, Dumbbell } from 'lucide-react';
import { Modal, Button, Input } from '../shared';

export function LogWorkoutModal({ isOpen, onClose, onSave, program }) {
  const [workoutType, setWorkoutType] = useState('strength');
  const [duration, setDuration] = useState('');
  const [sessionTime, setSessionTime] = useState('AM');
  const [exercises, setExercises] = useState([]);
  const [notes, setNotes] = useState('');
  const [rpe, setRpe] = useState('7');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setScreenshotPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const addExercise = () => setExercises([...exercises, { id: Date.now(), name: '', sets: '', reps: '', weight: '' }]);
  const updateExercise = (id, field, value) => setExercises(exercises.map((ex) => ex.id === id ? { ...ex, [field]: value } : ex));
  const removeExercise = (id) => setExercises(exercises.filter((ex) => ex.id !== id));

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
    setScreenshot(null); setScreenshotPreview(null);
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
                    <input type="text" value={ex.name} onChange={(e) => updateExercise(ex.id, 'name', e.target.value)} placeholder="Exercise name" className="flex-1 px-3 py-1.5 bg-dark-600 border border-dark-500 rounded text-white text-sm placeholder-gray-500" />
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
