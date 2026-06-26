import { searchFoodInUSDA } from "../services/nutritionService.js";

/**
 * Controller to handle food nutrition searches
 * POST /api/nutrition/search
 */
export async function searchNutrition(req, res, next) {
  try {
    const { query } = req.body;

    // 1. Trim whitespace and check presence
    const cleanQuery = typeof query === "string" ? query.trim() : "";

    // 2. Validation Checks
    if (!cleanQuery) {
      return res.status(400).json({
        success: false,
        error: "Search query cannot be empty."
      });
    }

    if (cleanQuery.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Search query exceeds the 100-character limit."
      });
    }

    // 3. Invoke Service
    const foodData = await searchFoodInUSDA(cleanQuery);

    // 4. Handle Not Found
    if (!foodData) {
      return res.status(404).json({
        success: false,
        error: `No nutrition data found for "${cleanQuery}".`
      });
    }

    // 5. Success response
    return res.status(200).json({
      success: true,
      food: foodData
    });

  } catch (err) {
    next(err);
  }
}
