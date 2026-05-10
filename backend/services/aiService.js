import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

console.log("🚀 Gemini ACTIVE");
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
  model: "gemini-2.5-flash",
});

    const prompt = `
${systemPrompt || "You are a concise, evidence-based wellness coach."}

User Data:
${JSON.stringify(data)}

Give clear, short insight and recommendation.
`;

    // 25 second timeout for insights
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI_TIMEOUT")), 25000)
    );

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]);

    const response = result?.response;

    let text = "";

if (typeof response?.text === "function") {
  text = response.text();
} else if (response?.candidates?.length) {
  text =
    response.candidates[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join(" ") || "";
}

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
  model: "gemini-2.5-flash",
});
    const prompt = `
You are BodyWise AI, an advanced personal fitness, nutrition, and wellness coach.

Your job:
- Give direct, practical, personalized advice
- Avoid generic introductions
- Respond naturally like a real coach
- Be concise but useful
- Give actionable steps
- Use bullet points when helpful
- Focus on the user's actual question immediately

User Context:
${JSON.stringify(context || {})}

User Message:
${message}

Important:
- Do NOT repeatedly introduce yourself
- Do NOT repeat greetings
- Give specific health guidance immediately
`;

    // 25 second timeout for chat
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI_TIMEOUT")), 25000)
    );

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]);

    const response = result?.response;
    console.log("Gemini response received");

    let text = "";

if (typeof response?.text === "function") {
  text = response.text();
} else if (response?.candidates?.length) {
  text =
    response.candidates[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join(" ") || "";
}

    return text || "I am unable to formulate a response right now. Please try again.";
  } catch (error) {
    console.error("🔥 Gemini chat error:", error?.message || error);
    if (error?.message === "AI_TIMEOUT") {
      return "I'm currently experiencing high traffic and couldn't respond in time. Please try again.";
    }
    return "An error occurred while generating a response. Please check the server logs.";
  }
};