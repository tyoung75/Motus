// Generate Meal Plan using Spoonacular API
// POST /api/nutrition/generate-meal-plan

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPOONACULAR_API_KEY;

  if (!apiKey) {
    // Return mock data if API key not configured
    return res.status(200).json(generateMockMealPlan(req.body));
  }

  const {
    targetCalories = 2000,
    targetProtein = 150,
    diet, // vegetarian, vegan, etc.
    exclude, // comma-separated ingredients to exclude
    cuisines, // preferred cuisines
    timeFrame = 'week'
  } = req.body;

  try {
    // Generate meal plan from Spoonacular
    const url = new URL('https://api.spoonacular.com/mealplanner/generate');
    url.searchParams.set('apiKey', apiKey);
    url.searchParams.set('timeFrame', timeFrame);
    url.searchParams.set('targetCalories', targetCalories);

    if (diet) {
      url.searchParams.set('diet', diet);
    }
    if (exclude) {
      url.searchParams.set('exclude', exclude);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json();
      console.error('Spoonacular API error:', error);
      return res.status(response.status).json({ error: 'Failed to generate meal plan' });
    }

    const mealPlan = await response.json();

    // Get detailed recipe info for each meal
    const mealIds = [];
    if (timeFrame === 'week') {
      mealPlan.week && Object.values(mealPlan.week).forEach(day => {
        day.meals?.forEach(meal => mealIds.push(meal.id));
      });
    } else {
      mealPlan.meals?.forEach(meal => mealIds.push(meal.id));
    }

    // Fetch recipe details in bulk
    let recipes = {};
    if (mealIds.length > 0) {
      const recipeUrl = `https://api.spoonacular.com/recipes/informationBulk?apiKey=${apiKey}&ids=${mealIds.join(',')}`;
      const recipeResponse = await fetch(recipeUrl);

      if (recipeResponse.ok) {
        const recipeData = await recipeResponse.json();
        recipes = recipeData.reduce((acc, recipe) => {
          acc[recipe.id] = {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            readyInMinutes: recipe.readyInMinutes,
            servings: recipe.servings,
            calories: recipe.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 0,
            protein: recipe.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0,
            carbs: recipe.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0,
            fat: recipe.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0,
            ingredients: recipe.extendedIngredients?.map(ing => ({
              id: ing.id,
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              original: ing.original
            })) || [],
            instructions: recipe.analyzedInstructions?.[0]?.steps?.map(s => s.step) || [],
            sourceUrl: recipe.sourceUrl,
            cuisines: recipe.cuisines,
            diets: recipe.diets
          };
          return acc;
        }, {});
      }
    }

    return res.status(200).json({
      mealPlan,
      recipes,
      generated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Meal plan generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Mock meal plan for development/demo
function generateMockMealPlan(params) {
  const { targetCalories = 2000, targetProtein = 150 } = params;

  const mockMeals = [
    {
      id: 1,
      title: 'Greek Yogurt Parfait with Berries',
      image: 'https://spoonacular.com/recipeImages/716627-312x231.jpg',
      readyInMinutes: 10,
      calories: Math.round(targetCalories * 0.2),
      protein: Math.round(targetProtein * 0.2),
      type: 'breakfast'
    },
    {
      id: 2,
      title: 'Grilled Chicken Salad with Quinoa',
      image: 'https://spoonacular.com/recipeImages/715538-312x231.jpg',
      readyInMinutes: 25,
      calories: Math.round(targetCalories * 0.35),
      protein: Math.round(targetProtein * 0.4),
      type: 'lunch'
    },
    {
      id: 3,
      title: 'Salmon with Roasted Vegetables',
      image: 'https://spoonacular.com/recipeImages/654959-312x231.jpg',
      readyInMinutes: 40,
      calories: Math.round(targetCalories * 0.35),
      protein: Math.round(targetProtein * 0.35),
      type: 'dinner'
    },
    {
      id: 4,
      title: 'Protein Smoothie',
      image: 'https://spoonacular.com/recipeImages/715497-312x231.jpg',
      readyInMinutes: 5,
      calories: Math.round(targetCalories * 0.1),
      protein: Math.round(targetProtein * 0.15),
      type: 'snack'
    }
  ];

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const week = {};

  days.forEach(day => {
    week[day] = {
      meals: mockMeals.map((meal, idx) => ({
        ...meal,
        id: meal.id + (days.indexOf(day) * 10)
      })),
      nutrients: {
        calories: targetCalories,
        protein: targetProtein,
        carbohydrates: Math.round(targetCalories * 0.4 / 4),
        fat: Math.round(targetCalories * 0.3 / 9)
      }
    };
  });

  return {
    mealPlan: { week },
    recipes: {},
    generated: new Date().toISOString(),
    isMock: true
  };
}
