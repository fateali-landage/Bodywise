/**
 * analyzeController.js
 * All endpoints validate input, sanitize before AI calls, and
 * return structured errors — no unhandled exceptions reach the client.
 */
import { generateInsight } from "../services/aiService.js";
import { bmiStatus, calculateBmi } from "../services/healthService.js";
import { sanitizeHealthPayload, sanitizeText, sanitizeNumber } from "../utils/sanitize.js";

// ── /api/analyze-body ─────────────────────────────────────────────────────────
export const analyzeBody = async (req, res) => {
  try {
    const { clean, errors } = sanitizeHealthPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join("; ") });
    }

    const { weight, height, age, gender, diet, activity, sleep } = clean;
    const bmi = calculateBmi({ weight, height });

    const insight = await generateInsight(
      { weight, height, age, gender, diet, activity, sleep, bmi },
      "You are BodyWise AI. Give practical, evidence-based body-health insights in 2-3 short sentences.",
    );

    return res.json({
      success: true,
      data: {
        bmi,
        status: bmiStatus(bmi),
        insight,
        recommendations: [
          "Keep hydration at 2.5–3 L/day.",
          "Maintain at least 7 hours of sleep.",
          "Include a protein source in every meal.",
        ],
      },
    });
  } catch (err) {
    console.error("[analyzeBody]", err);
    return res.status(500).json({ success: false, error: "Body analysis failed. Please try again." });
  }
};

// ── /api/analyze-skin ─────────────────────────────────────────────────────────
export const analyzeSkin = async (req, res) => {
  try {
    const concern = sanitizeText(req.body?.concern || "general skin stress");
    const simulated = ["acne", "dryness", "dark circles"];
    const concernLevel = concern.toLowerCase().includes("dry") ? "medium" : "low";

    const insight = await generateInsight(
      { concern, simulated },
      "You are a skincare AI assistant. Give concise, non-medical wellness suggestions.",
    );

    return res.json({
      success: true,
      data: {
        detected: simulated,
        concernLevel,
        insight,
        suggestions: [
          "Use a gentle cleanser and non-comedogenic moisturiser.",
          "Apply SPF 30+ every morning.",
          "Prioritise 7–8 hours of sleep for skin recovery.",
        ],
      },
    });
  } catch (err) {
    console.error("[analyzeSkin]", err);
    return res.status(500).json({ success: false, error: "Skin analysis failed. Please try again." });
  }
};

// ── /api/predict ──────────────────────────────────────────────────────────────
export const predictHealth = async (req, res) => {
  try {
    const weight   = sanitizeNumber(req.body?.weight);
    const activity = sanitizeNumber(req.body?.activity) || 0;
    const sleep    = sanitizeNumber(req.body?.sleep)    || 0;

    if (!weight) {
      return res.status(400).json({ success: false, error: "weight is required for health prediction." });
    }

    const delta   = activity >= 4 && sleep >= 7 ? "-1.2 kg/month" : "+0.8 kg/month";
    const skinRisk = sleep < 6 ? "Moderate-High" : "Low-Moderate";

    const insight = await generateInsight(
      { weight, activity, sleep, delta, skinRisk },
      "You are a preventive health AI. Give a realistic future trend explanation in 2–3 short sentences.",
    );

    return res.json({
      success: true,
      data: { weightTrend: delta, skinConditionRisk: skinRisk, insight },
    });
  } catch (err) {
    console.error("[predictHealth]", err);
    return res.status(500).json({ success: false, error: "Health prediction failed. Please try again." });
  }
};

// ── /api/food ─────────────────────────────────────────────────────────────────
export const analyzeFood = async (req, res) => {
  try {
    const food = sanitizeText(req.body?.food || "");

    if (!food) {
      return res.status(400).json({ success: false, error: "food description is required." });
    }

    // Rough calorie baseline — AI prompt will refine the recommendation
    const fl = food.toLowerCase();
    const calories = fl.includes("salad") ? 220 : fl.includes("rice") ? 420 : 310;

    // Ask AI to also estimate macros for this specific food
    const insight = await generateInsight(
      { type: "food", food, estimatedCalories: calories },
      `You are a nutrition AI. For the meal described, give: 
1) one practical insight in a single sentence.
2) estimated macros in the format: Protein: Xg, Carbs: Xg, Fats: Xg.
Keep response under 80 words.`,
    );

    // Parse macros from AI response if present, else use generic defaults
    const macroMatch = insight.match(/Protein:\s*(\d+)g,\s*Carbs:\s*(\d+)g,\s*Fats:\s*(\d+)g/i);
    const macros = macroMatch
      ? { protein: `${macroMatch[1]}g`, carbs: `${macroMatch[2]}g`, fats: `${macroMatch[3]}g` }
      : { protein: "—", carbs: "—", fats: "—" };

    return res.json({
      success: true,
      data: { food, estimatedCalories: calories, macros, insight },
    });
  } catch (err) {
    console.error("[analyzeFood]", err);
    return res.status(500).json({ success: false, error: "Food analysis failed. Please try again." });
  }
};

// ── /api/lifestyle ────────────────────────────────────────────────────────────
export const analyzeLifestyle = async (req, res) => {
  try {
    const smoking    = Boolean(req.body?.smoking);
    const alcohol    = Boolean(req.body?.alcohol);
    const sleepHours = sanitizeNumber(req.body?.sleepHours) || 0;
    const screenTime = sanitizeNumber(req.body?.screenTime) || 0;

    const riskScore =
      (smoking ? 30 : 0) +
      (alcohol ? 20 : 0) +
      (sleepHours < 6 ? 20 : 0) +
      (screenTime > 8 ? 15 : 0);
    const score = Math.max(100 - riskScore, 35);

    const insight = await generateInsight(
      { smoking, alcohol, sleepHours, screenTime, score },
      "You are a lifestyle scientist. Explain behaviour impact in 2–3 clear, evidence-based sentences.",
    );

    return res.json({
      success: true,
      data: {
        lifestyleScore: score,
        explanations: [
          "Consistent sleep supports hormone balance and skin repair.",
          "Smoking reduces collagen and increases systemic inflammation.",
          "High screen exposure may worsen eye strain and sleep quality.",
        ],
        insight,
      },
    });
  } catch (err) {
    console.error("[analyzeLifestyle]", err);
    return res.status(500).json({ success: false, error: "Lifestyle analysis failed. Please try again." });
  }
};
