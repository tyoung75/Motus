import React, { useState, useRef, useEffect } from 'react';
import {
  Camera, Plus, Trash2, Search, X, ChevronDown,
  Barcode, Clock, Utensils, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { Modal, Button, Input } from '../shared';
import { BarcodeScanner } from '../shared/BarcodeScanner';
import {
  fetchProductByBarcode,
  searchProducts,
  calculateNutrition,
  SERVING_OPTIONS,
  COMMON_FOODS,
} from '../../utils/foodDatabase';

export function LogMealModal({ isOpen, onClose, onSave, mealPlan }) {
  // View state
  const [view, setView] = useState('main'); // main, scanner, search, product
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Selected food items for the meal
  const [foodItems, setFoodItems] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Current product being added
  const [currentProduct, setCurrentProduct] = useState(null);
  const [servingAmount, setServingAmount] = useState('1');
  const [servingUnit, setServingUnit] = useState('serving');
  const [calculatedNutrition, setCalculatedNutrition] = useState(null);

  // Manual entry fallback
  const [manualBarcode, setManualBarcode] = useState('');

  // Meal metadata
  const [mealType, setMealType] = useState('');

  // Helper: Get today's day name for meal plan lookup
  const getTodayDayName = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  // Helper: Get planned meal for today by type
  const getPlannedMealForToday = (type) => {
    if (!mealPlan?.week) return null;
    const today = getTodayDayName();
    const dayData = mealPlan.week[today];
    if (!dayData?.meals) return null;
    // Map meal type to lowercase for matching
    const typeMap = {
      'Breakfast': 'breakfast',
      'Lunch': 'lunch',
      'Dinner': 'dinner',
      'Snack': 'snack',
      'Pre-workout': 'snack',
      'Post-workout': 'snack'
    };
    const mealTypeKey = typeMap[type] || type.toLowerCase();
    return dayData.meals.find(m => m.type === mealTypeKey);
  };

  // Use planned meal - auto-fill the macros from meal plan
  const usePlannedMeal = (plannedMeal) => {
    const newItem = {
      id: Date.now(),
      name: plannedMeal.title,
      brand: 'From Meal Plan',
      amount: 1,
      unit: 'serving',
      calories: plannedMeal.calories,
      protein: plannedMeal.protein,
      carbs: plannedMeal.carbs,
      fat: plannedMeal.fat,
    };
    setFoodItems([newItem]);
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setView('main');
      setFoodItems([]);
      setSearchQuery('');
      setSearchResults([]);
      setCurrentProduct(null);
      setServingAmount('1');
      setServingUnit('serving');
      setError(null);
      setManualBarcode('');
      setMealType('');
    }
  }, [isOpen]);

  // Calculate nutrition when serving changes
  useEffect(() => {
    if (currentProduct) {
      const amount = parseFloat(servingAmount) || 0;
      const nutrition = calculateNutrition(currentProduct, amount, servingUnit);
      setCalculatedNutrition(nutrition);
    }
  }, [currentProduct, servingAmount, servingUnit]);

  // Handle barcode scan
  const handleBarcodeScan = async (barcode) => {
    setView('main');
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchProductByBarcode(barcode);
      if (result.success) {
        setCurrentProduct(result.product);
        // Use default serving from data source
        setServingAmount('1');
        setServingUnit(result.product.servingSize || 'serving');
        setView('product');
      } else {
        setError(`Product not found for barcode: ${barcode}`);
      }
    } catch (err) {
      setError('Failed to fetch product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await searchProducts(searchQuery);
      if (result.success) {
        setSearchResults(result.products);
        if (result.products.length === 0) {
          setError('No products found. Try a different search term.');
        }
      } else {
        setError('Search failed. Please try again.');
      }
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Select product from search results
  const selectProduct = (product) => {
    setCurrentProduct(product);
    // Use default serving from data source
    setServingAmount('1');
    setServingUnit(product.servingSize || 'serving');
    setView('product');
  };

  // Add current product to food items
  const addFoodItem = () => {
    if (!currentProduct || !calculatedNutrition) return;

    const newItem = {
      id: Date.now(),
      name: currentProduct.name,
      brand: currentProduct.brand,
      barcode: currentProduct.barcode,
      amount: parseFloat(servingAmount) || 1,
      unit: servingUnit,
      ...calculatedNutrition,
    };

    setFoodItems([...foodItems, newItem]);
    setCurrentProduct(null);
    setCalculatedNutrition(null);
    setView('main');
  };

  // Remove food item
  const removeFoodItem = (id) => {
    setFoodItems(foodItems.filter(item => item.id !== id));
  };

  // Calculate meal totals
  const mealTotals = foodItems.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fat: acc.fat + (item.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Save meal
  const handleSave = () => {
    if (foodItems.length === 0) return;

    const meal = {
      name: mealType || `Meal (${foodItems.length} items)`,
      items: foodItems,
      calories: Math.round(mealTotals.calories),
      protein: Math.round(mealTotals.protein * 10) / 10,
      carbs: Math.round(mealTotals.carbs * 10) / 10,
      fat: Math.round(mealTotals.fat * 10) / 10,
      loggedAt: new Date().toISOString(),
    };

    onSave(meal);
    onClose();
  };

  // Manual barcode lookup
  const handleManualBarcode = () => {
    if (manualBarcode.trim()) {
      handleBarcodeScan(manualBarcode.trim());
    }
  };

  // Render barcode scanner
  if (view === 'scanner') {
    return (
      <BarcodeScanner
        isOpen={true}
        onScan={handleBarcodeScan}
        onClose={() => setView('main')}
      />
    );
  }

  // Render product detail view
  if (view === 'product' && currentProduct) {
    return (
      <Modal isOpen={isOpen} onClose={() => setView('main')} title="Add Food" size="md">
        <div className="space-y-5">
          {/* Product info */}
          <div className="flex gap-4">
            {currentProduct.image ? (
              <img
                src={currentProduct.image}
                alt={currentProduct.name}
                className="w-20 h-20 rounded-lg object-cover bg-dark-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-dark-700 flex items-center justify-center">
                <Utensils className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-white">{currentProduct.name}</h3>
              {currentProduct.brand && (
                <p className="text-sm text-gray-400">{currentProduct.brand}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Serving: {currentProduct.servingSize}
              </p>
            </div>
          </div>

          {/* Serving size selector */}
          <div className="p-4 bg-dark-700 rounded-xl space-y-4">
            <h4 className="text-sm font-medium text-gray-300">Serving Size</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Amount</label>
                <input
                  type="number"
                  value={servingAmount}
                  onChange={(e) => setServingAmount(e.target.value)}
                  min="0.1"
                  step="0.1"
                  className="w-full px-4 py-3 bg-dark-600 border border-dark-500 rounded-lg text-white text-lg font-medium focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Unit</label>
                <select
                  value={servingUnit}
                  onChange={(e) => setServingUnit(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-600 border border-dark-500 rounded-lg text-white focus:border-accent-primary focus:outline-none appearance-none"
                >
                  {SERVING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick serving buttons */}
            <div className="flex gap-2 flex-wrap">
              {[0.5, 1, 1.5, 2].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setServingAmount(amount.toString())}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    parseFloat(servingAmount) === amount
                      ? 'bg-accent-primary text-white'
                      : 'bg-dark-600 text-gray-400 hover:bg-dark-500'
                  }`}
                >
                  {amount} {servingUnit === 'serving' ? 'serving' : servingUnit}
                </button>
              ))}
            </div>
          </div>

          {/* Calculated nutrition */}
          {calculatedNutrition && (
            <div className="p-4 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-xl border border-accent-primary/20">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{calculatedNutrition.calories}</p>
                  <p className="text-xs text-gray-400">Calories</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent-primary">{calculatedNutrition.protein}g</p>
                  <p className="text-xs text-gray-400">Protein</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent-warning">{calculatedNutrition.carbs}g</p>
                  <p className="text-xs text-gray-400">Carbs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent-secondary">{calculatedNutrition.fat}g</p>
                  <p className="text-xs text-gray-400">Fat</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setView('main')} fullWidth>
              Cancel
            </Button>
            <Button onClick={addFoodItem} fullWidth disabled={!calculatedNutrition}>
              <Plus className="w-4 h-4 mr-2" />
              Add to Meal
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Render search view
  if (view === 'search') {
    return (
      <Modal isOpen={isOpen} onClose={() => setView('main')} title="Search Food" size="md">
        <div className="space-y-4">
          {/* Search input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search foods..."
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white focus:border-accent-primary focus:outline-none"
                autoFocus
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          {/* Search results */}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {searchResults.map((product, idx) => (
              <button
                key={idx}
                onClick={() => selectProduct(product)}
                className="w-full p-3 bg-dark-700 rounded-lg flex items-center gap-3 hover:bg-dark-600 transition-colors text-left"
              >
                {product.image ? (
                  <img src={product.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-dark-600 flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{product.name}</p>
                  {product.brand && (
                    <p className="text-xs text-gray-500 truncate">{product.brand}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {product.perServing.calories} cal • {product.perServing.protein}g P
                  </p>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-500 rotate-[-90deg]" />
              </button>
            ))}
          </div>

          {/* Common foods */}
          {searchResults.length === 0 && !isLoading && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Common Foods</h4>
              <div className="grid grid-cols-2 gap-2">
                {COMMON_FOODS.slice(0, 8).map((food) => (
                  <button
                    key={food.id}
                    onClick={() => selectProduct(food)}
                    className="p-3 bg-dark-700 rounded-lg text-left hover:bg-dark-600 transition-colors"
                  >
                    <p className="text-sm text-white truncate">{food.name}</p>
                    <p className="text-xs text-gray-500">{food.perServing.calories} cal</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button variant="secondary" onClick={() => setView('main')} fullWidth>
            Back
          </Button>
        </div>
      </Modal>
    );
  }

  // Main view
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Meal" size="md">
      <div className="space-y-5">
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setView('scanner')}
            className="p-4 bg-gradient-to-br from-accent-primary/20 to-accent-primary/5 border border-accent-primary/30 rounded-xl flex flex-col items-center gap-2 hover:border-accent-primary/50 transition-colors"
          >
            <div className="w-12 h-12 bg-accent-primary/20 rounded-full flex items-center justify-center">
              <Barcode className="w-6 h-6 text-accent-primary" />
            </div>
            <span className="text-white font-medium">Scan Barcode</span>
            <span className="text-xs text-gray-400">Point at product</span>
          </button>

          <button
            onClick={() => setView('search')}
            className="p-4 bg-dark-700 border border-dark-500 rounded-xl flex flex-col items-center gap-2 hover:border-dark-400 transition-colors"
          >
            <div className="w-12 h-12 bg-dark-600 rounded-full flex items-center justify-center">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <span className="text-white font-medium">Search Food</span>
            <span className="text-xs text-gray-400">Browse database</span>
          </button>
        </div>

        {/* Manual barcode entry */}
        <div className="p-3 bg-dark-700 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Or enter barcode manually:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="Enter barcode number..."
              className="flex-1 px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white text-sm focus:border-accent-primary focus:outline-none"
            />
            <Button size="sm" onClick={handleManualBarcode} disabled={!manualBarcode.trim() || isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Look up'}
            </Button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-400">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}

        {/* Food items added */}
        {foodItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300 flex items-center justify-between">
              <span>Food Items ({foodItems.length})</span>
              <span className="text-accent-primary">{Math.round(mealTotals.calories)} cal</span>
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {foodItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-dark-700 rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.amount} {item.unit} • {item.calories} cal • {item.protein}g P
                    </p>
                  </div>
                  <button
                    onClick={() => removeFoodItem(item.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Meal totals */}
            <div className="p-4 bg-gradient-to-r from-accent-success/10 to-accent-primary/10 rounded-xl border border-accent-success/20">
              <h4 className="text-sm font-medium text-white mb-3">Meal Totals</h4>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold text-white">{Math.round(mealTotals.calories)}</p>
                  <p className="text-xs text-gray-400">cal</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-accent-primary">{Math.round(mealTotals.protein)}g</p>
                  <p className="text-xs text-gray-400">protein</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-accent-warning">{Math.round(mealTotals.carbs)}g</p>
                  <p className="text-xs text-gray-400">carbs</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-accent-secondary">{Math.round(mealTotals.fat)}g</p>
                  <p className="text-xs text-gray-400">fat</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Fill from Meal Plan */}
        {mealPlan && (
          <div className="p-4 bg-gradient-to-r from-accent-secondary/10 to-accent-primary/10 rounded-xl border border-accent-secondary/20">
            <div className="flex items-center gap-2 mb-3">
              <Utensils className="w-4 h-4 text-accent-secondary" />
              <h4 className="text-sm font-medium text-white">Quick Fill from Today's Plan</h4>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => {
                const plannedMeal = getPlannedMealForToday(type);
                if (!plannedMeal) return null;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      usePlannedMeal(plannedMeal);
                      setMealType(type);
                    }}
                    className="px-3 py-2 bg-dark-700 border border-accent-secondary/30 rounded-lg text-left hover:border-accent-secondary transition-colors"
                  >
                    <p className="text-sm text-white font-medium">{type}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[120px]">{plannedMeal.title}</p>
                    <p className="text-xs text-accent-secondary mt-0.5">{plannedMeal.calories} cal • {plannedMeal.protein}g P</p>
                  </button>
                );
              })}
            </div>
            {!getPlannedMealForToday('Breakfast') && !getPlannedMealForToday('Lunch') && !getPlannedMealForToday('Dinner') && !getPlannedMealForToday('Snack') && (
              <p className="text-xs text-gray-500">No meals planned for today</p>
            )}
          </div>
        )}

        {/* Meal type selector */}
        {foodItems.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">Meal Type (optional)</label>
            <div className="flex gap-2 flex-wrap">
              {['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-workout', 'Post-workout'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(mealType === type ? '' : type)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    mealType === type
                      ? 'bg-accent-primary text-white'
                      : 'bg-dark-700 border border-dark-500 text-gray-300 hover:border-accent-primary'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button onClick={handleSave} fullWidth disabled={foodItems.length === 0}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Log Meal
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default LogMealModal;
