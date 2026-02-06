import React, { useState, useMemo } from 'react';
import { ArrowLeft, ShoppingCart, Check, Plus, Minus, ExternalLink, Search, Package, ChevronDown, ChevronUp } from 'lucide-react';

// Instacart affiliate link base
const INSTACART_BASE_URL = 'https://www.instacart.com/store/search/';

export default function ShoppingListView({ mealPlan, recipes, onBack }) {
  const [checkedItems, setCheckedItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  // Aggregate all ingredients from the meal plan
  const shoppingList = useMemo(() => {
    const ingredients = {};

    if (!mealPlan?.week) return [];

    // Go through each day and each meal
    Object.values(mealPlan.week).forEach(day => {
      day.meals?.forEach(meal => {
        const recipe = recipes?.[meal.id];
        if (recipe?.ingredients) {
          recipe.ingredients.forEach(ing => {
            // Handle both formats: { name, amount, unit } and { original }
            let name, amount, unit;

            if (ing.original) {
              // Parse "1 cup Greek yogurt" format
              const parts = ing.original.match(/^([\d.\/]+)?\s*(cup|cups|tbsp|tsp|oz|lb|g|ml|slice|slices|piece|pieces)?\s*(.+)$/i);
              if (parts) {
                amount = parts[1] ? parseFloat(eval(parts[1])) : 1; // Handle fractions like 1/2
                unit = parts[2] || '';
                name = parts[3]?.trim() || ing.original;
              } else {
                name = ing.original;
                amount = 1;
                unit = '';
              }
            } else {
              name = ing.name || 'Unknown';
              amount = ing.amount || 1;
              unit = ing.unit || '';
            }

            const key = name.toLowerCase();
            if (ingredients[key]) {
              // Combine amounts if same unit
              if (ingredients[key].unit === unit) {
                ingredients[key].amount += amount;
              }
            } else {
              ingredients[key] = {
                id: ing.id || key,
                name: name,
                amount: amount,
                unit: unit,
                category: categorizeIngredient(name)
              };
            }
          });
        }
      });
    });

    return Object.values(ingredients);
  }, [mealPlan, recipes]);

  // Group by category
  const groupedList = useMemo(() => {
    const groups = {};

    shoppingList.forEach(item => {
      const category = item.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });

    // Sort categories and items
    const sortedGroups = {};
    Object.keys(groups)
      .sort()
      .forEach(key => {
        sortedGroups[key] = groups[key].sort((a, b) => a.name.localeCompare(b.name));
      });

    return sortedGroups;
  }, [shoppingList]);

  // Filter by search
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return groupedList;

    const query = searchQuery.toLowerCase();
    const filtered = {};

    Object.entries(groupedList).forEach(([category, items]) => {
      const matchingItems = items.filter(item =>
        item.name.toLowerCase().includes(query)
      );
      if (matchingItems.length > 0) {
        filtered[category] = matchingItems;
      }
    });

    return filtered;
  }, [groupedList, searchQuery]);

  const toggleItem = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = shoppingList.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  // Create Instacart cart with unchecked items
  const openInstacart = () => {
    const uncheckedItems = shoppingList.filter(item => !checkedItems[item.id]);
    const searchTerms = uncheckedItems.map(item => item.name).join(', ');
    // Open Instacart with search
    window.open(`${INSTACART_BASE_URL}${encodeURIComponent(searchTerms)}`, '_blank');
  };

  // Create Instacart link for single item
  const openInstacartItem = (itemName) => {
    window.open(`${INSTACART_BASE_URL}${encodeURIComponent(itemName)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-dark-900 pb-32">
      {/* Header */}
      <div className="bg-dark-800 border-b border-dark-700 sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-dark-700 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Shopping List</h1>
              <p className="text-sm text-gray-400">{checkedCount} of {totalCount} items</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-accent-secondary/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-accent-secondary" />
            </div>
          </div>

          {/* Progress */}
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-accent-success transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Shopping List */}
      <div className="p-4 space-y-4">
        {Object.entries(filteredList).length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Items Found</h3>
            <p className="text-gray-400">
              {searchQuery ? 'Try a different search term' : 'Generate a meal plan to see your shopping list'}
            </p>
          </div>
        ) : (
          Object.entries(filteredList).map(([category, items]) => {
            const isExpanded = expandedCategories[category] !== false;
            const categoryChecked = items.filter(item => checkedItems[item.id]).length;

            return (
              <div key={category} className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getCategoryIcon(category)}</span>
                    <div className="text-left">
                      <h3 className="text-white font-medium">{category}</h3>
                      <p className="text-xs text-gray-400">{categoryChecked}/{items.length} items</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Items */}
                {isExpanded && (
                  <div className="border-t border-dark-700">
                    {items.map(item => {
                      const isChecked = checkedItems[item.id];

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 border-b border-dark-700 last:border-0 ${
                            isChecked ? 'opacity-50' : ''
                          }`}
                        >
                          <button
                            onClick={() => toggleItem(item.id)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isChecked
                                ? 'bg-accent-success border-accent-success'
                                : 'border-gray-500 hover:border-gray-400'
                            }`}
                          >
                            {isChecked && <Check className="w-4 h-4 text-dark-900" />}
                          </button>

                          <div className="flex-1">
                            <p className={`text-white ${isChecked ? 'line-through' : ''}`}>
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatAmount(item.amount, item.unit)}
                            </p>
                          </div>

                          <button
                            onClick={() => openInstacartItem(item.name)}
                            className="p-2 text-gray-400 hover:text-accent-secondary hover:bg-dark-700 rounded-lg"
                            title="Find on Instacart"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Instacart CTA */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-dark-900 via-dark-900 to-transparent">
        <button
          onClick={openInstacart}
          className="w-full py-4 bg-[#43B02A] hover:bg-[#3a9a24] text-white font-semibold rounded-xl flex items-center justify-center gap-3 shadow-lg transition-colors"
        >
          <img
            src="https://www.instacart.com/assets/beetstrap/brand/2022/carrotlogo-1286c257354036d178c09e815906198eb7f012b8cdc4f6f8ec86d3e64d799a5b.png"
            alt="Instacart"
            className="w-6 h-6"
            onError={(e) => e.target.style.display = 'none'}
          />
          <span>Order on Instacart</span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
            {totalCount - checkedCount} items
          </span>
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Opens Instacart with your remaining items
        </p>
      </div>
    </div>
  );
}

// Helper to categorize ingredients
function categorizeIngredient(name) {
  const lower = name.toLowerCase();

  const categories = {
    'Produce': ['lettuce', 'tomato', 'onion', 'garlic', 'pepper', 'carrot', 'celery', 'spinach', 'kale', 'broccoli', 'cucumber', 'avocado', 'lemon', 'lime', 'apple', 'banana', 'berry', 'orange', 'potato', 'sweet potato', 'mushroom', 'zucchini', 'squash'],
    'Meat & Seafood': ['chicken', 'beef', 'pork', 'turkey', 'salmon', 'fish', 'shrimp', 'bacon', 'sausage', 'lamb', 'steak', 'ground'],
    'Dairy & Eggs': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'sour cream'],
    'Bakery': ['bread', 'tortilla', 'bun', 'roll', 'bagel', 'pita'],
    'Pantry': ['rice', 'pasta', 'flour', 'sugar', 'oil', 'vinegar', 'sauce', 'broth', 'stock', 'beans', 'lentil', 'quinoa', 'oat'],
    'Spices & Seasonings': ['salt', 'pepper', 'cumin', 'paprika', 'oregano', 'basil', 'thyme', 'cinnamon', 'garlic powder', 'onion powder'],
    'Frozen': ['frozen'],
    'Beverages': ['water', 'juice', 'coffee', 'tea', 'soda']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      return category;
    }
  }

  return 'Other';
}

// Helper to get category icons
function getCategoryIcon(category) {
  const icons = {
    'Produce': '🥬',
    'Meat & Seafood': '🥩',
    'Dairy & Eggs': '🥛',
    'Bakery': '🍞',
    'Pantry': '🥫',
    'Spices & Seasonings': '🧂',
    'Frozen': '🧊',
    'Beverages': '🥤',
    'Other': '📦'
  };
  return icons[category] || '📦';
}

// Helper to format amounts
function formatAmount(amount, unit) {
  if (!amount) return '';

  // Round to reasonable precision
  const rounded = amount < 1 ? amount.toFixed(2) : Math.round(amount * 10) / 10;

  // Format unit
  const formattedUnit = unit || '';

  return `${rounded} ${formattedUnit}`.trim();
}
