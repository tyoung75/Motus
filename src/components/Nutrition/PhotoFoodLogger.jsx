import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Check, Edit2, RefreshCw } from 'lucide-react';

// Analyze food using Claude Vision API (via server endpoint)
const analyzeFood = async (imageData) => {
  // Check for test mode - bypass API calls entirely
  const isTestMode = localStorage.getItem('motus_test_no_api') === 'true';
  if (isTestMode) {
    console.log('[TEST MODE] Bypassing food analysis API, using mock data');
    return await testModeFoodAnalysis();
  }

  // Extract base64 data from data URL
  const base64Data = imageData.split(',')[1];
  const mediaType = imageData.split(';')[0].split(':')[1] || 'image/jpeg';

  try {
    // Call our API endpoint (Vercel serverless function or similar)
    const response = await fetch('/api/analyze-food', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Data,
        mediaType: mediaType,
      }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Food analysis API error:', error);

    // Fallback to local analysis prompt if API fails
    // This uses the same prompt structure but lets user know it's estimated
    return await fallbackAnalysis(imageData);
  }
};

// Test mode food analysis - returns realistic mock data without API calls
const testModeFoodAnalysis = async () => {
  // Simulate brief processing time
  await new Promise(resolve => setTimeout(resolve, 800));

  const mockMeals = [
    {
      foods: [
        { name: 'Grilled Chicken Breast', portion: '6 oz', calories: 280, protein: 52, carbs: 0, fat: 6 },
        { name: 'Brown Rice', portion: '1 cup cooked', calories: 215, protein: 5, carbs: 45, fat: 2 },
        { name: 'Steamed Broccoli', portion: '1 cup', calories: 55, protein: 4, carbs: 11, fat: 1 },
      ],
      totals: { calories: 550, protein: 61, carbs: 56, fat: 9 },
      confidence: 0.85,
      suggestions: ['[TEST MODE] Mock data - no API call made', 'Tap Edit to adjust items and macros'],
    },
    {
      foods: [
        { name: 'Salmon Fillet', portion: '5 oz', calories: 290, protein: 36, carbs: 0, fat: 16 },
        { name: 'Sweet Potato', portion: '1 medium', calories: 103, protein: 2, carbs: 24, fat: 0 },
        { name: 'Mixed Green Salad', portion: '2 cups', calories: 30, protein: 2, carbs: 5, fat: 0 },
      ],
      totals: { calories: 423, protein: 40, carbs: 29, fat: 16 },
      confidence: 0.82,
      suggestions: ['[TEST MODE] Mock data - no API call made', 'Good protein-to-calorie ratio!'],
    },
    {
      foods: [
        { name: 'Greek Yogurt Parfait', portion: '1 bowl', calories: 320, protein: 24, carbs: 42, fat: 8 },
        { name: 'Mixed Berries', portion: '1/2 cup', calories: 40, protein: 1, carbs: 10, fat: 0 },
        { name: 'Granola', portion: '1/4 cup', calories: 120, protein: 3, carbs: 20, fat: 4 },
      ],
      totals: { calories: 480, protein: 28, carbs: 72, fat: 12 },
      confidence: 0.88,
      suggestions: ['[TEST MODE] Mock data - no API call made', 'Great post-workout snack!'],
    },
  ];

  // Return a random mock meal for variety
  return mockMeals[Math.floor(Math.random() * mockMeals.length)];
};

// Fallback analysis when API is not available
const fallbackAnalysis = async (imageData) => {
  // Provide a reasonable default that user can edit
  // This is shown when the API endpoint is not set up
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    foods: [
      { name: 'Food Item 1', portion: 'Estimate portion', calories: 300, protein: 20, carbs: 30, fat: 10 },
    ],
    totals: { calories: 300, protein: 20, carbs: 30, fat: 10 },
    confidence: 0.3,
    suggestions: [
      '⚠️ AI analysis unavailable - please edit the items above',
      'Tap "Edit" to adjust food names, portions, and macros',
    ],
    isFallback: true,
  };
};

export function PhotoFoodLogger({ onLog, onClose }) {
  const [mode, setMode] = useState('capture'); // 'capture', 'analyzing', 'review', 'edit'
  const [image, setImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [editedFoods, setEditedFoods] = useState([]);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer back camera
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setError('Camera access denied. Please allow camera access or upload an image instead.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setImage(imageData);
      stopCamera();
      analyzeImage(imageData);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        analyzeImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageData) => {
    setMode('analyzing');
    setError(null);
    try {
      const result = await analyzeFood(imageData);
      setAnalysis(result);
      setEditedFoods(result.foods.map(f => ({ ...f, selected: true })));
      setMode('review');
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Failed to analyze food. Please try again or log manually.');
      setMode('capture');
    }
  };

  const handleFoodToggle = (index) => {
    setEditedFoods(prev => prev.map((f, i) =>
      i === index ? { ...f, selected: !f.selected } : f
    ));
  };

  const handleFoodEdit = (index, field, value) => {
    setEditedFoods(prev => prev.map((f, i) =>
      i === index ? { ...f, [field]: value } : f
    ));
  };

  const handleConfirmLog = () => {
    const selectedFoods = editedFoods.filter(f => f.selected);
    const totals = selectedFoods.reduce((acc, food) => ({
      calories: acc.calories + (parseFloat(food.calories) || 0),
      protein: acc.protein + (parseFloat(food.protein) || 0),
      carbs: acc.carbs + (parseFloat(food.carbs) || 0),
      fat: acc.fat + (parseFloat(food.fat) || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    onLog({
      foods: selectedFoods,
      totals,
      image,
      loggedAt: new Date().toISOString(),
      method: 'photo',
    });
    onClose();
  };

  const reset = () => {
    setImage(null);
    setAnalysis(null);
    setEditedFoods([]);
    setMode('capture');
    setError(null);
    stopCamera();
  };

  // Calculate totals from selected foods
  const calculatedTotals = editedFoods
    .filter(f => f.selected)
    .reduce((acc, food) => ({
      calories: acc.calories + (parseFloat(food.calories) || 0),
      protein: acc.protein + (parseFloat(food.protein) || 0),
      carbs: acc.carbs + (parseFloat(food.carbs) || 0),
      fat: acc.fat + (parseFloat(food.fat) || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-dark-800">
        <h2 className="text-lg font-bold text-white">
          {mode === 'capture' && '📸 Snap Your Meal'}
          {mode === 'analyzing' && '🔍 Analyzing...'}
          {mode === 'review' && '✅ Review & Log'}
          {mode === 'edit' && '✏️ Edit Details'}
        </h2>
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="p-2 rounded-full hover:bg-dark-700 text-gray-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Capture Mode */}
        {mode === 'capture' && (
          <div className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {showCamera ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-xl"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button
                    onClick={stopCamera}
                    className="p-3 bg-dark-800/80 rounded-full text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="p-4 bg-white rounded-full"
                  >
                    <Camera className="w-8 h-8 text-dark-900" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={startCamera}
                  className="w-full p-8 bg-dark-700 rounded-xl border-2 border-dashed border-dark-500 hover:border-accent-primary transition-colors flex flex-col items-center gap-3"
                >
                  <Camera className="w-12 h-12 text-accent-primary" />
                  <span className="text-white font-medium">Take Photo</span>
                  <span className="text-sm text-gray-400">Use your camera to capture your meal</span>
                </button>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-dark-600" />
                  <span className="text-gray-500 text-sm">or</span>
                  <div className="flex-1 h-px bg-dark-600" />
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 bg-dark-800 rounded-xl border border-dark-600 hover:border-dark-400 transition-colors flex items-center justify-center gap-3"
                >
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-gray-300">Upload from Gallery</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            <div className="mt-6 p-4 bg-dark-800 rounded-xl">
              <h3 className="text-white font-medium mb-2">📱 Tips for best results:</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Take the photo from directly above</li>
                <li>• Make sure all food is visible</li>
                <li>• Good lighting helps accuracy</li>
                <li>• Include a reference object (fork, hand) for portion sizing</li>
              </ul>
            </div>
          </div>
        )}

        {/* Analyzing Mode */}
        {mode === 'analyzing' && (
          <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
            {image && (
              <img
                src={image}
                alt="Food"
                className="w-48 h-48 object-cover rounded-xl mb-6 opacity-50"
              />
            )}
            <Loader2 className="w-12 h-12 text-accent-primary animate-spin mb-4" />
            <p className="text-white font-medium">Analyzing your meal...</p>
            <p className="text-sm text-gray-400 mt-2">Identifying foods and estimating macros</p>
          </div>
        )}

        {/* Review Mode */}
        {(mode === 'review' || mode === 'edit') && analysis && (
          <div className="p-4 space-y-4">
            {/* Image Preview */}
            {image && (
              <div className="relative">
                <img
                  src={image}
                  alt="Food"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <button
                  onClick={reset}
                  className="absolute top-2 right-2 p-2 bg-dark-800/80 rounded-full text-white"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Confidence Score */}
            <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <span className="text-sm text-gray-400">AI Confidence</span>
              <span className={`text-sm font-medium ${
                analysis.confidence > 0.8 ? 'text-green-400' :
                analysis.confidence > 0.6 ? 'text-yellow-400' : 'text-orange-400'
              }`}>
                {Math.round(analysis.confidence * 100)}%
              </span>
            </div>

            {/* Food Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">Detected Foods</h3>
                <button
                  onClick={() => setMode(mode === 'edit' ? 'review' : 'edit')}
                  className="text-sm text-accent-primary flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  {mode === 'edit' ? 'Done Editing' : 'Edit'}
                </button>
              </div>

              {editedFoods.map((food, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border transition-all ${
                    food.selected
                      ? 'bg-dark-700 border-accent-primary/50'
                      : 'bg-dark-800 border-dark-600 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleFoodToggle(index)}
                      className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${
                        food.selected
                          ? 'bg-accent-primary border-accent-primary'
                          : 'border-dark-500'
                      }`}
                    >
                      {food.selected && <Check className="w-3 h-3 text-dark-900" />}
                    </button>

                    <div className="flex-1">
                      {mode === 'edit' ? (
                        <input
                          type="text"
                          value={food.name}
                          onChange={(e) => handleFoodEdit(index, 'name', e.target.value)}
                          className="w-full bg-dark-600 border border-dark-500 rounded px-2 py-1 text-white text-sm mb-2"
                        />
                      ) : (
                        <p className="text-white font-medium">{food.name}</p>
                      )}

                      {mode === 'edit' ? (
                        <input
                          type="text"
                          value={food.portion}
                          onChange={(e) => handleFoodEdit(index, 'portion', e.target.value)}
                          className="bg-dark-600 border border-dark-500 rounded px-2 py-1 text-gray-400 text-xs mb-2"
                        />
                      ) : (
                        <p className="text-xs text-gray-400">{food.portion}</p>
                      )}

                      {mode === 'edit' ? (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          <div>
                            <label className="text-xs text-gray-500">Cal</label>
                            <input
                              type="number"
                              value={food.calories}
                              onChange={(e) => handleFoodEdit(index, 'calories', e.target.value)}
                              className="w-full bg-dark-600 border border-dark-500 rounded px-2 py-1 text-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">P</label>
                            <input
                              type="number"
                              value={food.protein}
                              onChange={(e) => handleFoodEdit(index, 'protein', e.target.value)}
                              className="w-full bg-dark-600 border border-dark-500 rounded px-2 py-1 text-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">C</label>
                            <input
                              type="number"
                              value={food.carbs}
                              onChange={(e) => handleFoodEdit(index, 'carbs', e.target.value)}
                              className="w-full bg-dark-600 border border-dark-500 rounded px-2 py-1 text-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">F</label>
                            <input
                              type="number"
                              value={food.fat}
                              onChange={(e) => handleFoodEdit(index, 'fat', e.target.value)}
                              className="w-full bg-dark-600 border border-dark-500 rounded px-2 py-1 text-white text-xs"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3 mt-1 text-xs">
                          <span className="text-gray-400">{food.calories} cal</span>
                          <span className="text-blue-400">{food.protein}g P</span>
                          <span className="text-yellow-400">{food.carbs}g C</span>
                          <span className="text-red-400">{food.fat}g F</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="p-4 bg-accent-primary/10 rounded-xl border border-accent-primary/30">
              <h3 className="text-white font-medium mb-3">Meal Total</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{Math.round(calculatedTotals.calories)}</p>
                  <p className="text-xs text-gray-400">Calories</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">{Math.round(calculatedTotals.protein)}g</p>
                  <p className="text-xs text-gray-400">Protein</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">{Math.round(calculatedTotals.carbs)}g</p>
                  <p className="text-xs text-gray-400">Carbs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">{Math.round(calculatedTotals.fat)}g</p>
                  <p className="text-xs text-gray-400">Fat</p>
                </div>
              </div>
            </div>

            {/* AI Suggestions */}
            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <div className="p-3 bg-dark-700 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">💡 Tips:</p>
                {analysis.suggestions.map((tip, i) => (
                  <p key={i} className="text-sm text-gray-300">• {tip}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {(mode === 'review' || mode === 'edit') && (
        <div className="p-4 bg-dark-800 border-t border-dark-600">
          <button
            onClick={handleConfirmLog}
            disabled={editedFoods.filter(f => f.selected).length === 0}
            className="w-full py-4 bg-accent-primary text-dark-900 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Log This Meal ({Math.round(calculatedTotals.calories)} cal)
          </button>
        </div>
      )}
    </div>
  );
}

export default PhotoFoodLogger;
