import { generateChatResponse } from "../services/aiService.js";

export const handleAiChat = async (req, res) => {
  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: "Message is required" });
  }

  try {
    const aiResponse = await generateChatResponse(message, context);
    return res.json({ success: true, response: aiResponse });
  } catch (error) {
    console.error("Error in AI Chat:", error);
    return res.status(500).json({ success: false, error: "Failed to generate AI response" });
  }
};
