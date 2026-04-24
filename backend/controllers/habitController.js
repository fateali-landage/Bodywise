import { supabaseAdmin } from "../config/supabase.js";

export const listHabits = async (req, res) => {
  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: [
        { id: "local-1", user_id: "demo", water: true, sleep: false, protein: true, date: new Date().toISOString().slice(0, 10) },
      ],
      source: "mock",
    });
  }

  const { userId } = req.query;
  const { data, error } = await supabaseAdmin
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(14);

  if (error) return res.status(400).json({ success: false, error: error.message });
  return res.json({ success: true, data });
};

export const createHabit = async (req, res) => {
  const payload = req.body;
  if (!supabaseAdmin) return res.status(201).json({ success: true, data: { ...payload, id: "mock-new" }, source: "mock" });

  const { data, error } = await supabaseAdmin.from("habits").insert(payload).select().single();
  if (error) return res.status(400).json({ success: false, error: error.message });
  return res.status(201).json({ success: true, data });
};
