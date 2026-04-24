import OpenAI from "openai";
import { env } from "../config/env.js";

const openai = env.openAiApiKey ? new OpenAI({ apiKey: env.openAiApiKey }) : null;

const mockInsight = (data) => {
  if (data?.type === "food") {
    return `This meal is useful for steady energy. Pair ${data.food} with fiber and water for improved digestion.`;
  }
  return "Your routine looks mostly stable. Focus on sleep consistency, hydration, and protein quality this week.";
};

export const generateInsight = async (data, systemPrompt) => {
  if (!openai) return mockInsight(data);

  try {
    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt || "You are a concise wellness coach." },
        { role: "user", content: JSON.stringify(data) },
      ],
    });

    return completion.output_text || mockInsight(data);
  } catch (error) {
    return mockInsight(data);
  }
};
