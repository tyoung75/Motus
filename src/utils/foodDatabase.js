// Food Database Utilities - Barcode scanning & nutrition data
// Uses Open Food Facts API (free, open-source food database)

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2';

// Unit conversion factors (to grams)
export const UNIT_CONVERSIONS = {
  // Weight
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  lb: 453.592,
  pound: 453.592,
  pounds: 453.592,

  // Volume (approximate for water/liquid, actual varies by ingredient)
  ml: 1, // Using ml as base for liquids
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  'fl oz': 29.5735,
  'fluid ounce': 29.5735,
  'fluid ounces': 29.5735,
  cup: 236.588,
  cups: 236.588,
  tbsp: 14.787,
  tablespoon: 14.787,
  tablespoons: 14.787,
  tsp: 4.929,
  teaspoon: 4.929,
  teaspoons: 4.929,
  pint: 473.176,
  quart: 946.353,
  gallon: 3785.41,
};

// Common serving size options
export const SERVING_OPTIONS = [
  { label: 'Serving', value: 'serving', icon: '🍽️' },
  { label: 'Gram (g)', value: 'g', icon: '⚖️' },
  { label: 'Ounce (oz)', value: 'oz', icon: '⚖️' },
  { label: 'Cup', value: 'cup', icon: '🥤' },
  { label: 'Tablespoon', value: 'tbsp', icon: '🥄' },
  { label: 'Teaspoon', value: 'tsp', icon: '🥄' },
  { label: 'Fluid Oz', value: 'fl oz', icon: '💧' },
  { label: 'mL', value: 'ml', icon: '💧' },
  { label: 'Piece', value: 'piece', icon: '🔢' },
  { label: 'Slice', value: 'slice', icon: '🍕' },
  { label: 'Container', value: 'container', icon: '📦' },
];

// Convert between units
export function convertUnits(value, fromUnit, toUnit) {
  const fromLower = fromUnit.toLowerCase();
  const toLower = toUnit.toLowerCase();

  if (fromLower === toLower) return value;

  const fromFactor = UNIT_CONVERSIONS[fromLower];
  const toFactor = UNIT_CONVERSIONS[toLower];

  if (!fromFactor || !toFactor) {
    console.warn(`Unknown unit conversion: ${fromUnit} to ${toUnit}`);
    return value;
  }

  // Convert to base unit (g or ml), then to target unit
  return (value * fromFactor) / toFactor;
}

// Fetch product by barcode from Open Food Facts
export async function fetchProductByBarcode(barcode) {
  try {
    const response = await fetch(`${OPEN_FOOD_FACTS_API}/product/${barcode}.json`);
    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return { success: false, error: 'Product not found' };
    }

    const product = data.product;
    const nutriments = product.nutriments || {};

    // Parse serving size
    const servingSize = product.serving_size || '100g';
    const servingSizeGrams = parseServingSize(servingSize);

    return {
      success: true,
      product: {
        barcode: barcode,
        name: product.product_name || product.product_name_en || 'Unknown Product',
        brand: product.brands || '',
        image: product.image_front_small_url || product.image_url || null,
        servingSize: servingSize,
        servingSizeGrams: servingSizeGrams,
        // Per 100g values
        per100g: {
          calories: Math.round(nutriments['energy-kcal_100g'] || nutriments.energy_100g / 4.184 || 0),
          protein: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
          carbs: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
          fat: Math.round((nutriments.fat_100g || 0) * 10) / 10,
          fiber: Math.round((nutriments.fiber_100g || 0) * 10) / 10,
          sugar: Math.round((nutriments.sugars_100g || 0) * 10) / 10,
          sodium: Math.round(nutriments.sodium_100g * 1000 || 0), // Convert to mg
        },
        // Per serving values
        perServing: {
          calories: Math.round(nutriments['energy-kcal_serving'] || (nutriments['energy-kcal_100g'] || 0) * servingSizeGrams / 100),
          protein: Math.round(((nutriments.proteins_serving || (nutriments.proteins_100g || 0) * servingSizeGrams / 100)) * 10) / 10,
          carbs: Math.round(((nutriments.carbohydrates_serving || (nutriments.carbohydrates_100g || 0) * servingSizeGrams / 100)) * 10) / 10,
          fat: Math.round(((nutriments.fat_serving || (nutriments.fat_100g || 0) * servingSizeGrams / 100)) * 10) / 10,
        },
        // Additional info
        categories: product.categories || '',
        ingredients: product.ingredients_text || product.ingredients_text_en || '',
        allergens: product.allergens || '',
        nutriscore: product.nutriscore_grade || null,
      },
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return { success: false, error: 'Failed to fetch product data' };
  }
}

// Search for products by name
export async function searchProducts(query, page = 1) {
  try {
    const response = await fetch(
      `${OPEN_FOOD_FACTS_API}/search?search_terms=${encodeURIComponent(query)}&page=${page}&page_size=20&fields=code,product_name,brands,image_front_small_url,nutriments,serving_size`
    );
    const data = await response.json();

    if (!data.products) {
      return { success: false, error: 'No products found', products: [] };
    }

    const products = data.products.map((product) => {
      const nutriments = product.nutriments || {};
      const servingSize = product.serving_size || '100g';
      const servingSizeGrams = parseServingSize(servingSize);

      return {
        barcode: product.code,
        name: product.product_name || 'Unknown Product',
        brand: product.brands || '',
        image: product.image_front_small_url || null,
        servingSize: servingSize,
        servingSizeGrams: servingSizeGrams,
        perServing: {
          calories: Math.round((nutriments['energy-kcal_100g'] || 0) * servingSizeGrams / 100),
          protein: Math.round(((nutriments.proteins_100g || 0) * servingSizeGrams / 100) * 10) / 10,
          carbs: Math.round(((nutriments.carbohydrates_100g || 0) * servingSizeGrams / 100) * 10) / 10,
          fat: Math.round(((nutriments.fat_100g || 0) * servingSizeGrams / 100) * 10) / 10,
        },
        per100g: {
          calories: Math.round(nutriments['energy-kcal_100g'] || 0),
          protein: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
          carbs: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
          fat: Math.round((nutriments.fat_100g || 0) * 10) / 10,
        },
      };
    });

    return {
      success: true,
      products: products.filter((p) => p.name !== 'Unknown Product'),
      totalCount: data.count || 0,
      page: data.page || 1,
    };
  } catch (error) {
    console.error('Error searching products:', error);
    return { success: false, error: 'Failed to search products', products: [] };
  }
}

// Parse serving size string to grams
function parseServingSize(servingSize) {
  if (!servingSize) return 100;

  // Try to extract number and unit
  const match = servingSize.match(/(\d+\.?\d*)\s*(g|ml|oz|cup|tbsp|tsp)?/i);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = (match[2] || 'g').toLowerCase();
    return convertUnits(value, unit, 'g');
  }

  return 100; // Default to 100g
}

// Calculate nutrition for a given amount and unit
export function calculateNutrition(product, amount, unit) {
  if (!product || !product.per100g) return null;

  let grams;

  if (unit === 'serving') {
    grams = product.servingSizeGrams || 100;
    grams *= amount;
  } else if (unit === 'piece' || unit === 'slice' || unit === 'container') {
    // For piece-based units, use serving size as reference
    grams = (product.servingSizeGrams || 100) * amount;
  } else {
    // Convert to grams
    grams = convertUnits(amount, unit, 'g');
  }

  const multiplier = grams / 100;

  return {
    calories: Math.round(product.per100g.calories * multiplier),
    protein: Math.round(product.per100g.protein * multiplier * 10) / 10,
    carbs: Math.round(product.per100g.carbs * multiplier * 10) / 10,
    fat: Math.round(product.per100g.fat * multiplier * 10) / 10,
    fiber: product.per100g.fiber ? Math.round(product.per100g.fiber * multiplier * 10) / 10 : null,
    sugar: product.per100g.sugar ? Math.round(product.per100g.sugar * multiplier * 10) / 10 : null,
    grams: Math.round(grams),
  };
}

// Common foods database for quick add (when API is unavailable)
export const COMMON_FOODS = [
  {
    id: 'egg',
    name: 'Egg (large)',
    brand: 'Generic',
    servingSize: '1 large (50g)',
    servingSizeGrams: 50,
    per100g: { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
    perServing: { calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
  },
  {
    id: 'chicken_breast',
    name: 'Chicken Breast (cooked)',
    brand: 'Generic',
    servingSize: '3 oz (85g)',
    servingSizeGrams: 85,
    per100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    perServing: { calories: 140, protein: 26, carbs: 0, fat: 3.1 },
  },
  {
    id: 'rice_white',
    name: 'White Rice (cooked)',
    brand: 'Generic',
    servingSize: '1 cup (158g)',
    servingSizeGrams: 158,
    per100g: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    perServing: { calories: 205, protein: 4.3, carbs: 44.2, fat: 0.4 },
  },
  {
    id: 'oats',
    name: 'Oatmeal (dry)',
    brand: 'Generic',
    servingSize: '1/2 cup (40g)',
    servingSizeGrams: 40,
    per100g: { calories: 389, protein: 16.9, carbs: 66, fat: 6.9 },
    perServing: { calories: 156, protein: 6.8, carbs: 26.4, fat: 2.8 },
  },
  {
    id: 'banana',
    name: 'Banana (medium)',
    brand: 'Generic',
    servingSize: '1 medium (118g)',
    servingSizeGrams: 118,
    per100g: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
    perServing: { calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  },
  {
    id: 'apple',
    name: 'Apple (medium)',
    brand: 'Generic',
    servingSize: '1 medium (182g)',
    servingSizeGrams: 182,
    per100g: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
    perServing: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  },
  {
    id: 'greek_yogurt',
    name: 'Greek Yogurt (plain)',
    brand: 'Generic',
    servingSize: '1 cup (227g)',
    servingSizeGrams: 227,
    per100g: { calories: 59, protein: 10, carbs: 3.6, fat: 0.7 },
    perServing: { calories: 134, protein: 23, carbs: 8.2, fat: 1.6 },
  },
  {
    id: 'almonds',
    name: 'Almonds',
    brand: 'Generic',
    servingSize: '1 oz (28g)',
    servingSizeGrams: 28,
    per100g: { calories: 579, protein: 21, carbs: 22, fat: 50 },
    perServing: { calories: 162, protein: 6, carbs: 6, fat: 14 },
  },
  {
    id: 'salmon',
    name: 'Salmon (cooked)',
    brand: 'Generic',
    servingSize: '3 oz (85g)',
    servingSizeGrams: 85,
    per100g: { calories: 208, protein: 20, carbs: 0, fat: 13 },
    perServing: { calories: 177, protein: 17, carbs: 0, fat: 11 },
  },
  {
    id: 'broccoli',
    name: 'Broccoli (cooked)',
    brand: 'Generic',
    servingSize: '1 cup (156g)',
    servingSizeGrams: 156,
    per100g: { calories: 35, protein: 2.4, carbs: 7, fat: 0.4 },
    perServing: { calories: 55, protein: 3.7, carbs: 11, fat: 0.6 },
  },
  {
    id: 'avocado',
    name: 'Avocado',
    brand: 'Generic',
    servingSize: '1/2 avocado (68g)',
    servingSizeGrams: 68,
    per100g: { calories: 160, protein: 2, carbs: 9, fat: 15 },
    perServing: { calories: 109, protein: 1.4, carbs: 6, fat: 10 },
  },
  {
    id: 'protein_shake',
    name: 'Protein Shake (whey)',
    brand: 'Generic',
    servingSize: '1 scoop (30g)',
    servingSizeGrams: 30,
    per100g: { calories: 400, protein: 80, carbs: 10, fat: 5 },
    perServing: { calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  },
];

export default {
  fetchProductByBarcode,
  searchProducts,
  calculateNutrition,
  convertUnits,
  SERVING_OPTIONS,
  COMMON_FOODS,
};
