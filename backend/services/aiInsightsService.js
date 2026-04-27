import { getGeminiModel, isGeminiConfigured } from "../config/geminiClient.js";

const FALLBACK = {
  insight: "Unable to analyze",
  recommendation: "Try again",
  risk_prediction: "Unknown",
};

const buildPrompt = ({ weight, height, age, activity }) => `You are an AI health assistant.

Analyze the user's health data:
- Weight: ${weight} kg
- Height: ${height} cm
- Age: ${age}
- Activity Level: ${activity}

Instructions:
- Provide simple and practical health insights
- Suggest improvements (diet, exercise, habits)
- Predict possible health risks
- Prefer Indian diet examples (roti, rice, dal, etc.)

IMPORTANT:
Return ONLY valid JSON. No extra text.

JSON format:
{
  "insight": "...",
  "recommendation": "...",
  "risk_prediction": "..."
}`;

const cleanJsonResponse = (raw) => {
  if (!raw) return "";
  let text = String(raw).trim();

  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }

  text = text.replace(/^json\s+/i, "");

  return text.trim();
};

const safeParse = (text) => {
  try {
    const parsed = JSON.parse(text);
    return {
      insight: parsed.insight ?? FALLBACK.insight,
      recommendation: parsed.recommendation ?? FALLBACK.recommendation,
      risk_prediction: parsed.risk_prediction ?? FALLBACK.risk_prediction,
    };
  } catch {
    return { ...FALLBACK };
  }
};

export const generateHealthInsights = async (userData) => {
  if (!isGeminiConfigured()) {
    return { ...FALLBACK };
  }

  const model = getGeminiModel();
  const prompt = buildPrompt(userData);

  try {
    const result = await model.generateContent(prompt);
    const rawText = result?.response?.text?.() ?? "";
    const cleaned = cleanJsonResponse(rawText);
    return safeParse(cleaned);
  } catch {
    return { ...FALLBACK };
  }
};
