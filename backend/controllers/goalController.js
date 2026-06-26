import { supabaseAdmin } from "../config/supabase.js";

// Memory storage fallback if Supabase is offline/tables don't exist
let localUserGoal = null;

/**
 * Mifflin-St Jeor calculator helper for BMR, TDEE, and Macro splits.
 */
export function calculateNutritionalTargets(params) {
  const { weight, height, age, gender, activity_level, goal_type, weekly_goal } = params;

  // 1. Calculate BMR (Mifflin-St Jeor)
  let bmr;
  const isMale = gender.toLowerCase() === "male" || gender.toLowerCase() === "m";
  if (isMale) {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // 2. TDEE Multipliers
  let factor = 1.2;
  switch (activity_level.toLowerCase()) {
    case "sedentary":
      factor = 1.2;
      break;
    case "lightly active":
    case "light":
      factor = 1.375;
      break;
    case "moderately active":
    case "moderate":
      factor = 1.55;
      break;
    case "very active":
    case "active":
      factor = 1.725;
      break;
    case "extra active":
    case "extra":
      factor = 1.9;
      break;
  }
  const tdee = Math.round(bmr * factor);

  // 3. Goal Adjustments
  let daily_calorie_goal = tdee;
  const lowerGoalType = goal_type.toLowerCase();

  if (lowerGoalType.includes("lose")) {
    if (weekly_goal === "lose-0.25") daily_calorie_goal -= 250;
    else if (weekly_goal === "lose-1.0") daily_calorie_goal -= 1000;
    else daily_calorie_goal -= 500; // Default: lose-0.5
  } else if (lowerGoalType.includes("gain")) {
    if (weekly_goal === "gain-0.25") daily_calorie_goal += 250;
    else daily_calorie_goal += 500; // Default: gain-0.5
  } else if (lowerGoalType === "build muscle") {
    daily_calorie_goal += 250; // Hypertrophy surplus
  }

  // Safe lower bounds
  const minCal = isMale ? 1500 : 1200;
  if (daily_calorie_goal < minCal) {
    daily_calorie_goal = minCal;
  }

  // 4. Macronutrient Targets
  // Protein: Build Muscle / Lose Weight (2.0g/kg); Gain / Fitness (1.8g/kg); Maintain (1.6g/kg)
  let proteinFactor = 1.6;
  if (lowerGoalType.includes("lose") || lowerGoalType === "build muscle") {
    proteinFactor = 2.0;
  } else if (lowerGoalType.includes("gain") || lowerGoalType.includes("fitness")) {
    proteinFactor = 1.8;
  }
  const protein_goal = Math.round(weight * proteinFactor);

  // Fat: 25% of calories
  const fat_calories = daily_calorie_goal * 0.25;
  const fat_goal = Math.round(fat_calories / 9);

  // Carbs: Remainder of calories
  const protein_calories = protein_goal * 4;
  const carb_calories = Math.max(daily_calorie_goal - (protein_calories + fat_calories), 0);
  const carbs_goal = Math.round(carb_calories / 4);

  // Water Goal: 35ml per kg, plus 500ml for active lifestyles, divided into 250ml glasses
  let waterLiters = (weight * 35) / 1000;
  if (activity_level.toLowerCase() !== "sedentary") {
    waterLiters += 0.5;
  }
  const water_goal = Math.max(Math.round(waterLiters / 0.25), 8); // Minimum 8 glasses

  return {
    daily_calorie_goal,
    protein_goal,
    carbs_goal,
    fat_goal,
    water_goal
  };
}

/**
 * GET /api/goals
 * Retrieve active user goal configuration.
 */
export const getActiveGoal = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized." });

    if (!supabaseAdmin) {
      return res.json({ success: true, data: localUserGoal && localUserGoal.user_id === userId ? localUserGoal : null, source: "mock" });
    }

    const { data, error } = await supabaseAdmin
      .from("user_goals")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (error.code === "42P01") {
        return res.json({ success: true, data: localUserGoal && localUserGoal.user_id === userId ? localUserGoal : null, source: "mock_fallback" });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getActiveGoal]", err);
    return res.status(500).json({ success: false, error: "Failed to retrieve goal." });
  }
};

/**
 * POST /api/goals
 * Configure/Create goal settings. Automatically calculates nutritional daily targets.
 */
export const createOrUpdateGoal = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized." });

    const {
      goal_type,
      current_weight,
      target_weight,
      target_date,
      weekly_goal,
      activity_level,
      height,
      gender,
      age
    } = req.body;

    // Validate inputs
    const weightNum = parseFloat(current_weight);
    const targetWeightNum = parseFloat(target_weight);
    const heightNum = parseFloat(height);
    const ageNum = parseInt(age, 10);

    if (!goal_type || isNaN(weightNum) || isNaN(targetWeightNum) || isNaN(heightNum) || isNaN(ageNum) || !activity_level || !gender) {
      return res.status(400).json({ success: false, error: "Missing or invalid configuration fields." });
    }

    // Run equation calculations
    const targets = calculateNutritionalTargets({
      weight: weightNum,
      height: heightNum,
      age: ageNum,
      gender,
      activity_level,
      goal_type,
      weekly_goal
    });

    const payload = {
      user_id: userId,
      goal_type,
      current_weight: weightNum,
      target_weight: targetWeightNum,
      target_date: target_date || null,
      weekly_goal: weekly_goal || "maintain",
      activity_level,
      height: heightNum,
      gender,
      age: ageNum,
      status: "active",
      ...targets,
      updated_at: new Date().toISOString()
    };

    // Helper to log initial weight in history
    const logInitialWeight = async (actualUserId, weightVal) => {
      const wPayload = {
        user_id: actualUserId,
        weight: weightVal,
        recorded_at: new Date().toISOString().slice(0, 10),
      };
      if (supabaseAdmin) {
        await supabaseAdmin.from("weight_history").insert(wPayload);
      }
    };

    if (!supabaseAdmin) {
      payload.id = `mock-goal-${Date.now()}`;
      payload.created_at = new Date().toISOString();
      localUserGoal = payload;
      await logInitialWeight(userId, weightNum);
      return res.status(201).json({ success: true, data: payload, source: "mock" });
    }

    // Check if goal already exists to decide on update vs insert
    const { data: existing } = await supabaseAdmin
      .from("user_goals")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    let result;
    if (existing) {
      const { data, error } = await supabaseAdmin
        .from("user_goals")
        .update(payload)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      payload.created_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from("user_goals")
        .insert(payload)
        .select()
        .single();
      if (error) {
        if (error.code === "42P01") {
          payload.id = `mock-goal-${Date.now()}`;
          localUserGoal = payload;
          await logInitialWeight(userId, weightNum);
          return res.status(201).json({ success: true, data: payload, source: "mock_fallback" });
        }
        throw error;
      }
      result = data;
    }

    // Insert into weight history
    await logInitialWeight(userId, weightNum);

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("[createOrUpdateGoal]", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to configure goal." });
  }
};

/**
 * PUT /api/goals
 * Update active goal fields (manually update targets or change status/dates).
 */
export const updateGoalTargets = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized." });

    const {
      status,
      target_weight,
      target_date,
      activity_level,
      daily_calorie_goal,
      protein_goal,
      carbs_goal,
      fat_goal,
      water_goal
    } = req.body;

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (target_weight !== undefined) updates.target_weight = parseFloat(target_weight) || 0;
    if (target_date !== undefined) updates.target_date = target_date;
    if (activity_level !== undefined) updates.activity_level = activity_level;
    
    if (daily_calorie_goal !== undefined) updates.daily_calorie_goal = parseInt(daily_calorie_goal, 10);
    if (protein_goal !== undefined) updates.protein_goal = parseInt(protein_goal, 10);
    if (carbs_goal !== undefined) updates.carbs_goal = parseInt(carbs_goal, 10);
    if (fat_goal !== undefined) updates.fat_goal = parseInt(fat_goal, 10);
    if (water_goal !== undefined) updates.water_goal = parseInt(water_goal, 10);

    updates.updated_at = new Date().toISOString();

    if (!supabaseAdmin) {
      if (!localUserGoal || localUserGoal.user_id !== userId) {
        return res.status(404).json({ success: false, error: "Goal not configured." });
      }
      localUserGoal = { ...localUserGoal, ...updates };
      return res.json({ success: true, data: localUserGoal, source: "mock" });
    }

    const { data, error } = await supabaseAdmin
      .from("user_goals")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "42P01") {
        if (!localUserGoal || localUserGoal.user_id !== userId) {
          return res.status(404).json({ success: false, error: "Goal not configured." });
        }
        localUserGoal = { ...localUserGoal, ...updates };
        return res.json({ success: true, data: localUserGoal, source: "mock_fallback" });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error("[updateGoalTargets]", err);
    return res.status(500).json({ success: false, error: "Failed to update goals." });
  }
};

/**
 * DELETE /api/goals
 * Reset/Delete active goal details.
 */
export const resetGoal = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized." });

    if (!supabaseAdmin) {
      localUserGoal = null;
      return res.json({ success: true, message: "Goal reset successfully." });
    }

    const { error } = await supabaseAdmin
      .from("user_goals")
      .delete()
      .eq("user_id", userId);

    if (error) {
      if (error.code === "42P01") {
        localUserGoal = null;
        return res.json({ success: true, message: "Goal reset successfully." });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: "Goal reset successfully." });
  } catch (err) {
    console.error("[resetGoal]", err);
    return res.status(500).json({ success: false, error: "Failed to reset goals." });
  }
};
