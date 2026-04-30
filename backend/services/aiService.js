import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

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
      model: "gemini-1.5-flash",
    });

    const prompt = `
${systemPrompt || "You are a concise, evidence-based wellness coach."}

User Data:
${JSON.stringify(data)}

Give clear, short insight and recommendation.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return text || mockInsight(data);
  } catch (error) {
    console.error("[aiService] Gemini error:", error?.message || error);
    return mockInsight(data);
  }
};