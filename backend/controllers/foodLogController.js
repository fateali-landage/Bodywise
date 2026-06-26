import { supabaseAdmin } from "../config/supabase.js";
import { generateInsight } from "../services/aiService.js";

// Basic fallback local DB for development if Supabase isn't connected
let localLogs = [];

const FOOD_DB = {
  rice:     { cal_100g: 130, p_100g: 2.7, c_100g: 28, f_100g: 0.3, type: "weight" },
  chicken:  { cal_100g: 165, p_100g: 31,  c_100g: 0,  f_100g: 3.6, type: "weight" },
  egg:      { cal: 78,  p: 6,   c: 0.6,f: 5, type: "piece" },
  milk:     { cal_100ml: 61, p_100ml: 3.2, c_100ml: 4.8, f_100ml: 3.3, type: "volume" },
  banana:   { cal: 89,  p: 1.1, c: 23, f: 0.3, type: "piece" },
  apple:    { cal: 52,  p: 0.3, c: 14, f: 0.2, type: "piece" },
  bread:    { cal: 265, p: 9,   c: 49, f: 3.2, type: "piece" },
  pasta:    { cal_100g: 131, p_100g: 5,   c_100g: 25, f_100g: 1.1, type: "weight" },
  oats:     { cal_100g: 389, p_100g: 17,  c_100g: 66, f_100g: 7, type: "weight" },
  yogurt:   { cal_100g: 59,  p_100g: 10,  c_100g: 3.6,f_100g: 0.4, type: "weight" },
  paneer:   { cal_100g: 265, p_100g: 18,  c_100g: 1.2,f_100g: 20, type: "weight" },
  dal:      { cal_100g: 116, p_100g: 9,   c_100g: 20, f_100g: 0.4, type: "weight" },
  roti:     { cal: 120, p: 3,   c: 20, f: 1, type: "piece" },
  idli:     { cal: 39,  p: 1,   c: 8,  f: 0.1, type: "piece" },
  dosa:     { cal: 168, p: 4,   c: 29, f: 3.7, type: "piece" },
  burger:   { cal: 295, p: 12,  c: 30, f: 14, type: "piece" },
  pizza:    { cal: 266, p: 11,  c: 33, f: 10, type: "piece" },
  salad:    { cal: 20,  p: 1,   c: 4,  f: 0.2, type: "serving" },
  coffee:   { cal_100ml: 2, p_100ml: 0.1, c_100ml: 0, f_100ml: 0, type: "volume" },
  tea:      { cal_100ml: 1, p_100ml: 0, c_100ml: 0.2, f_100ml: 0, type: "volume" },
  juice:    { cal_100ml: 45, p_100ml: 0.4, c_100ml: 10, f_100ml: 0.1, type: "volume" },
  coke:     { cal_100ml: 42, p_100ml: 0, c_100ml: 10.6, f_100ml: 0, type: "volume" },
  protein:  { cal: 120, p: 25,  c: 3,  f: 1.5, type: "serving" },
  shake:    { cal: 150, p: 20,  c: 10, f: 2, type: "serving" },
};

function estimateFood(foodName, quantity, unit) {
  const key = Object.keys(FOOD_DB).find(k => foodName.toLowerCase().includes(k));
  const base = key ? FOOD_DB[key] : { cal: 100, p: 2, c: 10, f: 2, type: "serving" };
  const q = parseFloat(quantity) || 1;
  const u = (unit || "serving").toLowerCase();

  let multiplier = q;

  if (u === "g" && (base.type === "weight" || base.cal_100g)) {
    multiplier = q / 100;
    return {
      calories: Math.round((base.cal_100g || base.cal || 100) * multiplier),
      protein: Math.round((base.p_100g || base.p || 0) * multiplier),
      carbs: Math.round((base.c_100g || base.c || 0) * multiplier),
      fats: Math.round((base.f_100g || base.f || 0) * multiplier)
    };
  }

  if (u === "ml" && (base.type === "volume" || base.cal_100ml)) {
    multiplier = q / 100;
    return {
      calories: Math.round((base.cal_100ml || base.cal || 100) * multiplier),
      protein: Math.round((base.p_100ml || base.p || 0) * multiplier),
      carbs: Math.round((base.c_100ml || base.c || 0) * multiplier),
      fats: Math.round((base.f_100ml || base.f || 0) * multiplier)
    };
  }
  
  if (u === "cup") {
    multiplier = q * 1.5; // very rough fallback conversion for cups
  } else if (u === "tbsp") {
    multiplier = q * 0.1;
  }

  // piece / serving fallback
  const calBase = base.cal_100g || base.cal_100ml || base.cal || 100;
  const pBase = base.p_100g || base.p_100ml || base.p || 2;
  const cBase = base.c_100g || base.c_100ml || base.c || 10;
  const fBase = base.f_100g || base.f_100ml || base.f || 2;

  return {
    calories: Math.round(calBase * multiplier),
    protein: Math.round(pBase * multiplier),
    carbs: Math.round(cBase * multiplier),
    fats: Math.round(fBase * multiplier)
  };
}

// ── GET /api/food-logs ────────────────────────────────────────────────────────
export const getDailyFoodLog = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized: userId not found in token." });
    }

    const { date, start_date, end_date } = req.query;

    if (start_date && end_date) {
      if (!supabaseAdmin) {
        const filtered = localLogs.filter(l => l.user_id === userId && l.date >= start_date && l.date <= end_date);
        return res.json({ success: true, data: filtered, source: "mock" });
      }
      const { data, error } = await supabaseAdmin
        .from("food_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("date", start_date)
        .lte("date", end_date)
        .order("date", { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          const filtered = localLogs.filter(l => l.user_id === userId && l.date >= start_date && l.date <= end_date);
          return res.json({ success: true, data: filtered, source: "mock_fallback" });
        }
        return res.status(400).json({ success: false, error: error.message });
      }
      return res.json({ success: true, data });
    }

    const targetDate = date || new Date().toISOString().slice(0, 10);

    if (!supabaseAdmin) {
      // Mock mode
      const filtered = localLogs.filter(l => l.user_id === userId && l.date === targetDate);
      return res.json({ success: true, data: filtered, source: "mock" });
    }

    const { data, error } = await supabaseAdmin
      .from("food_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("date", targetDate)
      .order("created_at", { ascending: false });

    if (error) {
      // If table doesn't exist, we fallback to mock automatically instead of throwing
      if (error.code === '42P01') { 
         const filtered = localLogs.filter(l => l.user_id === userId && l.date === targetDate);
         return res.json({ success: true, data: filtered, source: "mock_fallback" });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getDailyFoodLog]", err);
    return res.status(500).json({ success: false, error: "Failed to load food logs." });
  }
};

// ── POST /api/food-logs ───────────────────────────────────────────────────────
export const addFoodLog = async (req, res) => {
  try {
    const { food_name, quantity, unit, meal_type, date, calories, protein, carbs, fats } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(400).json({ success: false, error: "userId is required." });
    if (!food_name) return res.status(400).json({ success: false, error: "food_name is required." });

    const q = parseFloat(quantity) || 1;
    if (q < 0) return res.status(400).json({ success: false, error: "Quantity cannot be negative." });

    const u = unit || "serving";
    
    let est;
    if (calories !== undefined && protein !== undefined && carbs !== undefined && fats !== undefined) {
      est = {
        calories: parseInt(calories, 10) || 0,
        protein: parseInt(protein, 10) || 0,
        carbs: parseInt(carbs, 10) || 0,
        fats: parseInt(fats, 10) || 0
      };
    } else {
      est = estimateFood(food_name, q, u);

      // AI Attempt
      try {
        const insight = await generateInsight(
          { food: food_name, quantity: q, unit: u },
          `You are a nutrition AI. Estimate the calories and macros for this specific food and amount: ${q} ${u} of ${food_name}. 
          Return strictly in this format (no other text): Calories: X, Protein: Xg, Carbs: Xg, Fats: Xg`
        );

        const calMatch = insight.match(/Calories:\s*(\d+)/i);
        const pMatch = insight.match(/Protein:\s*(\d+)g/i);
        const cMatch = insight.match(/Carbs:\s*(\d+)g/i);
        const fMatch = insight.match(/Fats:\s*(\d+)g/i);

        if (calMatch && pMatch && cMatch && fMatch) {
          est = {
            calories: parseInt(calMatch[1], 10),
            protein: parseInt(pMatch[1], 10),
            carbs: parseInt(cMatch[1], 10),
            fats: parseInt(fMatch[1], 10)
          };
        }
      } catch (e) {
        console.warn("AI fallback used for addFoodLog due to timeout or error", e);
      }
    }

    const logDate = date || new Date().toISOString().slice(0, 10);

    const payload = {
      user_id: userId,
      food_name,
      quantity: q,
      unit: u,
      meal_type: meal_type || "snack",
      date: logDate,
      calories: est.calories,
      protein: est.protein,
      carbs: est.carbs,
      fats: est.fats,
      created_at: new Date().toISOString()
    };

    if (!supabaseAdmin) {
      payload.id = `mock-${Date.now()}`;
      localLogs.push(payload);
      return res.status(201).json({ success: true, data: payload, source: "mock" });
    }

    const { data, error } = await supabaseAdmin
      .from("food_logs")
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') { 
         payload.id = `mock-${Date.now()}`;
         localLogs.push(payload);
         return res.status(201).json({ success: true, data: payload, source: "mock_fallback" });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error("[addFoodLog]", err);
    return res.status(500).json({ success: false, error: "Failed to add food log." });
  }
};

// ── DELETE /api/food-logs/:id ──────────────────────────────────────────────────
export const deleteFoodLog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!supabaseAdmin || id.startsWith('mock-')) {
      localLogs = localLogs.filter(l => l.id !== id);
      return res.json({ success: true, id, source: "mock" });
    }

    const { error } = await supabaseAdmin
      .from("food_logs")
      .delete()
      .match({ id, user_id: userId }); // ensure they own it

    if (error) {
      if (error.code === '42P01') { 
         localLogs = localLogs.filter(l => l.id !== id);
         return res.json({ success: true, id, source: "mock_fallback" });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, id });
  } catch (err) {
    console.error("[deleteFoodLog]", err);
    return res.status(500).json({ success: false, error: "Failed to delete food log." });
  }
};
