import { generateChatResponse } from "../services/aiService.js";

/**
 * handleAiChat
 * AI coach chat endpoint.
 * Protected by requireAuth in routes.
 */
export const handleAiChat = async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    // Call the AI service with user message and context
    const reply = await generateChatResponse(message, context);

    return res.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("[handleAiChat] Error:", error);
    return res.status(500).json({
      success: false,
      error: "AI Coach is currently unavailable. Please try again later.",
    });
  }
};