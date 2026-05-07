/**
 * habitController.js — Daily habit CRUD
 * Gracefully falls back to mock data when Supabase is not configured.
 */
import { supabaseAdmin } from "../config/supabase.js";

// ── GET /api/habits ───────────────────────────────────────────────────────────
export const listHabits = async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.json({
        success: true,
        data: [
          {
            id: "local-1",
            user_id: "demo",
            water: true,
            sleep: false,
            protein: true,
            date: new Date().toISOString().slice(0, 10),
          },
        ],
        source: "mock",
      });
    }

    // Strictly use the verified JWT user ID
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized: userId not found in token." });
    }

    const { data, error } = await supabaseAdmin
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(14);

    if (error) {
      console.error("[listHabits] Supabase error:", error.message);
      return res.status(400).json({ success: false, error: error.message });
    }

    // Merge custom_habits back to top level for frontend
    const mappedData = data.map((d) => {
      const { custom_habits, ...rest } = d;
      return { ...rest, ...(custom_habits || {}) };
    });

    return res.json({ success: true, data: mappedData });
  } catch (err) {
    console.error("[listHabits]", err);
    return res.status(500).json({ success: false, error: "Failed to load habits." });
  }
};

// ── POST /api/habits ──────────────────────────────────────────────────────────
export const createHabit = async (req, res) => {
  try {
    // Always use the ID from the verified token
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized." });
    }

    const { date, water, sleep, protein, ...rest } = req.body || {};
    
    const dbPayload = {
      user_id: userId,
      date: date || new Date().toISOString().slice(0, 10),
      water: !!water,
      sleep: !!sleep,
      protein: !!protein,
      custom_habits: rest, // Save all dynamically added custom habits as JSONB
    };

    if (!supabaseAdmin) {
      return res.status(201).json({
        success: true,
        data: { ...payload, id: `mock-${Date.now()}` },
        source: "mock",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("habits")
      .upsert(dbPayload, { onConflict: "user_id, date" })
      .select()
      .single();

    if (error) {
      console.error("[createHabit] Supabase error:", error.message);
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error("[createHabit]", err);
    return res.status(500).json({ success: false, error: "Failed to save habit." });
  }
};
