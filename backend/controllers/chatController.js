import { generateChatResponse } from "../services/aiService.js";
import { supabaseAdmin } from "../config/supabase.js";

/**
 * handleAiChat
 * AI coach chat endpoint.
 * Protected by requireAuth in routes.
 */
export const handleAiChat = async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.user?.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    let goalContext = null;
    let weightContext = null;
    let recentAverages = null;

    if (userId && supabaseAdmin) {
      try {
        // Query active goal details
        const { data: goal } = await supabaseAdmin
          .from("user_goals")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (goal) {
          goalContext = {
            goal_type: goal.goal_type,
            current_weight: goal.current_weight,
            target_weight: goal.target_weight,
            weekly_goal: goal.weekly_goal,
            daily_calorie_goal: goal.daily_calorie_goal,
            protein_goal: goal.protein_goal,
            carbs_goal: goal.carbs_goal,
            fat_goal: goal.fat_goal,
            water_goal: goal.water_goal,
            status: goal.status
          };
        }

        // Query weight history logs (up to 10 entries)
        const { data: weights } = await supabaseAdmin
          .from("weight_history")
          .select("weight, recorded_at")
          .eq("user_id", userId)
          .order("recorded_at", { ascending: false })
          .limit(10);
        
        if (weights && weights.length > 0) {
          weightContext = {
            recent_logs: weights,
            initial_recorded: weights[weights.length - 1],
            latest_recorded: weights[0]
          };
        }

        // Query food logs for past 30 days
        const date30DaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const { data: logs } = await supabaseAdmin
          .from("food_logs")
          .select("calories, protein, carbs, fats, date")
          .eq("user_id", userId)
          .gte("date", date30DaysAgo);

        if (logs && logs.length > 0) {
          const totalCalories = logs.reduce((s, i) => s + (i.calories || 0), 0);
          const totalProtein = logs.reduce((s, i) => s + (i.protein || 0), 0);
          
          const uniqueDays = new Set(logs.map(l => l.date)).size;
          const denom = uniqueDays > 0 ? uniqueDays : 1;

          recentAverages = {
            avg_daily_calories: Math.round(totalCalories / denom),
            avg_daily_protein: Math.round(totalProtein / denom),
            days_tracked_in_last_30: uniqueDays
          };
        }
      } catch (err) {
        console.warn("[handleAiChat] Failed to construct goals context:", err.message);
      }
    }

    const enrichedContext = {
      ...context,
      user_health_goals: goalContext,
      user_weight_progress: weightContext,
      user_30day_nutrition_averages: recentAverages
    };

    // Call the AI service with user message and context
    const reply = await generateChatResponse(message, enrichedContext);

    return res.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("[handleAiChat] Error:", error);
    return res.status(500).json({
      success: false,
      error: "AI Coach is currently unavailable. Please try again later.",
    });
  }
};