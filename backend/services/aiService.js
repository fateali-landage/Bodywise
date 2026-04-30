import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

console.log("🔑 Gemini Key Exists:", !!env.geminiApiKey);

const genAI = env.geminiApiKey
  ? new GoogleGenerativeAI(env.geminiApiKey)
  : null;

const mockInsight = (data) => {
  if (data?.type === "food") {
    return `This meal provides useful energy. Pair ${data.food} with fiber-rich vegetables and adequate water for improved digestion and satiety.`;
  }
  return "Your routine looks mostly stable. Prioritise sleep consistency (7–8 hrs), hydration (2.5–3 L/day), and protein at every meal this week.";
};

export const generateInsight = async (data, systemPrompt) => {
  if (!genAI) return mockInsight(data);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const prompt = `
${systemPrompt || "You are a concise, evidence-based wellness coach."}

User Data:
${JSON.stringify(data)}

Give clear, short insight and recommendation.
`;

    const result = await model.generateContent(prompt);
    const response = result?.response;

    let text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      (typeof response?.text === "function" ? response.text() : "") ||
      "";

    if (!text) {
      console.log("⚠️ Empty Gemini response");
      return mockInsight(data);
    }

    console.log("✅ Gemini response:", text);
    return text;

  } catch (error) {
    console.error("🔥 Gemini error:", error?.message || error);
    return mockInsight(data);
  }
};