import { supabaseAdmin } from "../config/supabase.js";

// Memory storage fallback if Supabase is offline/tables don't exist
let localWeightHistory = [];

/**
 * GET /api/weight
 * Fetch user weight logging history, supporting range filters (7days, 30days, 90days, 1year, custom).
 */
export const getWeightHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized." });

    const { range, start_date, end_date } = req.query;
    let startDateLimit = null;

    const today = new Date();
    if (range === "7days") {
      startDateLimit = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    } else if (range === "30days") {
      startDateLimit = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    } else if (range === "90days") {
      startDateLimit = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    } else if (range === "1year") {
      startDateLimit = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    } else if (range === "today") {
      startDateLimit = today.toISOString().slice(0, 10);
    } else if (range === "custom") {
      startDateLimit = start_date;
    }

    if (!supabaseAdmin) {
      // Mock mode
      let filtered = localWeightHistory.filter(w => w.user_id === userId);
      if (startDateLimit) {
        filtered = filtered.filter(w => w.recorded_at >= startDateLimit);
      }
      if (range === "custom" && end_date) {
        filtered = filtered.filter(w => w.recorded_at <= end_date);
      }
      filtered.sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
      return res.json({ success: true, data: filtered, source: "mock" });
    }

    let query = supabaseAdmin
      .from("weight_history")
      .select("*")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: true })
      .order("created_at", { ascending: true });

    if (startDateLimit) {
      query = query.gte("recorded_at", startDateLimit);
    }
    if (range === "custom" && end_date) {
      query = query.lte("recorded_at", end_date);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "42P01") {
        let filtered = localWeightHistory.filter(w => w.user_id === userId);
        if (startDateLimit) {
          filtered = filtered.filter(w => w.recorded_at >= startDateLimit);
        }
        if (range === "custom" && end_date) {
          filtered = filtered.filter(w => w.recorded_at <= end_date);
        }
        filtered.sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
        return res.json({ success: true, data: filtered, source: "mock_fallback" });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getWeightHistory]", err);
    return res.status(500).json({ success: false, error: "Failed to retrieve weight history." });
  }
};

/**
 * POST /api/weight
 * Log weight entry. Automatically updates user_goals current_weight value to keep progress card synced.
 */
export const addWeightLog = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized." });

    const { weight, body_fat, muscle_mass, recorded_at } = req.body;
    const weightNum = parseFloat(weight);

    if (isNaN(weightNum) || weightNum <= 0) {
      return res.status(400).json({ success: false, error: "Valid weight log value is required." });
    }

    const logDate = recorded_at || new Date().toISOString().slice(0, 10);
    const payload = {
      user_id: userId,
      weight: weightNum,
      body_fat: parseFloat(body_fat) || null,
      muscle_mass: parseFloat(muscle_mass) || null,
      recorded_at: logDate
    };

    // Helper to update current goal weight
    const updateGoalCurrentWeight = async (actualUserId, weightVal) => {
      if (supabaseAdmin) {
        await supabaseAdmin
          .from("user_goals")
          .update({ current_weight: weightVal, updated_at: new Date().toISOString() })
          .eq("user_id", actualUserId);
      }
    };

    if (!supabaseAdmin) {
      payload.id = `mock-weight-${Date.now()}`;
      payload.created_at = new Date().toISOString();
      localWeightHistory.push(payload);
      await updateGoalCurrentWeight(userId, weightNum);
      return res.status(201).json({ success: true, data: payload, source: "mock" });
    }

    const { data, error } = await supabaseAdmin
      .from("weight_history")
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === "42P01") {
        payload.id = `mock-weight-${Date.now()}`;
        payload.created_at = new Date().toISOString();
        localWeightHistory.push(payload);
        await updateGoalCurrentWeight(userId, weightNum);
        return res.status(201).json({ success: true, data: payload, source: "mock_fallback" });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    // Keep active goal weight updated
    await updateGoalCurrentWeight(userId, weightNum);

    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error("[addWeightLog]", err);
    return res.status(500).json({ success: false, error: "Failed to save weight log." });
  }
};

/**
 * DELETE /api/weight/:id
 * Remove weight history log.
 */
export const deleteWeightLog = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized." });

    const { id } = req.params;

    if (!supabaseAdmin || id.startsWith("mock-")) {
      const idx = localWeightHistory.findIndex(w => w.id === id && w.user_id === userId);
      if (idx === -1) return res.status(404).json({ success: false, error: "Log not found." });
      localWeightHistory.splice(idx, 1);
      return res.json({ success: true, message: "Log removed successfully." });
    }

    const { error } = await supabaseAdmin
      .from("weight_history")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      if (error.code === "42P01") {
        const idx = localWeightHistory.findIndex(w => w.id === id && w.user_id === userId);
        if (idx === -1) return res.status(404).json({ success: false, error: "Log not found." });
        localWeightHistory.splice(idx, 1);
        return res.json({ success: true, message: "Log removed successfully." });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: "Log removed successfully." });
  } catch (err) {
    console.error("[deleteWeightLog]", err);
    return res.status(500).json({ success: false, error: "Failed to delete weight log." });
  }
};
