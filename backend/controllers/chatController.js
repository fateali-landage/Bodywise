import { generateChatResponse } from "../services/aiService.js";
export const handleAiChat = async (req, res) => {
  try {
    console.log("AI CHAT HIT"); // 👈 debug

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    // 🔥 TEMP RESPONSE (to verify backend works)
    return res.json({
      success: true,
      reply: `AI working ✅ → You said: ${message}`,
    });

  } catch (error) {
    console.error("CHAT ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};