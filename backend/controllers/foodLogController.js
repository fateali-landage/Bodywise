import { supabaseAdmin } from "../config/supabase.js";

// Basic fallback local DB for development if Supabase isn't connected
let localLogs = [];

const FOOD_DB = {
  rice:     { cal: 130, p: 2.7, c: 28, f: 0.3 },
  chicken:  { cal: 165, p: 31,  c: 0,  f: 3.6 },
  egg:      { cal: 78,  p: 6,   c: 0.6,f: 5 },
  milk:     { cal: 61,  p: 3.2, c: 4.8,f: 3.3 },
  banana:   { cal: 89,  p: 1.1, c: 23, f: 0.3 },
  apple:    { cal: 52,  p: 0.3, c: 14, f: 0.2 },
  bread:    { cal: 265, p: 9,   c: 49, f: 3.2 },
  pasta:    { cal: 131, p: 5,   c: 25, f: 1.1 },
  oats:     { cal: 389, p: 17,  c: 66, f: 7 },
  yogurt:   { cal: 59,  p: 10,  c: 3.6,f: 0.4 },
  paneer:   { cal: 265, p: 18,  c: 1.2,f: 20 },
  dal:      { cal: 116, p: 9,   c: 20, f: 0.4 },
  roti:     { cal: 120, p: 3,   c: 20, f: 1 },
  idli:     { cal: 39,  p: 1,   c: 8,  f: 0.1 },
  dosa:     { cal: 168, p: 4,   c: 29, f: 3.7 },
  burger:   { cal: 295, p: 12,  c: 30, f: 14 },
  pizza:    { cal: 266, p: 11,  c: 33, f: 10 },
  salad:    { cal: 20,  p: 1,   c: 4,  f: 0.2 },
  coffee:   { cal: 5,   p: 0.3, c: 0,  f: 0 },
  tea:      { cal: 2,   p: 0,   c: 0.4,f: 0 },
  juice:    { cal: 45,  p: 0.4, c: 10, f: 0.1 },
  coke:     { cal: 42,  p: 0,   c: 10.6,f: 0 },
  protein:  { cal: 120, p: 25,  c: 3,  f: 1.5 },
  shake:    { cal: 150, p: 20,  c: 10, f: 2 },
};

function estimateFood(foodName, quantity) {
  const key = Object.keys(FOOD_DB).find(k => foodName.toLowerCase().includes(k));
  const base = key ? FOOD_DB[key] : { cal: 100, p: 2, c: 10, f: 2 };
  const q = parseFloat(quantity) || 1;
  return {
    calories: Math.round(base.cal * q),
    protein: Math.round(base.p * q),
    carbs: Math.round(base.c * q),
    fats: Math.round(base.f * q)
  };
}

// ── GET /api/food-logs ────────────────────────────────────────────────────────
export const getDailyFoodLog = async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id;
    if (!userId) return res.status(400).json({ success: false, error: "userId is required." });

    const date = req.query.date || new Date().toISOString().slice(0, 10);

    if (!supabaseAdmin) {
      // Mock mode
      const filtered = localLogs.filter(l => l.user_id === userId && l.date === date);
      return res.json({ success: true, data: filtered, source: "mock" });
    }

    const { data, error } = await supabaseAdmin
      .from("food_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("created_at", { ascending: false });

    if (error) {
      // If table doesn't exist, we fallback to mock automatically instead of throwing
      if (error.code === '42P01') { 
         const filtered = localLogs.filter(l => l.user_id === userId && l.date === date);
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
    const { food_name, quantity, meal_type, date } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(400).json({ success: false, error: "userId is required." });
    if (!food_name) return res.status(400).json({ success: false, error: "food_name is required." });

    const est = estimateFood(food_name, quantity);
    const logDate = date || new Date().toISOString().slice(0, 10);

    const payload = {
      user_id: userId,
      food_name,
      quantity: parseFloat(quantity) || 1,
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
