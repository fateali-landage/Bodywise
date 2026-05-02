import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

console.log("🚀 Gemini 2.0 Flash ACTIVE");
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

    // 10 second timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI_TIMEOUT")), 10000)
    );

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]);

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

export const generateChatResponse = async (message, context) => {
  if (!genAI) {
    return "I am running in offline mode. Please configure the Gemini API key to chat with me!";
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const prompt = `You are BodyWise AI, a personal health and wellness coach.
You give professional, practical, and empathetic advice regarding fitness, diet, sleep, and overall wellness.
Keep your responses concise and formatted cleanly with markdown.

User Context Data:
${JSON.stringify(context || {})}

User Message:
${message}
`;

    // 15 second timeout for chat
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI_TIMEOUT")), 15000)
    );

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]);

    const response = result?.response;

    let text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      (typeof response?.text === "function" ? response.text() : "") ||
      "";

    return text || "I am unable to formulate a response right now. Please try again.";
  } catch (error) {
    console.error("🔥 Gemini chat error:", error?.message || error);
    if (error?.message === "AI_TIMEOUT") {
      return "I'm currently experiencing high traffic and couldn't respond in time. Please try again.";
    }
    return "An error occurred while generating a response. Please check the server logs.";
  }
};