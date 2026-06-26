import { supabaseAdmin } from "../config/supabase.js";

// Memory array fallback if Supabase is offline or tables are not created
let localCustomFoods = [];

/**
 * GET /api/custom-foods
 * Retrieve all custom foods for the current user, optionally filtered by a search query.
 * Sorted with favorites first, then alphabetically by name.
 */
export const getCustomFoods = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized: userId not found." });
    }

    const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";

    if (!supabaseAdmin) {
      // Mock mode
      let filtered = localCustomFoods.filter(f => f.user_id === userId);
      if (search) {
        filtered = filtered.filter(f => f.food_name.toLowerCase().includes(search));
      }
      // Sort: favorites first, then alphabetically
      filtered.sort((a, b) => {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        return a.food_name.localeCompare(b.food_name);
      });
      return res.json({ success: true, data: filtered, source: "mock" });
    }

    let query = supabaseAdmin
      .from("custom_foods")
      .select("*")
      .eq("user_id", userId)
      .order("is_favorite", { ascending: false })
      .order("food_name", { ascending: true });

    if (search) {
      query = query.ilike("food_name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "42P01") {
        // Table doesn't exist — fallback to local in-memory array
        let filtered = localCustomFoods.filter(f => f.user_id === userId);
        if (search) {
          filtered = filtered.filter(f => f.food_name.toLowerCase().includes(search));
        }
        filtered.sort((a, b) => {
          if (a.is_favorite && !b.is_favorite) return -1;
          if (!a.is_favorite && b.is_favorite) return 1;
          return a.food_name.localeCompare(b.food_name);
        });
        return res.json({ success: true, data: filtered, source: "mock_fallback" });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getCustomFoods]", err);
    return res.status(500).json({ success: false, error: "Failed to load custom foods." });
  }
};

/**
 * POST /api/custom-foods
 * Create a new custom food item.
 */
export const createCustomFood = async (req, res) => {
  try {
    const { food_name, serving_size, calories, protein, carbs, fat, fiber, notes, is_favorite } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized." });
    }

    // Input Validation
    const nameClean = typeof food_name === "string" ? food_name.trim() : "";
    if (!nameClean) {
      return res.status(400).json({ success: false, error: "Food name is required." });
    }
    if (nameClean.length > 100) {
      return res.status(400).json({ success: false, error: "Food name cannot exceed 100 characters." });
    }

    const cals = parseInt(calories, 10);
    const prot = parseInt(protein, 10) || 0;
    const carbObj = parseInt(carbs, 10) || 0;
    const fatObj = parseInt(fat, 10) || 0;
    const fibObj = parseInt(fiber, 10) || 0;

    if (isNaN(cals) || cals < 0) return res.status(400).json({ success: false, error: "Calories must be a number greater than or equal to 0." });
    if (prot < 0) return res.status(400).json({ success: false, error: "Protein must be greater than or equal to 0." });
    if (carbObj < 0) return res.status(400).json({ success: false, error: "Carbohydrates must be greater than or equal to 0." });
    if (fatObj < 0) return res.status(400).json({ success: false, error: "Fat must be greater than or equal to 0." });
    if (fibObj < 0) return res.status(400).json({ success: false, error: "Fiber must be greater than or equal to 0." });

    const payload = {
      user_id: userId,
      food_name: nameClean,
      serving_size: typeof serving_size === "string" && serving_size.trim() ? serving_size.trim() : "1 serving",
      calories: cals,
      protein: prot,
      carbs: carbObj,
      fat: fatObj,
      fiber: fibObj,
      is_favorite: !!is_favorite,
      notes: typeof notes === "string" ? notes.trim() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!supabaseAdmin) {
      payload.id = `mock-${Date.now()}`;
      localCustomFoods.push(payload);
      return res.status(201).json({ success: true, data: payload, source: "mock" });
    }

    const { data, error } = await supabaseAdmin
      .from("custom_foods")
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === "42P01") {
        payload.id = `mock-${Date.now()}`;
        localCustomFoods.push(payload);
        return res.status(201).json({ success: true, data: payload, source: "mock_fallback" });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error("[createCustomFood]", err);
    return res.status(500).json({ success: false, error: "Failed to create custom food." });
  }
};

/**
 * PUT /api/custom-foods/:id
 * Update an existing custom food item.
 */
export const updateCustomFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { food_name, serving_size, calories, protein, carbs, fat, fiber, notes, is_favorite } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized." });
    }

    // Input Validation
    const updates = {};
    if (food_name !== undefined) {
      const nameClean = typeof food_name === "string" ? food_name.trim() : "";
      if (!nameClean) {
        return res.status(400).json({ success: false, error: "Food name is required." });
      }
      if (nameClean.length > 100) {
        return res.status(400).json({ success: false, error: "Food name cannot exceed 100 characters." });
      }
      updates.food_name = nameClean;
    }

    if (serving_size !== undefined) {
      updates.serving_size = typeof serving_size === "string" && serving_size.trim() ? serving_size.trim() : "1 serving";
    }

    if (calories !== undefined) {
      const cals = parseInt(calories, 10);
      if (isNaN(cals) || cals < 0) return res.status(400).json({ success: false, error: "Calories must be a number greater than or equal to 0." });
      updates.calories = cals;
    }

    if (protein !== undefined) {
      const prot = parseInt(protein, 10);
      if (isNaN(prot) || prot < 0) return res.status(400).json({ success: false, error: "Protein must be greater than or equal to 0." });
      updates.protein = prot;
    }

    if (carbs !== undefined) {
      const carbObj = parseInt(carbs, 10);
      if (isNaN(carbObj) || carbObj < 0) return res.status(400).json({ success: false, error: "Carbohydrates must be greater than or equal to 0." });
      updates.carbs = carbObj;
    }

    if (fat !== undefined) {
      const fatObj = parseInt(fat, 10);
      if (isNaN(fatObj) || fatObj < 0) return res.status(400).json({ success: false, error: "Fat must be greater than or equal to 0." });
      updates.fat = fatObj;
    }

    if (fiber !== undefined) {
      const fibObj = parseInt(fiber, 10);
      if (isNaN(fibObj) || fibObj < 0) return res.status(400).json({ success: false, error: "Fiber must be greater than or equal to 0." });
      updates.fiber = fibObj;
    }

    if (notes !== undefined) {
      updates.notes = typeof notes === "string" ? notes.trim() : null;
    }

    if (is_favorite !== undefined) {
      updates.is_favorite = !!is_favorite;
    }

    updates.updated_at = new Date().toISOString();

    if (!supabaseAdmin || id.startsWith("mock-")) {
      // Mock mode
      const idx = localCustomFoods.findIndex(f => f.id === id && f.user_id === userId);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: "Custom food not found." });
      }
      localCustomFoods[idx] = { ...localCustomFoods[idx], ...updates };
      return res.json({ success: true, data: localCustomFoods[idx], source: "mock" });
    }

    const { data, error } = await supabaseAdmin
      .from("custom_foods")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "42P01") {
        const idx = localCustomFoods.findIndex(f => f.id === id && f.user_id === userId);
        if (idx === -1) {
          return res.status(404).json({ success: false, error: "Custom food not found." });
        }
        localCustomFoods[idx] = { ...localCustomFoods[idx], ...updates };
        return res.json({ success: true, data: localCustomFoods[idx], source: "mock_fallback" });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    if (!data) {
      return res.status(404).json({ success: false, error: "Custom food not found or unauthorized." });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error("[updateCustomFood]", err);
    return res.status(500).json({ success: false, error: "Failed to update custom food." });
  }
};

/**
 * DELETE /api/custom-foods/:id
 * Delete a custom food item.
 */
export const deleteCustomFood = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized." });
    }

    if (!supabaseAdmin || id.startsWith("mock-")) {
      // Mock mode
      const idx = localCustomFoods.findIndex(f => f.id === id && f.user_id === userId);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: "Custom food not found." });
      }
      localCustomFoods.splice(idx, 1);
      return res.json({ success: true, message: "Custom food deleted successfully." });
    }

    const { data, error, status } = await supabaseAdmin
      .from("custom_foods")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      if (error.code === "42P01") {
        const idx = localCustomFoods.findIndex(f => f.id === id && f.user_id === userId);
        if (idx === -1) {
          return res.status(404).json({ success: false, error: "Custom food not found." });
        }
        localCustomFoods.splice(idx, 1);
        return res.json({ success: true, message: "Custom food deleted successfully." });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: "Custom food deleted successfully." });
  } catch (err) {
    console.error("[deleteCustomFood]", err);
    return res.status(500).json({ success: false, error: "Failed to delete custom food." });
  }
};
