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

const classifyError = (err) => {
  const message = err?.message || String(err);
  const lower = message.toLowerCase();

  if (lower.includes("quota") || lower.includes("rate") || lower.includes("429")) {
    return { status: 429, error: "Gemini API quota or rate limit exceeded. Please try again later." };
  }
  if (lower.includes("api key") || lower.includes("unauthorized") || lower.includes("401") || lower.includes("403")) {
    return { status: 401, error: "Gemini API key is invalid or unauthorized." };
  }
  if (lower.includes("not found") || lower.includes("404")) {
    return { status: 502, error: "Gemini model is unavailable for this API version." };
  }
  return { status: 502, error: "Failed to reach the Gemini API." };
};

export const generateHealthInsights = async (userData) => {
  if (!isGeminiConfigured()) {
    const err = new Error("Gemini API key is not configured on the server.");
    err.status = 503;
    throw err;
  }

  const model = getGeminiModel();
  const prompt = buildPrompt(userData);

  try {
    const result = await model.generateContent(prompt);
    const rawText = result?.response?.text?.() ?? "";
    const cleaned = cleanJsonResponse(rawText);
    return safeParse(cleaned);
  } catch (rawErr) {
    const { status, error } = classifyError(rawErr);
    const err = new Error(error);
    err.status = status;
    throw err;
  }
};
