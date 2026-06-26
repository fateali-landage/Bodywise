import { supabaseAdmin } from "../config/supabase.js";
import { generateInsight } from "../services/aiService.js";

// Basic fallback local DB for development if Supabase isn't connected
let localLogs = [];

const FOOD_DB = {
  rice:     { cal: 130, p: 2.7,  c: 28,   f: 0.3 },
  chicken:  { cal: 165, p: 31,   c: 0,    f: 3.6 },
  cucumber: { cal: 15,  p: 0.7,  c: 3.6,  f: 0.1 },
  egg:      { cal: 155, p: 12.6, c: 1.1,  f: 10.6 },
  milk:     { cal: 61,  p: 3.2,  c: 4.8,  f: 3.3 },
  banana:   { cal: 89,  p: 1.1,  c: 23,   f: 0.3 },
  apple:    { cal: 52,  p: 0.3,  c: 14,   f: 0.2 },
  bread:    { cal: 265, p: 9,    c: 49,   f: 3.2 },
  pasta:    { cal: 131, p: 5,    c: 25,   f: 1.1 },
  oats:     { cal: 389, p: 17,   c: 66,   f: 7 },
  yogurt:   { cal: 59,  p: 10,   c: 3.6,  f: 0.4 },
  paneer:   { cal: 265, p: 18,   c: 1.2,  f: 20 },
  dal:      { cal: 116, p: 9,    c: 20,   f: 0.4 },
  roti:     { cal: 260, p: 7,    c: 55,   f: 3 },
  idli:     { cal: 150, p: 4,    c: 33,   f: 0.5 },
  dosa:     { cal: 220, p: 5,    c: 38,   f: 5 },
  burger:   { cal: 250, p: 10,   c: 25,   f: 12 },
  pizza:    { cal: 266, p: 11,   c: 33,   f: 10 },
  salad:    { cal: 20,  p: 1,    c: 4,    f: 0.2 },
  coffee:   { cal: 2,   p: 0.1,  c: 0,    f: 0 },
  tea:      { cal: 1,   p: 0,    c: 0.2,  f: 0 },
  juice:    { cal: 45,  p: 0.4,  c: 10,   f: 0.1 },
  coke:     { cal: 42,  p: 0,    c: 10.6, f: 0 },
  protein:  { cal: 360, p: 80,   c: 10,   f: 5 },
  shake:    { cal: 75,  p: 10,   c: 5,    f: 1 },
};

const FOOD_WEIGHTS = {
  rice: 150,
  chicken: 150,
  cucumber: 150,
  egg: 50,
  milk: 250,
  banana: 120,
  apple: 150,
  bread: 30,
  pasta: 150,
  oats: 40,
  yogurt: 150,
  paneer: 50,
  dal: 150,
  roti: 45,
  idli: 30,
  dosa: 80,
  burger: 150,
  pizza: 120,
  salad: 150,
  coffee: 250,
  tea: 250,
  juice: 250,
  coke: 330,
  protein: 30,
  shake: 250
};

function estimateFood(foodName, quantity, unit) {
  const key = Object.keys(FOOD_DB).find(k => foodName.toLowerCase().includes(k));
  const base = key ? FOOD_DB[key] : { cal: 100, p: 2, c: 10, f: 2 };
  
  const q = parseFloat(quantity) || 1;
  const u = (unit || "serving").toLowerCase();

  let gramsPerUnit = 100;
  if (key && FOOD_WEIGHTS[key]) {
    gramsPerUnit = FOOD_WEIGHTS[key];
  }

  let totalGrams = q;
  if (u === "g" || u === "ml") {
    totalGrams = q;
  } else if (u === "kg") {
    totalGrams = q * 1000;
  } else if (u === "serving" || u === "piece" || u === "slice" || u === "scoop" || u === "cup") {
    let factor = gramsPerUnit;
    if (u === "cup") factor = 240;
    totalGrams = q * factor;
  } else if (u === "tbsp") {
    totalGrams = q * 15;
  }

  const factor = totalGrams / 100;
  const calVal = base.cal * factor;
  const pVal = base.p * factor;
  const cVal = base.c * factor;
  const fVal = base.f * factor;

  const result = {
    calories: Math.round(calVal),
    protein: Math.round(pVal * 10) / 10,
    carbs: Math.round(cVal * 10) / 10,
    fats: Math.round(fVal * 10) / 10
  };

  console.log(`[estimateFood Tracing]`, {
    foodName,
    matchedKey: key,
    quantity: q,
    unit: u,
    totalGrams,
    baseNutrientsPer100g: base,
    result
  });

  return result;
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
