import React, { useState, useRef } from 'react';
import { Camera, Plus, Trash2 } from 'lucide-react';
import { Modal, Button, Input } from '../shared';

export function LogMealModal({ isOpen, onClose, onSave }) {
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onload = (e) => setScreenshotPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({
      name: mealName || 'Meal',
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
      screenshot: screenshotPreview,
      loggedAt: new Date().toISOString(),
    });
    setMealName(''); setCalories(''); setProtein(''); setCarbs(''); setFat('');
    setScreenshot(null); setScreenshotPreview(null);
    onClose();
  };

  const quickMeals = [
    { name: 'Breakfast', calories: 400, protein: 25, carbs: 45, fat: 15 },
    { name: 'Lunch', calories: 600, protein: 40, carbs: 60, fat: 20 },
    { name: 'Dinner', calories: 700, protein: 45, carbs: 70, fat: 25 },
    { name: 'Snack', calories: 200, protein: 10, carbs: 25, fat: 8 },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Meal" size="md">
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-400 mb-2 block">Quick Add</label>
          <div className="flex gap-2 flex-wrap">
            {quickMeals.map((meal) => (
              <button key={meal.name} onClick={() => { setMealName(meal.name); setCalories(meal.calories.toString()); setProtein(meal.protein.toString()); setCarbs(meal.carbs.toString()); setFat(meal.fat.toString()); }}
                className="px-3 py-1.5 text-sm bg-dark-700 rounded-lg border border-dark-500 text-gray-300 hover:border-accent-primary">{meal.name}</button>
            ))}
          </div>
        </div>
        <Input label="Meal Name" value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="e.g., Grilled Chicken Salad" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Calories" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="0" />
          <Input label="Protein (g)" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="0" />
          <Input label="Carbs (g)" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="0" />
          <Input label="Fat (g)" type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-400 mb-2 block">Screenshot (Optional)</label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          {screenshotPreview ? (
            <div className="relative">
              <img src={screenshotPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
              <button onClick={() => { setScreenshot(null); setScreenshotPreview(null); }} className="absolute top-2 right-2 p-2 bg-dark-900/80 rounded-lg hover:bg-accent-danger"><Trash2 className="w-4 h-4 text-white" /></button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} className="w-full p-8 border-2 border-dashed border-dark-500 rounded-lg hover:border-accent-primary flex flex-col items-center gap-2">
              <Camera className="w-6 h-6 text-gray-400" /><span className="text-sm text-gray-400">Click to upload screenshot</span>
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} fullWidth>Cancel</Button>
          <Button onClick={handleSave} fullWidth disabled={!calories && !protein && !carbs && !fat}><Plus className="w-4 h-4 mr-2" />Log Meal</Button>
        </div>
      </div>
    </Modal>
  );
}

export default LogMealModal;
