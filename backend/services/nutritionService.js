import axios from "axios";
import { env } from "../config/env.js";

const MOCK_FOODS = {
  apple: { name: "Apple", brand: "Standard USDA SR Legacy", calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, servingSize: "100 g", fdcId: "1750339" },
  banana: { name: "Banana", brand: "Standard USDA SR Legacy", calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, servingSize: "100 g", fdcId: "173944" },
  rice: { name: "Rice (White cooked)", brand: "Standard USDA FNDDS", calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, servingSize: "100 g", fdcId: "1101625" },
  "chicken breast": { name: "Chicken Breast (Grilled)", brand: "Standard USDA FNDDS", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, servingSize: "100 g", fdcId: "171140" },
  milk: { name: "Whole Milk", brand: "Standard USDA SR Legacy", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, servingSize: "100 g", fdcId: "171274" },
  egg: { name: "Boiled Egg", brand: "Standard USDA SR Legacy", calories: 155, protein: 12.6, carbs: 1.1, fat: 10.6, fiber: 0, servingSize: "100 g", fdcId: "173424" },
  bread: { name: "Whole Wheat Bread", brand: "Standard USDA SR Legacy", calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 6, servingSize: "100 g", fdcId: "172688" },
  oats: { name: "Rolled Oats (Dry)", brand: "Standard USDA SR Legacy", calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, servingSize: "100 g", fdcId: "172428" },
  paneer: { name: "Paneer Cheese", brand: "Standard Dairy Reference", calories: 265, protein: 18.3, carbs: 1.2, fat: 20.8, fiber: 0, servingSize: "100 g", fdcId: "paneer-mock" },
  tomato: { name: "Red Tomato (Raw)", brand: "Standard USDA SR Legacy", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, servingSize: "100 g", fdcId: "170010" }
};

/**
 * Searches USDA FoodData Central for a given food query
 * @param {string} query
 * @returns {Promise<Object|null>} Simplified nutrition data or null
 */
export async function searchFoodInUSDA(query) {
  const normalizedQuery = query.toLowerCase().trim();

  // If no API key configured, use high-fidelity local mock fallbacks
  if (!env.usdaApiKey) {
    console.log(`[nutritionService] USDA API key is missing. Using local mock for query: "${normalizedQuery}"`);
    return getLocalMockFood(normalizedQuery);
  }

  try {
    const response = await axios.post(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${env.usdaApiKey}`,
      {
        query: normalizedQuery,
        pageSize: 5,
        dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"]
      },
      {
        timeout: 10000 // Timeout requests after 10 seconds
      }
    );

    const foodsList = response.data?.foods;
    if (!foodsList || foodsList.length === 0) {
      // Fallback to local mock if USDA returns empty list for standard support queries
      return getLocalMockFood(normalizedQuery);
    }

    const foodItem = foodsList[0];
    const nutrients = foodItem.foodNutrients || [];

    // Helper to search and parse specific nutrients safely
    const getNutrient = (matchFn) => {
      const nutrient = nutrients.find(matchFn);
      return nutrient ? Math.round(parseFloat(nutrient.value) * 10) / 10 : 0;
    };

    // Nutrients IDs & Substring matchers
    const calories = getNutrient(n => n.nutrientId === 1008 || n.unitName?.toLowerCase() === "kcal" || n.nutrientName?.toLowerCase() === "energy");
    const protein = getNutrient(n => n.nutrientId === 1003 || n.nutrientName?.toLowerCase().includes("protein"));
    const carbs = getNutrient(n => n.nutrientId === 1005 || n.nutrientName?.toLowerCase().includes("carbohydrate"));
    const fat = getNutrient(n => n.nutrientId === 1004 || n.nutrientName?.toLowerCase().includes("lipid") || n.nutrientName?.toLowerCase().includes("fat"));
    const fiber = getNutrient(n => n.nutrientId === 1079 || n.nutrientName?.toLowerCase().includes("fiber"));

    // Determine serving size string
    let servingSize = "100 g";
    if (foodItem.servingSize) {
      const unit = foodItem.servingSizeUnit || "g";
      const desc = foodItem.servingSizeDescription ? ` (${foodItem.servingSizeDescription})` : "";
      servingSize = `${foodItem.servingSize} ${unit}${desc}`;
    } else if (foodItem.servingSizeDescription) {
      servingSize = foodItem.servingSizeDescription;
    }

    return {
      name: foodItem.description,
      brand: foodItem.brandOwner || "Standard USDA Reference",
      calories: Math.round(calories),
      protein,
      carbs,
      fat,
      fiber,
      servingSize,
      fdcId: String(foodItem.fdcId)
    };

  } catch (err) {
    console.error(`[nutritionService] USDA search failed: ${err.message}. Falling back to mock local data.`);
    // Fall back to local mock data on network errors or timeouts to maintain PWA offline and robust support
    return getLocalMockFood(normalizedQuery);
  }
}

function getLocalMockFood(query) {
  // Direct exact match
  if (MOCK_FOODS[query]) return MOCK_FOODS[query];

  // Substring match
  const matchedKey = Object.keys(MOCK_FOODS).find(key => query.includes(key) || key.includes(query));
  if (matchedKey) return MOCK_FOODS[matchedKey];

  return null;
}
